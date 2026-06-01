-- 0002_locale_from_metadata.sql
-- Honour the locale chosen on the signup form. Supabase passes form-side
-- options.data into auth.users.raw_user_meta_data; we read it here so the
-- profile row starts with the user's actual language preference.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locale text;
  v_full_name text;
begin
  v_locale := coalesce(new.raw_user_meta_data->>'locale', 'fr');
  if v_locale not in ('fr', 'en', 'ar') then
    v_locale := 'fr';
  end if;

  v_full_name := nullif(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, email, locale, full_name)
  values (new.id, new.email, v_locale, v_full_name);

  return new;
end;
$$;
