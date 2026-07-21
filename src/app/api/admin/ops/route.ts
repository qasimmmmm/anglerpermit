import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getStateConfig } from "@/lib/states";
import { refundTransaction, voidTransaction } from "@/lib/nmi";
import { dbConfigured, q } from "@/lib/db";
import {
  getApplicationByReference,
  logPaymentEvent,
  recordPayment,
  updateApplicationStatus,
  type ApplicationRecord,
} from "@/lib/storage";
import {
  opsAlert,
  sendCancelledEmail,
  sendMissingInfoEmail,
  sendRefundEmail,
  type LifecycleCtx,
} from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/admin/ops — team actions behind ADMIN_PANEL_SECRET.
 *
 * Actions (all JSON: { secret, action, reference, ... }):
 *   mark-processing — received -> processing (no email)
 *   request-info    — sends #9 with the team's specific ask; -> missing_info
 *   cancel          — cancels + sends #8 (manual cancel path)
 *   refund          — NMI refund (falls back to void for unsettled same-day
 *                     charges), records it, -> refunded, sends #10
 *
 * Every action goes through the same idempotent email pipeline as automated
 * sends — repeating an action can never double-email (except request-info,
 * which allocates a resend slot when repeated deliberately).
 */

const bodySchema = z.object({
  secret: z.string().min(1),
  action: z.enum(["mark-processing", "request-info", "cancel", "refund"]),
  reference: z.string().min(4).max(60),
  /** request-info: the specific ask shown to the customer. */
  message: z.string().max(2000).optional(),
  /** request-info: set true to send another #9 after the first. */
  force: z.boolean().optional(),
});

function secretMatches(provided: string): boolean {
  const expected = process.env.ADMIN_PANEL_SECRET;
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function buildCtx(app: ApplicationRecord): Promise<LifecycleCtx> {
  const config = await getStateConfig(app.stateSlug);
  return {
    config,
    applicationId: app.id,
    reference: app.reference,
    stateSlug: app.stateSlug,
    firstName: app.firstName,
    fullName: [app.firstName, app.lastName].filter(Boolean).join(" ") || null,
    email: app.email ?? "",
    residency: app.residency,
    licenseId: app.licenseId,
    addOnIds: app.addOnIds,
    amount: app.amountCents / 100,
  };
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PANEL_SECRET) {
    return NextResponse.json({ ok: false, message: "Admin actions not enabled." }, { status: 503 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }
  const { secret, action, reference, message, force } = parsed.data;
  if (!secretMatches(secret)) {
    return NextResponse.json({ ok: false, message: "Invalid admin secret." }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, message: "Database not configured." }, { status: 503 });
  }

  const app = await getApplicationByReference(reference.trim());
  if (!app) {
    return NextResponse.json({ ok: false, message: `No application ${reference}.` }, { status: 404 });
  }
  const ctx = await buildCtx(app);

  /* ---------------- mark-processing ---------------- */
  if (action === "mark-processing") {
    await updateApplicationStatus(app.id, "processing", "admin");
    await logPaymentEvent({ applicationId: app.id, source: "admin", eventType: "status_change", detail: { to: "processing" } });
    return NextResponse.json({ ok: true, status: "processing" });
  }

  /* ---------------- request-info (#9) ---------------- */
  if (action === "request-info") {
    const ask = message?.trim();
    if (!ask) {
      return NextResponse.json({ ok: false, message: "Enter what you need from the customer." }, { status: 400 });
    }
    if (!app.email) {
      return NextResponse.json({ ok: false, message: "Application has no email on file." }, { status: 400 });
    }
    const result = await sendMissingInfoEmail(ctx, ask, { force });
    if (result.status === "failed") {
      return NextResponse.json({ ok: false, message: `Email failed: ${result.error}` }, { status: 502 });
    }
    if (result.status === "skipped") {
      return NextResponse.json(
        { ok: false, message: "A missing-info email was already sent. Repeat with force=true to send another." },
        { status: 409 },
      );
    }
    await updateApplicationStatus(app.id, "missing_info", "awaiting customer detail");
    await logPaymentEvent({ applicationId: app.id, source: "admin", eventType: "info_requested", detail: { askLength: ask.length } });
    return NextResponse.json({ ok: true, status: "missing_info", emailed: app.email });
  }

  /* ---------------- cancel (+#8) ---------------- */
  if (action === "cancel") {
    if (["cancelled", "refunded"].includes(app.status)) {
      return NextResponse.json({ ok: false, message: `Already ${app.status}.` }, { status: 409 });
    }
    await updateApplicationStatus(app.id, "cancelled", message?.trim() || "cancelled by admin");
    await logPaymentEvent({ applicationId: app.id, source: "admin", eventType: "status_change", detail: { to: "cancelled" } });
    if (app.email) await sendCancelledEmail(ctx);
    await opsAlert(`Application cancelled (manual) — ${app.reference}`, `Cancelled by admin. Customer: ${app.email ?? "no email"}.`);
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  /* ---------------- refund (+#10) ---------------- */
  // Find the approved charge to refund.
  const pay = await q<{
    id: string;
    transaction_id: string | null;
    amount_cents: number;
    card_brand: string | null;
    card_last4: string | null;
    dev_mode: boolean;
  }>(
    `select id, transaction_id, amount_cents, card_brand, card_last4, dev_mode
       from payments
      where application_id = $1 and status = 'approved' and kind in ('sale','retry_sale')
      order by created_at desc limit 1`,
    [app.id],
  );
  const charge = pay.rows[0];
  if (!charge?.transaction_id) {
    return NextResponse.json({ ok: false, message: "No approved charge found to refund." }, { status: 409 });
  }
  if (app.status === "refunded") {
    return NextResponse.json({ ok: false, message: "Already refunded." }, { status: 409 });
  }

  const amount = charge.amount_cents / 100;
  let result = await refundTransaction(charge.transaction_id, amount);
  if (!result.ok) {
    // Unsettled same-day transactions can only be voided.
    const voided = await voidTransaction(charge.transaction_id);
    if (!voided.ok) {
      return NextResponse.json(
        { ok: false, message: `Gateway rejected refund (${result.message}) and void (${voided.message}).` },
        { status: 502 },
      );
    }
    result = voided;
  }

  const refundPaymentId = await recordPayment({
    applicationId: app.id,
    kind: "refund",
    source: "admin",
    transactionId: result.transactionId,
    amountCents: charge.amount_cents,
    status: "refunded",
    cardBrand: charge.card_brand ?? undefined,
    cardLast4: charge.card_last4 ?? undefined,
    devMode: result.devMode,
    idempotencyKey: `refund/${charge.transaction_id}`,
  }).catch(() => null);
  await updateApplicationStatus(app.id, "refunded", message?.trim() || "refunded by admin");
  await logPaymentEvent({
    applicationId: app.id,
    paymentId: refundPaymentId,
    source: "admin",
    eventType: "refund",
    detail: { refundTransactionId: result.transactionId, amountCents: charge.amount_cents },
  });
  if (app.email) {
    await sendRefundEmail(ctx, {
      refundTransactionId: result.transactionId,
      refundedAt: new Date(),
      cardBrand: charge.card_brand,
      cardLast4: charge.card_last4,
      amount,
    });
  }
  await opsAlert(
    `Refund issued — ${app.reference}`,
    [
      `Amount: $${amount.toFixed(2)} — refund transaction ${result.transactionId}`,
      `Original transaction: ${charge.transaction_id}${charge.dev_mode ? " (dev-mode)" : ""}`,
      `Customer: ${app.email ?? "no email"} — email #10 ${app.email ? "sent" : "skipped"}`,
    ].join("\n"),
  );
  return NextResponse.json({ ok: true, status: "refunded", refundTransactionId: result.transactionId });
}
