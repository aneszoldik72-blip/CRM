-- 0006_rename_avatar_url_to_image_url.sql
-- Rename profiles.avatar_url → profiles.image_url so the column name matches
-- the rest of the schema (products already uses image_url).
-- Idempotent: safe whether 0005_settings was applied or not.

alter table public.profiles
  add column if not exists image_url text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'avatar_url'
  ) then
    update public.profiles
       set image_url = avatar_url
     where image_url is null
       and avatar_url is not null;
    alter table public.profiles drop column avatar_url;
  end if;
end $$;
