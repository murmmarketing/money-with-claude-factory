# QuickConvert — Fast, Private, In-Browser Converters

A suite of single-purpose file/data converters that run **100% in the browser**.
No uploads, no accounts, no server-side processing. Each converter is its own
keyword-targeted landing page for durable organic traffic, with a thin Stripe
**Pro** subscription that degrades to a "join waitlist" state when Stripe keys
are absent — so it builds and deploys now, and monetizes when you connect Stripe.

Idea: `S1-75 — Browser-based converters` · Category: Build & Ship

## The converters (all client-side)

| Route | Tool | How it works |
| --- | --- | --- |
| `/convert/image-converter` | Image PNG · JPG · WEBP | Canvas `toBlob` re-encode |
| `/convert/unit-converter` | Length, weight, temp, volume, data | Exact conversion factors |
| `/convert/csv-to-json` | CSV → JSON | RFC 4180-aware parser |
| `/convert/timestamp-converter` | Unix epoch ↔ date | s/ms auto-detect, UTC + local |
| `/convert/color-converter` | HEX · RGB · HSL | Standard color-space math |
| `/convert/base64-converter` | Base64 encode/decode + file → data URL | UTF-8 safe |
| `/convert/case-converter` | Text case (camel, snake, kebab, …) | Word-split transforms |

Every conversion happens on the user's device — files never leave the browser.

## Stack

- **Next.js 14** App Router + **TypeScript**
- Plain/inline CSS (no UI libraries)
- **Stripe** Checkout (subscription) + signature-verified webhook
- Zero database required; Markdown guides rendered from `content/`
- Deploys to **Vercel** (`vercel.json` sets `framework: nextjs`)

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

With **zero env vars**, everything works: all converters run, and the Pro
section shows a waitlist form instead of Stripe Checkout.

## Environment variables

All optional — see `.env.example`.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Stripe redirects |
| `STRIPE_SECRET_KEY` | Enables real Pro checkout |
| `STRIPE_PRO_PRICE_ID` | Monthly ($5) recurring price ID |
| `STRIPE_PRO_PRICE_ID_YEARLY` | Optional yearly ($39) price ID |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures |
| `NEXT_PUBLIC_AD_CLIENT` / `NEXT_PUBLIC_AD_SLOT` | Enables the single free-tier ad slot |

When `STRIPE_SECRET_KEY` + `STRIPE_PRO_PRICE_ID` are set, the pricing page
renders a real "Upgrade to Pro" button that opens Stripe Checkout. Otherwise it
degrades to a clean waitlist form. The webhook responds 200 and skips when
Stripe is unconfigured.

## Content / SEO

- One static route per converter (`generateStaticParams`) with unique
  title/description/keywords, canonical URL, and **HowTo + FAQ + Breadcrumb**
  JSON-LD.
- `app/sitemap.ts` and `app/robots.ts` cover the whole suite plus guides.
- Two SEO guides in `content/*.md`, rendered at `/blog/[slug]` with `Article`
  JSON-LD and a CTA back into the relevant tool.

## OWNER checklist (the ~10% an agent can't do)

1. **Create the Stripe product + prices.** In Stripe, create a "QuickConvert
   Pro" product with a $5/mo recurring price (and optionally a $39/yr price).
   Put the price IDs in `STRIPE_PRO_PRICE_ID` / `STRIPE_PRO_PRICE_ID_YEARLY`.
2. **Add the webhook.** Point a Stripe webhook at `/api/webhook` for
   `checkout.session.completed` and `customer.subscription.deleted`; copy the
   signing secret into `STRIPE_WEBHOOK_SECRET`. (To actually gate Pro features
   per-user you'll need to add auth + a DB — the webhook already logs the events
   and has clearly marked extension points.)
3. **Set `NEXT_PUBLIC_SITE_URL`** to your real domain so canonical tags,
   sitemap and Stripe redirects are correct.
4. **(Optional) Ads.** Add your ad network publisher/slot IDs
   (`NEXT_PUBLIC_AD_CLIENT` / `NEXT_PUBLIC_AD_SLOT`) and include the network's
   global script in `app/layout.tsx` to fill the free-tier ad slot.
5. **Pick launch converters to promote** and verify the domain in Vercel.

## Notes on Pro gating

This build has no user auth, so batch conversion shows a "Pro" upsell rather
than unlocking silently client-side (which would be trivially bypassable). Wire
Pro entitlement to real subscription state via the webhook + a session/DB when
you add accounts.
