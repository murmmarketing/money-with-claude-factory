# The ASO Copy Framework (the thing clients pay for)

ASO copy has two jobs: **rank** (get shown for search terms) and **convert** (turn the store
visit into an install). Every field below is optimized for one or both. Follow this every time.

## Field-by-field character limits & rules

### Apple App Store
| Field | Limit | Indexed for search? | Job |
|---|---|---|---|
| App name / title | 30 chars | ✅ highest weight | Rank + brand |
| Subtitle | 30 chars | ✅ high weight | Rank + hook |
| Keyword field (hidden) | 100 chars | ✅ (not shown to users) | Rank only |
| Description | 4000 chars | ❌ NOT indexed | Convert only |
| Promotional text | 170 chars | ❌ | Convert (updatable anytime) |

### Google Play
| Field | Limit | Indexed? | Job |
|---|---|---|---|
| Title | 30 chars | ✅ highest | Rank + brand |
| Short description | 80 chars | ✅ high | Rank + convert (shown above fold) |
| Full description | 4000 chars | ✅ (keyword density matters) | Rank + convert |

**Key difference to tell clients:** on Apple the long description does NOT help ranking, so write
it purely to convert. On Google the full description IS indexed, so weave keywords naturally
(aim 2–3 mentions of your primary term, never stuff).

## Step 1 — Keyword mining (do this first, always)
1. List the app's core function in plain words (what a non-technical friend would type).
2. Ask Claude: *"List 30 App Store search terms someone would use to find a [category] app that
   [core benefit]. Group by intent: problem-aware, solution-aware, brand/competitor. Estimate
   relative volume high/med/low."*
3. Check the top competitors' titles & subtitles (read their store pages) — steal the terms they
   rank for that your app also deserves.
4. Fill `keyword-research-template.md`. Pick: **1 primary** (highest volume you can realistically
   rank for), **2–3 secondary**, and a long tail for the keyword field.

## Step 2 — Title (30 chars)
Formula: `Brand: Primary Keyword` OR `Brand — Benefit Keyword`
- Put the highest-volume term you can afford next to the brand.
- Example: `FocusFlow: Pomodoro Timer` (25 chars).
- Never waste the title on only the brand name unless the brand already has search demand.

## Step 3 — Subtitle (Apple) / Short description (Google)
This is your rank-AND-hook line. Pack a secondary keyword + the #1 benefit.
- Apple subtitle (30): `Study timer & focus tracker` — adds "study", "focus", "tracker".
- Google short (80): lead with benefit, include the primary term once. Shown above the fold, so
  it must make someone tap "read more".

## Step 4 — Keyword field (Apple only, 100 chars)
- Comma-separated, **no spaces after commas** (saves characters), **no repeats** of words already
  in title/subtitle (Apple already indexes those).
- Singular only (Apple auto-handles plurals). No brand names of others (rejection risk).
- Example: `study,concentration,deep,work,adhd,productivity,habit,routine,break,reminder,session`

## Step 5 — Description (convert)
Structure — first 3 lines are everything (that's all users see before "more"):
1. **Line 1:** one-sentence promise — the outcome, not the feature.
2. **Line 2–3:** who it's for + the core benefit.
3. **Social proof** line (ratings, downloads, press) if any.
4. **Feature blocks** — bullet list, benefit-led (`• Beat procrastination with 25-min focus sprints`
   not `• Timer feature`).
5. **Use cases** — 2–3 "perfect for…" lines (studying, remote work, workouts).
6. **CTA** — `Download FocusFlow and reclaim your focus today.`

For Google, repeat the primary keyword 2–3× across these blocks naturally.

## Step 6 — QA before delivery
- [ ] Every character limit respected (count them).
- [ ] Primary keyword in title AND subtitle/short-desc.
- [ ] No keyword repeated across Apple title + subtitle + keyword field (wasted weight).
- [ ] First 3 description lines readable with zero context.
- [ ] No competitor brand names, no unsupported medical/financial claims (rejection risk).

## The retainer pitch
After launch, rankings move. Sell a monthly loop: pull the app's keyword rankings, swap the
2 weakest keyword-field terms, rewrite the subtitle to chase a rising term, and test a new
promotional-text line each month. That iteration is why $500/mo makes sense.
