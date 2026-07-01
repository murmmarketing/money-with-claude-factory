-- ============================================================================
-- HaulHQ schema (Supabase / Postgres)
-- Run in the Supabase SQL editor for project "factory" (tcatgldshmpgttmputzo).
-- Idempotent: safe to re-run. RLS: reference tables + public hauls are anon-
-- readable; every write goes through the service-role key (server only).
-- ============================================================================

-- ---- Entitlements (Stripe subscription state, keyed by email) --------------
create table if not exists public.entitlements (
  email text primary key,
  plan text check (plan in ('monthly','annual')),
  status text not null default 'inactive',           -- active|trialing|canceled|past_due|inactive
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---- Hauls + items ---------------------------------------------------------
create table if not exists public.hauls (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  title text not null default 'Untitled haul',
  slug text unique,
  destination_country text not null default 'US',
  currency text not null default 'USD',
  fx_rate numeric not null default 0.14,
  agent text,
  shipping_line text,
  is_public boolean not null default false,
  cover_image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hauls_owner_idx on public.hauls (owner_email);
create index if not exists hauls_slug_idx on public.hauls (slug);

create table if not exists public.haul_items (
  id uuid primary key default gen_random_uuid(),
  haul_id uuid not null references public.hauls(id) on delete cascade,
  name text not null default '',
  product_url text default '',
  cny_price numeric not null default 0,
  qty int not null default 1,
  weight_grams int not null default 0,
  category text default '',
  agent text default '',
  shipping_line text default '',
  qc_photo_url text default '',
  notes text default '',
  sort_order int not null default 0
);
create index if not exists haul_items_haul_idx on public.haul_items (haul_id);

-- ---- Reference: agents -----------------------------------------------------
create table if not exists public.agents (
  id text primary key,
  name text not null,
  service_fee_pct numeric not null default 0,
  shipping_lines jsonb not null default '[]'::jsonb,
  notes text,
  active boolean not null default true
);

-- ---- Reference: customs rules ---------------------------------------------
create table if not exists public.customs_rules (
  country_code text primary key,
  country_name text not null,
  currency text not null default 'USD',
  vat_pct numeric not null default 0,
  de_minimis_usd numeric not null default 0,
  duty_notes text,
  updated_at timestamptz not null default now()
);

-- ---- Price / restock watchlist --------------------------------------------
create table if not exists public.price_watches (
  id uuid primary key default gen_random_uuid(),
  owner_email text not null,
  product_url text not null,
  label text default '',
  last_price_cny numeric,
  target_price_cny numeric,
  active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists price_watches_owner_idx on public.price_watches (owner_email);

-- ---- Passwordless one-time login codes ------------------------------------
create table if not exists public.login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_codes_email_idx on public.login_codes (email);

-- ---- Idempotency ledger for Stripe webhook --------------------------------
create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  created_at timestamptz not null default now()
);

-- ---- Lightweight analytics -------------------------------------------------
create table if not exists public.hh_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session_id text,
  meta jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.entitlements   enable row level security;
alter table public.hauls          enable row level security;
alter table public.haul_items     enable row level security;
alter table public.agents         enable row level security;
alter table public.customs_rules  enable row level security;
alter table public.price_watches  enable row level security;
alter table public.login_codes    enable row level security;
alter table public.stripe_events  enable row level security;
alter table public.hh_events      enable row level security;

-- Reference tables: anon read.
drop policy if exists agents_anon_read on public.agents;
create policy agents_anon_read on public.agents for select to anon, authenticated using (true);

drop policy if exists customs_anon_read on public.customs_rules;
create policy customs_anon_read on public.customs_rules for select to anon, authenticated using (true);

-- Public hauls: anon read only when is_public = true.
drop policy if exists hauls_public_read on public.hauls;
create policy hauls_public_read on public.hauls for select to anon, authenticated using (is_public = true);

-- Items of public hauls: anon read only when their parent haul is public.
drop policy if exists haul_items_public_read on public.haul_items;
create policy haul_items_public_read on public.haul_items for select to anon, authenticated
  using (exists (select 1 from public.hauls h where h.id = haul_items.haul_id and h.is_public = true));

-- No anon policies on entitlements / price_watches / login_codes / stripe_events
-- / hh_events => anon cannot read or write them. The service-role key bypasses
-- RLS entirely, so all privileged reads/writes go through server routes.

-- ============================================================================
-- Seed reference data (agents + customs). Re-runnable via upsert.
-- ============================================================================
insert into public.agents (id, name, service_fee_pct, shipping_lines, notes, active) values
('cnfans','CNFans',0,'[{"line":"GD-EUB (Economy)","base_cost":40,"per_kg":55,"volumetric_divisor":8000},{"line":"CNE Standard","base_cost":55,"per_kg":68,"volumetric_divisor":6000},{"line":"YunExpress","base_cost":60,"per_kg":78,"volumetric_divisor":6000},{"line":"DHL Express","base_cost":120,"per_kg":145,"volumetric_divisor":5000}]','No per-item service fee; earns on shipping margin.',true),
('kakobuy','Kakobuy',0,'[{"line":"Global Economy","base_cost":38,"per_kg":52,"volumetric_divisor":8000},{"line":"GD-EUB","base_cost":45,"per_kg":60,"volumetric_divisor":6000},{"line":"EMS","base_cost":90,"per_kg":110,"volumetric_divisor":6000},{"line":"DHL","base_cost":118,"per_kg":140,"volumetric_divisor":5000}]','No service fee; frequent shipping coupons.',true),
('superbuy','Superbuy',3,'[{"line":"Economy Air","base_cost":50,"per_kg":62,"volumetric_divisor":8000},{"line":"SAL","base_cost":65,"per_kg":75,"volumetric_divisor":6000},{"line":"EMS","base_cost":95,"per_kg":118,"volumetric_divisor":6000},{"line":"DHL","base_cost":130,"per_kg":150,"volumetric_divisor":5000}]','Service fee but strong QC + warehouse tools.',true),
('sugargoo','Sugargoo',0,'[{"line":"Economy Line","base_cost":42,"per_kg":54,"volumetric_divisor":8000},{"line":"GD-EUB","base_cost":50,"per_kg":63,"volumetric_divisor":6000},{"line":"YunExpress","base_cost":58,"per_kg":74,"volumetric_divisor":6000},{"line":"DHL","base_cost":122,"per_kg":143,"volumetric_divisor":5000}]','No service fee; broad line selection.',true),
('acbuy','ACBuy',2,'[{"line":"Economy","base_cost":40,"per_kg":56,"volumetric_divisor":8000},{"line":"CNE","base_cost":52,"per_kg":66,"volumetric_divisor":6000},{"line":"EMS","base_cost":92,"per_kg":112,"volumetric_divisor":6000},{"line":"DHL","base_cost":120,"per_kg":142,"volumetric_divisor":5000}]','Small service fee; supports spreadsheet imports.',true)
on conflict (id) do update set
  name=excluded.name, service_fee_pct=excluded.service_fee_pct,
  shipping_lines=excluded.shipping_lines, notes=excluded.notes, active=excluded.active;

insert into public.customs_rules (country_code, country_name, currency, vat_pct, de_minimis_usd, duty_notes) values
('US','United States','USD',0,800,'Section 321 de minimis is $800/person/day. No federal VAT at import; state use tax not collected at import.'),
('GB','United Kingdom','GBP',20,170,'Import VAT 20% on goods over ~£135. Duty generally 0% under £135.'),
('EU','European Union (generic)','EUR',21,1,'No VAT de minimis since July 2021 — VAT from the first euro. €150 threshold only exempts duty.'),
('DE','Germany','EUR',19,1,'VAT 19% from the first euro. Duty exempt under €150.'),
('FR','France','EUR',20,1,'VAT 20% from the first euro. Duty exempt under €150.'),
('NL','Netherlands','EUR',21,1,'VAT 21% from the first euro. Duty exempt under €150.'),
('ES','Spain','EUR',21,1,'VAT 21% from the first euro. Duty exempt under €150.'),
('IT','Italy','EUR',22,1,'VAT 22% from the first euro. Duty exempt under €150.'),
('CA','Canada','CAD',12,15,'Courier de minimis CA$20 (~$15). GST/HST + provincial ~12% above that; brokerage fees common.'),
('AU','Australia','AUD',10,660,'GST 10%. Low-value threshold AU$1000 (~$660) for duty.')
on conflict (country_code) do update set
  country_name=excluded.country_name, currency=excluded.currency, vat_pct=excluded.vat_pct,
  de_minimis_usd=excluded.de_minimis_usd, duty_notes=excluded.duty_notes, updated_at=now();

-- ============================================================================
-- Storage bucket for QC photos (public read). Create once.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('qc-photos','qc-photos', true)
on conflict (id) do nothing;
