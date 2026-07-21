# AnglerPermit — Email System Setup

The site sends five transactional emails through [Resend](https://resend.com):

| # | Email                              | To        | From                              | Trigger                          |
|---|------------------------------------|-----------|-----------------------------------|----------------------------------|
| 1 | Order confirmation + receipt       | Customer  | `orders@anglerpermit.com`         | Successful checkout              |
| 2 | New-order notification (full data) | Admin     | `orders@anglerpermit.com`         | Successful checkout              |
| 3 | Support message notification       | Admin     | `support@anglerpermit.com`        | Contact form on `/contact`       |
| 4 | "We got your message" acknowledgement | Customer | `support@anglerpermit.com`     | Contact form on `/contact`       |
| 5 | License delivery (with attachments)   | Customer + admin copy | `licenses@anglerpermit.com` | Team page `/admin/deliver` |

All senders are addresses on **anglerpermit.com**, so one domain verification
covers everything. Every email ships an HTML + plain-text version, sets
`Reply-To: support@anglerpermit.com` on customer emails, and sets the
customer's own address as `Reply-To` on admin emails (hit Reply to answer
them directly). Order emails use idempotency keys so retries can't
double-send. **Email failures never fail an order** — errors are logged to
the Vercel function logs and the checkout continues.

With no `RESEND_API_KEY` configured, nothing breaks: every send is logged to
the server console instead (dev mode).

---

## 1. Create the Resend account & API key

1. Sign up at https://resend.com/signup (free: 3,000 emails/month, 100/day).
2. **Domains → Add Domain** → `anglerpermit.com`, region of your choice.
3. **API Keys → Create API Key** → name `anglerpermit-production`, permission
   *Sending access*, domain `anglerpermit.com`. Copy the `re_…` key — it is
   shown only once.

## 2. DNS records at Porkbun

DNS for anglerpermit.com is hosted at **Porkbun** (porkbun.com → Domain
Management → anglerpermit.com → **DNS Records**).

After adding the domain, Resend shows the exact records to create — typically:

| Type | Host/Name                        | Value                              | Purpose        |
|------|----------------------------------|------------------------------------|----------------|
| TXT  | `resend._domainkey`              | `p=MIGfMA0GCS…` (from Resend)      | DKIM signature |
| MX   | `send`                           | `feedback-smtp.<region>.amazonses.com` prio 10 (from Resend) | Bounce handling |
| TXT  | `send`                           | `v=spf1 include:amazonses.com ~all` (from Resend) | SPF for bounce domain |

Porkbun notes:
- In the **Host** field enter only the part left of the domain (`resend._domainkey`, `send`) — Porkbun appends `.anglerpermit.com` automatically.
- These records do **not** conflict with the existing Porkbun email
  forwarding (`fwd1/fwd2.porkbun.com` MX on the root) — inbound forwarding
  for `support@anglerpermit.com` keeps working. Do not delete the root MX or
  root SPF records.
- Back in Resend, press **Verify DNS Records**. Verification usually
  completes in a few minutes.

### Recommended: DMARC

Add this TXT record (Resend doesn't require it, inbox providers love it):

| Type | Host     | Value                                                        |
|------|----------|--------------------------------------------------------------|
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:multiplespot29@gmail.com; fo=1` |

Start with `p=none` (monitor only). After a couple of clean weeks, tighten to
`p=quarantine`.

### Recommended: support@ forwarding

Customer replies go to `support@anglerpermit.com`. In Porkbun → Email
Forwarding, make sure `support@anglerpermit.com` forwards to the inbox you
actually read (e.g. `multiplespot29@gmail.com`).

## 3. Vercel environment variables

Vercel → the project that serves **anglerpermit.com** → Settings →
Environment Variables (add to *Production*, and *Preview* if you want emails
from previews). If both `anglerpermit` and `anglerpermit-ladb` are live, set
them on both.

| Name                 | Value                                  | Required |
|----------------------|----------------------------------------|----------|
| `RESEND_API_KEY`     | `re_…` from step 1                     | ✅        |
| `ADMIN_EMAIL`        | `multiplespot29@gmail.com`             | ✅        |
| `ADMIN_PANEL_SECRET` | output of `openssl rand -base64 24`    | for `/admin/deliver` |
| `EMAIL_FROM`         | `AnglerPermit <orders@anglerpermit.com>` | optional (default) |
| `EMAIL_FROM_SUPPORT` | `AnglerPermit Support <support@anglerpermit.com>` | optional (default) |
| `EMAIL_FROM_LICENSES`| `AnglerPermit <licenses@anglerpermit.com>` | optional (default) |
| `SUPPORT_REPLY_TO`   | `support@anglerpermit.com`             | optional (default) |
| `ADMIN_EMAIL_INCLUDE_FULL_SSN` | `true` **only** if fulfillment requires the full SSN by email | optional |

Redeploy after saving (Deployments → ⋯ → Redeploy) so the functions pick up
the new variables.

> **About `ADMIN_EMAIL_INCLUDE_FULL_SSN`:** by default the admin email masks
> SSNs (`***-**-1234`). Email is not encrypted at rest, so only enable the
> full number if you truly need it to purchase the license, and delete those
> emails after fulfillment. The long-term fix is an encrypted database +
> admin portal instead of email as the system of record.

## 4. Test checklist

1. **Contact form:** `/contact` → send a message. Expect the notification in
   the admin inbox and an acknowledgement at the address you entered.
2. **Order flow:** submit a test application. While `NMI_PRIVATE_SECURITY_KEY`
   is unset, charges are simulated (`DEV — SIMULATED CHARGE` shows in the
   admin email) so no real money moves. Expect the customer confirmation and
   the admin new-order email.
3. **License delivery:** `/admin/deliver` → fill the form with the
   `ADMIN_PANEL_SECRET`, attach a PDF. Expect the customer email with the
   attachment and a `[sent]` copy in the admin inbox.
4. **Deliverability:** at https://www.mail-tester.com send email #1 to the
   address it gives you (place a test order with it) — after DKIM + SPF +
   DMARC you should score 9–10/10.

## 5. Operating notes

- Monitor sends, opens, and bounces at https://resend.com/emails (each email
  is tagged: `order-confirmation`, `admin-new-order`, `contact-notification`,
  `contact-ack`, `license-delivery`).
- The contact endpoint throttles to 5 messages/hour/IP (per serverless
  instance) and has a honeypot field; failures tell the user to email
  support directly.
- Sending limits on the free tier: 3,000/month, 100/day. Each order consumes
  2 emails, a contact message 2, a delivery 2 — upgrade Resend when volume
  approaches ~45 orders/day.
