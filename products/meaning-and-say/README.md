# MeaningAndSay — What It Means & How to Say It

A programmatic-SEO reference site. One statically-generated page per term with a
plain-English meaning, an example sentence, a syllable breakdown, a phonetic
respelling, and a **tap-to-hear** pronunciation powered by the browser's Web
Speech API (no audio hosting, no API cost).

Free and ad-supported, with an optional **$4 Pronunciation Pack** (a printable
per-category cheat-sheet) sold via Stripe Checkout.

- **Stack:** Next.js 14 App Router · TypeScript · inline CSS · Stripe · Vercel
- **Content:** a curated JSON corpus in `data/terms.json`, expandable with a
  scripted pipeline (`scripts/build-corpus.mjs`)
- **Zero-env friendly:** builds, deploys, and runs with no environment variables
  at all. Pronunciation works, every page renders, and the paid pack degrades to
  a clean waitlist.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all term pages are static)
```

## How it makes money

1. **Display ads** (primary). Add your AdSense publisher ID + slot to the env
   and ad units appear on the home, category, term, and guide pages. With no ID,
   the slots render nothing — no empty boxes, no layout shift.
2. **Pronunciation Packs** (upside). A one-time $4 purchase per category that
   delivers a printable cheat-sheet of every term in that category. Uses one
   reusable Stripe Price; the category is passed as checkout metadata and the
   success page verifies the paid session before revealing the pack.

## The content pipeline (scaling to thousands of pages)

Every entry in `data/terms.json` becomes a page at `/term/<slug>`. To grow the
corpus:

1. Have Claude generate new entries in the same JSON shape and save them to
   `data/incoming.json`.
2. `npm run corpus:merge` — validates, slugifies, de-dupes, and appends them.
3. `npm run corpus:validate` — checks the whole corpus and prints category
   counts.
4. `npm run build` — publishes the new static pages + sitemap entries.

Entry shape:

```json
{
  "slug": "rizz",
  "term": "Rizz",
  "category": "slang",            // slang | foreign-words | baby-names | brand-names
  "partOfSpeech": "noun",         // optional
  "meaning": "Charm or charisma…",
  "example": "He got her number with one line — that's rizz.",
  "syllables": "rizz",            // hyphen- or space-separated
  "phonetic": "riz",              // plain respelling, CAPS = stress
  "origin": "English internet slang"  // optional
}
```

## Routes

| Path | What it is |
| --- | --- |
| `/` | Marketing home: hero, categories, trending, how-it-works, pack CTA |
| `/term/[slug]` | One static page per term (DefinedTerm + FAQ JSON-LD) |
| `/category/[slug]` | A–Z hub for each of the four categories |
| `/search` | Client-side instant search over the corpus |
| `/pricing` | Pronunciation Pack pricing + buy/waitlist |
| `/pack/[category]` | The delivered pack (gated by a verified paid Stripe session; `noindex`) |
| `/guides` + `/guides/[slug]` | SEO articles rendered from `content/*.md` |
| `/api/checkout` | Creates a Stripe Checkout session (503 when unconfigured) |
| `/api/webhook` | Signature-verified Stripe webhook (records purchases) |
| `/api/waitlist` | Captures emails (Supabase REST if configured, else logs) |
| `/sitemap.xml`, `/robots.txt` | Auto-generated |

## Environment variables

All optional — see `.env.example`. Nothing is required to build or deploy.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Stripe redirects |
| `STRIPE_SECRET_KEY` | Enables live checkout |
| `STRIPE_PRICE_ID` | The one-time $4 price reused for every pack |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures |
| `NEXT_PUBLIC_ADSENSE_CLIENT` / `NEXT_PUBLIC_ADSENSE_SLOT` | Display ads |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Optional waitlist storage |

## Deploy

Push to a Git repo and import into Vercel. `vercel.json` sets the framework.
The build is fully static except the payment API routes and the gated pack
page.

## OWNER checklist (the 10% an agent can't do)

- [ ] Apply to an ad network (e.g. Google AdSense / Ezoic) and add your
      publisher ID + slot to `NEXT_PUBLIC_ADSENSE_CLIENT` / `_SLOT`.
- [ ] In Stripe, create one **one-time $4 Price**, then set `STRIPE_SECRET_KEY`,
      `STRIPE_PRICE_ID`, and (after adding the webhook endpoint) `STRIPE_WEBHOOK_SECRET`.
- [ ] Add the webhook endpoint `https://<domain>/api/webhook` in Stripe and
      subscribe to `checkout.session.completed`.
- [ ] (Optional) Create the `meaningandsay_waitlist` table (SQL in `.env.example`)
      and set the Supabase vars to persist pre-launch signups.
- [ ] Spot-check a sample of generated term pages for accuracy before promoting.
- [ ] Point your domain at Vercel, set `NEXT_PUBLIC_SITE_URL`, and submit
      `/sitemap.xml` in Google Search Console.
