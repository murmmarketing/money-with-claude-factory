-- 0005_control.sql
-- Control / gate plane: validations, runs, tg_processed, approvals, and the
-- compute_scores() gate function. All tables service-role only (NO anon policy).
-- Project: tcatgldshmpgttmputzo

begin;

-- ---------------------------------------------------------------------------
-- validations: written by pipeline/validate.mjs — one demand-validation verdict.
-- ---------------------------------------------------------------------------
create table if not exists public.validations (
  id                    text primary key,   -- idea id
  tier                  text check (tier in ('FULL','LANDING','KILL','FLAG')),
  score                 numeric,
  intent_score          numeric,
  search_volume         int,
  kd                    int,
  saturation            numeric,
  active_ad_competitors int,
  marketplace_proof     int,
  reddit_hits           int,
  evidence_urls         jsonb default '[]'::jsonb,
  signals               jsonb default '{}'::jsonb,
  errors                jsonb default '[]'::jsonb,
  created_at            timestamptz default now()
);
alter table public.validations enable row level security;
revoke all on public.validations from anon;

-- ---------------------------------------------------------------------------
-- runs: one row per factory run (batch accounting).
-- ---------------------------------------------------------------------------
create table if not exists public.runs (
  run_id     text primary key,
  started_at timestamptz,
  ended_at   timestamptz,
  built      int default 0,
  killed     int default 0,
  flagged    int default 0,
  cost_usd   numeric default 0,
  status     text
);
alter table public.runs enable row level security;
revoke all on public.runs from anon;

-- ---------------------------------------------------------------------------
-- tg_processed: Telegram idempotency ledger. update_id PK makes replayed
-- updates a no-op; callback_id UNIQUE dedupes inline-button callbacks.
-- ---------------------------------------------------------------------------
create table if not exists public.tg_processed (
  update_id   bigint primary key,
  kind        text,
  callback_id text unique,
  seen_at     timestamptz default now()
);
alter table public.tg_processed enable row level security;
revoke all on public.tg_processed from anon;

-- ---------------------------------------------------------------------------
-- approvals: human money-gate decisions. unique(idea_id, action) makes a
-- duplicate approval a guaranteed no-op (pipeline P4).
-- ---------------------------------------------------------------------------
create table if not exists public.approvals (
  id         bigserial primary key,
  idea_id    text,
  action     text,
  arg        text,
  status     text default 'pending',
  decided_at timestamptz,
  unique (idea_id, action)
);
alter table public.approvals enable row level security;
revoke all on public.approvals from anon;

-- ---------------------------------------------------------------------------
-- compute_scores(): roll up per-live-landing-page gate metrics and set state.
--   sessions = count(distinct session_id) from events WHERE name='view'
--   paid     = count(*)                   from conversions
--   signups  = count(distinct lower(email)) from signups WHERE flagged=false
--   state = PROMOTE  if paid >= min_paid
--           DEAD     if sessions >= min_sessions AND paid = 0
--           PENDING  otherwise
-- ---------------------------------------------------------------------------
create or replace function public.compute_scores(
  min_sessions int default 150,
  min_paid     int default 3
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.scores (idea_id, sessions, signups, paid, state, updated_at)
  select
    lp.id,
    coalesce(ev.sessions, 0),
    coalesce(su.signups, 0),
    coalesce(cv.paid, 0),
    case
      when coalesce(cv.paid, 0) >= min_paid then 'PROMOTE'
      when coalesce(ev.sessions, 0) >= min_sessions and coalesce(cv.paid, 0) = 0 then 'DEAD'
      else 'PENDING'
    end,
    now()
  from public.landing_pages lp
  left join (
    select idea_id, count(distinct session_id)::int as sessions
    from public.events
    where name = 'view'
    group by idea_id
  ) ev on ev.idea_id = lp.id
  left join (
    select idea_id, count(distinct lower(email))::int as signups
    from public.signups
    where flagged = false
    group by idea_id
  ) su on su.idea_id = lp.id
  left join (
    select idea_id, count(*)::int as paid
    from public.conversions
    group by idea_id
  ) cv on cv.idea_id = lp.id
  where lp.live = true
  on conflict (idea_id) do update set
    sessions   = excluded.sessions,
    signups    = excluded.signups,
    paid       = excluded.paid,
    state      = excluded.state,
    updated_at = now();
end;
$$;

revoke all on function public.compute_scores(int, int) from anon;

commit;
