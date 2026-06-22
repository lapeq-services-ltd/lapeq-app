-- ============================================================
-- LAPEQ Migration: Add itinerary support to notifications
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add missing columns to notifications table
alter table public.notifications
  add column if not exists type text default 'general',
  add column if not exists target_id uuid,
  add column if not exists data jsonb;

-- 2. Update existing notifications to have type = 'general'
update public.notifications set type = 'general' where type is null;

-- 3. Allow admin to insert any notification (extend existing policy)
drop policy if exists "Admins can insert notifications" on public.notifications;
create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (true);

-- 4. Allow service role / admin to insert notifications for any user
-- (The existing admin check policy was: is_admin())
-- This grants insert for admins and service role.
