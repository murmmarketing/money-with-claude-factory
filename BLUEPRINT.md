# The Idea Factory — Final Blueprint

*Execution plan for Marius. This supersedes the synthesized blueprint; it folds in the three adversarial reviews and makes the hard calls.*

---

## 1. TL;DR

Build a **lean digital-product + SEO-tool factory**, not an 800-wide slop machine. The three proven pillars stay: the **local headless Claude Code runner**, **pinned-Telegram-message state**, and **tools-are-the-verifier discipline**. On top of them sits a **type-router → real-data triage → live landing/tool → real-traffic → real-signup** loop that only ever full-builds the two idea types that are honestly near-launch on your stack (**programmatic-SEO tools/calculators** and **digital downloads**). Everything experimental lives on a **throwaway `noindex` domain** so it can never touch murmweb.dev's SEO. The single number the whole machine optimizes is **paid conversions (or refundable deposits) per idea** — free waitlist signups are a weak secondary signal, not the gate — and a hard **portfolio stop condition** freezes new intake the moment one idea earns real money so your attention concentrates there.

---

## 2. Runtime & scheduling

**Primary host: your Mac, on `launchd` (not cron), authenticated with the subscription OAuth token.**

- `claude setup-token` → store `CLAUDE_CODE_OAUTH_TOKEN` in `~/.factory.env` (chmod 600). **Never set `ANTHROPIC_API_KEY` on the Mac** — it silently reroutes builds to metered API.
- Replace cron with a `launchd` agent: `StartInterval=3600`, `RunAtLoad=true`, `ProgramArguments` wraps `run-factory.sh` in `caffeinate -i` and sources env via `zsh -lc`.
- Sleep off on AC: `sudo pmset -c sleep 0 disablesleep 1 autorestart 1` + a resident `caffeinate -dimsu` KeepAlive daemon + auto-login.

**Three non-negotiable hardening items (load-bearing, from the ops review — ship these before anything else):**

1. **Off-host dead-man's switch.** Every successful run pings **healthchecks.io**. If the ping stops (Mac sleeps, panics, FileVault parks a reboot at the unlock screen), healthchecks.io — *not* the Mac — alerts your Telegram/phone. Without this, "unattended for weeks" silently becomes "dead since Saturday, noticed Wednesday."
2. **Whole-run + per-subprocess `timeout`/`gtimeout`, and a stale-lock-aware `flock`.** The lock file carries PID + start-time; a run older than the wall-clock budget is force-broken. A hung Claude session, Playwright hang, or auth-prompting `git push` must self-kill, never freeze the factory behind a held lock.
3. **Weekly-rate-limit backpressure.** Max 20x has a weekly cap. Track headroom; as the reset window approaches, throttle the per-day build cap toward zero and post a heartbeat warning. Accept planned weekly stalls — do **not** pretend the API-key "overflow valve" and "never set the API key on the Mac" can both be true on one host. The spillover host (Phase 4+) is the *only* place the API key lives.

**FileVault reality:** if FileVault is on, `autorestart` will not self-resume a forced OS-update reboot. Decide explicitly: FileVault **off** on this dedicated machine, or accept manual unlock after OS updates (and let the dead-man's switch tell you).

**Fallback (defer to Phase 4, don't build day one):** a €3.79/mo Hetzner CX22 running the *identical* `run-factory.sh` on a systemd hourly timer, authed with `ANTHROPIC_API_KEY`, left **PAUSED**. Failover = flip `PAUSED:yes` on the Mac via Telegram, start the VPS timer. Only ever one host un-paused (enforced by the pinned `PAUSED` flag + per-host flock).

**Cadence:** hourly trigger (so Telegram commands stay responsive), but each run does a **bounded** amount of work — a wall-clock budget + a per-day build cap — then stops. Never an unbounded loop.

---

## 3. The per-idea pipeline

Fewer stages than the draft. Everything past "live landing + traffic" is **pull, not push** — generated on demand *only* for ideas that already earned a signal. Idea types are collapsed to what's honestly buildable:

- **Auto-buildable end-to-end:** `tool` (programmatic-SEO / calculator / free micro-tool), `digital` (download: xlsx/PDF/prompt-pack/template).
- **Landing-only, capped:** `service`, `content`.
- **HARD-EXCLUDED from auto-build (landing-only after a compliance pass, or skipped):** `commerce`/physical (no real product, supplier, COGS, photography), anything **regulated** (health/finance/legal), credentialed services, and **marketplace/two-sided-network** ideas (a landing page cannot validate a two-sided market).

| # | Stage | Produces | Verifier (non-LLM unless noted) | Kill condition |
|---|-------|----------|-------------------------------|----------------|
| 0 | **Triage + type route** (Haiku/Sonnet batch, *not* Opus — it's coarse) | `pipeline` row: `{id, type, offer_hint, killed}` | strict JSON; `type` in enum; excluded types force-routed to landing-only or skip | commodity-labor / no productizable artifact → killed |
| 1 | **Demand triage — ONE signal, not six** | `validation.json {signal, evidence_urls[], intent_score, tier}` | ≥3 corroborating evidence URLs; **commercial-intent** proxy (buy/tool/template/pricing modifiers + active paid competitors in Meta Ad Library), **not** raw volume | no marketplace proof AND no intent signal → KILL. **High keyword-difficulty/SERP saturation counts AGAINST an idea** (crowded ≠ fundable) |
| 2 | **Positioning & offer** (Opus — one of only two Opus stages) | `offer.json {name, icp, jtbd, promise, price:int, guarantee}` | ICP is a specific named segment (fails "everyone"); price is one integer; anti-vague banned-word scan | offer can't plausibly reach the income floor → downgrade/kill |
| 3 | **Brand + creative** (fal.ai bg + **Satori/@vercel/og** for ALL text) | `brand.json` + `logo.svg` + `hero/og.png` (1200×630) | ≥3 hex palette; primary-on-bg WCAG AA ≥4.5:1 computed in-code; SVG parses; OG dims exact | none (cosmetic); 2 retries then FLAG |
| 4 | **Landing + waitlist, DB-driven ISR deploy** | live page at `ideas-lab.dev/l/[id]` (throwaway domain, `noindex` until promoted); `/api/wait` writes `signups` | curl 200 + HTML contains exact headline; synthetic POST → SELECT → DELETE round-trip; **Cloudflare Turnstile + rate-limit** on the endpoint; anti-slop regex; **GDPR consent + privacy-policy + CAN-SPAM footer injected**; **every cited stat must have a fetchable source URL or is banned** | deploy/self-test fails ×2 → `needs_review` (do NOT kill the idea) |
| 5 | **Traffic + real-payment micro-test** *(the actual gate)* | UTM'd distribution: MurmReps newsletter / CAIRN dogfood (free, trustworthy) OR human-approved **€5–40 Meta** with **API-level `lifetime_budget` + `end_time` hard stop** (never daily budget); **live Stripe pre-order / refundable deposit** | sessions land; Stripe test event fires; ad has `end_time` set | — |
| 6 | **MVP** *(conditional: `tool` and `digital` only)* | `tool`: working `/tool/[id]` route; `digital`: real file (parses, meets count) + Gumroad/Lemon draft | POST sample input → valid output; file parses; content is real not an outline | functional test fails ×2 → `needs_review` |
| 7 | **GTM assets** *(pull: only after a signal)* | 3 posts each naming an EXACT destination; one outreach DM/cold email; one SEO/directory listing | every asset names a specific destination, complete copy, anti-slop scan | none |
| 8 | **Analytics + conversion wiring** | server-side `events` into factory Supabase; Meta Pixel env-injected | deployed HTML contains script; synthetic visit fires an `events` row | none |
| 9 | **Human-handoff package + delivery** *(final gate)* | `LAUNCH.md` (live URLs, done items, exact linked 10% human steps, go/no-go citing Stage-1 + Stage-5 evidence); Telegram summary + link + **inline-keyboard proposal card** | every claimed URL == 200; every human step is a concrete linked action; `verify.jsonl` verdict PASS/FLAG; `evidence/` newer than run start | verify blocked → **not delivered**, run flagged (never narrate instead of verify) |
| 10 | **Post-launch demand gate** (each run, over live ideas) | `scores {id, sessions, paid_conversions, cost, state}` | **paid conversions with confidence intervals / sequential stopping** — NOT a fixed 2%/5% at N=50 (that's 1–2 people, a coin flip); needs a minimum absolute count | no conversions after real traffic → DEAD (archive, stop spend). One paid conversion at a real price → **PROMOTE** → fires portfolio stop (§6) |

**One subjective check only** (Sonnet judge, must cite an evidence file): copy rubric + on-brand imagery. Everything else is proven by curl/round-trip/regex/render, whose raw output lands in `kits/<id>/evidence/`. No `verify.jsonl` PASS/FLAG ⇒ the kit is physically never delivered.

---

## 4. Tech stack & tokens

| Service | Purpose | Auth | Cost |
|---|---|---|---|
| **Anthropic Max 20x + OAuth token** | Primary headless BUILD auth (~$0 marginal) | `claude setup-token`; env chmod 600; never set API key here | $200/mo (already paid) |
| **Anthropic API key** | One-shot 800-idea triage **on Haiku** + fallback host only | console key; used ONLY by `screen.js` + VPS | **~$10 one-time** (Haiku, not $60 Opus batch) |
| **DataForSEO** | Intent/competition signal for triage (secondary to marketplace proof) | basic-auth login/password | ~$0.05–0.30/idea PAYG |
| **Meta Ad Library + Marketing API** | Free competitor-ad signal; human-gated €5–40 smoke tests | existing CAIRN long-lived token (**expires ~60d — auto-alert on expiry**) + `AD_ACCOUNT_ID` + `PIXEL_ID` | $0 library; ad spend human-gated |
| **Reddit public JSON** | Community buying-intent signal | unauth low-volume / free script OAuth | $0 |
| **Vercel (Pro) — single `factory-launchpad` app** | All `/l/[id]` + `/tool/[id]` from one deploy, **DB-driven ISR (adding an idea = Supabase upsert, ZERO rebuild)**; `@vercel/og` | `VERCEL_TOKEN`/`ORG_ID`/`PROJECT_ID` | ~$20/mo |
| **Supabase — new `factory` project (Pro from day one)** | `pipeline, landing_pages, signups, events, ledger, scores`; insert-only RLS on signups | `URL` + `ANON_KEY` + `SERVICE_ROLE_KEY` | ~$25/mo (free tier auto-pauses — unacceptable for the kill-gate source of truth) |
| **fal.ai** | Autonomous backgrounds/heroes; text composited via Satori | `FAL_KEY` | ~$0.02–0.15/img |
| **@vercel/og (Satori)** | ALL text-bearing creative (logos, OG, ad headlines) — spelled correctly, deterministic, free | in-app | $0 |
| **Stripe** | **LIVE** pre-order / refundable-deposit test (this is the real gate) + test scaffolds | restricted key | $0 fixed |
| **Cloudflare (Turnstile + API)** | Bot protection on public endpoints; DNS for `ideas-lab.dev` | `CLOUDFLARE_API_TOKEN` + Turnstile keys | existing |
| **Resend** | Waitlist confirm email | `RESEND_API_KEY` | free tier |
| **healthchecks.io** | Off-host dead-man's switch | ping URL | free |
| **Gumroad / LemonSqueezy** | Draft digital listings (Stage 6-digital) | `GUMROAD_ACCESS_TOKEN` | $0 marginal |
| **Hetzner/Fly (Phase 4)** | Paused fallback host | same repo + API key | €3.79/mo |

**Cut for v1** (over-engineering per the efficiency review): epsilon-greedy bandit (noise below ~50 data points — a hand-sorted queue is strictly better and free), double-opt-in (halves already-tiny counts — use Turnstile + server-side dedup instead), Playwright evidence screenshots (curl-200 + HTML-contains + form round-trip is 90% of the value at a fraction of the fragility), Shopify factory store, and the six-component PBS score.

**Tokens/keys to get from Marius to start (v1 only):**
1. `CLAUDE_CODE_OAUTH_TOKEN` via `claude setup-token` on the Mac
2. `ANTHROPIC_API_KEY` (for the one-time Haiku triage only)
3. New **`factory` Supabase Pro** project: `URL` + `ANON_KEY` + `SERVICE_ROLE_KEY`
4. `VERCEL_TOKEN` + `ORG_ID` + `PROJECT_ID` (confirm Pro)
5. `FAL_KEY`
6. `STRIPE_SECRET_KEY` (**live**, restricted — for the deposit test)
7. `CLOUDFLARE_API_TOKEN` + **Turnstile** site/secret keys
8. A fresh throwaway domain (e.g. `ideas-lab.dev`) — **do not use a murmweb.dev subpath**
9. `RESEND_API_KEY`
10. healthchecks.io ping URL
11. **Later (Phase 3+):** `DATAFORSEO_LOGIN/PASSWORD`, Meta token + `AD_ACCOUNT_ID` + `PIXEL_ID`, `GUMROAD_ACCESS_TOKEN`

---

## 5. Cost & cadence

**Fixed:** ~$20 Vercel + ~$25 Supabase = **~$45/mo** (+ €3.79 fallback once Phase 4).

**Per-idea (variable, scales with survivors not with 800):**
- Triage: ~$0.01 (Haiku).
- Killed at Stage 1 (~50%): ~$0.10–0.30 DataForSEO, no build spend.
- Landing-only: ~$0.20 API + near-zero infra.
- Full-build `tool`/`digital`: ~$0.40–1.00 (fal cheap, Satori free, Claude ~$0 on subscription).

**The cost that actually matters — and was buried in the draft:** **ad spend.** Be honest: if you smoke-test ~160 ideas at €5–40 that is **up to ~€6,400** — orders of magnitude more than the triage or DataForSEO spend. So: **ad spend is the PRIMARY variable cost, gated behind an explicit weekly € budget in the pinned message**, every campaign set with `lifetime_budget` + `end_time`, and **free traffic (newsletter/dogfood) is preferred over paid** for as long as possible. In v1 you spend real ad money on **≤10 ideas**, not 160.

**Cadence & throughput reality:** hourly trigger, ~2–4 builds/run cap, but the **true throughput ceiling is the Max weekly limit** — likely a handful of full builds/week, meaning ~months to traverse even a few hundred ideas. That math itself argues for **radically fewer ideas**. Run **5–10 ideas end-to-end first**, measure real builds-per-week, then decide whether to widen.

---

## 6. Quality & human-in-the-loop

**Verifiers:** every objective claim proven by a non-LLM tool writing raw output to `evidence/` (curl exit codes, form INSERT→SELECT→DELETE round-trip, WCAG contrast math, dead-link curls, price coherence, anti-slop regex, stat-source-URL-or-ban). Sonnet judges only copy + imagery, and must cite an evidence file.

**Anti-slop / anti-spam:** banned-vague-word scan; **dedup/clustering** so near-identical ideas don't cannibalize; **unsourced statistics banned outright**; **`noindex` until promoted** so nothing thin is ever indexed under any brand; Turnstile + rate-limits so bots can't inflate the session denominator and false-kill good ideas.

**Telegram approval checkpoints (the human 10%, delivered as inline-keyboard cards):** go live / attach real domain / flip Stripe live / publish a listing / **any real ad spend**. Everything free and reversible auto-ships.

**Idempotency (money actions must NEVER replay):** persist the Telegram `update_id` offset durably + a processed-callback set. A re-served callback for "approve €40 spend" or "go live" must be a no-op the second time.

**Kill-switch & circuit-breaker:** `KILL:no` global switch + `DEAD:<ids>` list + per-run/day/idea € caps in the pinned message. **Fail-closed everywhere:** DataForSEO/fal/Meta/Resend error or expired key → **skip the idea, log the error class, do NOT advance, do NOT kill**. Ledger unreadable or unwritten → **PAUSE, don't proceed**. Meter fal + DataForSEO + Meta into the ledger, not just Claude's `total_cost_usd`.

**State resilience:** emit a **git-committed `state.json`** alongside the pinned message every run and reconcile on startup — removes the single-point-of-failure on a human-editable Telegram string. Handle non-fast-forward pushes explicitly (rebase-or-abort, never a dirty tree). Kit artifacts (images/zips) go to **R2/object storage**, delivered as links — not 50MB Telegram uploads or a bloating public git repo.

**Observability:** a **daily heartbeat digest** to Telegram (built from ledger + scores): runs OK, N built/killed/flagged, € spent per provider, weekly-limit headroom, DataForSEO balance. A pile of FLAGs or a silently-broken stage otherwise looks identical to "quietly working."

**The ONE metric it optimizes:** **paid conversions per idea** (a live pre-order or refundable deposit at a real price). Free waitlist signups are a weak secondary. And the **portfolio-level stop condition** — the single biggest omission in the draft — is a first-class rule: *the first idea to earn N paid conversions freezes new-idea intake and redirects all runner time + your attention to that one.* The factory exists to find that idea, not to keep producing landing pages against a fixed human ceiling (~10–20 concurrent live experiments max).

**Honest ceiling:** no agent owns payments, legal, or judgment. It cannot decide an offer is *tasteful*, cannot sign you up for liability, cannot run a two-sided market from a landing page, and cannot make a saturated commodity market winnable. It gets you to a live, verified, real-traffic, real-payment-tested page with a linked checklist — you do the final 10% and, critically, you own the taste call before publish.

---

## 7. Phased rollout

**Phase 0 — Runtime hardening + the loop on ONE idea (1–2 days).** launchd + caffeinate + pmset; OAuth token; **healthchecks.io dead-man's switch, whole-run `timeout`, stale-lock flock, weekly-limit backpressure** (the three load-bearing items). Then take **one** calculator idea by hand through build → live `noindex` page → newsletter traffic → real deposit test. *Testable:* does one page collect a real click and a real Stripe test event, and does the machine self-recover from a forced sleep?

**Phase 1 — Verifier substrate + shared launchpad (2–3 days).** `factory` Supabase Pro (insert-only RLS, Turnstile); single **DB-driven ISR** Next.js app on `ideas-lab.dev` with `/l/[id]`, `/tool/[id]`, `/api/wait`, `/api/health`; `render.js` (no-LLM templater) + evidence verifiers (curl, round-trip, anti-slop, price, stat-source); rewrite AGENTS.md to require `verify.jsonl`; git-committed `state.json` + idempotent callbacks. *Testable:* upsert an idea → page live with zero rebuild → verifier blocks a deliberately-broken kit.

**Phase 2 — Triage + demand gate, `tool`/`digital` only (2–3 days).** Haiku triage (type + `offer_hint` + coarse kill); intent-based Stage-1 gate (marketplace proof + commercial-intent modifiers, saturation as a *negative*); dedup/clustering; GDPR/compliance injection. Hand-check the score distribution on the first 20 and calibrate cutoffs against the Phase-0 ground truth. *Testable:* 20 ideas triaged, obvious junk killed, survivors are genuinely `tool`/`digital`.

**Phase 3 — Stage-streaming build + real-payment test at small scale (3–4 days).** Per-idea `STATE.json` state machine (≤3 stages/run, build cap, time budget); offer/brand(fal+Satori)/landing-deploy/handoff with verifiers; Telegram delivery + proposal cards; **live Stripe deposit** wired; free newsletter/CAIRN traffic first, human-gated €5–40 Meta (with `lifetime_budget`+`end_time`) for a **handful** only. Portfolio stop condition live. *Testable:* 5–10 ideas fully autonomous end-to-end, each with real traffic and a real payment verdict.

**Phase 4 — Widen + resilience, only if Phase 3 produced a winner (ongoing).** Add Gumroad/Lemon drafts, the paused Hetzner fallback, DataForSEO tuning, and raise the batch *within* Max weekly limits. Back-test which pre-build signals predicted real conversions and re-weight. **Do not build this until the loop has proven itself on real money.**

---

## 8. First 10 ideas to run

All from the **programmatic-SEO / calculator / free-tool + digital-download** clusters — the only buckets that honestly reach near-launch autonomously on your exact stack (Next.js + Supabase + Vercel, same as MurmReps' 19.5K-product site) and that can pull **free, trustworthy** traffic from the MurmReps newsletter / CAIRN.

1. **S2-96 (calculator)** — cleanest verifier target: unit-tested compute + waitlist + `/tool/[id]`; proves the whole tool pipeline end-to-end before anything else.
2. **S2-161..200 cluster — a niche dataset/API** — deploys as data into the launchpad, self-verifies (sitemap exists, SEO score, `/api/wait` round-trip).
3. **S2-165 (hub/directory)** — data-driven pages, zero rebuild via ISR, dogfoodable to the newsletter.
4. **A comparison site (from the same cluster)** — high commercial-intent keywords (buy/vs/pricing), the right signal for the inverted Stage-1 gate.
5. **A niche job-board (data-in)** — but capped **landing-only** first (network-effect risk; validate demand before building supply).
6. **A digital template/spreadsheet pack** — real xlsx that parses + Gumroad draft; honest near-launch, ~$0 to ship.
7. **A prompt-pack / notion-template download** — same, and directly seedable to your audience.
8. **A single-purpose free micro-tool** (e.g. a converter/generator) — pure `/tool/[id]`, self-verifies, no compliance surface.
9. **A programmatic-SEO glossary/reference in a niche you can newsletter** — trustworthy free Gate-2 traffic without ad spend.
10. **One idea Marius can dogfood on CAIRN's audience** — the only ideas that get *real* traffic for €0, so their conversion verdict is trustworthy without paid spend.

**Queue order = ROI:** grounded (+2) + low-effort (+2) + fast (+2) + sellable-as-digital-product-today (+2) + **leverages an existing Marius audience/asset (+3)**. Run these 10, get real numbers, *then* decide whether to widen.

---

## 9. The single most important decision, right now

**Commit to "5–10 genuinely validated products with real traffic," not "800 near-launch products."**

The engineering loop is sound. The 800 number is a vanity target that collides with three hard walls the reviews all found: your **Max weekly rate limit** (a few builds/week, not 96/day), your **finite founder attention** (~10–20 concurrent live experiments, ever), and the fact that **there is no traffic for 800 pages** — so the real validator never fires and you'd be automating the production of unvalidatable slop under a domain that could drag down MurmReps' SEO.

So the decision is binary and it gates everything else: **narrow to the `tool` + `digital` clusters on a throwaway `noindex` domain, make paid-conversion (not free waitlist) the gate, and add the portfolio stop condition that freezes intake the moment one idea earns money.** Say yes to that and I build Phases 0–3 as specced. Say "no, I want 800-wide" and you get a fast, expensive slop generator that risks a real business asset — which is the one outcome we should refuse to ship.