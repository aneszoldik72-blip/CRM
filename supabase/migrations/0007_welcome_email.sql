-- 0007_welcome_email.sql
-- Add welcome_email_sent_at to profiles so the dashboard knows whether to
-- send the welcome email on first visit. Idempotent.

alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;
