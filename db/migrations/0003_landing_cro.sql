-- 0003_landing_cro.sql
-- CRO / brand columns on landing_pages, an aggregate social-proof view,
-- and a promoted flag (indexing control, not visibility).
-- Project: tcatgldshmpgttmputzo

begin;

-- CRO + commerce + brand columns.
alter table public.landing_pages add column if not exists deposit_cents      int;
alter table public.landing_pages add column if not exists price_cents        int;
alter table public.landing_pages add column if not exists proof              jsonb default '{}'::jsonb;
alter table public.landing_pages add column if not exists urgency            jsonb default '{}'::jsonb;
alter table public.landing_pages add column if not exists cta_label_secondary text;
alter table public.landing_pages add column if not exists eyebrow            text;
alter table public.landing_pages add column if not exists promoted           boolean default false;

-- Brand contract. We deliberately DO NOT explode brand into per-key columns;
-- the single jsonb `brand` column is the source of truth and the frontend
-- (launchpad/lib/theme.ts) COALESCEs every key to a default. Documented shape:
--
--   {
--     "accent":     text  (hex, primary action color),
--     "accentInk":  text  (hex, text color on top of accent),
--     "bg":         text  (hex, page background),
--     "surface":    text  (hex, card/surface background),
--     "ink":        text  (hex, primary text),
--     "muted":      text  (hex, secondary text),
--     "radius":     int   (px corner radius),
--     "fontKey":    'editorial' | 'geometric' | 'mono',
--     "template":   'centered' | 'split' | 'left-rail',
--     "motif":      text  (decorative motif key),
--     "logo":       text? (optional image url),
--     "monogram":   text? (optional 1-2 char fallback mark)
--   }
--
-- This backs the deterministic Brand type in launchpad/lib/types.ts and the
-- F1/F2/F3 frontend items.
comment on column public.landing_pages.brand is
  'Brand contract jsonb: {accent, accentInk, bg, surface, ink, muted, radius:int, fontKey:editorial|geometric|mono, template:centered|split|left-rail, motif, logo?, monogram}. App-side COALESCE supplies defaults; do not add per-key columns.';

comment on column public.landing_pages.promoted is
  'When true the page is eligible to be indexed (app flips noindex->index). Does NOT affect anon read visibility, which is governed solely by live=true.';

-- Aggregate-only social-proof view. Exposes counts, never raw signup rows,
-- so signups itself stays fully insert/select-blocked for anon.
create or replace view public.live_signup_counts as
  select idea_id, count(*)::int as n
  from public.signups
  where flagged = false
  group by idea_id;

-- Views run with the definer's privileges; grant anon read on the aggregate.
grant select on public.live_signup_counts to anon;

-- Anon SELECT RLS on landing_pages is unchanged: readable WHERE live = true.
-- (promoted only governs indexing in the app, never row visibility.)
-- Re-assert idempotently in case of drift.
drop policy if exists landing_pages_anon_select_live on public.landing_pages;
create policy landing_pages_anon_select_live
  on public.landing_pages
  for select
  to anon
  using (live = true);

commit;
