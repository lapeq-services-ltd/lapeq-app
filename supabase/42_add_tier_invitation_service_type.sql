-- ============================================================
-- LAPEQ Migration 42: Add tier-invitation service type
--
-- The Black-tier "Request Invitation" screen's submit button previously
-- did nothing at all — no supabase call existed anywhere in the file, so
-- a customer requesting Lapeq's most expensive membership got no
-- confirmation and no one at Lapeq was ever notified. Wiring it to
-- actually insert a request row (app/join/request.tsx), parallel to the
-- existing tier-purchase flow for self-service tiers.
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
    'event-service', 'card-delivery', 'lifestyle-bespoke-care', 'white-label-event',
    'tier-invitation'
  ]::text[])
);
