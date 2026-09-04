-- ============================================================
-- LAPEQ Migration: Add sent_by_staff_id to notifications
-- The admin dashboard (itinerary, requests, cs, driver, messages
-- pages) has been inserting sent_by_staff_id on every notification
-- it creates, and the Activity page joins on it, but the column
-- was never actually added to the table — every one of those admin
-- actions has been failing with "Could not find the 'sent_by_staff_id'
-- column of 'notifications' in the schema cache".
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.notifications
  add column if not exists sent_by_staff_id uuid references public.profiles(id) on delete set null;

-- Force PostgREST to pick up the new column immediately instead of
-- waiting for its next automatic schema cache refresh.
notify pgrst, 'reload schema';
