-- 0001_init.sql
-- Idea Factory — schema snapshot (reification of the currently-live tables).
-- Project: tcatgldshmpgttmputzo
--
-- This migration reifies the tables that already exist in the live Supabase
-- project (pipeline, landing_pages, signups, events, ledger, scores) together
-- with their existing RLS posture:
--   * anon may SELECT landing_pages WHERE live = true
--   * anon may INSERT signups
--   * anon may INSERT events
-- Everything else is service-role only.
--
-- It is written idempotently (IF NOT EXISTS / DROP POLICY IF EXISTS ... CREATE)
-- so `apply_migration` is a safe no-op against the existing project and also
-- correctly bootstraps a fresh clone. Later migrations (0002+) tighten this.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- pipeline: one row per idea moving through the factory
-- ---------------------------------------------------------------------------
create table if not exists public.pipeline (
  id          text primary key,           -- idea id (matches data/ideas_all.json ids)
  n           int,
  cat         text,
  title       text,
  kind        text,                        -- 'tool' | 'digital'
  status      text default 'queued',       -- queued|validating|building|live|killed|promoted|flagged
  stage       text,
  brief       jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- landing_pages: DB-driven ISR landing content consumed by app/l/[id]
-- ---------------------------------------------------------------------------
create table if not exists public.landing_pages (
  id          text primary key,            -- idea id
  headline    text,
  subhead     text,
  cta_label   text,
  bullets     jsonb default '[]'::jsonb,
  faq         jsonb default '[]'::jsonb,
  brand       jsonb default '{}'::jsonb,
  content     jsonb default '{}'::jsonb,
  live        boolean default false,
  created_at  timestamptz default now()
);
create index if not exists landing_pages_live_idx on public.landing_pages (live);

-- ---------------------------------------------------------------------------
-- signups: waitlist email captures (anon-insertable in this snapshot)
-- ---------------------------------------------------------------------------
create table if not exists public.signups (
  id          uuid primary key default gen_random_uuid(),
  idea_id     text,
  email       text,
  session_id  text,
  utm         jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);
create index if not exists signups_idea_idx on public.signups (idea_id);

-- ---------------------------------------------------------------------------
-- events: lightweight analytics (view/signup/etc)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  idea_id     text,
  session_id  text,
  name        text,
  created_at  timestamptz default now()
);
create index if not exists events_idea_name_idx on public.events (idea_id, name);

-- ---------------------------------------------------------------------------
-- ledger: cost/revenue accounting per idea
-- ---------------------------------------------------------------------------
create table if not exists public.ledger (
  id          uuid primary key default gen_random_uuid(),
  idea_id     text,
  kind        text,                        -- 'cost' | 'revenue'
  amount_cents int,
  currency    text default 'usd',
  note        text,
  created_at  timestamptz default now()
);
create index if not exists ledger_idea_idx on public.ledger (idea_id);

-- ---------------------------------------------------------------------------
-- scores: rolled-up gate metrics per idea (written by compute_scores())
-- ---------------------------------------------------------------------------
create table if not exists public.scores (
  idea_id     text primary key,
  sessions    int default 0,
  signups     int default 0,
  paid        int default 0,
  state       text default 'PENDING',      -- PENDING|PROMOTE|DEAD
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.pipeline      enable row level security;
alter table public.landing_pages enable row level security;
alter table public.signups       enable row level security;
alter table public.events        enable row level security;
alter table public.ledger        enable row level security;
alter table public.scores        enable row level security;

-- anon may only read live landing pages.
drop policy if exists landing_pages_anon_select_live on public.landing_pages;
create policy landing_pages_anon_select_live
  on public.landing_pages
  for select
  to anon
  using (live = true);

-- anon may insert signups (tightened away in 0002).
drop policy if exists signups_anon_insert on public.signups;
create policy signups_anon_insert
  on public.signups
  for insert
  to anon
  with check (true);

-- anon may insert events (tightened away in 0002).
drop policy if exists events_anon_insert on public.events;
create policy events_anon_insert
  on public.events
  for insert
  to anon
  with check (true);

-- Table-level grants (RLS still governs row visibility).
grant select on public.landing_pages to anon;
grant insert on public.signups       to anon;
grant insert on public.events        to anon;

commit;
