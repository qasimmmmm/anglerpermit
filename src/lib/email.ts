import { Resend } from "resend";
import type { StateConfig } from "@/lib/state-config";
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
    `Consents: accurate=${app.consents.accurate}, purchaseAuthorized=${app.consents.purchaseAuthorized}, termsAccepted=${app.consents.termsAccepted}`,
    ``,
    `--- Applicant (sensitive fields masked) ---`,
  ];
  for (const [key, value] of Object.entries(maskedData)) {
    lines.push(`${key}: ${String(value ?? "")}`);
  }
  if (config) {
    lines.push(
      ``,
      `--- Pricing ---`,
      `Official fee: ${formatPrice(
        (config.licenses.find((l) => l.id === app.licenseId)?.price ?? 0) +
          app.addOnIds.reduce(
            (sum, id) => sum + (config.addOns.find((a) => a.id === id)?.price ?? 0),
            0,
          ),
      )}`,
      `Service fee: ${formatPrice(config.serviceFee)}`,
    );
  }
  return lines.join("\n");
}

export async function sendApplicationEmail(
  ctx: ApplicationEmailContext,
): Promise<{ delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const from = process.env.EMAIL_FROM ?? "AnglerPermit <applications@anglerpermit.com>";
  const subject = `New application ${ctx.app.reference} — ${ctx.config?.stateName ?? ctx.app.stateSlug}`;
  const text = renderTextBody(ctx);

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
