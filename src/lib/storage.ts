import { dbConfigured, q } from "@/lib/db";

/**
 * Application persistence — Postgres-backed (see migrations/001_init.sql),
 * with a graceful console fallback when DATABASE_URL is unset so the site
 * still works with zero env (dev mode).
 *
 * PII POLICY (do not weaken):
 * - form_data receives the MASKED submission only (SSN -> ***-**-1234).
 *   The full SSN is never persisted anywhere in this system.
 * - Payment rows contain gateway metadata only — card data never exists
 *   server-side in any form (see src/lib/nmi.ts header).
 */

/* ------------------------------------------------------------------ */
/* legacy shape kept for the email templates                           */
/* ------------------------------------------------------------------ */

export interface StoredApplication {
  reference: string;
  stateSlug: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  /** Applicant data — always the MASKED copy. */
  data: Record<string, unknown>;
  consents: {
    accurateAndTerms: boolean;
  };
  /** Payment record. NEVER contains card data — gateway metadata only. */
  payment: {
    transactionId: string;
    /** Charged amount in USD (server-computed, markup applied). */
    amount: number;
    last4?: string;
    brand?: string;
    /** Card-statement descriptor, e.g. "ANGLER PERMIT". */
    descriptor: string;
    /** True when the charge was simulated (no NMI key configured). */
    devMode: boolean;
  };
  submittedAt: string; // ISO timestamp
}

/* ------------------------------------------------------------------ */
/* database records                                                    */
/* ------------------------------------------------------------------ */

export type ApplicationStatus =
  | "pending_payment"
  | "payment_failed"
  | "received"
  | "processing"
  | "missing_info"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ApplicationRecord {
  id: string;
  reference: string;
  stateSlug: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  formData: Record<string, unknown>;
  consents: Record<string, unknown>;
  amountCents: number;
  status: ApplicationStatus;
  statusReason: string | null;
  nmiCustomerVaultId: string | null;
  submittedAt: string;
  paidAt: string | null;
  paymentFailedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
}

interface AppRow {
  id: string;
  reference: string;
  state_slug: string;
  residency: string;
  license_id: string;
  addon_ids: unknown;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  form_data: Record<string, unknown>;
  consents: Record<string, unknown>;
  amount_cents: number;
  status: ApplicationStatus;
  status_reason: string | null;
  nmi_customer_vault_id: string | null;
  submitted_at: Date;
  paid_at: Date | null;
  payment_failed_at: Date | null;
  delivered_at: Date | null;
  cancelled_at: Date | null;
  refunded_at: Date | null;
}

function rowToRecord(r: AppRow): ApplicationRecord {
  return {
    id: r.id,
    reference: r.reference,
    stateSlug: r.state_slug,
    residency: r.residency,
    licenseId: r.license_id,
    addOnIds: Array.isArray(r.addon_ids) ? (r.addon_ids as string[]) : [],
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    formData: r.form_data ?? {},
    consents: r.consents ?? {},
    amountCents: r.amount_cents,
    status: r.status,
    statusReason: r.status_reason,
    nmiCustomerVaultId: r.nmi_customer_vault_id,
    submittedAt: r.submitted_at.toISOString(),
    paidAt: r.paid_at?.toISOString() ?? null,
    paymentFailedAt: r.payment_failed_at?.toISOString() ?? null,
    deliveredAt: r.delivered_at?.toISOString() ?? null,
    cancelledAt: r.cancelled_at?.toISOString() ?? null,
    refundedAt: r.refunded_at?.toISOString() ?? null,
  };
}

const APP_COLS = `id, reference, state_slug, residency, license_id, addon_ids, email,
  first_name, last_name, phone, form_data, consents, amount_cents, status,
  status_reason, nmi_customer_vault_id, submitted_at, paid_at, payment_failed_at,
  delivered_at, cancelled_at, refunded_at`;

/* ------------------------------------------------------------------ */
/* create / reuse                                                      */
/* ------------------------------------------------------------------ */

export interface NewApplicationInput {
  reference: string;
  stateSlug: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  /** MASKED submission data only. */
  formData: Record<string, unknown>;
  consents: Record<string, unknown>;
  amountCents: number;
}

/**
 * Insert a new application (status pending_payment) — or, when the same
 * customer resubmits an identical unpaid order (double-click, decline retry
 * without the client threading applicationId), reuse the existing row so we
 * never create dunning-duplicate applications.
 *
 * Returns null when no database is configured (console fallback).
 */
export async function createOrReuseApplication(
  input: NewApplicationInput,
): Promise<{ app: ApplicationRecord; reused: boolean } | null> {
  if (!dbConfigured()) {
    // eslint-disable-next-line no-console
    console.log(
      `[storage:console] application ${input.reference} (${input.stateSlug}) — DATABASE_URL unset, not persisted`,
    );
    return null;
  }

  // Reuse window: identical unpaid application from the same email in the
  // last 24h. Keeps decline->retry from spawning duplicate rows.
  if (input.email) {
    const existing = await q<AppRow>(
      `select ${APP_COLS} from applications
        where lower(email) = lower($1)
          and state_slug = $2 and license_id = $3 and amount_cents = $4
          and status in ('pending_payment','payment_failed')
          and submitted_at > now() - interval '24 hours'
        order by submitted_at desc limit 1`,
      [input.email, input.stateSlug, input.licenseId, input.amountCents],
    );
    if (existing.rows[0]) {
      // Refresh the masked form data to the latest submission.
      const updated = await q<AppRow>(
        `update applications
            set form_data = $2, consents = $3, addon_ids = $4, residency = $5,
                first_name = $6, last_name = $7, phone = $8
          where id = $1
          returning ${APP_COLS}`,
        [
          existing.rows[0].id,
          input.formData,
          input.consents,
          JSON.stringify(input.addOnIds),
          input.residency,
          input.firstName,
          input.lastName,
          input.phone,
        ],
      );
      return { app: rowToRecord(updated.rows[0]), reused: true };
    }
  }

  const inserted = await q<AppRow>(
    `insert into applications
       (reference, state_slug, residency, license_id, addon_ids, email,
        first_name, last_name, phone, form_data, consents, amount_cents)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning ${APP_COLS}`,
    [
      input.reference,
      input.stateSlug,
      input.residency,
      input.licenseId,
      JSON.stringify(input.addOnIds),
      input.email,
      input.firstName,
      input.lastName,
      input.phone,
      input.formData,
      input.consents,
      input.amountCents,
    ],
  );
  return { app: rowToRecord(inserted.rows[0]), reused: false };
}

/* ------------------------------------------------------------------ */
/* lookups                                                             */
/* ------------------------------------------------------------------ */

export async function getApplicationById(id: string): Promise<ApplicationRecord | null> {
  if (!dbConfigured()) return null;
  const res = await q<AppRow>(`select ${APP_COLS} from applications where id = $1`, [id]);
  return res.rows[0] ? rowToRecord(res.rows[0]) : null;
}

export async function getApplicationByReference(
  reference: string,
): Promise<ApplicationRecord | null> {
  if (!dbConfigured()) return null;
  const res = await q<AppRow>(`select ${APP_COLS} from applications where reference = $1`, [
    reference,
  ]);
  return res.rows[0] ? rowToRecord(res.rows[0]) : null;
}

/* ------------------------------------------------------------------ */
/* payments + events                                                   */
/* ------------------------------------------------------------------ */

export interface PaymentAttemptInput {
  applicationId: string;
  kind: "sale" | "retry_sale" | "refund" | "void" | "validate";
  source: "checkout" | "retry_page" | "admin" | "cron" | "webhook";
  transactionId?: string;
  amountCents: number;
  status: "approved" | "declined" | "error" | "refunded" | "voided";
  declineCode?: string;
  declineMessage?: string;
  gatewayCode?: string;
  cardBrand?: string;
  cardLast4?: string;
  billingZip?: string;
  descriptor?: string;
  devMode?: boolean;
  rawResponse?: Record<string, unknown>;
  idempotencyKey?: string;
}

/** Record a gateway attempt. Returns the payment row id (or null in dev mode). */
export async function recordPayment(input: PaymentAttemptInput): Promise<string | null> {
  if (!dbConfigured()) return null;
  const res = await q<{ id: string }>(
    `insert into payments
       (application_id, kind, source, transaction_id, amount_cents, status,
        decline_code, decline_message, gateway_code, card_brand, card_last4,
        billing_zip, descriptor, dev_mode, raw_response, idempotency_key)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     on conflict (idempotency_key) do nothing
     returning id`,
    [
      input.applicationId,
      input.kind,
      input.source,
      input.transactionId ?? null,
      input.amountCents,
      input.status,
      input.declineCode ?? null,
      input.declineMessage ?? null,
      input.gatewayCode ?? null,
      input.cardBrand ?? null,
      input.cardLast4 ?? null,
      input.billingZip ?? null,
      input.descriptor ?? null,
      input.devMode ?? false,
      input.rawResponse ?? null,
      input.idempotencyKey ?? null,
    ],
  );
  return res.rows[0]?.id ?? null;
}

/** Has an approved (non-refunded) payment already been recorded for this app? */
export async function hasApprovedPayment(applicationId: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const res = await q(
    `select 1 from payments
      where application_id = $1 and status = 'approved' and kind in ('sale','retry_sale')
      limit 1`,
    [applicationId],
  );
  return (res.rowCount ?? 0) > 0;
}

/** Append to the audit trail. Never throws — auditing must not break checkout. */
export async function logPaymentEvent(event: {
  applicationId?: string;
  paymentId?: string | null;
  source: string;
  eventType: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!dbConfigured()) return;
  try {
    await q(
      `insert into payment_events (application_id, payment_id, source, event_type, detail)
       values ($1,$2,$3,$4,$5)`,
      [
        event.applicationId ?? null,
        event.paymentId ?? null,
        event.source,
        event.eventType,
        event.detail ?? null,
      ],
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[storage] payment_event insert failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }
}

/* ------------------------------------------------------------------ */
/* status transitions                                                  */
/* ------------------------------------------------------------------ */

/** Mark paid: pending_payment/payment_failed -> received (+vault id capture). */
export async function markApplicationPaid(
  applicationId: string,
  opts?: { customerVaultId?: string },
): Promise<void> {
  if (!dbConfigured()) return;
  await q(
    `update applications
        set status = 'received', paid_at = coalesce(paid_at, now()),
            status_reason = null,
            nmi_customer_vault_id = coalesce($2, nmi_customer_vault_id)
      where id = $1 and status in ('pending_payment','payment_failed')`,
    [applicationId, opts?.customerVaultId ?? null],
  );
}

/** Mark declined: starts (or keeps) the dunning clock. */
export async function markApplicationPaymentFailed(
  applicationId: string,
  reason: string,
): Promise<void> {
  if (!dbConfigured()) return;
  await q(
    `update applications
        set status = 'payment_failed',
            payment_failed_at = coalesce(payment_failed_at, now()),
            status_reason = $2
      where id = $1 and status in ('pending_payment','payment_failed')`,
    [applicationId, reason],
  );
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  reason?: string,
): Promise<void> {
  if (!dbConfigured()) return;
  const stampCol =
    status === "delivered"
      ? "delivered_at"
      : status === "cancelled"
        ? "cancelled_at"
        : status === "refunded"
          ? "refunded_at"
          : null;
  await q(
    `update applications
        set status = $2, status_reason = $3
            ${stampCol ? `, ${stampCol} = coalesce(${stampCol}, now())` : ""}
      where id = $1`,
    [applicationId, status, reason ?? null],
  );
}

/** Record issued-license details (admin Upload License & Send). */
export async function setLicenseFields(
  applicationId: string,
  fields: { licenseNumber?: string | null; validFrom?: string | null; validTo?: string | null },
): Promise<void> {
  if (!dbConfigured()) return;
  await q(
    `update applications
        set license_number = coalesce($2, license_number),
            license_valid_from = coalesce($3::date, license_valid_from),
            license_valid_to = coalesce($4::date, license_valid_to)
      where id = $1`,
    [applicationId, fields.licenseNumber ?? null, fields.validFrom ?? null, fields.validTo ?? null],
  );
}

/* ------------------------------------------------------------------ */
/* dunning support                                                     */
/* ------------------------------------------------------------------ */

export interface DunningCandidate extends ApplicationRecord {
  dunningPausedAt: string | null;
}

/** All payment_failed applications with their pause state (cron input). */
export async function listDunningCandidates(): Promise<DunningCandidate[]> {
  if (!dbConfigured()) return [];
  const res = await q<AppRow & { dunning_paused_at: Date | null }>(
    `select ${APP_COLS}, dunning_paused_at from applications
      where status = 'payment_failed' and payment_failed_at is not null
      order by payment_failed_at`,
  );
  return res.rows.map((r) => ({
    ...rowToRecord(r),
    dunningPausedAt: r.dunning_paused_at?.toISOString() ?? null,
  }));
}

/** Highest dunning sequence step already sent (0 if none). */
export async function lastDunningStepSent(applicationId: string): Promise<number> {
  if (!dbConfigured()) return 0;
  const res = await q<{ max: number | null }>(
    `select max(sequence_step)::int as max from email_log
      where application_id = $1
        and email_type in ('payment_reminder','final_notice')
        and status in ('sending','sent')`,
    [applicationId],
  );
  return res.rows[0]?.max ?? 0;
}

/** Record steps the cron intentionally skipped (so they never fire late). */
export async function markDunningStepsSkipped(
  applicationId: string,
  steps: Array<{ type: string; step: number }>,
): Promise<void> {
  if (!dbConfigured() || steps.length === 0) return;
  for (const s of steps) {
    await q(
      `insert into email_log (application_id, email_type, sequence_step, recipient, subject, status, meta)
       values ($1,$2,$3,'','','skipped','{"reason":"superseded by later step"}')
       on conflict (application_id, email_type, sequence_step)
         where status in ('sending','sent') and application_id is not null
         do nothing`,
      [applicationId, s.type, s.step],
    ).catch(() => {});
  }
}

/** Card display info from the most recent declined attempt (for reminders). */
export async function latestDeclinedCard(
  applicationId: string,
): Promise<{ brand: string | null; last4: string | null } | null> {
  if (!dbConfigured()) return null;
  const res = await q<{ card_brand: string | null; card_last4: string | null }>(
    `select card_brand, card_last4 from payments
      where application_id = $1 and status = 'declined'
      order by created_at desc limit 1`,
    [applicationId],
  );
  return res.rows[0] ? { brand: res.rows[0].card_brand, last4: res.rows[0].card_last4 } : null;
}

/** Set the reminders-pause flag. Returns true when a row was updated. */
export async function pauseDunning(applicationId: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const res = await q(
    `update applications set dunning_paused_at = coalesce(dunning_paused_at, now())
      where id = $1 and status = 'payment_failed'`,
    [applicationId],
  );
  return (res.rowCount ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/* legacy adapter shim (kept so nothing else breaks if imported)       */
/* ------------------------------------------------------------------ */

export interface StorageAdapter {
  saveApplication(app: StoredApplication): Promise<void>;
}

/** @deprecated superseded by createOrReuseApplication — kept for compatibility. */
export const storage: StorageAdapter = {
  async saveApplication(app: StoredApplication): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[storage:legacy] saveApplication(${app.reference}) — no-op (DB layer active)`);
  },
};
