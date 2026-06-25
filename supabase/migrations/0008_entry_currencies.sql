-- 0008_entry_currencies.sql
-- Per-entry currency selectors for sales and costs. Allows a user to record
-- revenue in one currency (e.g. EUR) and costs in another (e.g. USD) while
-- the product's currency stays the canonical display unit for all metrics.

-- 1. Add the columns nullable so the backfill below can populate them
--    before we flip them to NOT NULL.
alter table public.entries
  add column sales_currency text,
  add column costs_currency text;

-- 2. Backfill existing entries: each entry inherits the currency of the
--    product it belongs to (entries → months → products). Before this
--    migration, that's the only currency the entry could have meant.
update public.entries e
   set sales_currency = p.currency,
       costs_currency = p.currency
  from public.months m
  join public.products p on p.id = m.product_id
 where e.month_id = m.id;

-- 3. Lock in NOT NULL + default so future INSERTs without explicit currency
--    fall back to USD (the platform default). Application code always
--    supplies the right currency; the default is a defensive safety net.
alter table public.entries
  alter column sales_currency set not null,
  alter column costs_currency set not null,
  alter column sales_currency set default 'USD',
  alter column costs_currency set default 'USD';

-- 4. Constrain to the supported set. Stays in sync with
--    lib/currency.ts → SUPPORTED_CURRENCIES.
alter table public.entries
  add constraint entries_sales_currency_chk
    check (sales_currency in ('USD','EUR','MAD','DZD','TND','XOF','NGN'));

alter table public.entries
  add constraint entries_costs_currency_chk
    check (costs_currency in ('USD','EUR','MAD','DZD','TND','XOF','NGN'));
