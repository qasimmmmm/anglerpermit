import {
  adminNewOrderEmail,
  contactAckEmail,
  contactNotificationEmail,
  customerEmail,
  licenseDeliveryEmail,
  orderConfirmationEmail,
  type ContactMessage,
  type LicenseDeliveryInput,
  type OrderEmailContext,
} from "./templates";
import { deliver, opsAlert, sendEmail } from "./pipeline";

export type { ContactMessage, LicenseDeliveryInput, OrderEmailContext };
export { deliver, opsAlert, sendEmail };
export {
  sendApplicationReceivedEmail,
  sendPaymentReceiptEmail,
  sendPaymentDeclinedEmail,
  sendDunningStepEmail,
  sendCancelledEmail,
  buildApplicationReceivedEmail,
  buildPaymentReceiptEmail,
  buildPaymentDeclinedEmail,
  buildReminder1Email,
  buildReminder2Email,
  buildFinalNoticeEmail,
  buildCancelledEmail,
  fmtDateET,
  fmtDateTimeET,
  type LifecycleCtx,
  type BuiltEmail,
} from "./lifecycle";

/**
 * AnglerPermit transactional email — Resend integration.
 *
 * Emails sent by the system:
 *   1. Customer order confirmation + payment receipt   (on successful checkout)
 *   2. Admin new-order notification with full details  (on successful checkout)
 *   3. Contact-form notification to support inbox      (on /api/contact)
 *   4. Contact-form acknowledgement to the customer    (on /api/contact)
 *   5. License delivery with attachments               (via /admin/deliver)
 *
 * Behavior notes:
 * - Works with ZERO env vars: without RESEND_API_KEY every send becomes a
 *   console log (dev mode) and the calling flow continues normally.
 * - Email failures NEVER fail an order — the card has already been charged;
 *   we log and move on. Order emails use Resend idempotency keys so gateway
 *   retries can't double-send.
 * - SECURITY: customer-facing emails only ever receive masked data. The admin
 *   email uses masked SSNs unless ADMIN_EMAIL_INCLUDE_FULL_SSN=true.
 *
 * Environment variables (see .env.example):
 *   RESEND_API_KEY               — Resend secret key (required in production)
 *   ADMIN_EMAIL                  — where order/contact notifications go;
 *                                  comma-separate for multiple recipients
 *   EMAIL_FROM                   — orders sender    (default: AnglerPermit <orders@anglerpermit.com>)
 *   EMAIL_FROM_SUPPORT           — support sender  (default: AnglerPermit Support <support@anglerpermit.com>)
 *   EMAIL_FROM_LICENSES          — license sender  (default: AnglerPermit <licenses@anglerpermit.com>)
 *   SUPPORT_REPLY_TO             — reply-to on customer emails (default: support@anglerpermit.com)
 *   ADMIN_EMAIL_INCLUDE_FULL_SSN — "true" to include unmasked SSN in admin order emails
 */

const DEFAULTS = {
  from: "AnglerPermit <orders@anglerpermit.com>",
  fromSupport: "AnglerPermit Support <support@anglerpermit.com>",
  fromLicenses: "AnglerPermit <licenses@anglerpermit.com>",
  replyTo: "support@anglerpermit.com",
} as const;

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function adminRecipients(): string[] {
  return (env("ADMIN_EMAIL") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface SendResult {
  delivered: boolean;
  id?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* order emails (confirmation + admin notification)                    */
/* ------------------------------------------------------------------ */

export interface OrderEmailsResult {
  customer: SendResult & { to: string | null };
  admin: SendResult & { to: string[] };
}

/**
 * Send both order emails in parallel after a successful checkout.
 * Never throws — the order is already paid; email problems are logged only.
 */
export async function sendOrderEmails(ctx: OrderEmailContext): Promise<OrderEmailsResult> {
  const to = customerEmail(ctx);
  const admins = adminRecipients();
  const includeFullSSN = env("ADMIN_EMAIL_INCLUDE_FULL_SSN") === "true";

  const jobs: Array<Promise<SendResult>> = [];

  // 1. Customer confirmation + receipt
  if (to) {
    const tpl = orderConfirmationEmail(ctx);
    jobs.push(
      deliver({
        from: env("EMAIL_FROM") ?? DEFAULTS.from,
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        replyTo: env("SUPPORT_REPLY_TO") ?? DEFAULTS.replyTo,
        tag: "order-confirmation",
        idempotencyKey: `order-confirm/${ctx.app.reference}`,
      }),
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[email] ${ctx.app.reference}: no valid customer email in submission — confirmation skipped`);
    jobs.push(Promise.resolve({ delivered: false, error: "no customer email" }));
  }

  // 2. Admin notification (reply-to goes straight to the customer)
  if (admins.length) {
    const tpl = adminNewOrderEmail(ctx, { includeFullSSN });
    jobs.push(
      deliver({
        from: env("EMAIL_FROM") ?? DEFAULTS.from,
        to: admins,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        replyTo: to ?? undefined,
        tag: "admin-new-order",
        idempotencyKey: `order-admin/${ctx.app.reference}`,
      }),
    );
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[email] ${ctx.app.reference}: ADMIN_EMAIL not set — admin notification skipped`);
    jobs.push(Promise.resolve({ delivered: false, error: "ADMIN_EMAIL not configured" }));
  }

  const [customer, admin] = await Promise.all(jobs);
  return {
    customer: { ...customer, to },
    admin: { ...admin, to: admins },
  };
}

/* ------------------------------------------------------------------ */
/* contact form emails                                                 */
/* ------------------------------------------------------------------ */

export interface ContactEmailsResult {
  admin: SendResult;
  ack: SendResult;
}

/** Send the support-inbox notification and the customer acknowledgement. */
export async function sendContactEmails(msg: ContactMessage): Promise<ContactEmailsResult> {
  const admins = adminRecipients();
  const fromSupport = env("EMAIL_FROM_SUPPORT") ?? DEFAULTS.fromSupport;

  const notif = contactNotificationEmail(msg);
  const ackTpl = contactAckEmail(msg);

  const [admin, ack] = await Promise.all([
    admins.length
      ? deliver({
          from: fromSupport,
          to: admins,
          subject: notif.subject,
          html: notif.html,
          text: notif.text,
          replyTo: msg.email,
          tag: "contact-notification",
        })
      : Promise.resolve<SendResult>({ delivered: false, error: "ADMIN_EMAIL not configured" }),
    deliver({
      from: fromSupport,
      to: msg.email,
      subject: ackTpl.subject,
      html: ackTpl.html,
      text: ackTpl.text,
      replyTo: env("SUPPORT_REPLY_TO") ?? DEFAULTS.replyTo,
      tag: "contact-ack",
    }),
  ]);

  return { admin, ack };
}

/* ------------------------------------------------------------------ */
/* license delivery                                                    */
/* ------------------------------------------------------------------ */

export interface LicenseDeliveryArgs extends LicenseDeliveryInput {
  to: string;
  attachments: Array<{ filename: string; content: Buffer; contentType?: string }>;
}

/** Send the branded license-delivery email with attachments. */
export async function sendLicenseDeliveryEmail(args: LicenseDeliveryArgs): Promise<SendResult> {
  const tpl = licenseDeliveryEmail(args);
  const result = await deliver({
    from: env("EMAIL_FROM_LICENSES") ?? DEFAULTS.fromLicenses,
    to: args.to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    replyTo: env("SUPPORT_REPLY_TO") ?? DEFAULTS.replyTo,
    tag: "license-delivery",
    attachments: args.attachments,
  });

  // Give the team a copy of what was sent (best effort — awaited so the
  // serverless function isn't frozen before the request completes).
  const admins = adminRecipients();
  if (result.delivered && admins.length) {
    await deliver({
      from: env("EMAIL_FROM_LICENSES") ?? DEFAULTS.fromLicenses,
      to: admins,
      subject: `[sent] ${tpl.subject}`,
      html: tpl.html,
      text: tpl.text,
      tag: "license-delivery-copy",
      attachments: args.attachments,
    });
  }
  return result;
}
