-- ========================================================
-- LAPEQ - Add bulleted details & opening hours to content
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================================

-- 1. Add bullet_points and opening_hours columns if they don't exist
alter table public.content add column if not exists bullet_points text;
alter table public.content add column if not exists opening_hours text;

-- 2. Reload PostgREST schema cache
notify pgrst, 'reload schema';
