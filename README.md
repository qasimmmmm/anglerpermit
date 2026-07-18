# AnglerPermit.com

A privately owned fishing-license assistance service. Customers pick their state, fill out a
form that matches the official state license application, and submit; our team then purchases
the license from the official state portal on their behalf.

> **Compliance:** AnglerPermit is **not** affiliated with, endorsed by, or operated by any
> government agency. The mandatory non-affiliation disclaimer lives in the site footer, on
> every state page, and on `/disclaimer` — keep it verbatim everywhere. Official state fees
> and our service fee are always itemized separately.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **react-hook-form + zod** — client and server-side validation, with zod schemas
  **generated from each state's config** (`src/lib/state-config.ts`)
- **Resend** — admin notification emails (optional; works without it)
- **lucide-react** — icons

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (must pass with zero errors)
npm start
```

The app works with **zero environment variables** — without an email provider, submissions
are validated, masked, and logged to the server console (dev mode).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | No | Resend API key. When set (with `ADMIN_EMAIL`), new applications are emailed to the admin. |
| `ADMIN_EMAIL` | No | Inbox that receives new application notifications. |
| `EMAIL_FROM` | No | Sender identity. Default: `AnglerPermit <applications@anglerpermit.com>` |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL used in metadata/sitemap. Default: `https://anglerpermit.com` |

Copy `.env.example` to `.env.local` for local development (never commit real secrets).

## Deploy to Vercel (zero config)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project → Import** the repository.
3. Vercel auto-detects Next.js — no build settings needed. Click **Deploy**.
4. (Optional) Add the env vars above in **Project → Settings → Environment Variables**.

## Docker

```bash
docker build -t anglerpermit .
docker run -p 3000:3000 anglerpermit
```

Multi-stage build (`node:20-alpine`) using Next.js `output: 'standalone'`.

## How state pages work (for editors and state agents)

All per-state data — license catalog, official prices, add-ons, form fields, service fee —
lives in **`src/data/states/<slug>.ts`**. State pages and discovery are fully dynamic:

- **Discovery**: `src/lib/states.ts` reads `src/data/states/` at build time (home grid,
  `/states`, sitemap) and dynamically imports configs at runtime (API validation). Files
  starting with `_` and non-`.ts` files are ignored.
- **Page**: `src/app/<slug>/page.tsx` renders `<StatePageTemplate config={config} />` — see
  `src/app/sample-state/page.tsx` for the exact pattern.
- **Template**: `src/data/states/_example.ts.txt` documents the required file shape. Copy it,
  rename to `<slug>.ts`, and fill it in from the official portal. **Never invent licenses,
  prices, or fields** — mark unverifiable items with `officialNote: "TODO: verify — <url>"`.

### Editing prices / fields / the service fee

Open `src/data/states/<slug>.ts` and edit the numbers:

- `serviceFee` — our flat service fee for that state.
- `licenses[].price` / `addOns[].price` — official state fees (numbers in USD).
- `formFields` — the applicant fields, in the official portal's order. Validation schemas,
  the multi-step form, review screen, and server-side validation all regenerate automatically
  from this array — **no other code changes are needed**.

### How validation works

`src/lib/state-config.ts` defines the `StateConfig` contract plus
`buildSubmissionSchema(config)`, which generates a zod schema from `formFields` (all field
types, masks, patterns, required flags, and conditional display rules). The same schema is
used by the client wizard (via `zodResolver`) and by `POST /api/applications` — so client
and server validation can never drift apart. If a state file doesn't exist yet, the API
falls back to a generic base schema (name/dob/email/phone/address + consents).

## SSN handling (read before touching the API route)

- SSNs are collected only for states where `requiresSSN` is true.
- The SSN field is masked on entry (`###-##-####`) with a show/hide toggle.
- **Raw SSNs are never logged or emailed.** The API route masks them (`***-**-6789`) via
  `maskSensitiveFields()` before storage, logging, or email.
- `src/lib/storage.ts` is a stub. When replacing `consoleStorage` with a database adapter,
  **encrypt PII/SSN at rest** and restrict access.

## Project structure

```
src/
  app/                     # App Router pages (home, legal, states hub, sample-state, api)
  components/              # Header, Footer, StatePageTemplate, ApplicationForm, ...
  components/ui/           # Button, Card, Input, Select, Badge, DisclaimerBanner
  data/states/             # per-state configs (dynamic discovery) + _example.ts.txt
  data/faq.ts              # shared FAQ content
  lib/
    state-config.ts        # StateConfig contract + zod schema generator + SSN masking
    states.ts              # dynamic state discovery
    storage.ts             # storage adapter stub (console)
    email.ts               # Resend admin notifications (masked)
    masks.ts               # input masks (ssn/phone/dob/zip)
    format.ts              # price formatting, category labels
```

## Compliance checklist

- [x] Non-affiliation disclaimer in footer + every state page + `/disclaimer` (verbatim)
- [x] Official fee vs. service fee always itemized separately
- [x] Privacy Policy explicitly covers SSN collection, retention, encryption intent,
      and third-party state portals
- [x] Terms of Service, Refund Policy published
- [x] SSNs masked in all logs and emails
- [x] Every state page links to its official portal with a last-verified date
