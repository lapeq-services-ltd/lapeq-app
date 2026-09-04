-- ============================================================
-- Add speakers/sponsors columns to events — the mobile app's event
-- detail screen has always had full UI for both (see app/(tabs)/events.tsx),
-- but the admin content editor had no fields to actually populate them.
-- Idempotent — safe to run whether or not these columns already exist.
-- ============================================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS speakers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sponsors jsonb NOT NULL DEFAULT '[]'::jsonb;
