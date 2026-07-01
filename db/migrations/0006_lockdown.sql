-- 0006_lockdown.sql
-- Anon write lockdown — SPLIT OUT of 0002 so the live waitlist keeps working until
-- the server routes have a real service-role key.
-- Project: tcatgldshmpgttmputzo
--
-- APPLY THIS ONLY AFTER:
--   1. FACTORY_SERVICE_ROLE_KEY is set in ~/.factory.env AND in the launchpad's Vercel env, and
--   2. a synthetic POST /api/wait (which uses serviceClient()) inserts exactly one row.
-- After this, anon can ONLY "SELECT landing_pages WHERE live = true" and the aggregate
-- live_signup_counts view; all writes go through the service role (which bypasses RLS).

begin;

drop policy if exists signups_anon_insert on public.signups;
drop policy if exists events_anon_insert  on public.events;
revoke insert on public.signups from anon;
revoke insert on public.events  from anon;
-- Defensive: strip any stray anon grants on these tables.
revoke all on public.signups from anon;
revoke all on public.events  from anon;

commit;
