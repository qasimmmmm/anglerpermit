# 7-State Data & Systems Audit — 2026-07-21

Full audit of whether the data we collect is sufficient to purchase each
customer's correct fishing license, plus a best-practices review of payments,
email, and the admin panel. Method: our live configs (portal-verified
2026-07-18) were re-verified against official agency sources on 2026-07-21 by
seven parallel research passes; findings below cite official URLs only.

## Executive summary

- **Prices: effectively 100% correct.** 100+ stored base prices across all 7
  states match the official 2026 fee schedules (CA 22/23 items OK — the one
  miss was the closed abalone fishery, now removed; CO 14/14; FL 30+ OK;
  MI 10/10; NC all fishing licenses OK against the July 13, 2026 digest;
  SC all OK; TX 23/23 with TPWD item numbers).
- **Core personal-data fields: sufficient for the mainstream licenses** in
  all 7 states (name, DOB, address, contact, ID, physical descriptors where
  required, SSN where legally mandated). The original portal research was
  strong — several suspected gaps (CA GO ID option, SC alien-ID alternative,
  CO ITIN wording, CO Habitat-Stamp auto-add) were already handled.
- **Fixed in this audit:** CA abalone card removed from sale; optional
  CPW Customer ID (CO) and WRC Customer Number (NC) fields added so
  returning customers match their existing state records; security headers +
  checkout throttle added.
- **The real risks are business/fulfillment risks, not data gaps** — see
  Critical Flags. Three of them deserve a decision before scaling ads.

## Critical flags (decide before running ads)

### 1. California enforcement risk — HIGH
CDFW's official fraud FAQ describes third-party license-purchase services —
charging a markup and buying on customers' behalf — as **unauthorized**, says
it issues **cease-and-desist letters to operators**, and works to get their
**search ads removed**. Only CDFW offices, licensed agents, CDFW's own portal
and phone line are authorized channels.
Source: https://nrm.dfg.ca.gov/FileHandler.ashx?DocumentID=170649
**Recommendation:** at minimum exclude California from paid-ad targeting;
ideally get legal advice before continuing CA sales at all. (I'm not a
lawyer — this one needs a real one.)

### 2. Ad-platform policy — HIGH (affects the whole ads plan)
Google Ads restricts promotion of **"government documents and official
services"** — documents/services obtainable directly from a government, which
is exactly what fishing licenses are. Ads in this category are routinely
disapproved and repeat violations risk account suspension
([Google policy](https://support.google.com/adspolicy/answer/6368711?hl=en),
[Search Engine Journal coverage](https://www.searchenginejournal.com/google-ads-introduces-new-policies-for-government-documents-services/356440/),
[example disapproval threads](https://support.google.com/google-ads/thread/348473837/ads-disapproved-for-government-documents-and-official-services-policy-%E2%80%93-need-guidance?hl=en)).
**Recommendation:** read the current policy text before spending anything;
plan for non-Google channels (Meta/TikTok have their own review but no
identical blanket restriction), SEO, and content marketing as primary.
Microsoft/Bing has a similar restricted category. Budget for disapprovals.

### 3. Texas ID-validation rule — effective Aug 1–3, 2026 (days away)
TPWD: from early August 2026, buyers 17+ must show ID in person, and **"if
purchasing online, each license holder will need to have their ID
independently validated."** The mechanics of that online validation are not
yet public (the FAQ page is behind a TPWD login). If validation requires the
license holder to interact directly, third-party fulfillment for Texas may
break. Foreign residents lose online eligibility entirely.
Sources: https://tpwd.texas.gov/regulations/outdoor-annual/licenses/purchase-requirements ,
https://tpwd.texas.gov/newsmedia/releases/?req=20260326b
**Recommendation:** re-check the TPWD validation FAQ + portal flow the week
of Aug 3, and again at the Aug 15 on-sale date for 2026-27 licenses.

### 4. Application-only products we list as instantly purchasable — MEDIUM
These cannot be bought online by anyone — they're mail-in/in-person
applications with documentation (so either build a mail-in fulfillment
workflow with document upload, or stop selling them):
- **CA:** all 4 Lifetime licenses + Fishing Privilege Package (first purchase
  is office/mail only), Low-Income Senior (offices only), both free licenses
  (first issue via License & Revenue Branch), Disabled Veteran / Recovering
  Service Member (CDFW prequalification letters first).
- **NC:** Disabled Veteran, Totally Disabled (inland + CRFL), Legally Blind,
  Adult Care Home (mail/in-person with certifications); Subsistence Waiver
  (county DSS only).
- **SC:** Senior ($9), Gratis, Disability ($0), all Lifetime licenses
  (mail to the SC Wildlife Endowment Fund with document photocopies).
- **TX:** Lifetime packages (paper application), Special Resident All-Water
  ($7, legally blind — LE offices), Saltwater Trotline + Bait-Shrimp Trawl
  tags (coastal LE offices only).
- **MI:** legally-blind senior pricing and military/veteran free licenses
  need DNR-verified status.
- **FL:** Disability license (FWC review ~10 days + SSA/VA docs), Military
  Gold Sportsman (verification step), Tarpon tags (tax collector only).

### 5. Third-party purchase terms — MEDIUM (unverified)
No state's portal ToS could be fully reviewed without accounts. NC DEQ's FAQ
says licenses can't be "bought…for" transfer to another person (buying in the
customer's own name with their data is a different act, but this wants legal
review). TX explicitly allows buying for others today; CA's FAQ contemplates
it; MI requires an account in the customer's name.

## Per-state field verdicts

| State | Fields verdict | Notes |
|---|---|---|
| California | ✅ Sufficient (incl. GO ID, physical descriptors, youth flow) | Make stateIssued/countryIssued/youth fields conditional on identity type (currently always required → over-collection). No SSN — correct, and CDFW says never provide one. |
| Colorado | ✅ Sufficient + CID field added | Habitat-Stamp auto-add already modeled. Watch: ID must be ≥6 months old for residents (we don't collect issue date — portal will enforce). Under-18 ID edge case. |
| Florida | ✅ Sufficient for US customers | International customers: portal needs Country/Province/intl-postal — our zip mask blocks them (low volume; fix if targeting intl). FL residents must have FL DL/ID for online purchase — collected but optional; treat as required for residents in ops. 5-yr Snook/Lobster are resident-only (enforce in ops). Lifetime child age tiers (0–4, 5–12) missing. |
| Michigan | ✅ Sufficient | Portal is account-based (20-min checkout window). Daily license needs a use-date (ask customer in ops). Combo Apprentice + youth spearfishing SKUs exist but minor. |
| North Carolina | ✅ Sufficient + WRC number added | Full SSN + last-4 both collected exactly as the portal asks. $5 transaction fee is per ORDER (don't double-charge on multi-license orders). Senior lifetime is now age 70+ (grandfather clause for pre-2022 65-year-olds). |
| South Carolina | ✅ Sufficient (incl. race/gender, alien-ID alt) | Hunter-ed number must be REQUIRED when a hunting-inclusive license (Sportsman/Combination/Junior) is bought by anyone born after 6/30/1979. "Combination" is hunt+freshwater only — never present it as fresh+salt. |
| Texas | ✅ Sufficient today; Aug 2026 rule pending | No youth fishing license exists in TX (under-17 exempt) — remove/hide the youth path. $5 online admin fee per transaction (portal-side). One-day license: capture intended use date(s). No Amex at TPWD. |

## Payments / email / admin — best-practices scorecard

**Payments — meets or exceeds market standard:**
server-computed amounts ✅ · client tokenization only, PCI SAQ-A ✅ ·
idempotency at DB + provider level (double-charge impossible — proven) ✅ ·
normalized decline handling with customer-safe copy ✅ · signed webhooks with
replay dedupe + reconciliation ✅ · refunds + void fallback ✅ · full audit
trail ✅ · retry-page rate limiting ✅ · NEW: per-IP checkout throttle ✅.
Recommended later: 3-D Secure via NMI for fraud-heavy traffic; a proper
fraud-screening service if chargebacks appear; CSP header once Collect.js
allowlist is tested.

**Email — exceeds market standard:**
SPF+DKIM+DMARC(p=quarantine) all pass, mail-tester 10/10 on a real production
send ✅ · exactly-once pipeline (proven under replay) ✅ · plain-text parts,
preheaders, postal address, non-affiliation disclosure everywhere ✅ ·
List-Unsubscribe only where lawful/appropriate ✅ · bounce webhook with
URGENT alert on license-delivery failures ✅. Recommended later: move DMARC
to p=reject after 2–4 clean weeks; BIMI logo only if brand budget allows.

**Admin — adequate for a solo operator, below standard for a team:**
secret-protected (timing-safe), noindexed, duplicate-send-proof actions ✅.
When a second person joins ops: real accounts + 2FA (e.g. move admin behind
Vercel/Auth provider), per-action audit user attribution, and an order
dashboard (list/search applications) — today's panel is action-only.

## Site QA (ads-readiness)

- All 19 public pages return 200; sitemap + robots correct; admin noindexed ✅
- Security headers now: HSTS, X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy ✅
- Legal pages exist (Terms, Privacy, Refund, Disclaimer) ✅
- **No analytics/conversion tracking installed — blocker for paid ads.**
  Install GA4 + the ad platform's pixel/conversion API and fire a conversion
  on the checkout success step BEFORE spending money, or you'll be flying
  blind. (Needs your account IDs — tell me which platforms and I'll wire it.)
- **Payments still simulated** until NMI env keys are pasted + the NMI
  account's "Activity limit exceeded" status is resolved with NMI support.
  Do one real card test + refund before ads go live.

## Recommended action order

1. Paste the 3 Vercel env vars; resolve NMI account activation; real test purchase + refund.
2. Decide the California question (ads exclusion at minimum).
3. Read Google's government-documents ad policy; pick channels accordingly.
4. Tell me your analytics/pixel IDs → I wire conversion tracking.
5. Decide application-only SKUs: build mail-in fulfillment or unlist them (I can do either).
6. Re-check Texas ID-validation FAQ in early August.
7. Ops discipline per state: FL residents need FL DL/ID; SC hunter-ed for hunting combos; NC $5 fee once per order; MI 20-minute checkout; CO returning customers via CID.
