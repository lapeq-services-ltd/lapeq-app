-- ============================================================
-- LAPEQ Migration 21: Structured Chauffeur Vehicle Profiles
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add structured vehicle columns to public.profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS vehicle_model text,
  ADD COLUMN IF NOT EXISTS vehicle_color text,
  ADD COLUMN IF NOT EXISTS vehicle_plate text,
  ADD COLUMN IF NOT EXISTS vehicle_class text;

-- 2. Populate columns for existing profiles by parsing vehicle_details if set
UPDATE public.profiles
SET 
  vehicle_model = coalesce(vehicle_model, split_part(vehicle_details, '(', 1)),
  vehicle_plate = coalesce(vehicle_plate, substring(vehicle_details from '\(([^)]+)\)')),
  vehicle_class = coalesce(vehicle_class, 'luxury-sedan')
WHERE vehicle_details IS NOT NULL AND vehicle_model IS NULL;
