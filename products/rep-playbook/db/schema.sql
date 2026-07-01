-- ============================================================================
-- The Rep Playbook schema (Supabase / Postgres)
-- Run in the Supabase SQL editor for the shared "factory" project
-- (tcatgldshmpgttmputzo). Idempotent: safe to re-run.
-- All tables are venture-prefixed with repplaybook_ so they coexist with other
-- factory ventures. Every write goes through the service-role key (server only);
-- no anon policies are created, so anon cannot read or write any of these.
-- ============================================================================

-- ---- Orders (one row per successful purchase) ------------------------------
create table if not exists public.repplaybook_orders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_session_id text unique,
  amount_cents integer,
  currency text not null default 'usd',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);
create index if not exists repplaybook_orders_email_idx on public.repplaybook_orders (email);

-- ---- Entitlements (who owns the Playbook, keyed by email) ------------------
create table if not exists public.repplaybook_entitlements (
  email text primary key,
  product text not null default 'playbook',
  source text not null default 'stripe',        -- stripe | manual | gumroad
  granted_at timestamptz not null default now()
);

-- ---- Free-chapter leads ----------------------------------------------------
create table if not exists public.repplaybook_leads (
  email text primary key,
  source text default 'site',
  captured_at timestamptz not null default now()
);

-- ---- Waitlist (used when Stripe is not yet connected) ----------------------
create table if not exists public.repplaybook_waitlist (
  email text primary key,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- ---- Passwordless one-time login codes ------------------------------------
create table if not exists public.repplaybook_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists repplaybook_login_codes_email_idx
  on public.repplaybook_login_codes (email);

-- ---- Idempotency ledger for the Stripe webhook ----------------------------
create table if not exists public.repplaybook_events (
  event_id text primary key,
  type text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security: enable on all, create NO anon policies.
-- The service-role key bypasses RLS, so all server routes keep working while
-- the browser (anon key) can neither read nor write these tables.
-- ============================================================================
alter table public.repplaybook_orders        enable row level security;
alter table public.repplaybook_entitlements  enable row level security;
alter table public.repplaybook_leads         enable row level security;
alter table public.repplaybook_waitlist      enable row level security;
alter table public.repplaybook_login_codes   enable row level security;
alter table public.repplaybook_events        enable row level security;
