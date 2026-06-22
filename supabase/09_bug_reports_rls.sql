-- ============================================================
-- LAPEQ Migration 09: RLS policies for bug_reports & Storage Bucket
-- Fixes: bug report submissions failing due to policy violation
-- Fixes: bug report screenshot images failing to upload/load
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- Part 1: Table RLS policies
-- ------------------------------------------------------------

-- 1. Ensure RLS is enabled on the table
alter table public.bug_reports enable row level security;

-- 2. Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Allow insert for everyone" on public.bug_reports;
drop policy if exists "Allow select for authenticated" on public.bug_reports;
drop policy if exists "Allow delete for authenticated" on public.bug_reports;

-- 3. Create INSERT policy (allows anyone - anon or auth - to submit bugs from the app)
create policy "Allow insert for everyone" on public.bug_reports
  for insert to anon, authenticated
  with check (true);

-- 4. Create SELECT policy (allows authenticated dashboard admin users to view them)
create policy "Allow select for authenticated" on public.bug_reports
  for select to authenticated
  using (true);

-- 5. Create DELETE policy (allows authenticated dashboard admin users to delete them)
create policy "Allow delete for authenticated" on public.bug_reports
  for delete to authenticated
  using (true);


-- ------------------------------------------------------------
-- Part 2: Storage Bucket & Object Policies
-- ------------------------------------------------------------

-- 1. Create a public storage bucket named 'bug-reports'
insert into storage.buckets (id, name, public)
values ('bug-reports', 'bug-reports', true)
on conflict (id) do nothing;

-- 2. Drop policies if exist to prevent errors on rerun
drop policy if exists "Public Access to Bug Reports" on storage.objects;
drop policy if exists "Anyone can upload bug reports" on storage.objects;

-- 3. Create RLS policies to allow public reads and client uploads
create policy "Public Access to Bug Reports"
  on storage.objects for select
  using (bucket_id = 'bug-reports');

create policy "Anyone can upload bug reports"
  on storage.objects for insert
  with check (bucket_id = 'bug-reports');
