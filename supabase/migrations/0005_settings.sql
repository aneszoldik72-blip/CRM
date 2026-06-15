-- 0005_settings.sql
-- VOIDCRAFT CRM — settings surface.
-- New profile columns + avatars storage bucket with owner-only write RLS.

-- ============================================================================
-- TABLES
-- ============================================================================

alter table public.profiles
  add column avatar_url                  text,
  add column notification_payment_failed boolean not null default true,
  add column notification_trial_ending   boolean not null default true,
  add column notification_weekly_summary boolean not null default true;

-- ============================================================================
-- STORAGE: avatars bucket
-- ============================================================================
-- Public read so <img src> works without signed URLs. Writes are scoped per
-- user via storage RLS. Object naming convention: "{user_id}/avatar.{ext}"
-- so the first path segment carries ownership.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
