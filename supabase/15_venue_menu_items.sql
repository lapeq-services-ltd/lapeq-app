-- ========================================================
-- LAPEQ - Create Venue Menu Items Table for Curation
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================================

create table if not exists public.venue_menu_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade not null,
  image_url text not null,
  name text not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.venue_menu_items enable row level security;

-- Create policies
drop policy if exists "Anyone can read venue menu items" on public.venue_menu_items;
create policy "Anyone can read venue menu items" on public.venue_menu_items for select using (true);

drop policy if exists "Staff can manage venue menu items" on public.venue_menu_items;
create policy "Staff can manage venue menu items" on public.venue_menu_items for all using (true);
