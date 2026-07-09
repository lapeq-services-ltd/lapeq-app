-- ============================================================
-- LAPEQ Migration 17: Add role, member_code, email, gender to profiles
-- Fixes: admin dashboard showing "--" for new members
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add missing columns
alter table public.profiles
  add column if not exists role text not null default 'pending',
  add column if not exists email text,
  add column if not exists gender text,
  add column if not exists member_code text;

-- 2. Migrate existing is_admin flag → role column
update public.profiles set role = 'admin' where is_admin = true and role = 'pending';
-- Treat anyone who already had a profile (not admin) as an active member
update public.profiles set role = 'member' where is_admin = false and role = 'pending';

-- 3. Sync emails from auth.users for all existing profiles
update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id and p.email is null;

-- 4. Generate member codes for existing profiles that don't have one
update public.profiles
  set member_code = 'LPQ-' || upper(substring(replace(id::text, '-', ''), 1, 7))
  where member_code is null;

-- 5. Update handle_new_user trigger to populate all fields on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_full_name text;
begin
  -- App stores first_name + last_name separately; trigger gets raw_user_meta_data
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(
      coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' ||
      coalesce(new.raw_user_meta_data->>'last_name', '')
    ), '')
  );

  insert into public.profiles (id, full_name, phone, email, role, member_code)
  values (
    new.id,
    v_full_name,
    new.raw_user_meta_data->>'phone',
    new.email,
    'pending',
    'LPQ-' || upper(substring(replace(new.id::text, '-', ''), 1, 7))
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- 6. Update is_admin() helper to use the new role column
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select role in ('admin', 'customer_service') from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- Done!
-- After running this, update the app's register.tsx to also upsert email into profiles
-- (see register.tsx - the upsert call should include `email: email.trim()`)
