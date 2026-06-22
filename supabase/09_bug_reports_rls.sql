-- ============================================================
-- LAPEQ Migration 09: RLS policies for bug_reports
-- Fixes: bug report submissions failing due to policy violation
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Ensure RLS is enabled on the table
alter table public.bug_reports enable row level security;

-- 2. Drop existing policies if they exist to avoid duplication errors
drop policy if exists "Allow insert for everyone" on public.bug_reports;
drop policy if exists "Allow select for authenticated" on public.bug_reports;

-- 3. Create INSERT policy (allows anyone - anon or auth - to submit bugs from the app)
create policy "Allow insert for everyone" on public.bug_reports
  for insert to anon, authenticated
  with check (true);

-- 4. Create SELECT policy (allows authenticated dashboard admin users to view them)
create policy "Allow select for authenticated" on public.bug_reports
  for select to authenticated
  using (true);

-- 5. Create DELETE policy (allows authenticated dashboard admin users to delete them)
drop policy if exists "Allow delete for authenticated" on public.bug_reports;
create policy "Allow delete for authenticated" on public.bug_reports
  for delete to authenticated
  using (true);
