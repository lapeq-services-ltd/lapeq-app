-- ============================================================
-- LAPEQ Migration: Auto-cancel Curated Itinerary requests once
-- their travel date has passed with nothing ever having happened
-- to them (still sitting at status = 'pending' — never curated,
-- never paid, never actioned by staff).
--
-- dateFrom/dateTo are stored as formatted strings inside details
-- (e.g. "08 Aug 2026", from fmtDate() in lifestyle-travel.tsx),
-- parsed here with to_date(..., 'DD Mon YYYY').
--
-- Sends the client a notification of type 'itinerary_cancelled'
-- (wired up in app/_layout.tsx to also show a blocking popup, same
-- as trip_status) plus a heads-up to staff.
--
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_cancel_expired_itineraries()
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  FOR req IN
    SELECT id, user_id, reference, details->>'dateFrom' AS date_from
    FROM public.requests
    WHERE service_type = 'lifestyle-travel'
      AND details->>'serviceType' = 'Curated Itinerary'
      AND status = 'pending'
      AND details->>'dateFrom' IS NOT NULL
      AND to_date(details->>'dateFrom', 'DD Mon YYYY') < current_date
  LOOP
    UPDATE public.requests
    SET status = 'cancelled',
        admin_notes = COALESCE(admin_notes || E'\n', '') || 'Auto-cancelled: travel date (' || req.date_from || ') passed while still pending.'
    WHERE id = req.id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, request_id, read)
    VALUES (
      req.user_id,
      'Itinerary Request Cancelled',
      'Your itinerary request for ' || req.date_from || ' was not confirmed in time and has been cancelled. Please submit a new request with updated dates whenever you''re ready.',
      'itinerary_cancelled', req.id, req.id, false
    );

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Itinerary Auto-Cancelled — Travel Date Passed',
           'Request ' || COALESCE(req.reference, req.id::text) || ' (travel date ' || req.date_from || ') was auto-cancelled — it was never curated/confirmed before the date passed.',
           'status_alert', req.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Runs once a day — this is a date-level (not intra-day) check, so
-- there's no benefit to checking every 15 minutes like the ride one.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('auto-cancel-expired-itineraries')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-cancel-expired-itineraries');

SELECT cron.schedule(
  'auto-cancel-expired-itineraries',
  '0 6 * * *',
  $$ SELECT public.auto_cancel_expired_itineraries(); $$
);
