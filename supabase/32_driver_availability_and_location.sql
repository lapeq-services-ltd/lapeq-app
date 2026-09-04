-- ============================================================
-- LAPEQ Migration: Add missing driver availability + live location columns
--
-- Found via Supabase Postgres logs: "column profiles.latitude does not
-- exist" firing repeatedly. The driver portal (driver/page.tsx) has been
-- writing GPS coordinates and duty-status toggles to these columns this
-- whole time — updateAvailability() writes is_available/available_hours/
-- availability_updated_at, and the geolocation watcher writes latitude/
-- longitude/location_updated_at — but no migration ever actually created
-- them on public.profiles. Every one of those writes has been silently
-- failing (PostgREST 400s), and coordination.tsx's driver-profile SELECT
-- (which includes latitude/longitude in its column list) has been failing
-- entirely as a result, meaning the "Your Chauffeur" driver info card
-- likely never rendered real driver details at all.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS availability_updated_at timestamptz;
