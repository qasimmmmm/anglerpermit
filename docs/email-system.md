# AnglerPermit — payments + transactional email system

Living reference for the NMI payment integration and the lifecycle email
system. Companion file: `docs/email-dns-setup.md` (DNS/deliverability).

## Architecture

```
Checkout (ApplicationForm → PaymentStep → Collect.js token)
   │  POST /api/applications        ← amount recomputed server-side, never client-trusted
   ▼
applications (pending_payment) ──charge (lib/nmi)──► approved ──► received ──► #1 + #2 + [AP Ops]
   │                                                    ▲
   └── declined ──► payment_failed + retry token ──► #4 │
         │                                              │ POST /api/payments/retry
         ├─ Day 2  cron ► #5 (reminder, pause link)     │   (from /pay/{token})
         ├─ Day 4  cron ► #6                            │
         ├─ Day 7  cron ► #7 + [AP Ops]                 │
         └─ Day 8  cron ► auto-cancel + #8 + [AP Ops] ──┘ (recovery ends dunning)

received ──admin──► processing ──► delivered (#3 + license fields)
   │                    │              └─ 14d before license_valid_to: renewal reminder
   │                    └──► missing_info (#9)
   └──admin/webhook──► refunded (#10)

Webhooks:  /api/webhooks/nmi (HMAC t=,s=)   — reconcile missed sales, refunds → #10
           /api/webhooks/resend (Svix)      — email_log status; license bounce = URGENT ops
Cron:      /api/cron/dunning (daily 14:00 UTC, CRON_SECRET) — dunning + renewals
```

Every email goes through **`sendEmail()`** (`src/lib/email/pipeline.ts`):

1. `email_log` reserve-then-send — partial unique index on
   `(application_id, email_type, sequence_step)` means one send per logical
   email, ever. Webhook replays, cron re-runs, double-fires all lose the race.
2. Resend idempotency key `${type}/${applicationId}/${step}` (provider-side
   24h dedupe, works even if the DB is briefly unreachable).
3. 3 attempts with backoff on transient provider errors; hard failure →
   `email_log.status='failed'` + `[AP Ops]` alert. Email failures never break
   payment flows.

`email_log` stores metadata only (type, recipient, subject, message id, small
`meta` props) — never rendered bodies, never PII beyond the recipient address.

## Trigger map (the contract)

| Event | Emails |
|---|---|
| submit + NMI approval | **#1** Application Received (`applications@`), **#2** Receipt (`receipts@`), `[AP Ops]` rich order email |
| NMI decline (not gateway errors) | **#4** Declined (`billing@`) + retry token + dunning schedule + `[AP Ops]` |
| cron day 2 / 4 / 7 after decline | **#5 / #6 / #7** (`billing@`, pause link + List-Unsubscribe) |
| cron day 8 / manual cancel | auto-cancel + **#8** + `[AP Ops]` |
| retry-link payment succeeds | recovery: #1 (if never sent) + #2, token consumed, `[AP Ops]` "recovered at step N" |
| admin "Request info" | **#9** Missing Info (`applications@`), status → missing_info |
| admin "Upload License & Send" | **#3** License Delivered + attachments (`applications@`), status → delivered |
| admin Refund / NMI refund webhook | **#10** Refund Confirmation (`receipts@`), status → refunded |
| cron, 14 days before `license_valid_to` | renewal reminder (opt-out link, List-Unsubscribe) |
| any hard email failure / license bounce | `[AP Ops]` alert (bounce on #3 = URGENT) |

Sequence steps: dunning uses `sequence_step` 2/4/7; everything else 0; manual
forced resends allocate steps ≥ 100.

## Environment variables

See `.env.example` for the annotated list. Production quick reference:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres (auto-injected by the Vercel↔Neon integration) |
| `NMI_PRIVATE_SECURITY_KEY` | server-side charges (`NMI_SECURITY_KEY` alias accepted) |
| `NEXT_PUBLIC_NMI_TOKENIZATION_KEY` | Collect.js in the browser |
| `NMI_WEBHOOK_SIGNING_KEY` | verify /api/webhooks/nmi |
| `CRON_SECRET` | dunning/renewal cron auth (Vercel sends it automatically) |
| `RESEND_API_KEY` | sending |
| `RESEND_WEBHOOK_SECRET` | verify /api/webhooks/resend |
| `ADMIN_EMAIL`, `ADMIN_PANEL_SECRET` | ops notifications, admin actions |
| `EMAIL_FROM_APPLICATIONS/RECEIPTS/BILLING` | sender identities (defaults fine) |
| `BUSINESS_LEGAL_NAME/ADDRESS`, `SUPPORT_EMAIL/PHONE` | footer identity |
| `NMI_ENABLE_CUSTOMER_VAULT` | OFF until checkout consent copy ships |

Migrations: `migrations/*.sql`, applied automatically on every deploy
(`npm run build` runs `scripts/migrate.mjs` first; `npm run db:migrate`
locally). Idempotent + advisory-locked.

## How to add a new email

1. Add a builder + sender in `src/lib/email/lifecycle.ts` (copy an existing
   one — `emailShell` + `statusBanner` + `detailCard`/`stepsBlock`/`ctaButton`
   give you the design system; ALWAYS ship a real plain-text part).
2. Give it a stable `type` string and send through `sendEmail()` with the
   `applicationId` — idempotency comes free.
3. Add seed props to `/api/dev/email-preview` and check both formats.
4. Non-transactional? Add List-Unsubscribe + an opt-out path (see the
   renewal reminder for the pattern).

## Preview & test-send harness

```
GET /api/dev/email-preview?secret=<ADMIN_PANEL_SECRET>&template=5           # HTML in browser
GET /api/dev/email-preview?secret=…&template=5&format=text                  # plain text
GET /api/dev/email-preview?secret=…&template=3&state=texas                  # other state seed
GET /api/dev/email-preview?secret=…&template=2&send=you@example.com         # real test send
```

Templates: `1 2 3 4 5 6 7 8 9 10 renewal`.

## Runbooks

**Resend is down / a send failed** — the payment already completed; the
customer email is recorded `failed` in `email_log` and ops got an alert.
Fix the cause, then resend: for #9 use the admin panel force option; for
others re-trigger via the admin action (deliveries 409 if already sent —
that means it actually went out; check `email_log`).

**License email bounced** — URGENT ops alert fires (needs the Resend
webhook configured). Reach the customer by phone, correct the address, and
re-deliver from /admin/deliver (the 409 guard applies per application — if
you must re-send to a corrected address, contact eng to clear the
`license_delivered` row or use force tooling).

**Webhook replay storm** — replays dedupe at three layers: webhook_events
unique (provider, event_id), payments idempotency keys, email_log unique
index. Zero duplicate emails by construction; `email_log` proves it.

**Charge approved but customer says "no confirmation"** — check
`email_log` for the application; check Resend dashboard for the message id;
check the NMI webhook reconciliation ops alerts (a missed sync response gets
marked paid by the webhook). Resend the receipt from the preview harness if
truly lost.

**Dunning didn't run** — Vercel → Crons shows invocations; the endpoint
503s if CRON_SECRET is missing and 401s on bad auth. Manual run:
`curl -H "Authorization: Bearer $CRON_SECRET" https://anglerpermit.com/api/cron/dunning`.
Time-travel QA: append `?simulateDay=N` (test data only!).

**Refund from the NMI portal instead of the admin panel** — fine: the
refund webhook records it, flips the status, and sends #10 (deduped against
the admin path).

## Compliance guardrails (do not weaken)

- Non-affiliation disclosure + business postal address in EVERY email footer
  (FTC Impersonation Rule / CAN-SPAM). No state seals, agency logos, or
  government-style letterheads anywhere, ever. Senders are always
  "AnglerPermit"/"AnglerPermit Billing".
- SSN: last 4 max, and customer emails never include it at all. Card data:
  brand + last4 only — PANs never exist server-side (Collect.js, SAQ-A).
  Never add raw card fields to any route.
- #1–#4, #9, #10 are pure transactional (no unsubscribe clutter). #5–#7
  carry the pause link + RFC 8058 one-click header. Renewal reminders have a
  full opt-out.
- Absolute dates with timezone in customer copy ("July 28, 2026"), reference
  number in every subject.

## QA evidence (2026-07-21)

- NMI sandbox: 11/11 gateway tests through `chargeSale`/`refundTransaction`/
  `voidTransaction` (approve, decline enum mapping, refund, void).
- Production end-to-end: checkout approve (#1+#2+ops), decline (#4 + token),
  double-submit → original success returned, decline replay → single #4
  (email_log + Resend both show exactly one), retry-page recovery on the
  live site, cron auth 401/503.
- simulateDay sweep 0→2→2→4→7→8: steps fire exactly once, day-8
  auto-cancel + #8; pause skips reminders but not cancellation; rate limit
  402×5 → 429.
- Ops chain on one application: #4 → recovery → #9 (repeat 409) → #3
  (repeat 409) → #10; then a signed NMI refund webhook for the same charge
  produced **no second #10**. Bad webhook signature / stale timestamp → 401;
  event replay → `duplicate:true`.
- Rendering: all templates screenshotted at 720px and 390px via headless
  Chromium (light mode); table-based layout, inline styles, VML button for
  Outlook. Remaining manual matrix (real Outlook desktop / Gmail iOS /
  Apple Mail dark) — see go-live checklist.
