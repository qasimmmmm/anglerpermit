# Email DNS & deliverability — anglerpermit.com

Status as of 2026-07-21: **all records below are live** (registrar: Porkbun).
This file is the checklist to re-verify after any DNS change.

## Records

| Purpose | Host | Type | Value | Status |
|---|---|---|---|---|
| DKIM (Resend) | `resend._domainkey` | TXT | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCbLkxmud…` (from Resend dashboard) | ✅ live |
| SPF for bounce/Return-Path subdomain | `send` | TXT | `v=spf1 include:amazonses.com ~all` | ✅ live |
| Return-Path MX | `send` | MX 10 | `feedback-smtp.us-east-1.amazonses.com` | ✅ live |
| DMARC | `_dmarc` | TXT | `v=DMARC1; p=quarantine; rua=mailto:multiplespot29@gmail.com; adkim=s; aspf=r; pct=100; fo=1` | ⬆ upgraded from `p=none` |
| Inbound forwarding (replies) | `@` | MX 10/20 | `fwd1.porkbun.com` / `fwd2.porkbun.com` (Porkbun email forwarding) | ✅ live |
| Root SPF (forwarding) | `@` | TXT | `v=spf1 include:_spf.porkbun.com ~all` | ✅ live |

Verify any time:

```bash
dig +short TXT _dmarc.anglerpermit.com
dig +short TXT send.anglerpermit.com
dig +short MX  send.anglerpermit.com
dig +short TXT resend._domainkey.anglerpermit.com
```

## DMARC rollout plan

1. **Now:** `p=quarantine; pct=100` with strict DKIM alignment (`adkim=s`) and
   relaxed SPF alignment (`aspf=r` — the Return-Path lives on
   `send.anglerpermit.com`, so relaxed alignment is required).
2. **After 2–4 weeks of clean aggregate reports** (they arrive at the `rua`
   address): move to `p=reject`. Just edit the `_dmarc` TXT record — nothing
   else changes.
3. Aggregate reports currently go to `multiplespot29@gmail.com` (a mailbox that
   verifiably receives mail). If you later create a dedicated
   `dmarc@anglerpermit.com` forward at Porkbun, update `rua=` to match.

## Sending identities

All senders live on the verified root domain (never `onboarding@resend.dev`):

| Address | Used for |
|---|---|
| `applications@anglerpermit.com` | application lifecycle (#1 received, #3 license delivered, #9 missing info) |
| `receipts@anglerpermit.com` | payment receipts + refunds (#2, #10) |
| `billing@anglerpermit.com` | declined payment + reminders (#4–#8) |
| `support@anglerpermit.com` | contact-form emails; the reply-to on everything |
| `orders@anglerpermit.com` | internal [AP Ops] notifications |

Every customer email sets `reply_to: support@anglerpermit.com`. Inbound mail to
the domain is handled by **Porkbun email forwarding** — confirm in the Porkbun
dashboard that `support@` (or a catch-all) forwards to a monitored inbox.
Domain-level verification in Resend covers every local part above; adding a new
sender address requires no DNS change.

## Rules that keep deliverability healthy

- **Transactional only on this domain.** If marketing/newsletter email ever
  launches, it must send from a separate subdomain (e.g. `news.anglerpermit.com`)
  with its own DKIM/SPF/DMARC, so promotional reputation can never hurt
  receipts or license delivery.
- Consistent from-names ("AnglerPermit", "AnglerPermit Billing") — inbox
  providers build sender recognition on them.
- Reminder emails #5–#7 carry a `List-Unsubscribe` header + a "pause payment
  reminders" link; pure transactional emails (#1–#4, #9, #10) deliberately
  do not.
- No URL shorteners, no all-caps subjects, absolute `https://anglerpermit.com`
  links only, every email ships a genuinely readable plain-text part.
- Target: mail-tester.com ≥ 9.5 for every template (QA phase re-checks this),
  and `Authentication-Results: spf=pass dkim=pass dmarc=pass` on a real
  received message.
