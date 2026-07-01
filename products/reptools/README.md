# HaulHQ

**The command center for your reps hauls** — real landed cost, cheapest-agent
compare, and shareable haul lists.

A freemium rep-buyer toolkit SaaS built on Next.js 14 (App Router) + TypeScript +
Supabase + Stripe, deployable to Vercel. Free tools are client-side (no login).
Pro is gated by a Stripe subscription with a lightweight, passwordless email
entitlement.

---

## What's in the box

### Free (no login, runs in the browser)
- `/haul` — **Haul Builder** with live landed-cost breakdown (goods + agent
  service fee + shipping line + customs/VAT), localStorage persistence.
- `/tools` — **CNY→USD/EUR/GBP converter**, **shipping-line estimator** (with
  volumetric-weight warning), **customs quick-check** (VAT % + de-minimis, 10
  countries).
- Copy/print a haul summary for Discord.

### Pro ($6/mo or $48/yr)
- Save unlimited hauls to Supabase, synced across devices (edit/duplicate/delete).
- **Multi-agent compare** — same cart scored across every agent's fees + lines,
  cheapest total highlighted.
- **De-minimis split-shipment planner** with tax-saved estimate.
- **Shareable public haul pages** at `/h/[slug]` (server-rendered, indexable, OG
  image).
- **QC photo storage** per item (Supabase Storage, signed uploads).
- **CSV export** of any haul.
- **Price/restock watchlist** + weekly reminder email (Vercel cron). Honest v1:
  a re-check nudge, no live scraping.

### Marketing
- `/` hero (money-saved), free + pro feature grids, FAQ, footer.
- `/pricing` with Stripe checkout and a graceful "Pro launching soon" waitlist.
- `/login`, `/account` (billing portal, hauls, watchlist).
- `robots.ts`, `sitemap.ts` (includes public haul pages), JSON-LD.

---

## Architecture

- **Compute** (`lib/haulCompute.ts`): pure, dependency-free landed-cost engine.
  Single source of truth for the builder, compare, public page, CSV and OG image.
- **Reference data** (`lib/referenceData.ts`): agents + customs seed as TS
  constants so free tools need **zero** DB. `lib/loadReference.ts` prefers the
  Supabase `agents`/`customs_rules` tables and falls back to the constants.
- **Supabase**: `lib/supabase.ts` (anon, public reads), `lib/serverSupabase.ts`
  (service-role, server-only writes). Both return `null` when unconfigured.
- **Entitlement** (`lib/entitlement.ts`): passwordless login. Email → 6-digit
  code (Resend) → HMAC-signed httpOnly cookie `{email, exp}`. Pro routes call
  `requirePro()` which verifies the cookie and reads the `entitlements` table.
- **Stripe** (`lib/stripe.ts`): returns `null` when unconfigured, so checkout
  degrades to a clean 503 + waitlist. The signature-verified webhook is the only
  writer of `entitlements`, idempotent via the `stripe_events` ledger.

Everything degrades gracefully with missing env and must `npm run build` clean.

---

## Local setup

```bash
cd products/reptools
npm install
cp .env.example .env.local   # fill in what you have; blanks are fine
npm run dev                  # http://localhost:3000
```

With **no** env set, the free tools still work (bundled reference data). Login
returns the 6-digit code in the API response (dev mode) so you can test Pro
flows without Resend. Stripe checkout shows the waitlist fallback.

### Database
Run `db/schema.sql` in the Supabase SQL editor (project `factory`,
`tcatgldshmpgttmputzo`). It is idempotent, creates all tables + RLS, seeds
agents/customs, and creates the `qc-photos` Storage bucket (public read).

---

## Environment variables

| Var | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | correct links/OG/redirects | defaults to request host / `haulhq.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | any persistence | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public reads (share pages, sitemap, OG) | |
| `FACTORY_SERVICE_ROLE_KEY` | all Pro writes, login, webhook | server-only; `SUPABASE_SERVICE_ROLE_KEY` also accepted |
| `ENTITLEMENT_SECRET` | Pro login | 32+ char random; signs the session cookie |
| `SERVER_SALT` | login codes / analytics hashing | random string |
| `RESEND_API_KEY` | emailing login codes + watch reminders | when absent, codes are returned in-response (dev) |
| `RESEND_FROM` | email sender | e.g. `HaulHQ <login@yourdomain>` |
| `STRIPE_SECRET_KEY` | live Pro checkout | when absent → 503 + waitlist |
| `STRIPE_WEBHOOK_SECRET` | webhook signature | |
| `STRIPE_PRICE_MONTHLY` | monthly plan | Stripe price id |
| `STRIPE_PRICE_ANNUAL` | annual plan | Stripe price id |
| `CRON_SECRET` | protect the cron route | Vercel sends `Authorization: Bearer` |
| `QC_BUCKET` | QC photo storage | defaults to `qc-photos` |

---

## Deploy (Vercel)

1. Import `products/reptools` as the project root (or set it as the Root
   Directory). Framework: Next.js. `npm run build` must be clean.
2. Add the env vars above in the Vercel project settings.
3. `vercel.json` registers the weekly price-watch cron
   (`/api/cron/price-watch`, Mondays 13:00 UTC).
4. Set the Stripe webhook endpoint to
   `https://<your-domain>/api/stripe/webhook` and subscribe to:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`.

---

## OWNER checklist — the irreducible 10%

An agent built everything below the line. These steps require **you** (legal
identity, money, final call):

1. **Stripe live**: create the product + two prices ($6/mo, $48/yr), set
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`,
   `STRIPE_PRICE_ANNUAL`. Verify your bank/identity in Stripe.
2. **Resend**: add `RESEND_API_KEY` + a verified `RESEND_FROM` domain so login
   codes and reminders actually send.
3. **Supabase**: run `db/schema.sql`; confirm the `qc-photos` bucket exists and
   is public-read. Add `NEXT_PUBLIC_SUPABASE_URL`, anon key, service-role key.
4. **Secrets**: set `ENTITLEMENT_SECRET`, `SERVER_SALT`, `CRON_SECRET` to long
   random values.
5. **Domain**: point a domain at Vercel and set `NEXT_PUBLIC_SITE_URL`.
6. **Test**: sign in, subscribe with a live card (or test mode first), confirm
   the webhook writes an `entitlements` row and `/account` shows Pro.
7. **Approve & publish**: announce to the MurmReps newsletter + SEO pages.

Until Stripe keys are set, checkout shows "Pro launching soon — join the list"
and never crashes.
