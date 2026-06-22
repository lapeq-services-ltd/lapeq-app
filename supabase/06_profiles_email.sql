-- ============================================================
-- LAPEQ Migration 06: Add email to profiles table
-- Fixes: column profiles_1.email does not exist in admin queries
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add email column to profiles
alter table public.profiles
  add column if not exists email text;

-- 2. Sync existing emails from auth.users
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id;

-- 3. Update handle_new_user trigger to save email on registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;
