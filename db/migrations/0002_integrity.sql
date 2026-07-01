-- 0002_integrity.sql
-- Lockdown + integrity: revoke anon writes, dedup signups, audit columns,
-- idempotent conversions table, and updated_at bookkeeping.
-- Project: tcatgldshmpgttmputzo
--
-- After this migration the launchpad server routes must use
-- FACTORY_SERVICE_ROLE_KEY (server-only) for writes; anon keeps ONLY
-- "SELECT landing_pages WHERE live = true".

begin;

-- (1) Anon write LOCKDOWN has been MOVED to 0006_lockdown.sql.
--     Apply 0006 ONLY after FACTORY_SERVICE_ROLE_KEY is set in .factory.env + Vercel,
--     otherwise the live waitlist (which still falls back to the anon key) starts
--     returning 500s. Everything below is additive/safe to apply now.

-- (2) Abuse / provenance columns on signups.
alter table public.signups add column if not exists ip_hash     text;
alter table public.signups add column if not exists ua          text;
alter table public.signups add column if not exists referred_by text;
alter table public.signups add column if not exists verified    boolean default false;
alter table public.signups add column if not exists flagged     boolean default false;

-- (3) One signup per (idea, email). Case-insensitive on email.
--     De-dupe any pre-existing rows first so the unique index can be created.
with ranked as (
  select id,
         row_number() over (
           partition by idea_id, lower(email)
           order by created_at asc, id asc
         ) as rn
  from public.signups
  where email is not null
)
delete from public.signups s
using ranked r
where s.id = r.id and r.rn > 1;

-- Plain (idea_id, email) so /api/wait's upsert onConflict:'idea_id,email' matches.
-- Emails are always lowercased by normalizeEmail() before write, so this is
-- equivalent to a case-insensitive constraint without an expression index.
create unique index if not exists signups_idea_email_uniq
  on public.signups (idea_id, email);

-- (4) Event provenance + A/B variant.
alter table public.events add column if not exists ip_hash text;
alter table public.events add column if not exists variant text;

-- (5) conversions: REAL paid events. service-role only, idempotent via
--     UNIQUE(stripe_event_id) so a Stripe webhook replay is a guaranteed no-op.
create table if not exists public.conversions (
  id              uuid primary key default gen_random_uuid(),
  idea_id         text,
  session_id      text,
  stripe_event_id text unique,
  amount_cents    int,
  currency        text,
  kind            text check (kind in ('preorder','deposit')),
  email           text,
  created_at      timestamptz default now()
);
create index if not exists conversions_idea_idx on public.conversions (idea_id);
alter table public.conversions enable row level security;
-- No anon policy: service-role (which bypasses RLS) is the only writer/reader.
revoke all on public.conversions from anon;

-- (6) updated_at bookkeeping on mutable tables + BEFORE UPDATE trigger.
alter table public.pipeline      add column if not exists updated_at timestamptz default now();
alter table public.landing_pages add column if not exists updated_at timestamptz default now();
alter table public.scores        add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pipeline_set_updated_at on public.pipeline;
create trigger pipeline_set_updated_at
  before update on public.pipeline
  for each row execute function public.set_updated_at();

drop trigger if exists landing_pages_set_updated_at on public.landing_pages;
create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row execute function public.set_updated_at();

drop trigger if exists scores_set_updated_at on public.scores;
create trigger scores_set_updated_at
  before update on public.scores
  for each row execute function public.set_updated_at();

commit;
