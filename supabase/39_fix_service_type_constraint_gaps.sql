-- ============================================================
-- LAPEQ Migration 39: Add missing service_type values
--
-- Cross-checked every literal service_type the app actually inserts
-- against the live requests_service_type_check constraint. Four values
-- are used in shipped/in-progress screens but rejected by the DB today:
--   - event-service        (app/(tabs)/events.tsx)
--   - card-delivery        (app/(main)/membership.tsx — physical card request)
--   - lifestyle-bespoke-care (app/services/lifestyle-bespoke-care.tsx)
--   - white-label-event    (app/services/lifestyle.tsx)
-- Submitting any of these right now fails with a check constraint
-- violation. Postgres has no ADD VALUE for CHECK constraints, so this
-- drops and recreates it with the full current set.
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_service_type_check;

ALTER TABLE public.requests ADD CONSTRAINT requests_service_type_check CHECK (
  service_type = ANY (ARRAY[
    'driving-service', 'logistics', 'lifestyle-travel', 'corporate-pairing',
    'diaspora-support', 'project-trust', 'ladies-concierge', 'gentlemens-concierge',
    'general-concierge', 'concierge-request', 'lifestyle-family', 'lifestyle-medical',
    'lifestyle-recreation', 'lifestyle-security', 'lifestyle-request', 'lifestyle-property',
    'lifestyle-photography', 'lifestyle-finance', 'lifestyle-gifts', 'lifestyle-legal',
    'experience', 'private-jet', 'tier-purchase', 'event', 'restaurant-booking',
    'hotel-booking', 'general',
    'event-service', 'card-delivery', 'lifestyle-bespoke-care', 'white-label-event'
  ]::text[])
);
