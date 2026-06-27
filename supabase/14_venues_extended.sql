-- ========================================================
-- LAPEQ - Add Perks and Menu Columns to Venues Table
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================================

-- Add perks and menu columns to venues table if they don't exist
alter table public.venues add column if not exists perks text;
alter table public.venues add column if not exists menu text;
