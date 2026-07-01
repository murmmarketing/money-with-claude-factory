# The Rep Playbook

> Everything you wish someone told you before your first rep haul.

A one-time **digital product**: a complete, genuinely-written rep-buying field
manual (9 chapters + 4 printable cheat-sheets) sold for pay-what-you-want
(from $9, default $19) via Stripe Checkout, delivered instantly through a
magic-link members area. Deliberately a **different model from HaulHQ** (one-off
knowledge product vs. HaulHQ's $6/mo SaaS calculator) and a bidirectional
cross-sell: the guide hands off to HaulHQ for cost math and MurmReps for finds;
they carry a "New to reps? Start with The Playbook" CTA back.

Built with the Marius stack: **Next.js 14 App Router + TypeScript**, deployable to
Vercel, `@supabase/supabase-js` for persistence, plain/inline CSS, no heavy UI
deps. **Everything degrades gracefully with no env set** — it builds, deploys and
runs as a clean "launching soon" funnel today, and monetizes the moment the owner
connects Stripe + Resend + a domain.

## The product is real

The full guide lives in `lib/content.ts` (single source of truth). It is rendered
three ways from that one file:

1. The public **web reader** (`/read`, gated per-chapter).
2. The free **Chapter 1 + glossary** lead magnet.
3. Real **PDFs** generated on demand by `lib/pdf.ts` — a dependency-free,
   spec-valid PDF writer (built-in Helvetica core fonts + real glyph-width tables
   for accurate wrapping, auto page breaks, cover pages). No `@react-pdf/renderer`,
   no headless browser — so the build stays clean. PDFs are **never** a public
   static URL; they're streamed only through the entitlement-gated
   `/api/download` route.

## How it works

- **Payments** — `POST /api/checkout` creates a one-time Stripe Checkout session
  with pay-what-you-want via `price_data` (floor enforced server-side; a
  pre-created `STRIPE_PRICE_PLAYBOOK` is optional). When `STRIPE_SECRET_KEY` is
  absent it returns `503 coming_soon` and the UI shows a **waitlist** capture.
- **Fulfilment** — the signature-verified `POST /api/stripe/webhook`
  (`checkout.session.completed`) records the order, grants an entitlement
  (idempotent via `repplaybook_events`), and emails a **magic link** into the
  library via Resend.
- **Access** — HMAC-signed httpOnly cookie carrying `{email,exp}` (pattern reused
  from HaulHQ). No passwords, no session table. Magic link
  (`/api/auth/magic`) or passwordless 6-digit code (`/api/auth/request-code` +
  `/api/auth/verify`) both mint the cookie. Access = cookie email has a row in
  `repplaybook_entitlements`.
- **Lead magnet** — `POST /api/lead` captures an email for the free chapter.

## Routes

| Path | What |
|------|------|
| `/` | Landing: hero, what-you-get, TOC, sample spread, buy box, cross-sell, free-chapter capture, FAQ |
| `/pricing` | Pay-what-you-want buy box + FAQ (waitlist fallback pre-Stripe) |
| `/read` | Web-reader index (free chapters open; rest gated) |
| `/read/[slug]` | Chapter reader (free or owner-gated) |
| `/read/cheat/[slug]` | Cheat-sheet reader (owner-gated) |
| `/download` | Owner-only download hub (gated PDFs) |
| `/guides`, `/guides/[slug]` | 6 SEO articles funnelling to the Playbook |
| `/login`, `/account` | Passwordless login + library/logout |
| `/thanks` | Post-checkout success |
| `/api/*` | checkout, stripe/webhook, auth/*, download, lead, waitlist, me |

## Environment

All optional — the app builds and deploys with none set. See `.env.example`.

| Var | Purpose | Absent behavior |
|-----|---------|-----------------|
| `NEXT_PUBLIC_SITE_URL` | Absolute links, magic links, Stripe redirects | Falls back to request host |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Orders/leads/waitlist not persisted (routes 503/no-op cleanly) |
| `FACTORY_SERVICE_ROLE_KEY` | Server-only Supabase writes | Same as above |
| `ENTITLEMENT_SECRET` | Signs login cookie + magic links | Uses a dev default (set in prod!) |
| `SERVER_SALT` | Hashes login codes | Dev default |
| `RESEND_API_KEY` / `RESEND_FROM` | Emails magic links + codes | Codes returned on-screen (dev), no email sent |
| `STRIPE_SECRET_KEY` | Live checkout | UI shows waitlist instead of buy |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook | Webhook returns 503 |
| `STRIPE_PRICE_PLAYBOOK` | Optional fixed Price | PWYW `price_data` used instead |

## Data model (Supabase, `repplaybook_*` prefixed)

`db/schema.sql` (idempotent) — `repplaybook_orders`, `repplaybook_entitlements`,
`repplaybook_leads`, `repplaybook_waitlist`, `repplaybook_login_codes`,
`repplaybook_events`. RLS enabled with no anon policies; all writes go through the
service-role key (server only).

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000  (works with no env — waitlist + free chapter)
npm run build    # clean production build
```

## The irreducible 10% (owner)

See `launch/owner-checklist.md`. Short version: connect Stripe (identity + bank),
connect Resend (verified domain), run `db/schema.sql`, point a domain, smoke-test
a $9 purchase, and switch on distribution via MurmReps + HaulHQ. An agent built
everything else.
