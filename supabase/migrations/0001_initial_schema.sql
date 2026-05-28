-- 0001_initial_schema.sql
-- VOIDCRAFT CRM — initial schema.
-- 5 tables, RLS on every table, 2 triggers.

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. profiles ---------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  locale               text not null default 'fr',
  country              text,
  onboarding_complete  boolean not null default false,
  created_at           timestamptz not null default now()
);

-- 2. products ---------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  country     text,
  currency    text not null default 'USD',
  image_url   text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index products_user_id_idx          on public.products (user_id);
create index products_user_id_archived_idx on public.products (user_id, archived);

-- 3. months -----------------------------------------------------------------
create table public.months (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label       text not null,
  start_date  date not null,
  end_date    date not null,
  created_at  timestamptz not null default now()
);

create index months_product_id_idx            on public.months (product_id);
create index months_product_id_start_date_idx on public.months (product_id, start_date);

-- 4. entries ----------------------------------------------------------------
-- One entries row per month. UNIQUE (month_id) enforces 1:1 with months.
create table public.entries (
  id                  uuid primary key default gen_random_uuid(),
  month_id            uuid not null unique references public.months(id) on delete cascade,
  leads               integer not null default 0,
  orders              integer not null default 0,
  delivered           integer not null default 0,
  revenue_cents       bigint  not null default 0,
  ads_spend_cents     bigint  not null default 0,
  test_spend_cents    bigint  not null default 0,
  ad_account_cents    bigint  not null default 0,
  product_cost_cents  bigint  not null default 0,
  service_cost_cents  bigint  not null default 0,
  bonus_cents         bigint  not null default 0,
  initial_stock       integer,
  current_stock       integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 5. subscriptions ----------------------------------------------------------
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  status                  text,
  plan                    text,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.profiles      enable row level security;
alter table public.products      enable row level security;
alter table public.months        enable row level security;
alter table public.entries       enable row level security;
alter table public.subscriptions enable row level security;

-- profiles -------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = auth.uid());

-- products -------------------------------------------------------------------
create policy "products_select_own"
  on public.products for select
  using (user_id = auth.uid());

create policy "products_insert_own"
  on public.products for insert
  with check (user_id = auth.uid());

create policy "products_update_own"
  on public.products for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "products_delete_own"
  on public.products for delete
  using (user_id = auth.uid());

-- months — ownership traced through products --------------------------------
create policy "months_select_own"
  on public.months for select
  using (exists (
    select 1 from public.products p
    where p.id = months.product_id and p.user_id = auth.uid()
  ));

create policy "months_insert_own"
  on public.months for insert
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.user_id = auth.uid()
  ));

create policy "months_update_own"
  on public.months for update
  using (exists (
    select 1 from public.products p
    where p.id = months.product_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_id and p.user_id = auth.uid()
  ));

create policy "months_delete_own"
  on public.months for delete
  using (exists (
    select 1 from public.products p
    where p.id = months.product_id and p.user_id = auth.uid()
  ));

-- entries — ownership traced through months → products ---------------------
create policy "entries_select_own"
  on public.entries for select
  using (exists (
    select 1
    from public.months m
    join public.products p on p.id = m.product_id
    where m.id = entries.month_id and p.user_id = auth.uid()
  ));

create policy "entries_insert_own"
  on public.entries for insert
  with check (exists (
    select 1
    from public.months m
    join public.products p on p.id = m.product_id
    where m.id = month_id and p.user_id = auth.uid()
  ));

create policy "entries_update_own"
  on public.entries for update
  using (exists (
    select 1
    from public.months m
    join public.products p on p.id = m.product_id
    where m.id = entries.month_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.months m
    join public.products p on p.id = m.product_id
    where m.id = month_id and p.user_id = auth.uid()
  ));

create policy "entries_delete_own"
  on public.entries for delete
  using (exists (
    select 1
    from public.months m
    join public.products p on p.id = m.product_id
    where m.id = entries.month_id and p.user_id = auth.uid()
  ));

-- subscriptions — SELECT only for authenticated users.
-- INSERT / UPDATE / DELETE are performed exclusively by the Stripe webhook
-- handler using the service_role key, which bypasses RLS entirely.
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger 1: auto-create a profile row when a user signs up.
-- SECURITY DEFINER is required because the auth.users insert is triggered
-- from a context that does not have direct write access to public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger 2: bump entries.updated_at on every UPDATE.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.tg_set_updated_at();
