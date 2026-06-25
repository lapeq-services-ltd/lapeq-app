-- =============================================
-- LAPEQ - Supabase Schema (v2 - Admin Ready)
-- Run this in: Supabase Dashboard > SQL Editor
-- WARNING: This drops and recreates all tables.
-- =============================================

-- =============================================
-- CLEANUP
-- =============================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop trigger if exists on_request_updated on public.requests;
drop function if exists public.handle_updated_at cascade;
drop function if exists public.is_admin cascade;

drop table if exists public.push_subscriptions cascade;
drop table if exists public.explore_items cascade;
drop table if exists public.events cascade;
drop table if exists public.messages cascade;
drop table if exists public.notifications cascade;
drop table if exists public.reports cascade;
drop table if exists public.requests cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  tier text default 'Standard' check (tier in ('Standard', 'Silver', 'Gold', 'Black')),
  is_admin boolean not null default false,
  expo_push_token text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- HELPER: is_admin()
-- Must be created AFTER profiles table exists.
-- Returns true if the current user is an admin.
-- =============================================
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 2. REQUESTS
-- =============================================
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  assigned_staff_id uuid references public.profiles(id) on delete set null,
  service_type text not null check (service_type in (
    'driving-service',
    'logistics',
    'lifestyle-travel',
    'corporate-pairing',
    'diaspora-support',
    'project-trust'
  )),
  status text not null default 'pending' check (status in (
    'pending',
    'approved',
    'arranged',
    'en-route',
    'in-progress',
    'completed',
    'cancelled'
  )),
  title text,
  pickup_location text,
  dropoff_location text,
  scheduled_time timestamp with time zone,
  details jsonb not null default '{}',
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-update updated_at on any change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_request_updated
  before update on public.requests
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- 3. REPORTS (Project Trust file uploads)
-- =============================================
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade not null,
  title text not null,
  summary text,
  report_date date not null default current_date,
  files jsonb default '[]',
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- =============================================
-- 4. NOTIFICATIONS
-- =============================================
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  read boolean default false,
  request_id uuid references public.requests(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- =============================================
-- 4b. PUSH SUBSCRIPTIONS
-- =============================================
create table public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null,
  platform text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- 5. MESSAGES (Concierge Chat)
-- =============================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_type text default 'client' check (sender_type in ('client', 'admin')),
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- =============================================
-- 6. EVENTS (with map coordinates)
-- =============================================
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date timestamp with time zone not null,
  location_name text not null,
  latitude double precision,
  longitude double precision,
  image_url text,
  badge text,
  confirmed_count integer default 0,
  created_at timestamp with time zone default now()
);

-- =============================================
-- 7. EXPLORE ITEMS (curated catalog)
-- =============================================
create table public.explore_items (
  id uuid default gen_random_uuid() primary key,
  category text not null check (category in ('restaurant', 'hotel', 'experience')),
  title text not null,
  subtitle text not null,
  description text,
  image_url text,
  badge text,
  created_at timestamp with time zone default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- Pattern: users can only see/edit their own data.
-- Admins (is_admin = true) bypass all restrictions.
-- =============================================

-- ---- PROFILES ----
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id OR public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id OR public.is_admin());

-- Admins can insert profiles (e.g. manual onboarding)
create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

-- Only admins can delete profiles
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- ---- REQUESTS ----
alter table public.requests enable row level security;

create policy "Users can view own requests"
  on public.requests for select
  using (auth.uid() = user_id OR public.is_admin());

create policy "Users can create requests"
  on public.requests for insert
  with check (auth.uid() = user_id OR public.is_admin());

-- Only admins can update request status/notes
create policy "Admins can update any request"
  on public.requests for update
  using (public.is_admin());

create policy "Admins can delete requests"
  on public.requests for delete
  using (public.is_admin());

-- ---- REPORTS ----
alter table public.reports enable row level security;

create policy "Users can view their project reports"
  on public.reports for select
  using (
    public.is_admin() OR
    exists (
      select 1 from public.requests
      where requests.id = reports.request_id
      and requests.user_id = auth.uid()
    )
  );

create policy "Admins can insert reports"
  on public.reports for insert
  with check (public.is_admin());

create policy "Admins can update reports"
  on public.reports for update
  using (public.is_admin());

create policy "Admins can delete reports"
  on public.reports for delete
  using (public.is_admin());

-- ---- NOTIFICATIONS ----
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id OR public.is_admin());

create policy "Users can mark notifications read"
  on public.notifications for update
  using (auth.uid() = user_id OR public.is_admin());

create policy "Admins can insert notifications"
  on public.notifications for insert
  with check (public.is_admin());

create policy "Admins can delete notifications"
  on public.notifications for delete
  using (public.is_admin());

-- ---- PUSH SUBSCRIPTIONS ----
alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- ---- MESSAGES ----
alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id OR public.is_admin());

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id OR public.is_admin());

create policy "Admins can update messages"
  on public.messages for update
  using (public.is_admin());

create policy "Admins can delete messages"
  on public.messages for delete
  using (public.is_admin());

-- ---- EVENTS ----
alter table public.events enable row level security;

create policy "Anyone can view events"
  on public.events for select
  using (true);

create policy "Admins can insert events"
  on public.events for insert
  with check (public.is_admin());

create policy "Admins can update events"
  on public.events for update
  using (public.is_admin());

create policy "Admins can delete events"
  on public.events for delete
  using (public.is_admin());

-- ---- EXPLORE ITEMS ----
alter table public.explore_items enable row level security;

create policy "Anyone can view explore items"
  on public.explore_items for select
  using (true);

create policy "Admins can insert explore items"
  on public.explore_items for insert
  with check (public.is_admin());

create policy "Admins can update explore items"
  on public.explore_items for update
  using (public.is_admin());

create policy "Admins can delete explore items"
  on public.explore_items for delete
  using (public.is_admin());

-- =============================================
-- ENABLE REALTIME
-- Realtime WebSocket subscriptions for the mobile
-- app's live status updates (milestone tracker).
-- =============================================
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
