# The Rep Playbook — OG / Social Image Spec

Spec for the Open Graph / Twitter card image, plus dynamic per-article OG cards for the
SEO posts. Colors, fonts and voice come from `brand.json`. The look is an editorial
**book jacket**, deliberately distinct from HaulHQ's dark trader-terminal cards.

## Canvas & format
- **Size:** 1200 × 630 px (1.91:1). Safe area: keep all text/logo inside a 64px inner margin.
- **Formats:** PNG (static default at `og-default.png`) and dynamically rendered per-article
  cards via an `/api/og` route (edge, `@vercel/og`).
- **Weight:** target < 300 KB for the static card.
- **Twitter card type:** `summary_large_image`.

## Theme — two approved compositions
The Playbook has a paper default AND a dark "ink cover". For OG, the **dark ink cover is the
primary** card (a book jacket reads best dark + one accent + serif). A paper variant is
allowed for lighter contexts.

### Primary: ink cover (default og-default.png)
- Background: `#211C16` (dark `bg`), full bleed.
- Faint paper-grain / hairline double-rule frame inset 28px in `#3A3226` (texture only,
  never competes with text). No gradients, no glow.
- Optional 1px rust rule (`#E86A4E`) directly under the headline as an editorial flourish.

### Alt: paper cover
- Background: `#FBF6EC` (`light.bg`), hairline frame inset 28px in `#E3D8C2`.
- Same layout; swap ink/paper roles per the color table below.

## Layout (static default: og-default.png, ink cover)
Left-aligned, stacked like a book jacket.

1. **Logo lockup** — top-left, `logo.svg` mark + wordmark at ~300px wide. On the ink cover
   render the wordmark in paper `#FBF6EC` and keep the bookmark mark in bright rust `#E86A4E`.
2. **Kicker** — small tracked label, Inter 600 ~24px, letter-spacing 6, `#B8AE9C`:
   > THE FIELD MANUAL FOR REP BUYERS
3. **Headline** — Fraunces 700, ~78px, `#FBF6EC`, letter-spacing -0.02em, max 3 lines:
   > Everything you wish someone told you before your first rep haul.
   Emphasize one phrase (e.g. "first rep haul") in bright rust `#E86A4E`.
4. **Subhead** — Inter 500, ~30px, `#B8AE9C`, 1 line:
   > Sourcing · agents · QC · sizing · customs · legit-checks — in one guide.
5. **Footer row** (bottom):
   - Bottom-left: a rust pill — fill `#C1432A`, radius 8px, Inter 600 ~26px, text `#FFFFFF`:
     > Instant download · lifetime updates
   - Bottom-right: domain, Inter 500 ~24px, `#B8AE9C` — value of `NEXT_PUBLIC_SITE_URL`
     (default `therepplaybook.com`).

## Layout (dynamic per-article card: /api/og?type=article)
For the SEO posts — the shareable/search surface.

- Top-left: Playbook mark (small, ~120px) + kicker "THE REP PLAYBOOK" in `#B8AE9C`.
- Big **article title** (from the post frontmatter) — Fraunces 700 ~62px, `#FBF6EC`,
  truncate to 3 lines, one keyword phrase in rust `#E86A4E`.
- **Reading label** row (Inter 500 ~26px, `#B8AE9C`): e.g. "Beginner guide · 8 min read".
- Bottom-right: domain footer.
- No thumbnails required; keep it typographic and clean.

### /api/og query params (contract for the app thread)
- `type` = `default` | `article` (default `default`)
- `title` — article title (article type)
- `kicker` — optional small label (e.g. `Beginner guide`)
- `read` — optional read-time / meta line (e.g. `8 min read`)
- `theme` — `ink` | `paper` (default `ink`)
All params must be URL-encoded and length-clamped server-side; missing params fall back to
the static default composition.

## Typography rules
- Display/headline/title: **Fraunces** (weights 700/900). In `@vercel/og`, load the Fraunces
  `.ttf` via `fetch` in the route and pass to `fonts`.
- Kicker/subhead/labels/pill/domain: **Inter** (weights 500/600).
- Never use emoji. Tone is warm, plain and trustworthy — the guide, not the salesman
  (see `brand.json.voice`).

## Color usage (from brand.json)
| Element | Ink cover | Paper cover |
|---|---|---|
| Background | `#211C16` | `#FBF6EC` |
| Frame / rules | `#3A3226` | `#E3D8C2` |
| Primary text (headline) | `#FBF6EC` | `#211C16` |
| Secondary text (kicker/subhead/domain) | `#B8AE9C` | `#5E5442` |
| Accent emphasis word / mark | `#E86A4E` | `#C1432A` |
| CTA pill fill | `#C1432A` | `#C1432A` |
| Text on pill | `#FFFFFF` | `#FFFFFF` |

Contrast: every text/background pair above is WCAG-AA-verified in
`brand.json.palette.wcag_aa_pairs`.

## Do / Don't
- **Do** make it read like a book jacket: big serif headline, one accent word, lots of calm space.
- **Do** left-align and stack; keep one clear focal headline.
- **Don't** use the rust accent for large body text on paper (it sits near the AA floor — use
  `accentDeep #A3341E` for smaller rust text on paper).
- **Don't** add gradients, drop shadows, neon or emoji. The credibility is in the restraint.
- **Don't** mix in HaulHQ's lime/dark terminal styling — the two brands must stay distinct.
