-- ============================================================
-- LAPEQ Migration 41: Close two live, publicly-writable holes
--
-- 1. venue_menu_items had a policy named "Staff can manage venue menu
--    items" that was actually `FOR ALL USING (true)` — no role check at
--    all. Any authenticated OR anonymous caller could rewrite any venue's
--    menu content shown to every user browsing Explore. Replaced with the
--    same admin-only pattern already correctly used on the venues table
--    itself (02_venues.sql).
--
-- 2. bug-reports storage bucket had a policy literally named "Anyone can
--    upload bug reports" scoped to the `public` role (authenticated AND
--    anonymous), with zero file-type/size restriction — a free anonymous
--    file host on Lapeq's own storage. Removed the public policy; kept
--    the existing authenticated-only one.
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "Staff can manage venue menu items" ON venue_menu_items;
CREATE POLICY "Admins can manage venue menu items" ON venue_menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Anyone can upload bug reports" ON storage.objects;
