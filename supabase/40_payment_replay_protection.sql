-- ============================================================
-- LAPEQ Migration 40: Payment replay protection
--
-- verify-payment checked amount and ownership, but never recorded which
-- tx_ref had already paid for a request — so the same real Flutterwave
-- transaction could be replayed against a DIFFERENT request_id owned by
-- the same user (most exploitably: the curation fee is a fixed ₦5,000
-- across every service, so one real ₦5,000 payment could mark multiple
-- separate curation fees as paid). The read-then-write idempotency check
-- in verify-membership-payment had the same underlying gap: no DB-level
-- uniqueness, so two near-simultaneous calls with the same tx_ref could
-- both pass the "not yet processed" check before either insert commits.
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS payment_tx_ref text;

-- A given Flutterwave transaction reference can only ever mark ONE request paid.
CREATE UNIQUE INDEX IF NOT EXISTS requests_payment_tx_ref_unique
  ON public.requests (payment_tx_ref)
  WHERE payment_tx_ref IS NOT NULL;

-- A given tier-purchase transaction reference can only ever create ONE
-- tier-purchase row — enforced at the DB level, not just app-level read-then-write.
CREATE UNIQUE INDEX IF NOT EXISTS requests_tier_purchase_reference_unique
  ON public.requests (reference)
  WHERE service_type = 'tier-purchase';
