-- ============================================================
-- LAPEQ Migration 07: Create Voice Notes Storage Bucket
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Create a public storage bucket named 'voice-notes'
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', true)
on conflict (id) do nothing;

-- 2. Drop policies if exist to prevent errors on rerun
drop policy if exists "Public Access to Voice Notes" on storage.objects;
drop policy if exists "Anyone can upload voice notes" on storage.objects;

-- 3. Create RLS policies to allow public reads and client uploads
create policy "Public Access to Voice Notes"
  on storage.objects for select
  using (bucket_id = 'voice-notes');

create policy "Anyone can upload voice notes"
  on storage.objects for insert
  with check (bucket_id = 'voice-notes');
