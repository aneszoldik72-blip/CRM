-- 0004_agents.sql
-- VOIDCRAFT CRM — agents + confirmations.
-- Per-agent, per-product, per-day confirmation tracking. The wedge.

-- ============================================================================
-- TABLES
-- ============================================================================

-- 6. agents -----------------------------------------------------------------
create table public.agents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  phone       text,
  photo_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index agents_user_id_idx on public.agents (user_id);

-- 7. confirmations ----------------------------------------------------------
-- One row per (agent, product, day). Operator types three integers per row;
-- no_answer = called − confirmed − rejected (computed in app code).
create table public.confirmations (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references public.agents(id)   on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  date        date not null,
  called      integer not null default 0,
  confirmed   integer not null default 0,
  rejected    integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (agent_id, product_id, date),
  check (called    >= 0),
  check (confirmed >= 0),
  check (rejected  >= 0),
  check (confirmed + rejected <= called)
);

create index confirmations_agent_date_idx   on public.confirmations (agent_id, date desc);
create index confirmations_product_date_idx on public.confirmations (product_id, date desc);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

alter table public.agents        enable row level security;
alter table public.confirmations enable row level security;

-- agents -- direct user_id match -------------------------------------------
create policy "agents_select_own"
  on public.agents for select
  using (user_id = auth.uid());

create policy "agents_insert_own"
  on public.agents for insert
  with check (user_id = auth.uid());

create policy "agents_update_own"
  on public.agents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "agents_delete_own"
  on public.agents for delete
  using (user_id = auth.uid());

-- confirmations -- ownership traced through agents -------------------------
create policy "confirmations_select_own"
  on public.confirmations for select
  using (exists (
    select 1 from public.agents a
    where a.id = confirmations.agent_id and a.user_id = auth.uid()
  ));

create policy "confirmations_insert_own"
  on public.confirmations for insert
  with check (exists (
    select 1 from public.agents a
    where a.id = agent_id and a.user_id = auth.uid()
  ));

create policy "confirmations_update_own"
  on public.confirmations for update
  using (exists (
    select 1 from public.agents a
    where a.id = confirmations.agent_id and a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.agents a
    where a.id = agent_id and a.user_id = auth.uid()
  ));

create policy "confirmations_delete_own"
  on public.confirmations for delete
  using (exists (
    select 1 from public.agents a
    where a.id = confirmations.agent_id and a.user_id = auth.uid()
  ));
