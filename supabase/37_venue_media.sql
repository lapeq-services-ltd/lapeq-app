-- ============================================================
-- LAPEQ Migration: Support photos AND videos in venue_images,
-- with per-item captions, for the new Instagram-Explore-style
-- shuffled media grid.
--
-- No thumbnail_url — videos autoplay directly in the grid, no
-- static cover needed.
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.venue_images
  add column if not exists media_type text not null default 'image' check (media_type in ('image','video')),
  add column if not exists caption text;
