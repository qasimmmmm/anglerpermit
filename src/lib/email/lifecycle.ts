import type { StateConfig } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import type { DeclineCode } from "@/lib/nmi";
import { NMI_DESCRIPTOR } from "@/lib/nmi";
import {
  BUSINESS,
  detailCard,
  detailRow,
  emailShell,
  esc,
  ctaButton,
  stepsBlock,
  textFooter,
  utmLink,
} from "./email-layout";
import { sendEmail, type SendEmailResult } from "./pipeline";

/**
 * Lifecycle emails #1 (Application Received), #2 (Payment Receipt) and
 * #4 (Payment Declined) — built on the shared design system and sent through
 * the idempotent sendEmail() pipeline.
 *
 * Copy source: the product spec (Part 5), adapted only where the repo is the
 * source of truth (reference format, bundled-pricing honesty rules).
 * PII: templates receive masked data only; no SSN ever appears in any email.
 */

/* ------------------------------------------------------------------ */
/* sender identities                                                   */
/* ------------------------------------------------------------------ */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

const FROM = {
  applications: () =>
    env("EMAIL_FROM_APPLICATIONS") ?? "AnglerPermit <applications@anglerpermit.com>",
  receipts: () => env("EMAIL_FROM_RECEIPTS") ?? "AnglerPermit <receipts@anglerpermit.com>",
  billing: () => env("EMAIL_FROM_BILLING") ?? "AnglerPermit Billing <billing@anglerpermit.com>",
};

const replyTo = () => env("SUPPORT_REPLY_TO") ?? BUSINESS.supportEmail;

/* ------------------------------------------------------------------ */
/* formatting helpers                                                  */
/* ------------------------------------------------------------------ */

/** "July 28, 2026, 5:00 PM ET" — absolute dates with timezone, always. */
export function fmtDateTimeET(d: Date): string {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${s} ET`;
}

/** "July 28, 2026" (Eastern calendar date). */
export function fmtDateET(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* shared context                                                      */
/* ------------------------------------------------------------------ */

export interface LifecycleCtx {
  config: StateConfig | null;
  applicationId: string | null;
  reference: string;
  stateSlug: string;
  firstName: string | null;
  fullName: string | null;
  email: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  /** Bundled total in dollars (server-computed). */
  amount: number;
}

function stateName(ctx: LifecycleCtx): string {
  return ctx.config?.stateName ?? titleCaseSlug(ctx.stateSlug);
}

function license(ctx: LifecycleCtx) {
  return ctx.config?.licenses.find((l) => l.id === ctx.licenseId) ?? null;
}

function addOns(ctx: LifecycleCtx) {
  return (ctx.config?.addOns ?? []).filter((a) => ctx.addOnIds.includes(a.id));
}

function residencyLabel(ctx: LifecycleCtx): string {
  const opt = ctx.config?.residencyOptions?.find((r) => r.value === ctx.residency);
  return opt?.label ?? (ctx.residency ? titleCaseSlug(ctx.residency) : "—");
}

function greetingName(ctx: LifecycleCtx): string {
  return ctx.firstName?.trim() || "there";
}

/* ------------------------------------------------------------------ */
/* EMAIL #1 — Application Received                                     */
/* ------------------------------------------------------------------ */

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildApplicationReceivedEmail(ctx: LifecycleCtx): BuiltEmail {
  const state = stateName(ctx);
  const lic = license(ctx);
  const subject = `We've received your ${state} fishing license application (${ctx.reference})`;
  const preheader =
    "Our team is reviewing it now — most applications are processed within 1 business day.";

  const steps = stepsBlock([
    {
      title: "We review your application",
      body: "A specialist checks every detail — typically within 1 business day.",
    },
    {
      title: "We purchase your license",
      body: `We submit it through ${state}'s official licensing system on your behalf.`,
    },
    {
      title: "Your license lands in your inbox",
      body: "As soon as it's issued, we'll email it to you ready to print or save to your phone.",
    },
  ]);

  const rows = [
    detailRow("Reference", esc(ctx.reference), { mono: true, strong: true }),
    ctx.fullName ? detailRow("Applicant", esc(ctx.fullName)) : "",
    detailRow("State", esc(state)),
    lic ? detailRow("License", esc(lic.name)) : detailRow("License", esc(ctx.licenseId)),
    detailRow("Residency", esc(residencyLabel(ctx))),
    lic?.duration ? detailRow("Duration", esc(lic.duration)) : "",
    ...addOns(ctx).map((a) => detailRow("Add-on", esc(a.name))),
    detailRow("Amount paid", esc(formatPrice(ctx.amount)), { strong: true }),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your application is in ✓</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#475569;">
      Thanks for choosing AnglerPermit. Your ${esc(state)} fishing license application is in —
      here's exactly what happens next:
    </p>
    ${steps}
    ${detailCard(rows, { heading: "Application summary" })}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      <strong style="color:#0A2540;">Nothing else is needed from you right now.</strong>
      If anything in your application needs a correction, reply to this email and we'll fix it
      before we process it.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">Your receipt is in a separate email.</p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `Thanks for choosing AnglerPermit. Your ${state} fishing license application is in — here's exactly what happens next:`,
    "",
    "1. We review your application — a specialist checks every detail, typically within 1 business day.",
    `2. We purchase your license — we submit it through ${state}'s official licensing system on your behalf.`,
    "3. Your license lands in your inbox — ready to print or save to your phone.",
    "",
    "APPLICATION SUMMARY",
    `Reference:   ${ctx.reference}`,
    ...(ctx.fullName ? [`Applicant:   ${ctx.fullName}`] : []),
    `State:       ${state}`,
    `License:     ${lic?.name ?? ctx.licenseId}`,
    `Residency:   ${residencyLabel(ctx)}`,
    ...(lic?.duration ? [`Duration:    ${lic.duration}`] : []),
    ...addOns(ctx).map((a) => `Add-on:      ${a.name}`),
    `Amount paid: ${formatPrice(ctx.amount)}`,
    "",
    "Nothing else is needed from you right now. If anything needs a correction, just reply to this email.",
    "Your receipt is in a separate email.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "info", text: "Application received" },
      footerReference: ctx.reference,
      campaign: "application_received",
    }),
    text,
  };
}

export async function sendApplicationReceivedEmail(ctx: LifecycleCtx): Promise<SendEmailResult> {
  const tpl = buildApplicationReceivedEmail(ctx);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "application_received",
    to: ctx.email,
    from: FROM.applications(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { state: ctx.stateSlug, licenseId: ctx.licenseId },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #2 — Payment Receipt                                          */
/* ------------------------------------------------------------------ */

export interface ReceiptPayment {
  brand?: string;
  last4?: string;
  transactionId: string;
  paidAt: Date;
}

export function buildPaymentReceiptEmail(ctx: LifecycleCtx, pay: ReceiptPayment): BuiltEmail {
  const state = stateName(ctx);
  const lic = license(ctx);
  const subject = `Your AnglerPermit receipt — ${formatPrice(ctx.amount)} (${ctx.reference})`;
  const preheader = "Payment confirmed. Fully refundable until your license purchase is completed.";

  // Itemization: researched base prices are the state-fee portion; the
  // remainder is our bundled service & processing fee. (Bases are never
  // labeled "official fee" — repo honesty rule.)
  const baseItems: Array<{ label: string; base: number }> = [];
  if (lic) baseItems.push({ label: `${state} license fee — ${lic.name}`, base: lic.price });
  for (const a of addOns(ctx)) baseItems.push({ label: a.name, base: a.price });
  const stateFee = baseItems.reduce((s, i) => s + i.base, 0);
  const serviceFee = Math.max(0, ctx.amount - stateFee);
  const canItemize = lic !== null && stateFee > 0 && serviceFee >= 0;

  const method = [pay.brand, pay.last4 ? `ending ${pay.last4}` : ""].filter(Boolean).join(" ");
  const metaRows = [
    detailRow("Date", esc(fmtDateTimeET(pay.paidAt))),
    method ? detailRow("Payment method", esc(method)) : "",
    detailRow("Transaction ID", esc(pay.transactionId), { mono: true }),
    detailRow("Reference", esc(ctx.reference), { mono: true }),
  ].join("");

  const itemRows = canItemize
    ? [
        ...baseItems.map((i) => detailRow(i.label, esc(formatPrice(i.base)))),
        detailRow("Service & processing", esc(formatPrice(serviceFee))),
        detailRow("Total charged", esc(formatPrice(ctx.amount)), { strong: true }),
      ].join("")
    : detailRow("Total charged", esc(formatPrice(ctx.amount)), { strong: true });

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Payment receipt</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
      Your payment went through successfully. Keep this receipt for your records.
    </p>
    ${detailCard(metaRows, { heading: "Payment details" })}
    ${detailCard(itemRows, { heading: "Receipt" })}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      This charge will appear on your statement as <strong style="color:#0A2540;">${esc(NMI_DESCRIPTOR)}</strong>.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      <strong style="color:#0A2540;">Refund policy:</strong> your payment is fully refundable any
      time before we complete your license purchase with the state. After that, the state fee is
      non-refundable per state rules — see our
      <a href="${utmLink("/refund", "payment_receipt")}" style="color:#175CD3;">Refund Policy</a>.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    "Your payment went through successfully. Keep this receipt for your records.",
    "",
    "PAYMENT DETAILS",
    `Date:           ${fmtDateTimeET(pay.paidAt)}`,
    ...(method ? [`Payment method: ${method}`] : []),
    `Transaction ID: ${pay.transactionId}`,
    `Reference:      ${ctx.reference}`,
    "",
    "RECEIPT",
    ...(canItemize
      ? [
          ...baseItems.map((i) => `${i.label}: ${formatPrice(i.base)}`),
          `Service & processing: ${formatPrice(serviceFee)}`,
        ]
      : []),
    `Total charged: ${formatPrice(ctx.amount)}`,
    "",
    `This charge will appear on your statement as ${NMI_DESCRIPTOR}.`,
    "",
    "Refund policy: your payment is fully refundable any time before we complete your license purchase with the state. After that, the state fee is non-refundable per state rules.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "success", text: "Payment received" },
      footerReference: ctx.reference,
      campaign: "payment_receipt",
    }),
    text,
  };
}

export async function sendPaymentReceiptEmail(
  ctx: LifecycleCtx,
  pay: ReceiptPayment,
): Promise<SendEmailResult> {
  const tpl = buildPaymentReceiptEmail(ctx, pay);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "payment_receipt",
    to: ctx.email,
    from: FROM.receipts(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { transactionId: pay.transactionId, amount: ctx.amount },
  });
}

/* ------------------------------------------------------------------ */
/* EMAIL #4 — Payment Declined (Day 0)                                 */
/* ------------------------------------------------------------------ */

/** Decline-reason → one-sentence dunning hint (concierge tone, never blame). */
const DECLINE_HINTS: Record<DeclineCode, string> = {
  insufficient_funds:
    "This usually happens when a card is temporarily short on funds — try again in a moment, or use a different card.",
  expired_card:
    "This usually happens when a card has expired — double-check the expiry date or use a different card.",
  incorrect_card:
    "The billing details didn't match your bank's records — re-enter them carefully and try again.",
  invalid_cvv:
    "The security code (CVV) didn't match — re-enter it carefully; it's the 3-digit code on the back (4 on Amex).",
  over_limit:
    "The card appears to be over its limit — a different card usually does the trick.",
  do_not_honor:
    "Your bank declined the charge — a quick call to the number on the back of your card usually clears it, or you can simply try another card.",
  generic_decline:
    "Your bank declined the charge — a quick call to the number on the back of your card usually clears it, or you can simply try another card.",
  retry_later:
    "Your bank declined the charge for now — trying again tomorrow, or using a different card, usually works.",
  suspected_fraud:
    "Your bank declined the charge — please contact your bank, or simply use a different card.",
  duplicate_transaction:
    "This looked like a duplicate payment attempt — if you already paid, your receipt is in your inbox; otherwise try again in a few minutes.",
  card_not_supported:
    "This card type isn't supported for this purchase — a Visa, Mastercard, Amex or Discover card will work.",
  processor_error:
    "A temporary processing hiccup got in the way — trying again now usually works.",
  gateway_error:
    "A temporary processing hiccup got in the way — trying again now usually works.",
};

export interface DeclinedEmailInput {
  declineCode: DeclineCode;
  /** Secure retry link (/pay/{token}); falls back to the state page. */
  retryUrl: string | null;
  /** Hold deadline — decline + 7 days. */
  holdExpiry: Date;
}

export function buildPaymentDeclinedEmail(ctx: LifecycleCtx, input: DeclinedEmailInput): BuiltEmail {
  const state = stateName(ctx);
  const subject = `Action needed: your payment didn't go through (${ctx.reference})`;
  const preheader =
    "No charge was made. It takes about 60 seconds to try again with the same or a different card.";
  const hint = DECLINE_HINTS[input.declineCode] ?? DECLINE_HINTS.generic_decline;
  const holdDate = fmtDateET(input.holdExpiry);
  const retryUrl = input.retryUrl ?? utmLink(`/${ctx.stateSlug}`, "payment_declined");

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;font-weight:700;color:#0A2540;">Your payment didn't go through</h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">Hi ${esc(greetingName(ctx))},</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#475569;">
      We couldn't process your payment of <strong style="color:#0A2540;">${esc(formatPrice(ctx.amount))}</strong>
      for your ${esc(state)} fishing license application — <strong style="color:#0A2540;">you have not
      been charged</strong>, and your application is saved and waiting.
    </p>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${esc(hint)}</p>
    ${ctaButton(retryUrl, "Complete your payment securely")}
    <p style="margin:6px 0 0;text-align:center;font-size:12px;color:#64748B;">Takes about 60 seconds · card details are never stored on our servers</p>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      We'll hold your application until <strong style="color:#0A2540;">${esc(holdDate)}</strong> (7 days).
      After that it's cancelled automatically and nothing is charged.
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
      If you'd rather not continue, no action is needed — the application will simply expire.
      Questions? Just reply.
    </p>`;

  const text = [
    `Hi ${greetingName(ctx)},`,
    "",
    `We couldn't process your payment of ${formatPrice(ctx.amount)} for your ${state} fishing license application — you have NOT been charged, and your application is saved and waiting.`,
    "",
    hint,
    "",
    "Complete your payment securely (takes about 60 seconds):",
    retryUrl,
    "",
    `We'll hold your application until ${holdDate} (7 days). After that it's cancelled automatically and nothing is charged.`,
    "",
    "If you'd rather not continue, no action is needed — the application will simply expire. Questions? Just reply.",
    textFooter({ reference: ctx.reference }),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader,
      bodyHtml,
      banner: { tone: "warning", text: "Action needed: payment unsuccessful" },
      footerReference: ctx.reference,
      campaign: "payment_declined",
    }),
    text,
  };
}

export async function sendPaymentDeclinedEmail(
  ctx: LifecycleCtx,
  input: DeclinedEmailInput,
): Promise<SendEmailResult> {
  const tpl = buildPaymentDeclinedEmail(ctx, input);
  return sendEmail({
    applicationId: ctx.applicationId,
    type: "payment_declined",
    to: ctx.email,
    from: FROM.billing(),
    replyTo: replyTo(),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    meta: { declineCode: input.declineCode },
  });
}
