import type { StateConfig } from "@/lib/state-config";
import { computeOrderTotal } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import type { StoredApplication } from "@/lib/storage";
import {
  BRAND,
  detailCard,
  detailRow,
  emailShell,
  esc,
  referenceBanner,
  siteUrl,
  stepsBlock,
  textFooter,
} from "./email-layout";

/* ------------------------------------------------------------------ */
/* shared helpers                                                      */
/* ------------------------------------------------------------------ */

export interface OrderEmailContext {
  config: StateConfig | null;
  app: StoredApplication;
  /** Applicant data with SSN fields masked (***-**-####). */
  maskedData: Record<string, unknown>;
  /**
   * Raw applicant data. Used ONLY when ADMIN_EMAIL_INCLUDE_FULL_SSN=true to
   * include the unmasked SSN in the admin fulfillment email. Never sent to
   * customers and never logged.
   */
  rawData?: Record<string, unknown>;
}

function residencyLabel(value: string): string {
  switch (value) {
    case "resident": return "Resident";
    case "nonresident": return "Non-resident";
    case "senior": return "Senior";
    case "youth": return "Youth";
    default: return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
  }
}

function licenseName(ctx: OrderEmailContext): string {
  return (
    ctx.config?.licenses.find((l) => l.id === ctx.app.licenseId)?.name ?? ctx.app.licenseId
  );
}

function addOnNames(ctx: OrderEmailContext): string[] {
  return ctx.app.addOnIds.map(
    (id) => ctx.config?.addOns.find((a) => a.id === id)?.name ?? id,
  );
}

function stateName(ctx: OrderEmailContext): string {
  return ctx.config?.stateName ?? ctx.app.stateSlug;
}

function orderTotal(ctx: OrderEmailContext): number {
  return ctx.config
    ? computeOrderTotal(ctx.config, ctx.app.licenseId, ctx.app.addOnIds)
    : ctx.app.payment.amount;
}

function customerFirstName(ctx: OrderEmailContext): string {
  const v = ctx.maskedData["firstName"];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** The customer's email address as submitted on the application. */
export function customerEmail(ctx: OrderEmailContext): string | null {
  const v = ctx.maskedData["email"];
  return typeof v === "string" && /.+@.+\..+/.test(v) ? v.trim() : null;
}

function paymentSummaryValue(app: StoredApplication): string {
  const card = app.payment.last4
    ? `${app.payment.brand ?? "Card"} •••• ${app.payment.last4}`
    : "Card";
  return `${card}`;
}

function formatValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/* ------------------------------------------------------------------ */
/* 1. customer order confirmation                                      */
/* ------------------------------------------------------------------ */

export function orderConfirmationEmail(ctx: OrderEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const first = customerFirstName(ctx);
  const state = stateName(ctx);
  const total = formatPrice(orderTotal(ctx));
  const addOns = addOnNames(ctx);
  const subject = `Order confirmed ${ctx.app.reference} — your ${state} fishing license application`;

  const orderRows = [
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx.app.residency))),
    detailRow("License", esc(licenseName(ctx))),
    ...(addOns.length ? [detailRow("Add-ons", esc(addOns.join(", ")))] : []),
    detailRow("Submitted", esc(new Date(ctx.app.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) + " CT")),
  ].join("");

  const paymentRows = [
    detailRow("Amount charged", esc(total), { strong: true }),
    detailRow("Payment method", esc(paymentSummaryValue(ctx.app))),
    detailRow("Transaction ID", esc(ctx.app.payment.transactionId), { mono: true }),
    detailRow("Statement descriptor", esc(ctx.app.payment.descriptor)),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:${BRAND.navy};">Thanks${first ? `, ${esc(first)}` : ""} — your application is in.</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      We've received your <strong style="color:${BRAND.navy};">${esc(state)}</strong> fishing license application
      and your payment of <strong style="color:${BRAND.navy};">${esc(total)}</strong>.
      A licensing specialist will now review it and purchase your license from the official state portal on your behalf.
    </p>
    ${referenceBanner(ctx.app.reference)}
    ${detailCard(orderRows, { heading: "Order summary" })}
    ${detailCard(paymentRows, { heading: "Payment receipt" })}
    <h2 style="margin:26px 0 0;font-size:16px;color:${BRAND.navy};">What happens next</h2>
    ${stepsBlock([
      { title: "Review", body: "A specialist checks your application for errors — usually within 1 business day." },
      { title: "Fulfillment", body: "We purchase your license on the official state portal. Your card statement shows “" + ctx.app.payment.descriptor + "”." },
      { title: "Delivery", body: "Your license and receipt are emailed to this address as soon as the state issues them." },
    ])}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border-left:3px solid ${BRAND.forest500};background:${BRAND.forest50};border-radius:0 10px 10px 0;">
      <tr><td style="padding:13px 18px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.forest};">
          <strong>Refund promise:</strong> your order is fully refundable any time before we purchase your license from the state.
        </p>
      </td></tr>
    </table>`;

  const text = [
    `Thanks${first ? `, ${first}` : ""} — your application is in.`,
    ``,
    `We've received your ${state} fishing license application and your payment of ${total}.`,
    `A licensing specialist will review it and purchase your license from the official state portal on your behalf.`,
    ``,
    `Your reference number: ${ctx.app.reference}`,
    `(Keep this number — include it whenever you contact us.)`,
    ``,
    `ORDER SUMMARY`,
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx.app.residency)}`,
    `License: ${licenseName(ctx)}`,
    ...(addOns.length ? [`Add-ons: ${addOns.join(", ")}`] : []),
    ``,
    `PAYMENT RECEIPT`,
    `Amount charged: ${total}`,
    `Payment method: ${paymentSummaryValue(ctx.app)}`,
    `Transaction ID: ${ctx.app.payment.transactionId}`,
    `Statement descriptor: ${ctx.app.payment.descriptor}`,
    ``,
    `WHAT HAPPENS NEXT`,
    `1. Review — a specialist checks your application for errors (usually within 1 business day).`,
    `2. Fulfillment — we purchase your license on the official state portal.`,
    `3. Delivery — your license and receipt are emailed to this address.`,
    ``,
    `Refund promise: your order is fully refundable any time before we purchase your license from the state.`,
    textFooter(),
  ].join("\n");

  return { subject, html: emailShell({ preheader: `Reference ${ctx.app.reference} · ${state} · ${total} — we'll email your license once the state issues it.`, kicker: "Order confirmation", bodyHtml }), text };
}

/* ------------------------------------------------------------------ */
/* 2. admin new-order notification                                     */
/* ------------------------------------------------------------------ */

export function adminNewOrderEmail(
  ctx: OrderEmailContext,
  opts: { includeFullSSN: boolean },
): { subject: string; html: string; text: string } {
  const state = stateName(ctx);
  const total = formatPrice(orderTotal(ctx));
  const addOns = addOnNames(ctx);
  const subject = `New order ${ctx.app.reference} — ${state} — ${total}`;

  // Choose data source: masked by default; raw only when explicitly enabled.
  const data =
    opts.includeFullSSN && ctx.rawData ? ctx.rawData : ctx.maskedData;

  // Render applicant fields in the order defined by the state config, with
  // official labels; append any extra keys not covered by the config.
  const rendered = new Set<string>();
  const applicantRows: string[] = [];
  const applicantText: string[] = [];
  if (ctx.config) {
    for (const field of ctx.config.formFields) {
      if (!(field.name in data)) continue;
      rendered.add(field.name);
      const value = formatValue(data[field.name]);
      applicantRows.push(detailRow(field.label, esc(value)));
      applicantText.push(`${field.label}: ${value}`);
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (rendered.has(key)) continue;
    const v = formatValue(value);
    applicantRows.push(detailRow(key, esc(v)));
    applicantText.push(`${key}: ${v}`);
  }

  const ssnNote = opts.includeFullSSN
    ? `<p style="margin:10px 0 0;font-size:12px;color:${BRAND.red600};font-weight:600;">Contains full SSN — handle per your data-handling policy and delete when fulfilled.</p>`
    : `<p style="margin:10px 0 0;font-size:12px;color:${BRAND.slate500};">SSN fields are masked (***-**-last4). Set ADMIN_EMAIL_INCLUDE_FULL_SSN=true only if your fulfillment flow requires the full number by email.</p>`;

  const orderRows = [
    detailRow("Reference", esc(ctx.app.reference), { mono: true, strong: true }),
    detailRow("State", esc(state)),
    detailRow("Residency", esc(residencyLabel(ctx.app.residency))),
    detailRow("License", esc(licenseName(ctx))),
    ...(addOns.length ? [detailRow("Add-ons", esc(addOns.join(", ")))] : []),
    detailRow("Submitted", esc(ctx.app.submittedAt), { mono: true }),
  ].join("");

  const paymentRows = [
    detailRow("Amount charged", esc(total), { strong: true }),
    detailRow("Card", esc(paymentSummaryValue(ctx.app))),
    detailRow("Transaction ID", esc(ctx.app.payment.transactionId), { mono: true }),
    ...(ctx.app.payment.devMode
      ? [detailRow("Mode", `<span style="color:${BRAND.red600};font-weight:700;">DEV — SIMULATED CHARGE</span>`)]
      : []),
  ].join("");

  const portal = ctx.config
    ? `<p style="margin:18px 0 0;font-size:13px;color:${BRAND.slate600};">Fulfill at: <a href="${esc(ctx.config.officialPortalUrl)}" style="color:${BRAND.forest500};font-weight:600;">${esc(ctx.config.officialPortalName)}</a></p>`
    : "";

  const bodyHtml = `
    <h1 style="margin:0;font-size:20px;color:${BRAND.navy};">New application received</h1>
    <p style="margin:10px 0 0;font-size:14px;color:${BRAND.slate600};">Reply to this email to reach the customer directly.</p>
    ${detailCard(orderRows, { heading: "Order" })}
    ${detailCard(paymentRows, { heading: "Payment" })}
    ${detailCard(applicantRows.join(""), { heading: "Applicant details (as submitted)" })}
    ${ssnNote}
    ${portal}`;

  const text = [
    `New application received`,
    ``,
    `ORDER`,
    `Reference: ${ctx.app.reference}`,
    `State: ${state}`,
    `Residency: ${residencyLabel(ctx.app.residency)}`,
    `License: ${licenseName(ctx)}`,
    ...(addOns.length ? [`Add-ons: ${addOns.join(", ")}`] : []),
    `Submitted: ${ctx.app.submittedAt}`,
    ``,
    `PAYMENT`,
    `Amount charged: ${total}`,
    `Card: ${paymentSummaryValue(ctx.app)}`,
    `Transaction ID: ${ctx.app.payment.transactionId}`,
    ...(ctx.app.payment.devMode ? [`Mode: DEV — SIMULATED CHARGE`] : []),
    ``,
    `APPLICANT DETAILS (as submitted)`,
    ...applicantText,
    ``,
    opts.includeFullSSN
      ? `NOTE: contains full SSN — handle per policy and delete when fulfilled.`
      : `NOTE: SSN fields are masked (***-**-last4).`,
    ...(ctx.config ? [``, `Fulfill at: ${ctx.config.officialPortalName} — ${ctx.config.officialPortalUrl}`] : []),
  ].join("\n");

  return {
    subject,
    html: emailShell({
      preheader: `${state} · ${licenseName(ctx)} · ${total}`,
      kicker: "New order",
      bodyHtml,
      disclaimer: false,
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 3. contact form — admin notification                                */
/* ------------------------------------------------------------------ */

export interface ContactMessage {
  name: string;
  email: string;
  reference?: string;
  message: string;
}

export function contactNotificationEmail(msg: ContactMessage): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Support message from ${msg.name}${msg.reference ? ` — ${msg.reference}` : ""}`;
  const rows = [
    detailRow("Name", esc(msg.name)),
    detailRow("Email", `<a href="mailto:${esc(msg.email)}" style="color:${BRAND.forest500};">${esc(msg.email)}</a>`),
    ...(msg.reference ? [detailRow("Reference", esc(msg.reference), { mono: true })] : []),
  ].join("");

  const bodyHtml = `
    <h1 style="margin:0;font-size:20px;color:${BRAND.navy};">New support message</h1>
    <p style="margin:10px 0 0;font-size:14px;color:${BRAND.slate600};">Sent from the contact form on anglerpermit.com. Reply to this email to answer ${esc(msg.name.split(" ")[0] || "the customer")} directly.</p>
    ${detailCard(rows, { heading: "From" })}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border:1px solid ${BRAND.slate200};border-radius:12px;">
      <tr><td style="padding:18px 22px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">Message</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.navy};white-space:pre-wrap;">${esc(msg.message)}</p>
      </td></tr>
    </table>`;

  const text = [
    `New support message (contact form)`,
    ``,
    `Name: ${msg.name}`,
    `Email: ${msg.email}`,
    ...(msg.reference ? [`Reference: ${msg.reference}`] : []),
    ``,
    `MESSAGE`,
    msg.message,
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: msg.message.slice(0, 120), kicker: "Support", bodyHtml, disclaimer: false }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 4. contact form — customer acknowledgement                          */
/* ------------------------------------------------------------------ */

export function contactAckEmail(msg: ContactMessage): {
  subject: string;
  html: string;
  text: string;
} {
  const first = msg.name.trim().split(/\s+/)[0] || "";
  const subject = `We got your message${msg.reference ? ` — ${msg.reference}` : ""} | AnglerPermit Support`;

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;color:${BRAND.navy};">We got your message${first ? `, ${esc(first)}` : ""}.</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      Thanks for reaching out — a real person reads every message. We typically reply within
      <strong style="color:${BRAND.navy};">1 business day</strong>${msg.reference ? `, and we've linked your note to reference <strong style="color:${BRAND.navy};font-family:monospace;">${esc(msg.reference)}</strong>` : ""}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border:1px solid ${BRAND.slate200};border-radius:12px;background:${BRAND.slate50};">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">Your message</p>
        <p style="margin:0;font-size:13px;line-height:1.65;color:${BRAND.slate600};white-space:pre-wrap;">${esc(msg.message)}</p>
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${BRAND.slate600};">
      If anything is urgent, you can also check our <a href="${siteUrl()}/faq" style="color:${BRAND.forest500};font-weight:600;">FAQ</a> — many answers are there.
    </p>`;

  const text = [
    `We got your message${first ? `, ${first}` : ""}.`,
    ``,
    `Thanks for reaching out — a real person reads every message.`,
    `We typically reply within 1 business day.${msg.reference ? ` Your note is linked to reference ${msg.reference}.` : ""}`,
    ``,
    `YOUR MESSAGE`,
    msg.message,
    ``,
    `FAQ: ${siteUrl()}/faq`,
    textFooter(),
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: "Thanks for reaching out — we typically reply within 1 business day.", kicker: "Message received", bodyHtml }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 5. license delivery                                                 */
/* ------------------------------------------------------------------ */

export interface LicenseDeliveryInput {
  customerName: string;
  reference: string;
  stateName: string;
  /** Optional personal note from the team, shown above the standard copy. */
  note?: string;
  attachmentNames: string[];
}

export function licenseDeliveryEmail(input: LicenseDeliveryInput): {
  subject: string;
  html: string;
  text: string;
} {
  const first = input.customerName.trim().split(/\s+/)[0] || "";
  const subject = `Your ${input.stateName} fishing license is here — ${input.reference}`;

  const noteHtml = input.note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;border-left:3px solid ${BRAND.forest500};background:${BRAND.forest50};border-radius:0 10px 10px 0;">
        <tr><td style="padding:13px 18px;">
          <p style="margin:0;font-size:13px;line-height:1.65;color:${BRAND.forest};white-space:pre-wrap;">${esc(input.note)}</p>
        </td></tr>
      </table>`
    : "";

  const attachList = input.attachmentNames.length
    ? `<ul style="margin:8px 0 0;padding-left:20px;">${input.attachmentNames
        .map((n) => `<li style="font-size:13px;color:${BRAND.navy};font-weight:600;margin:3px 0;">${esc(n)}</li>`)
        .join("")}</ul>`
    : "";

  const bodyHtml = `
    <h1 style="margin:0;font-size:22px;color:${BRAND.navy};">Tight lines${first ? `, ${esc(first)}` : ""} — your license is attached. 🎣</h1>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:${BRAND.slate600};">
      Your <strong style="color:${BRAND.navy};">${esc(input.stateName)}</strong> fishing license has been issued and is attached to this email.
      Print it or save it to your phone — carry it whenever you fish, and follow your state's regulations.
    </p>
    ${referenceBanner(input.reference)}
    ${noteHtml}
    <p style="margin:20px 0 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.slate500};">Attached</p>
    ${attachList}
    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:${BRAND.slate600};">
      Check the license carefully. If anything looks wrong, reply to this email with your reference number and we'll make it right.
    </p>`;

  const text = [
    `Tight lines${first ? `, ${first}` : ""} — your ${input.stateName} fishing license is attached.`,
    ``,
    `Reference: ${input.reference}`,
    ``,
    ...(input.note ? [input.note, ``] : []),
    `Attached: ${input.attachmentNames.join(", ") || "license document"}`,
    ``,
    `Print it or save it to your phone — carry it whenever you fish, and follow your state's regulations.`,
    `If anything looks wrong, reply to this email with your reference number and we'll make it right.`,
    textFooter(),
  ].join("\n");

  return {
    subject,
    html: emailShell({ preheader: `Your ${input.stateName} fishing license is attached — reference ${input.reference}.`, kicker: "License delivered", bodyHtml }),
    text,
  };
}
