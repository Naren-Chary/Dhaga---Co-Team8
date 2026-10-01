-- Dhaga & Co. — Supabase PostgreSQL MVP schema
-- Design goal: minimum practical table count for a 500 MB Supabase free-tier MVP.
-- Five application tables. Supabase Auth is used for app users and is not duplicated here.
--
-- Tables:
-- 1. customers
-- 2. vendors
-- 3. products
-- 4. orders
-- 5. returns
--
-- AI risk/intervention data is stored as compact JSONB on orders instead of
-- creating separate risk/intervention tables. This keeps the MVP small.
--
-- Data note:
-- The synthetic dataset is generated externally and supplied to the application.
-- This SQL only defines the storage contract; it does NOT generate data.
-- Do NOT store large product images, full chat histories, model prompts,
-- or repeated catalogue snapshots in Postgres.

create extension if not exists pgcrypto;

create type order_payment_type as enum ('COD', 'PREPAID');
create type order_status_type as enum ('PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'CANCELLED');
create type risk_band_type as enum ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');
create type return_reason_type as enum ('FIT', 'QUALITY', 'DAMAGED', 'WRONG_ITEM', 'OTHER', 'NONE');

create table public.customers (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    name text,
    phone_hash text,
    city text,
    state text,
    pincode text,
    total_orders integer not null default 0,
    previous_rto_count integer not null default 0,
    previous_return_count integer not null default 0,
    cod_orders_count integer not null default 0,
    cod_rto_count integer not null default 0,
    created_at timestamptz not null default now()
);

create table public.vendors (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    name text not null,
    city text,
    state text,
    historical_order_count integer not null default 0,
    historical_return_count integer not null default 0,
    historical_rto_count integer not null default 0,
    fit_return_rate numeric(6,4) not null default 0,
    rto_rate numeric(6,4) not null default 0,
    created_at timestamptz not null default now()
);

create table public.products (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    vendor_id uuid not null references public.vendors(id),
    name text not null,
    category text,
    subcategory text,
    price numeric(10,2) not null default 0,
    available_sizes jsonb not null default '[]'::jsonb,
    size_chart jsonb not null default '{}'::jsonb,
    fit_return_rate numeric(6,4) not null default 0,
    rto_rate numeric(6,4) not null default 0,
    total_orders integer not null default 0,
    total_returns integer not null default 0,
    created_at timestamptz not null default now()
);

create table public.orders (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    customer_id uuid not null references public.customers(id),
    product_id uuid not null references public.products(id),
    vendor_id uuid not null references public.vendors(id),

    payment_type order_payment_type not null,
    amount numeric(10,2) not null,
    selected_size text,
    city text,
    state text,
    pincode text,

    status order_status_type not null default 'PLACED',
    ordered_at timestamptz not null default now(),
    shipped_at timestamptz,
    delivered_at timestamptz,
    rto_at timestamptz,

    -- Model 1 output
    rto_risk_score numeric(6,5),
    risk_band risk_band_type not null default 'UNKNOWN',
    risk_factors jsonb not null default '[]'::jsonb,

    -- Model 2 / workflow output
    intervention_type text,
    intervention_payload jsonb not null default '{}'::jsonb,
    intervention_status text,
    customer_response jsonb not null default '{}'::jsonb,

    -- Outcome/evaluation fields
    intervention_success boolean,
    final_outcome text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.returns (
    id uuid primary key default gen_random_uuid(),
    external_id text unique not null,
    order_id uuid not null references public.orders(id),
    customer_id uuid not null references public.customers(id),
    product_id uuid not null references public.products(id),
    vendor_id uuid not null references public.vendors(id),

    selected_reason return_reason_type not null default 'OTHER',
    customer_text text,
    fit_issue text,
    body_area text,
    return_status text,
    returned_at timestamptz not null default now(),

    -- AI classification of messy return text
    ai_reason text,
    ai_fit_issue text,
    ai_confidence numeric(6,5),
    ai_evidence jsonb not null default '[]'::jsonb
);

-- Useful indexes; avoid indexing every column to keep storage and write overhead low.
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_product on public.orders(product_id);
create index idx_orders_vendor on public.orders(vendor_id);
create index idx_orders_risk on public.orders(risk_band, payment_type);
create index idx_orders_status on public.orders(status);
create index idx_orders_ordered_at on public.orders(ordered_at desc);
create index idx_returns_product on public.returns(product_id);
create index idx_returns_vendor on public.returns(vendor_id);
create index idx_returns_reason on public.returns(selected_reason);

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
-- Enable RLS. For an MVP, authenticated users can read/write application
-- data. Tighten this policy later if multiple roles/tenants are introduced.
alter table public.customers enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.returns enable row level security;

create policy "authenticated users can read customers"
on public.customers for select to authenticated using (true);

create policy "authenticated users can read vendors"
on public.vendors for select to authenticated using (true);

create policy "authenticated users can read products"
on public.products for select to authenticated using (true);

create policy "authenticated users can read orders"
on public.orders for select to authenticated using (true);

create policy "authenticated users can read returns"
on public.returns for select to authenticated using (true);

-- Backend writes should preferably use the server-side Supabase key.
-- Do not expose the service-role key in React/Vite.
