# ResumeVault — ATS-Proof Resume Kits by Industry

A deployable Next.js 14 digital-product site. Sells downloadable, ATS-safe resume
kits per industry (template + bullet library + cover letters + keyword list +
checklist), plus an all-industries vault. Traffic is programmatic SEO: one landing
page per industry with a free interactive bullet picker that converts organic
search visitors into buyers.

Built to **build and deploy today with zero environment variables** (degrades to a
clean "join the waitlist" flow), and monetize the moment Stripe keys are added.

## Stack

- Next.js 14 App Router + TypeScript
- Plain CSS (`app/globals.css`) — no UI dependencies
- Stripe Checkout via the REST API (`fetch`) — **no SDK dependency**
- Optional Supabase persistence via REST — **no SDK dependency**
- Signed, expiring download tokens (Node `crypto` HMAC) for token-gated delivery

The only runtime dependencies are `next`, `react`, and `react-dom`.

## How it works

1. **Programmatic pages** — `/resume/[industry]` is generated from `data/industries.ts`
   (real ATS content: summary, keywords, bullets, cover-letter lines per industry).
   Add an industry object and you get a new SEO page, kit, and download automatically.
2. **Free bullet picker** — client component previews real bullets by role/seniority.
3. **Checkout** — `POST /api/checkout` creates a Stripe Checkout Session (`$19` kit /
   `$59` vault). With no `STRIPE_SECRET_KEY`, it returns `{ waitlist: true }` and the UI
   shows an email capture instead.
4. **Delivery** — after payment, `/success` verifies the session server-side, signs a
   download token, and redirects to `/download`. `/api/download` serves the real, freshly
   generated files (see `lib/kit.ts`): a Word-openable `.doc` resume template, the bullet
   library, cover-letter pack, keyword list, and the shared ATS checklist.
5. **Webhook** — `POST /api/webhook` is signature-verified and records purchases to
   Supabase when configured. Downloads do not depend on it, so it's safe to wire later.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (passes with zero env)
```

## Environment variables

All optional. See `.env.example`. With none set, the site builds, deploys, and shows
the waitlist flow.

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Enables live Checkout. Absent → waitlist flow. |
| `STRIPE_WEBHOOK_SECRET` | Verifies the `/api/webhook` signature. |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for redirects + sitemap. |
| `DOWNLOAD_TOKEN_SECRET` | Signs token-gated download links. Set in production. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional. Persist waitlist + purchases. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional. Server-side Supabase writes. |

### Optional Supabase tables

Create in the factory project if you want persistence (tables prefixed `rv_`):

```sql
create table rv_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product text,
  created_at timestamptz default now()
);
create table rv_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product text,
  session_id text,
  created_at timestamptz default now()
);
```

## Content / SEO

- `content/*.md` — two ready-to-publish SEO articles targeting buyer intent.
- `app/sitemap.ts` + `app/robots.ts` — generated at build.
- FAQ + Product JSON-LD embedded on the home and industry pages.

## Deploy (Vercel)

`vercel.json` sets `{ "framework": "nextjs" }`. Import the repo, set env vars if you
have them (or none), deploy.

## OWNER checklist (the 10% an agent can't do)

- [ ] Create/connect your Stripe account; set `STRIPE_SECRET_KEY` in Vercel.
- [ ] Create a webhook endpoint in Stripe → `/api/webhook`; set `STRIPE_WEBHOOK_SECRET`.
- [ ] Set a strong `DOWNLOAD_TOKEN_SECRET` and your real `NEXT_PUBLIC_SITE_URL`.
- [ ] (Optional) Create the `rv_` Supabase tables + set Supabase env vars.
- [ ] Verify your domain and update `BRAND.support` / support email in `lib/config.ts`.
- [ ] Proofread two sample kits end-to-end (download the `.doc` and the libraries).
- [ ] Do a real $1 test purchase in Stripe test mode and confirm the download unlocks.
```
