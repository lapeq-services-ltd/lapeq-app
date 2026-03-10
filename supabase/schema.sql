-- =============================================
-- LAPEQ - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. PROFILES (extends Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  tier text default 'Standard' check (tier in ('Standard', 'Gold', 'Black')),
  expo_push_token text,
  created_at timestamp with time zone default now()
);

-- Auto-create a profile row when a user signs up
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

-- 2. REQUESTS (Explicit columns for Admin tracking)
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
  -- Explicit tracking columns
  title text,
  pickup_location text,
  dropoff_location text,
  scheduled_time timestamp with time zone,
  
  -- Flexible JSON fallback for highly bespoke requests 
  details jsonb not null default '{}',
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Auto-update updated_at on changes
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

-- 3. REPORTS (for Project Trust)
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade not null,
  title text not null,
  summary text,
  report_date date not null default current_date,
  files jsonb default '[]', -- array of {name, url, type}
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- 4. NOTIFICATIONS
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  read boolean default false,
  request_id uuid references public.requests(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 5. MESSAGES (Concierge Chat)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_type text default 'client' check (sender_type in ('client', 'admin')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- 6. EVENTS (With Map Coordinates)
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

-- 7. EXPLORE ITEMS (Curated For You - Hotels, Restaurants, etc.)
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
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Profiles: users can only read/update their own
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Requests: users can only see their own requests
alter table public.requests enable row level security;

create policy "Users can view own requests"
  on public.requests for select
  using (auth.uid() = user_id);

create policy "Users can create requests"
  on public.requests for insert
  with check (auth.uid() = user_id);

-- Reports: users can view reports linked to their requests
alter table public.reports enable row level security;

create policy "Users can view their project reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.requests
      where requests.id = reports.request_id
      and requests.user_id = auth.uid()
    )
  );

-- Notifications: users can only see their own
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark notifications read"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Messages: users can only see/send in their own chat
alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- Events & Explore: World readable (assuming clients can see all catalog items)
alter table public.events enable row level security;
alter table public.explore_items enable row level security;

create policy "Anyone can view events"
  on public.events for select
  using (true);

create policy "Anyone can view explore items"
  on public.explore_items for select
  using (true);
