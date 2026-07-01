# The Rep Playbook — Owner Launch Checklist (the irreducible 10%)

The app is built, deploys clean, and works today in "pre-launch" mode (free
chapters + waitlist). An agent cannot legally own your Stripe/Resend identity,
verify a bank, own a domain, or make the publish decision. That's you. Here's the
short list to flip it live and start taking money.

## 0. Deploy (2 min)
- Import `products/rep-playbook/` into Vercel (framework auto-detects Next.js).
- It builds and deploys with ZERO env vars set — you'll see the site + free
  Chapter 1 + a waitlist form. Everything below turns monetization on.

## 1. Supabase tables (5 min)
- Open the shared factory project (`tcatgldshmpgttmputzo`) → SQL editor.
- Paste and run `db/schema.sql` (idempotent). Creates the `repplaybook_*` tables.
- Set env in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL=https://tcatgldshmpgttmputzo.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
  - `FACTORY_SERVICE_ROLE_KEY=<service role key>`  (from ~/.factory.env)

## 2. Auth secrets (1 min)
- `ENTITLEMENT_SECRET=<32+ random chars>`  (signs login cookies + magic links)
- `SERVER_SALT=<random>`  (hashes login codes)

## 3. Stripe (10 min) — turns on payments
- Create/verify your Stripe account (this is the identity + bank an agent can't do).
- Add env:
  - `STRIPE_SECRET_KEY=sk_live_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`  (from the webhook you create below)
  - `STRIPE_PRICE_PLAYBOOK=` (OPTIONAL — leave blank to use pay-what-you-want;
    the app builds the line item on the fly, so you do NOT need to create a Price.)
- Add a webhook endpoint in Stripe → Developers → Webhooks:
  - URL: `https://<your-domain>/api/stripe/webhook`
  - Event: `checkout.session.completed`
  - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
- With `STRIPE_SECRET_KEY` set, the site automatically switches from waitlist to
  a live pay-what-you-want checkout (floor $9, default $19).

## 4. Resend (5 min) — delivers the product
- Create a Resend account, verify your sending domain.
- Add env:
  - `RESEND_API_KEY=re_...`
  - `RESEND_FROM="The Rep Playbook <hello@yourdomain.com>"`
- Without this, purchases still grant access and buyers can log in via the code
  shown on-screen in dev — but for real launch you want emailed magic links.

## 5. Domain (5 min)
- Buy one of: therepplaybook.com / repplaybook.com / replaybook.co.
- Point it at Vercel, then set `NEXT_PUBLIC_SITE_URL=https://<domain>` in env.
- Redeploy so absolute links, magic links and Stripe redirects use it.

## 6. Smoke test (5 min)
- Visit `/` — you should see live pricing (not the waitlist).
- Buy at the $9 tier with a real card (refund yourself after).
- Confirm: purchase email arrives with a magic link → opens `/read` unlocked →
  `/download` serves the guide + cheat-sheet PDFs.
- Log out, go to `/login`, request a code, confirm you get back in.

## 7. Distribution (ongoing) — you already own the audience
- MurmReps: add a persistent "New to reps? Start with The Playbook" CTA on
  product/category pages + one dedicated newsletter send.
- HaulHQ: add a "First haul? Read The Playbook" onboarding card/banner.
- Post the free glossary + QC cheat-sheet in rep communities with attribution.
- The 6 SEO guides under `/guides` are live and internally linked — submit the
  sitemap (`/sitemap.xml`) in Google Search Console.

That's it. Until you do steps 3–5 the site is a clean, honest "launching soon"
funnel that still builds a lead list. After them, it sells.
