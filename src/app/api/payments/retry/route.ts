import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getStateConfig } from "@/lib/states";
import { paymentSchema } from "@/lib/state-config";
import { chargeSale, NMI_DESCRIPTOR } from "@/lib/nmi";
import {
  getApplicationById,
  hasApprovedPayment,
  lastDunningStepSent,
  logPaymentEvent,
  markApplicationPaid,
  recordPayment,
} from "@/lib/storage";
import { checkRetryToken, consumeRetryToken } from "@/lib/retry-tokens";
import { dbConfigured, q } from "@/lib/db";
import {
  opsAlert,
  sendApplicationReceivedEmail,
  sendPaymentReceiptEmail,
  type LifecycleCtx,
} from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/payments/retry — complete payment from a /pay/{token} link.
 *
 * Security model:
 * - The 256-bit token IS the auth (stored hashed; single-active; expires
 *   decline + 8 days). No login, no PII exposure beyond the order recap.
 * - Amount comes from the application row (server source of truth) — the
 *   client sends only the Collect.js payment token + display metadata.
 * - Rate-limited per application (gateway attempts/hour) to stop
 *   card-testing abuse; every attempt is recorded in payment_events.
 * - PCI: tokenized card data only. DO NOT add raw card fields (see
 *   src/lib/nmi.ts).
 *
 * On approval: application -> received, retry token consumed, remaining
 * dunning ends automatically (status check), emails #1/#2 sent if never sent
 * (the email_log pipeline dedupes), ops notified of the recovery.
 */

const bodySchema = z.object({
  token: z.string().min(20).max(200),
  payment: paymentSchema,
});

const MAX_ATTEMPTS_PER_HOUR = 6;

async function attemptsLastHour(applicationId: string): Promise<number> {
  if (!dbConfigured()) return 0;
  const res = await q<{ n: number }>(
    `select count(*)::int as n from payments
      where application_id = $1 and created_at > now() - interval '1 hour'`,
    [applicationId],
  );
  return res.rows[0]?.n ?? 0;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const { token, payment } = parsed.data;

  const check = await checkRetryToken(token);
  if (check.status !== "valid") {
    return NextResponse.json(
      { ok: false, tokenState: check.status, message: "This payment link is no longer valid." },
      { status: 410 },
    );
  }

  const app = await getApplicationById(check.applicationId);
  if (!app) {
    return NextResponse.json(
      { ok: false, tokenState: "invalid", message: "This payment link is no longer valid." },
      { status: 410 },
    );
  }

  // Already paid (double-click, replayed link): return the original success.
  if (await hasApprovedPayment(app.id).catch(() => false)) {
    return NextResponse.json({ ok: true, reference: app.reference, alreadyPaid: true });
  }
  if (!["payment_failed", "pending_payment"].includes(app.status)) {
    return NextResponse.json(
      { ok: false, tokenState: "used", message: "This application is no longer awaiting payment." },
      { status: 410 },
    );
  }

  // Rate limit: bounded gateway attempts per application per hour.
  if ((await attemptsLastHour(app.id)) >= MAX_ATTEMPTS_PER_HOUR) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Too many payment attempts in the last hour. Please wait a bit and try again, or reply to our email for help.",
      },
      { status: 429 },
    );
  }

  const amount = app.amountCents / 100;
  const tokenFingerprint = createHash("sha256").update(payment.token).digest("hex").slice(0, 12);

  await logPaymentEvent({
    applicationId: app.id,
    source: "retry_page",
    eventType: "charge_attempt",
    detail: { amountCents: app.amountCents, tokenFp: tokenFingerprint },
  });

  const charge = await chargeSale({
    amount,
    paymentToken: payment.token,
    orderId: app.reference,
    billingZip: payment.billingZip,
    customer: {
      firstName: app.firstName ?? undefined,
      lastName: app.lastName ?? undefined,
      email: app.email ?? undefined,
      phone: app.phone ?? undefined,
    },
  });

  if (!charge.ok) {
    const paymentId = await recordPayment({
      applicationId: app.id,
      kind: "retry_sale",
      source: "retry_page",
      transactionId: charge.transactionId,
      amountCents: app.amountCents,
      status: charge.status === "declined" ? "declined" : "error",
      declineCode: charge.declineCode,
      declineMessage: charge.message,
      gatewayCode: charge.gateway?.gatewayCode,
      cardBrand: payment.brand,
      cardLast4: payment.last4,
      billingZip: payment.billingZip,
      descriptor: NMI_DESCRIPTOR,
      rawResponse: charge.gateway?.raw,
      idempotencyKey: `retry/${app.id}/${tokenFingerprint}`,
    }).catch(() => null);
    await logPaymentEvent({
      applicationId: app.id,
      paymentId,
      source: "retry_page",
      eventType: charge.status,
      detail: { declineCode: charge.declineCode },
    });
    // The customer is ON the page — inline error, no extra email, dunning
    // continues unchanged.
    return NextResponse.json(
      {
        ok: false,
        message: charge.message,
        declineCode: charge.declineCode,
        retriable: charge.retriable,
      },
      { status: 402 },
    );
  }

  /* ---------------- approved: recover the application ---------------- */

  const paymentId = await recordPayment({
    applicationId: app.id,
    kind: "retry_sale",
    source: "retry_page",
    transactionId: charge.transactionId,
    amountCents: app.amountCents,
    status: "approved",
    cardBrand: payment.brand,
    cardLast4: payment.last4,
    billingZip: payment.billingZip,
    descriptor: NMI_DESCRIPTOR,
    devMode: charge.devMode,
    rawResponse: charge.gateway?.raw,
    idempotencyKey: `retry/${app.id}/${tokenFingerprint}`,
  }).catch(() => null);

  const recoveredAtStep = await lastDunningStepSent(app.id).catch(() => 0);

  await markApplicationPaid(app.id, { customerVaultId: charge.customerVaultId }).catch(() => {});
  await consumeRetryToken(check.tokenId).catch(() => {});
  await logPaymentEvent({
    applicationId: app.id,
    paymentId,
    source: "retry_page",
    eventType: "approved",
    detail: { transactionId: charge.transactionId, recoveredAtStep },
  });

  // Emails: the pipeline's exactly-once check means #1 goes out only if it
  // never did (declined-at-checkout apps never got it), and #2 always (first
  // successful charge for this application).
  if (app.email) {
    const config = await getStateConfig(app.stateSlug);
    const ctx: LifecycleCtx = {
      config,
      applicationId: app.id,
      reference: app.reference,
      stateSlug: app.stateSlug,
      firstName: app.firstName,
      fullName: [app.firstName, app.lastName].filter(Boolean).join(" ") || null,
      email: app.email,
      residency: app.residency,
      licenseId: app.licenseId,
      addOnIds: app.addOnIds,
      amount,
    };
    await Promise.all([
      sendApplicationReceivedEmail(ctx),
      sendPaymentReceiptEmail(ctx, {
        brand: payment.brand,
        last4: payment.last4,
        transactionId: charge.transactionId,
        paidAt: new Date(),
      }),
    ]);
  }

  await opsAlert(
    `Payment recovered — ${app.reference}`,
    [
      `Application: ${app.reference} (${app.id})`,
      `Amount: $${amount.toFixed(2)} — transaction ${charge.transactionId}`,
      `Recovered via retry link${recoveredAtStep ? ` after reminder step ${recoveredAtStep}` : " before any reminder"}.`,
      `Customer: ${app.email ?? "no email"}`,
      "Dunning sequence ended automatically. Application is now in the review queue.",
    ].join("\n"),
  );

  return NextResponse.json({ ok: true, reference: app.reference });
}
