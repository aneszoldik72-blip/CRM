-- Adds the user's preferred reporting currency. Used on the overview
-- dashboard to convert mixed-currency product totals into one base unit.
-- Individual product pages keep their own currency.

alter table public.profiles
  add column default_currency text not null default 'USD';

alter table public.profiles
  add constraint profiles_default_currency_supported
  check (default_currency in ('USD','EUR','MAD','DZD','TND','XOF','NGN'));
