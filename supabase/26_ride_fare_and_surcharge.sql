-- ============================================================
-- LAPEQ Migration: Real chauffeur ride pricing + waiting surcharge collection
--
-- Previously: chauffeur/driving-service requests had no price field at all
-- (unlike jet/stays, which at least embed a cost in a text message — though
-- even those were never actually collected in-app). The waiting surcharge
-- shown in the app was purely a client-side display, never saved or charged.
--
-- This adds:
--   - requests.quoted_fare: set by staff when confirming a chauffeur booking
--   - requests.surcharge_amount: computed SERVER-SIDE (not trusting the
--     client's timer) from the real arrived_at/now() gap, the moment
--     driver_status transitions to in_progress
-- The client then pays quoted_fare + surcharge_amount in-app via the same
-- Flutterwave + verify-payment pattern already used for the curation fee.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS quoted_fare numeric,
  ADD COLUMN IF NOT EXISTS surcharge_amount numeric NOT NULL DEFAULT 0;

-- Compute the waiting surcharge the moment the trip actually starts, using the
-- server-recorded arrived_at timestamp (set by record_driver_arrival_timestamp
-- in 20_secure_rls_and_triggers.sql) rather than trusting a client-side timer.
-- Reads OLD.details (not NEW) so it doesn't depend on trigger execution order
-- relative to the other BEFORE UPDATE trigger on this table.
CREATE OR REPLACE FUNCTION public.calculate_ride_surcharge()
RETURNS TRIGGER AS $$
DECLARE
  arrived_at_ts timestamptz;
  waiting_seconds numeric;
BEGIN
  IF (OLD.driver_status IS DISTINCT FROM NEW.driver_status OR OLD.driver_status IS NULL)
     AND NEW.driver_status = 'in_progress' THEN
    arrived_at_ts := (OLD.details->>'arrived_at')::timestamptz;
    IF arrived_at_ts IS NOT NULL THEN
      waiting_seconds := GREATEST(EXTRACT(EPOCH FROM (now() - arrived_at_ts)), 0);
      -- ₦3,000 per full 10-minute block waited, matching the app's existing display logic
      NEW.surcharge_amount := FLOOR(waiting_seconds / 600) * 3000;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_ride_surcharge ON public.requests;
CREATE TRIGGER trg_calculate_ride_surcharge
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ride_surcharge();
