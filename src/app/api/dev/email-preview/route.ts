import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getStateConfig } from "@/lib/states";
import {
  buildApplicationReceivedEmail,
  buildCancelledEmail,
  buildFinalNoticeEmail,
  buildLicenseDeliveredEmail,
  buildMissingInfoEmail,
  buildPaymentDeclinedEmail,
  buildPaymentReceiptEmail,
  buildRefundEmail,
  buildReminder1Email,
  buildReminder2Email,
  buildRenewalReminderEmail,
  deliver,
  type BuiltEmail,
  type LifecycleCtx,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dev/email-preview — template preview + test-send harness.
 *
 *   ?secret=ADMIN_PANEL_SECRET     required (same team secret as /admin)
 *   &template=1|2|4|5|6|7|8|3|9|10|renewal   which email
 *   &format=html|text              default html
 *   &state=michigan|texas|...      seed state (default michigan)
 *   &send=someone@example.com      actually send it (via Resend) instead
 *
 * Every template renders from realistic seed props so the whole design can
 * be reviewed (or run through mail-tester) without touching real customers.
 */

function secretMatches(provided: string): boolean {
  const expected = process.env.ADMIN_PANEL_SECRET;
  if (!expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!secretMatches(url.searchParams.get("secret") ?? "")) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const template = url.searchParams.get("template") ?? "1";
  const format = url.searchParams.get("format") === "text" ? "text" : "html";
  const stateSlug = url.searchParams.get("state") ?? "michigan";
  const sendTo = url.searchParams.get("send");

  const config = await getStateConfig(stateSlug);
  const lic = config?.licenses[0];
  const ctx: LifecycleCtx = {
    config,
    applicationId: null,
    reference: "AP-PREVIEW-000000-TEST",
    stateSlug,
    firstName: "Sarah",
    fullName: "Sarah Whitaker",
    email: sendTo ?? "preview@example.com",
    residency: config?.residencyOptions[0]?.value ?? "resident",
    licenseId: lic?.id ?? "license",
    addOnIds: [],
    amount: lic ? lic.price * 3 : 78,
  };
  const inWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const dunning = {
    retryUrl: "https://anglerpermit.com/pay/PREVIEW-TOKEN",
    pauseUrl: "https://anglerpermit.com/reminders/pause/PREVIEW-TOKEN",
    holdExpiry: inWeek,
    cardBrand: "Visa",
    cardLast4: "4242",
  };

  const builders: Record<string, () => BuiltEmail> = {
    "1": () => buildApplicationReceivedEmail(ctx),
    "2": () =>
      buildPaymentReceiptEmail(ctx, {
        brand: "Visa",
        last4: "4242",
        transactionId: "10339741231",
        paidAt: new Date(),
      }),
    "3": () =>
      buildLicenseDeliveredEmail(ctx, {
        licenseNumber: "LIC-2026-0099887",
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        attachmentNames: ["fishing-license.pdf"],
      }),
    "4": () =>
      buildPaymentDeclinedEmail(ctx, {
        declineCode: "insufficient_funds",
        retryUrl: dunning.retryUrl,
        holdExpiry: inWeek,
      }),
    "5": () => buildReminder1Email(ctx, dunning),
    "6": () => buildReminder2Email(ctx, dunning),
    "7": () => buildFinalNoticeEmail(ctx, dunning),
    "8": () => buildCancelledEmail(ctx),
    "9": () =>
      buildMissingInfoEmail(
        ctx,
        "The date of birth on your application doesn't match your driver license record. Please reply with the correct date of birth exactly as it appears on your license.",
      ),
    "10": () =>
      buildRefundEmail(ctx, {
        refundTransactionId: "10339745555",
        refundedAt: new Date(),
        cardBrand: "Visa",
        cardLast4: "4242",
        amount: ctx.amount,
      }),
    renewal: () =>
      buildRenewalReminderEmail(ctx, {
        validTo: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        optOutUrl: "https://anglerpermit.com/api/renewals/optout?ref=PREVIEW&sig=PREVIEW",
      }),
  };

  const build = builders[template];
  if (!build) {
    return NextResponse.json(
      { ok: false, message: `Unknown template "${template}". Use 1-10 or "renewal".` },
      { status: 400 },
    );
  }
  const tpl = build();

  if (sendTo) {
    const result = await deliver({
      from: "AnglerPermit <applications@anglerpermit.com>",
      to: sendTo,
      subject: `[TEST] ${tpl.subject}`,
      html: tpl.html,
      text: tpl.text,
      replyTo: "support@anglerpermit.com",
      tag: "template-test",
    });
    return NextResponse.json({ ok: result.delivered, id: result.id, error: result.error });
  }

  return new NextResponse(format === "text" ? tpl.text : tpl.html, {
    headers: {
      "Content-Type": format === "text" ? "text/plain; charset=utf-8" : "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
    },
  });
}
