import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getStateConfig } from "@/lib/states";
import {
  buildSubmissionSchema,
  computeOrderTotal,
  genericSubmissionSchema,
  maskSensitiveFields,
  type TokenizedPayment,
} from "@/lib/state-config";
import { chargeSale, vaultEnabled, NMI_DESCRIPTOR } from "@/lib/nmi";
import {
  createOrReuseApplication,
  getApplicationById,
  hasApprovedPayment,
  logPaymentEvent,
  markApplicationPaid,
  markApplicationPaymentFailed,
  recordPayment,
  type ApplicationRecord,
  type StoredApplication,
} from "@/lib/storage";
import { dbConfigured } from "@/lib/db";
import {
  opsAlert,
  sendApplicationReceivedEmail,
  sendEmail,
  sendPaymentDeclinedEmail,
  sendPaymentReceiptEmail,
  fmtDateET,
  type LifecycleCtx,
  type OrderEmailContext,
} from "@/lib/email";
import { adminRecipients } from "@/lib/email/pipeline";
import { adminNewOrderEmail } from "@/lib/email/templates";
import { issueRetryToken } from "@/lib/retry-tokens";
import { formatPrice } from "@/lib/format";

export const runtime = "nodejs";

/**
 * POST /api/applications — submit + charge, atomically from the customer's
 * point of view.
 *
 * Flow (save-first so declines can be recovered by email):
 *   1. Validate the submission against the state's zod schema.
 *   2. Compute the amount SERVER-SIDE from the state config — a client-sent
 *      amount is never accepted (the client doesn't even send one).
 *   3. Persist the application as pending_payment (MASKED data only — the
 *      full SSN is never stored anywhere).
 *   4. Charge the single-use payment token via NMI.
 *   5. Approved  -> status received, payment + audit rows, emails.
 *      Declined  -> status payment_failed (dunning clock starts), HTTP 402
 *                   with a customer-safe message + applicationId so an
 *                   immediate in-page retry reuses the same application.
 *
 * SSN HANDLING: raw SSNs are NEVER logged, stored, or emailed. Storage and
 * customer emails get the masked copy; the admin email includes the full SSN
 * only when ADMIN_EMAIL_INCLUDE_FULL_SSN=true (and even then is never stored).
 *
 * PCI: this route accepts ONLY tokenized payments (payment.token from
 * Collect.js). DO NOT add raw card fields here — see src/lib/nmi.ts header.
 */

function generateReference(stateSlug: string): string {
  const state = stateSlug.toUpperCase().replace(/-/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = new Uint8Array(3);
  crypto.getRandomValues(randomBytes);
  const random = Array.from(randomBytes)
    .map((b) => (b % 36).toString(36))
    .join("")
    .toUpperCase()
    .slice(0, 4)
    .padStart(4, "0");
  return `AP-${state}-${timestamp}-${random}`;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/* Per-IP submission throttle (card-testing / abuse guard). In-memory per
 * serverless instance — a soft limit; the retry endpoint adds a DB-backed
 * per-application limit on top. 15 checkout attempts/hour/IP is far above
 * any legitimate use. */
const ipHits = new Map<string, number[]>();
const IP_LIMIT = 15;
const IP_WINDOW_MS = 60 * 60 * 1000;

function ipThrottled(request: Request): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (hits.length >= IP_LIMIT) return true;
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) {
    // Bounded memory: drop stale entries.
    ipHits.forEach((v, k) => {
      if (!v.some((t) => now - t < IP_WINDOW_MS)) ipHits.delete(k);
    });
  }
  return false;
}

export async function POST(request: Request) {
  if (ipThrottled(request)) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts from your connection. Please wait a while and try again." },
      { status: 429 },
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const rawBody = (body ?? {}) as Record<string, unknown>;
  const stateSlug = typeof rawBody.stateSlug === "string" ? rawBody.stateSlug : "";
  // Retry threading: after a decline the client re-submits with the same
  // applicationId so we reuse the row instead of creating a duplicate.
  const retryApplicationId = str(rawBody.applicationId);

  const config = stateSlug ? await getStateConfig(stateSlug) : null;
  const schema = config ? buildSubmissionSchema(config) : genericSubmissionSchema;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      (errors[path] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 400 },
    );
  }

  const submission = parsed.data as {
    stateSlug: string;
    residency: string;
    licenseId: string;
    addOnIds: string[];
    data: Record<string, unknown>;
    consents: { accurateAndTerms: boolean };
    payment: TokenizedPayment;
  };

  /* ------------------------- server-authoritative price ------------------------- */

  const amount = config
    ? computeOrderTotal(config, submission.licenseId, submission.addOnIds)
    : 0;

  if (amount <= 0) {
    return NextResponse.json(
      { ok: false, message: "We could not price this order. Please re-select your license." },
      { status: 400 },
    );
  }
  const amountCents = Math.round(amount * 100);

  /* ------------------------- persist (masked) before charging ------------------------- */

  // Mask SSNs before ANY storage/logging/email. The unmasked payload stays in
  // `submission.data` only for the opt-in admin email and is never persisted.
  const maskedData = maskSensitiveFields(config, submission.data);
  const email = str(submission.data.email);
  const firstName = str(submission.data.firstName);
  const lastName = str(submission.data.lastName);
  const phone = str(submission.data.phone) ?? str(submission.data.primaryPhone);

  let appRecord: ApplicationRecord | null = null;
  let reference = "";

  try {
    if (retryApplicationId) {
      const existing = await getApplicationById(retryApplicationId);
      if (existing && existing.stateSlug === submission.stateSlug) {
        // Already paid (e.g. success response was lost in transit and the
        // client retried): NEVER charge again — return the original success.
        if (await hasApprovedPayment(existing.id)) {
          return NextResponse.json({
            ok: true,
            reference: existing.reference,
            applicationId: existing.id,
            confirmationEmailedTo: existing.email,
            duplicate: true,
          });
        }
        // Only reuse when it's plausibly the same order and still unpaid.
        if (
          (existing.status === "pending_payment" || existing.status === "payment_failed") &&
          (!existing.email || !email || existing.email.toLowerCase() === email.toLowerCase())
        ) {
          appRecord = existing;
        }
      }
    }
    if (!appRecord) {
      const created = await createOrReuseApplication({
        reference: generateReference(submission.stateSlug),
        stateSlug: submission.stateSlug,
        residency: submission.residency,
        licenseId: submission.licenseId,
        addOnIds: submission.addOnIds,
        email,
        firstName,
        lastName,
        phone,
        formData: maskedData,
        consents: submission.consents,
        amountCents,
      });
      appRecord = created?.app ?? null;
    }
  } catch (err) {
    // Persistence problems must not strand a paying customer mid-checkout:
    // continue without a DB record (dev-mode behavior) and log loudly.
    // eslint-disable-next-line no-console
    console.error(
      `[api/applications] persistence failed before charge: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  reference = appRecord?.reference ?? generateReference(submission.stateSlug);

  // Double-submit guard: this application already has an approved charge —
  // never charge twice. Return the original success response.
  if (appRecord && (await hasApprovedPayment(appRecord.id).catch(() => false))) {
    return NextResponse.json({
      ok: true,
      reference: appRecord.reference,
      applicationId: appRecord.id,
      confirmationEmailedTo: appRecord.email,
      duplicate: true,
    });
  }

  /* ------------------------- charge ------------------------- */

  const tokenFingerprint = createHash("sha256")
    .update(submission.payment.token)
    .digest("hex")
    .slice(0, 12);

  await logPaymentEvent({
    applicationId: appRecord?.id,
    source: "checkout",
    eventType: "charge_attempt",
    detail: { amountCents, tokenFp: tokenFingerprint },
  });

  const charge = await chargeSale({
    amount,
    paymentToken: submission.payment.token,
    orderId: reference,
    billingZip: submission.payment.billingZip,
    customer: {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      email: email ?? undefined,
      phone: phone ?? undefined,
    },
    addToVault: vaultEnabled(),
  });

  /* ------------------------- declined / error ------------------------- */

  if (!charge.ok) {
    if (appRecord) {
      const paymentId = await recordPayment({
        applicationId: appRecord.id,
        kind: "sale",
        source: "checkout",
        transactionId: charge.transactionId,
        amountCents,
        status: charge.status === "declined" ? "declined" : "error",
        declineCode: charge.declineCode,
        declineMessage: charge.message,
        gatewayCode: charge.gateway?.gatewayCode,
        cardBrand: submission.payment.brand,
        cardLast4: submission.payment.last4,
        billingZip: submission.payment.billingZip,
        descriptor: NMI_DESCRIPTOR,
        rawResponse: charge.gateway?.raw,
        idempotencyKey: `sale/${appRecord.id}/${tokenFingerprint}`,
      }).catch(() => null);

      // Only a real DECLINE starts the dunning clock — a gateway/processor
      // error is our problem, not the customer's.
      if (charge.status === "declined") {
        await markApplicationPaymentFailed(appRecord.id, charge.declineCode).catch(() => {});
      }
      await logPaymentEvent({
        applicationId: appRecord.id,
        paymentId,
        source: "checkout",
        eventType: charge.status,
        detail: { declineCode: charge.declineCode, gatewayCode: charge.gateway?.gatewayCode },
      });
    }

    // EMAIL #4 (+ dunning schedule) — real declines only, never transient
    // gateway errors (spec 2.4: don't dun on errors; invite an in-page retry).
    if (charge.status === "declined" && email) {
      const holdExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const retry = appRecord ? await issueRetryToken(appRecord.id).catch(() => null) : null;
      const ctx: LifecycleCtx = {
        config,
        applicationId: appRecord?.id ?? null,
        reference,
        stateSlug: submission.stateSlug,
        firstName,
        fullName: [firstName, lastName].filter(Boolean).join(" ") || null,
        email,
        residency: submission.residency,
        licenseId: submission.licenseId,
        addOnIds: submission.addOnIds,
        amount,
      };
      await sendPaymentDeclinedEmail(ctx, {
        declineCode: charge.declineCode,
        retryUrl: retry?.url ?? null,
        holdExpiry,
      });
      await opsAlert(
        `Payment declined — ${reference}`,
        [
          `Application: ${reference} (${appRecord?.id ?? "no DB record"})`,
          `State/license: ${submission.stateSlug} / ${submission.licenseId}`,
          `Amount: ${formatPrice(amount)}`,
          `Reason: ${charge.declineCode} (gateway code ${charge.gateway?.gatewayCode ?? "?"})`,
          `Customer: ${email}`,
          "",
          `Email #4 sent with a secure retry link. Reminders scheduled for Day 2/4/7; auto-cancel ${fmtDateET(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000))}.`,
        ].join("\n"),
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: charge.message,
        declineCode: charge.declineCode,
        retriable: charge.retriable,
        applicationId: appRecord?.id ?? null,
      },
      { status: 402 },
    );
  }

  /* ------------------------- approved ------------------------- */

  if (appRecord) {
    const paymentId = await recordPayment({
      applicationId: appRecord.id,
      kind: "sale",
      source: "checkout",
      transactionId: charge.transactionId,
      amountCents,
      status: "approved",
      cardBrand: submission.payment.brand,
      cardLast4: submission.payment.last4,
      billingZip: submission.payment.billingZip,
      descriptor: NMI_DESCRIPTOR,
      devMode: charge.devMode,
      rawResponse: charge.gateway?.raw,
      idempotencyKey: `sale/${appRecord.id}/${tokenFingerprint}`,
    }).catch(() => null);
    await markApplicationPaid(appRecord.id, {
      customerVaultId: charge.customerVaultId,
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        `[api/applications] markApplicationPaid failed for ${reference}: ${err instanceof Error ? err.message : "unknown"}`,
      );
    });
    await logPaymentEvent({
      applicationId: appRecord.id,
      paymentId,
      source: "checkout",
      eventType: "approved",
      detail: { transactionId: charge.transactionId, devMode: charge.devMode },
    });
  } else if (dbConfigured()) {
    // eslint-disable-next-line no-console
    console.error(
      `[api/applications] ${reference}: charge approved but no DB record exists — follow up manually (txn ${charge.transactionId})`,
    );
  }

  /* ------------------------- notify (emails #1 + #2 + ops) ------------------------- */

  // Email failures never fail the order — the card is already charged. All
  // sends go through the idempotent pipeline (email_log + Resend keys), so
  // replays/double-fires can never duplicate them.
  const lifecycleCtx: LifecycleCtx = {
    config,
    applicationId: appRecord?.id ?? null,
    reference,
    stateSlug: submission.stateSlug,
    firstName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || null,
    email: email ?? "",
    residency: submission.residency,
    licenseId: submission.licenseId,
    addOnIds: submission.addOnIds,
    amount,
  };

  let customerEmailed = false;
  if (email) {
    const [received, receipt] = await Promise.all([
      sendApplicationReceivedEmail(lifecycleCtx),
      sendPaymentReceiptEmail(lifecycleCtx, {
        brand: submission.payment.brand,
        last4: submission.payment.last4,
        transactionId: charge.transactionId,
        paidAt: new Date(),
      }),
    ]);
    customerEmailed = received.status === "sent" || receipt.status === "sent";
    if (received.status === "failed" || receipt.status === "failed") {
      // eslint-disable-next-line no-console
      console.error(
        `[api/applications] ${reference} lifecycle email failure — #1: ${received.status}, #2: ${receipt.status}`,
      );
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[api/applications] ${reference}: no customer email — #1/#2 skipped`);
  }

  // [AP Ops] rich admin notification with full order details (SSN masked
  // unless ADMIN_EMAIL_INCLUDE_FULL_SSN=true; rawData never logged/stored).
  const admins = adminRecipients();
  if (admins.length) {
    const app: StoredApplication = {
      reference,
      stateSlug: submission.stateSlug,
      residency: submission.residency,
      licenseId: submission.licenseId,
      addOnIds: submission.addOnIds,
      data: maskedData,
      consents: submission.consents,
      payment: {
        transactionId: charge.transactionId,
        amount,
        last4: submission.payment.last4,
        brand: submission.payment.brand,
        descriptor: NMI_DESCRIPTOR,
        devMode: charge.devMode,
      },
      submittedAt: appRecord?.submittedAt ?? new Date().toISOString(),
    };
    const orderCtx: OrderEmailContext = { config, app, maskedData, rawData: submission.data };
    const adminTpl = adminNewOrderEmail(orderCtx, {
      includeFullSSN: process.env.ADMIN_EMAIL_INCLUDE_FULL_SSN === "true",
    });
    await sendEmail({
      applicationId: appRecord?.id ?? null,
      type: "ops_paid",
      to: admins,
      from: process.env.EMAIL_FROM ?? "AnglerPermit <orders@anglerpermit.com>",
      subject: `[AP Ops] ${adminTpl.subject}`,
      html: adminTpl.html,
      text: adminTpl.text,
      replyTo: email ?? undefined,
      meta: { amount, devMode: charge.devMode },
    });
  }

  return NextResponse.json({
    ok: true,
    reference,
    applicationId: appRecord?.id ?? null,
    confirmationEmailedTo: customerEmailed ? email : null,
  });
}
