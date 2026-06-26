-- ============================================================
-- CREATE FAQS / AUTO-REPLY TABLE
-- Run in Supabase SQL Editor -> New Query
-- ============================================================

-- 1. Create table
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] default '{}',
  created_at timestamptz not null default now()
);

-- 2. Enable Row-Level Security (RLS)
alter table public.faqs enable row level security;

-- 3. Select policy: authenticated users can read FAQs
drop policy if exists "Anyone can read faqs" on public.faqs;
create policy "Anyone can read faqs" on public.faqs for select using (true);

-- 4. Manage policy: admin and customer_service roles can manage FAQs
drop policy if exists "CS/Admin can manage faqs" on public.faqs;
create policy "CS/Admin can manage faqs" on public.faqs for all using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'customer_service')
  )
);

-- 5. Prepopulate with default FAQs
insert into public.faqs (question, answer, keywords) values
('What''s included in Gold membership?', 'Gold membership includes full concierge access with a 24-hour response guarantee, chauffeur service, bespoke travel planning, lifestyle management, event access, and priority reservations at partner venues across Abuja, Lagos, Port Harcourt, Akwa Ibom, and Kano.', '{gold,membership,included,include}'),
('How does Project Supervision work?', 'Our team provides independent oversight of your construction or renovation project in Nigeria. We conduct regular site visits, send weekly photo reports, verify materials, and liaise with contractors - keeping you fully informed from anywhere in the world.', '{project,supervision,construction,build,site}'),
('Can you arrange airport pickup?', 'Yes. We arrange private airport transfers across all cities we cover. Simply provide your flight details and we''ll handle the rest - including meet & greet, luggage assistance, and direct transfer to your destination.', '{airport,pickup,transfer,arrival,flight}'),
('What cities do you cover?', 'We currently operate in Abuja and Lagos, with services in Port Harcourt, Akwa Ibom, and Kano coming soon. Our on-the-ground concierge teams ensure real-time service delivery.', '{cities,city,cover,location,abuja,lagos,"port harcourt",ph,"akwa ibom",kano}'),
('How do I upgrade my tier?', 'You can upgrade your membership directly in the app. Go to Profile → Upgrade Membership, select your desired tier, and submit a request. Our team will process it and reach out to confirm.', '{upgrade,tier,black,silver,"change plan"}')
on conflict do nothing;
