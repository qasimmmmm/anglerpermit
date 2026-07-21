import { Resend } from "resend";
import type { StateConfig } from "@/lib/state-config";
import { computeOrderTotal } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import type { StoredApplication } from "@/lib/storage";

/**
 * Admin notification email.
 *
 * SECURITY: the `data` payload passed here must already have SSN fields
 * masked (***-**-####) via maskSensitiveFields(). Never email raw SSNs.
 *
 * Works with ZERO env vars: when RESEND_API_KEY or ADMIN_EMAIL are missing,
 * the masked summary is logged to the server console instead (dev mode).
 */

export interface ApplicationEmailContext {
  config: StateConfig | null;
  app: StoredApplication;
  /** Pre-masked applicant data. */
  maskedData: Record<string, unknown>;
}

function renderTextBody({ config, app, maskedData }: ApplicationEmailContext): string {
  const lines: string[] = [
    `New AnglerPermit application`,
    ``,
    `Reference: ${app.reference}`,
    `State: ${config?.stateName ?? app.stateSlug}`,
    `Residency: ${app.residency}`,
    `License: ${config?.licenses.find((l) => l.id === app.licenseId)?.name ?? app.licenseId}`,
    `Add-ons: ${
      app.addOnIds
        .map((id) => config?.addOns.find((a) => a.id === id)?.name ?? id)
        .join(", ") || "None"
    }`,
    `Submitted: ${app.submittedAt}`,
    ``,
    `Consent: accurateAndTerms=${app.consents.accurateAndTerms}`,
    `Payment: ${formatPrice(app.payment.amount)} charged (txn ${app.payment.transactionId}${app.payment.devMode ? ", DEV SIMULATED" : ""}${app.payment.last4 ? `, ${app.payment.brand ?? "card"} •••• ${app.payment.last4}` : ""})`,
    ``,
    `--- Applicant (sensitive fields masked) ---`,
  ];
  for (const [key, value] of Object.entries(maskedData)) {
    lines.push(`${key}: ${String(value ?? "")}`);
  }
  if (config) {
    // Single bundled total (markup applied via computeOrderTotal) — no
    // "official fee"/"service fee" split; our margin is inside the total.
    lines.push(
      ``,
      `--- Pricing ---`,
      `Total charged: ${formatPrice(computeOrderTotal(config, app.licenseId, app.addOnIds))}`,
    );
  }
  return lines.join("\n");
}

/**
 * Minimal HTML wrapper for the admin notification: a centered brand logo
 * header above the (HTML-escaped) plain-text summary.
 *
 * The logo is referenced by absolute public URL — email clients cannot load
 * relative paths, and the image only resolves once the site is deployed.
 * Set NEXT_PUBLIC_SITE_URL (e.g. https://anglerpermit.com) in the deployment
 * environment; the fallback below matches the production domain.
 */
function renderHtmlBody(text: string): string {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpermit.com").replace(/\/$/, "");
  const logoUrl = `${siteUrl}/brand/logo.png`;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;">
      <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
        <img src="${logoUrl}" alt="AnglerPermit" width="200" style="display:inline-block;width:200px;height:auto;border:0;" />
      </div>
      <pre style="margin:24px 0 0;white-space:pre-wrap;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.5;color:#0f172a;">${escaped}</pre>
    </div>
  </body>
</html>`;
}

export async function sendApplicationEmail(
  ctx: ApplicationEmailContext,
): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM ?? "AnglerPermit <applications@anglerpermit.com>";
  const subject = `New application ${ctx.app.reference} — ${ctx.config?.stateName ?? ctx.app.stateSlug}`;
  const text = renderTextBody(ctx);
  const html = renderHtmlBody(text);

  if (!apiKey || !adminEmail) {
    // Dev-mode fallback: no email provider configured. Masked summary only.
    // eslint-disable-next-line no-console
    console.log(`[email:dev] RESEND_API_KEY/ADMIN_EMAIL not set — would send:\n${subject}\n${text}`);
    return { delivered: false };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject,
      text,
      html,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[email] Resend error for ${ctx.app.reference}: ${error.message}`);
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[email] Failed to send ${ctx.app.reference}: ${err instanceof Error ? err.message : "unknown error"}`,
    );
    return { delivered: false };
  }
}
