-- ============================================================
-- LAPEQ Migration 05: Comprehensive schema fixes
-- Fixes: missing reference column, service_type constraint too narrow
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add reference column to requests (used everywhere in the app)
alter table public.requests
  add column if not exists reference text;

-- 2. Drop the old narrow service_type check constraint
alter table public.requests
  drop constraint if exists requests_service_type_check;

-- 3. Replace with a wider constraint covering all service types used in the app
alter table public.requests
  add constraint requests_service_type_check check (service_type in (
    -- original
    'driving-service',
    'logistics',
    'lifestyle-travel',
    'corporate-pairing',
    'diaspora-support',
    'project-trust',
    -- concierge
    'ladies-concierge',
    'gentlemens-concierge',
    'general-concierge',
    'concierge-request',
    -- lifestyle sub-services
    'lifestyle-family',
    'lifestyle-medical',
    'lifestyle-recreation',
    'lifestyle-security',
    'lifestyle-request',
    'lifestyle-property',
    'lifestyle-photography',
    'lifestyle-finance',
    'lifestyle-gifts',
    'lifestyle-legal',
    -- other
    'experience',
    'private-jet',
    'tier-purchase',
    'event'
  ));

-- 4. Also fix the status check to include all statuses used in the app
alter table public.requests
  drop constraint if exists requests_status_check;

alter table public.requests
  add constraint requests_status_check check (status in (
    'pending',
    'approved',
    'arranged',
    'en-route',
    'in-progress',
    'completed',
    'cancelled',
    'building',
    'ready',
    'active'
  ));

-- 5. Add preferred_name and region/country to profiles (used in profile screen)
alter table public.profiles
  add column if not exists preferred_name text,
  add column if not exists region text,
  add column if not exists country text;

-- 6. notifications: already migrated in 04, ensure columns exist
alter table public.notifications
  add column if not exists type text default 'general',
  add column if not exists target_id uuid,
  add column if not exists data jsonb;

-- Done!
