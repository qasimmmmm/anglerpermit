import { NextResponse } from "next/server";
import { getStateConfig } from "@/lib/states";
import {
  hasApprovedPayment,
  lastDunningStepSent,
  latestDeclinedCard,
  listDunningCandidates,
  logPaymentEvent,
  markDunningStepsSkipped,
  updateApplicationStatus,
  type DunningCandidate,
} from "@/lib/storage";
import { dbConfigured } from "@/lib/db";
import { issueRetryToken } from "@/lib/retry-tokens";
import {
  fmtDateET,
  opsAlert,
  sendCancelledEmail,
  sendDunningStepEmail,
  type LifecycleCtx,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/dunning — the payment-reminder scheduler.
 *
 * Runs daily at 14:00 UTC (vercel.json cron ≈ 9–10am US Eastern, the window
 * that measurably improves recovery). Protected by CRON_SECRET — Vercel sends
 * `Authorization: Bearer $CRON_SECRET` on scheduled invocations; without the
 * secret configured this endpoint refuses to run.
 *
 * Behavior (idempotent — safe to run any number of times per day):
 *   Day 2  -> email #5 (payment_reminder, step 2)
 *   Day 4  -> email #6 (payment_reminder, step 4)
 *   Day 7  -> email #7 (final_notice,     step 7)
 *   Day 8+ -> auto-cancel + email #8, dunning ends
 * - Exactly-once per step via the email_log unique index (the sendEmail
 *   pipeline); a cron re-run or overlap can never double-send.
 * - If the cron was down and multiple steps became due, only the HIGHEST due
 *   step is sent; skipped lower steps are recorded so they never fire late.
 * - Paused applications (dunning_paused_at) get no reminders, but Day-8
 *   auto-cancel still applies (the customer was told the hold deadline).
 * - Anything paid/cancelled/refunded in the meantime is skipped by status.
 *
 * Time-travel testing (Part 8): `?simulateDay=N` — with the same CRON_SECRET
 * auth — treats every candidate as N days past its decline. Dry-run friendly:
 * pair with test applications only.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY_MS);
}

async function processCandidate(
  app: DunningCandidate,
  simulateDay: number | null,
  summary: {
    sent: Record<string, number>;
    cancelled: number;
    skippedPaused: number;
    skippedNotDue: number;
    errors: number;
  },
): Promise<void> {
  const now = Date.now();
  const failedAt = app.paymentFailedAt ?? app.submittedAt;
  const day = simulateDay ?? daysSince(failedAt, now);

  // Safety: if a payment slipped through while status lagged, never dun.
  if (await hasApprovedPayment(app.id).catch(() => false)) return;

  /* -------- Day 8+: auto-cancel + email #8 -------- */
  if (day >= 8) {
    await updateApplicationStatus(app.id, "cancelled", "payment_not_completed");
    await logPaymentEvent({
      applicationId: app.id,
      source: "cron",
      eventType: "auto_cancelled",
      detail: { day },
    });
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
        amount: app.amountCents / 100,
      };
      await sendCancelledEmail(ctx);
    }
    await opsAlert(
      `Application auto-cancelled — ${app.reference}`,
      [
        `Application: ${app.reference} (${app.id})`,
        `Declined: ${failedAt} (day ${day})`,
        `Customer: ${app.email ?? "no email"}`,
        "Dunning sequence exhausted — cancelled automatically, email #8 sent.",
      ].join("\n"),
    );
    summary.cancelled++;
    return;
  }

  /* -------- reminders (paused apps get none) -------- */
  if (app.dunningPausedAt) {
    summary.skippedPaused++;
    return;
  }

  const dueStep: 0 | 2 | 4 | 7 = day >= 7 ? 7 : day >= 4 ? 4 : day >= 2 ? 2 : 0;
  if (!dueStep || !app.email) {
    summary.skippedNotDue++;
    return;
  }

  const lastSent = await lastDunningStepSent(app.id);
  if (lastSent >= dueStep) {
    summary.skippedNotDue++;
    return;
  }

  // Record steps we're deliberately jumping over (cron outage catch-up).
  const jumped = [2, 4].filter((s) => s < dueStep && s > lastSent);
  await markDunningStepsSkipped(
    app.id,
    jumped.map((s) => ({ type: "payment_reminder", step: s })),
  );

  // Fresh single-active token, expiry anchored to the ORIGINAL decline
  // (decline + 8 days) so reminders never extend the deadline.
  const token = await issueRetryToken(app.id, { anchor: new Date(failedAt) });
  const config = await getStateConfig(app.stateSlug);
  const card = await latestDeclinedCard(app.id).catch(() => null);
  const holdExpiry = new Date(new Date(failedAt).getTime() + 7 * DAY_MS);

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
    amount: app.amountCents / 100,
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpermit.com";
  const result = await sendDunningStepEmail(ctx, dueStep, {
    retryUrl: token?.url ?? `${siteUrl}/${app.stateSlug}`,
    pauseUrl: token ? `${siteUrl}/reminders/pause/${token.token}` : `${siteUrl}/contact`,
    holdExpiry,
    cardBrand: card?.brand,
    cardLast4: card?.last4,
  });

  if (result.status === "sent") {
    summary.sent[`step${dueStep}`] = (summary.sent[`step${dueStep}`] ?? 0) + 1;
    await logPaymentEvent({
      applicationId: app.id,
      source: "cron",
      eventType: "dunning_sent",
      detail: { step: dueStep, day },
    });
    if (dueStep === 7) {
      await opsAlert(
        `Final notice sent — ${app.reference}`,
        [
          `Application: ${app.reference} (${app.id})`,
          `Customer: ${app.email}`,
          `Auto-cancel: ${fmtDateET(new Date(new Date(failedAt).getTime() + 8 * DAY_MS))}`,
        ].join("\n"),
      );
    }
  } else if (result.status === "failed") {
    summary.errors++;
  } else {
    summary.skippedNotDue++;
  }
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured — dunning disabled" },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const simulateRaw = url.searchParams.get("simulateDay");
  const simulateDay = simulateRaw !== null ? Number(simulateRaw) : null;
  if (simulateDay !== null && (!Number.isInteger(simulateDay) || simulateDay < 0 || simulateDay > 60)) {
    return NextResponse.json({ ok: false, error: "invalid simulateDay" }, { status: 400 });
  }

  const summary = {
    checked: 0,
    sent: {} as Record<string, number>,
    cancelled: 0,
    skippedPaused: 0,
    skippedNotDue: 0,
    errors: 0,
    simulateDay,
  };

  const candidates = await listDunningCandidates();
  summary.checked = candidates.length;

  for (const app of candidates) {
    try {
      await processCandidate(app, simulateDay, summary);
    } catch (err) {
      summary.errors++;
      // eslint-disable-next-line no-console
      console.error(
        `[cron/dunning] ${app.reference}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  const activity = summary.cancelled + Object.values(summary.sent).reduce((a, b) => a + b, 0);
  if (activity > 0 && simulateDay === null) {
    await opsAlert(
      `Dunning run: ${JSON.stringify(summary.sent)} sent, ${summary.cancelled} cancelled`,
      JSON.stringify(summary, null, 2),
    );
  }

  return NextResponse.json({ ok: true, ...summary });
}
