import { NextResponse } from "next/server";
import { getStateConfig } from "@/lib/states";
import {
  buildSubmissionSchema,
  computeOrderTotal,
  genericSubmissionSchema,
  maskSensitiveFields,
  type TokenizedPayment,
} from "@/lib/state-config";
import { chargeSale, NMI_DESCRIPTOR } from "@/lib/nmi";
import { storage, type StoredApplication } from "@/lib/storage";
import { sendApplicationEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/applications
 *
 * Validates the submission server-side against a zod schema generated from the
 * submitted state's config (dynamically discovered in src/data/states/). When
 * the state file does not exist yet, a generic base schema is used so the
 * endpoint works before Phase B lands.
 *
 * SSN HANDLING: raw SSNs are NEVER logged or emailed. The admin email and the
 * console storage adapter receive a masked copy (***-**-####). When a real
 * database adapter replaces consoleStorage, it must encrypt PII/SSN at rest.
 *
 * PAYMENTS: the client sends only an NMI payment_token (card data is tokenized
 * in the browser and never reaches this server). The charge amount is computed
 * SERVER-SIDE from the state config (license + add-ons, markup applied) — a
 * client-sent amount is never accepted. Declines return HTTP 402.
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const stateSlug =
    body && typeof body === "object" && "stateSlug" in body
      ? String((body as { stateSlug: unknown }).stateSlug)
      : "";

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

  const reference = generateReference(submission.stateSlug);

  /* ------------------------- payment (before saving) ------------------------- */

  // Server-authoritative amount: license + add-ons from the state config with
  // the global markup applied (computeOrderTotal). The client's amount is
  // never trusted — the client doesn't even send one.
  const amount = config
    ? computeOrderTotal(config, submission.licenseId, submission.addOnIds)
    : 0;

  if (amount <= 0) {
    return NextResponse.json(
      { ok: false, message: "We could not price this order. Please re-select your license." },
      { status: 400 },
    );
  }

  const charge = await chargeSale({
    amount,
    paymentToken: submission.payment.token,
    orderId: reference,
    billingZip: submission.payment.billingZip,
  });

  if (!charge.ok) {
    // 402 Payment Required — the card was declined or the gateway failed.
    // Nothing is saved; the customer can fix their card and retry.
    return NextResponse.json({ ok: false, message: charge.message }, { status: 402 });
  }

  /* ------------------------- store + notify ------------------------- */

  // Mask SSNs before ANY storage/logging/email. The unmasked payload stays in
  // `submission.data` only for the future encrypted-at-rest database adapter.
  const maskedData = maskSensitiveFields(config, submission.data);

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
    submittedAt: new Date().toISOString(),
  };

  try {
    await storage.saveApplication(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[api/applications] storage failed for ${reference}: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  const { delivered } = await sendApplicationEmail({ config, app, maskedData });
  if (!delivered) {
    // Dev-mode fallback already logged the masked summary. Masked values only —
    // never log submission.data (contains raw SSN).
    // eslint-disable-next-line no-console
    console.log(`[api/applications] ${reference} received (email delivery: no provider configured)`);
  }

  return NextResponse.json({ ok: true, reference });
}
