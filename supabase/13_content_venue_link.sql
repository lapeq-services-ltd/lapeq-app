-- ========================================================
-- LAPEQ - Link Monthly Picks (Content) to Partner Venues & Addresses
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================================

-- 1. Add venue_id and address columns to content table if they don't exist
alter table public.content add column if not exists venue_id uuid references public.venues(id) on delete set null;
alter table public.content add column if not exists address text;
