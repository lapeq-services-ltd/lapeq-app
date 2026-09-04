-- ============================================================
-- LAPEQ Migration: Auto-resolve abandoned pre-pickup chauffeur rides
--
-- Problem this fixes: a request can sit forever if nobody ever updates it —
-- either a driver was assigned but never progressed (driver_status stuck in
-- 'assigned'/'en_route'/'arrived'), OR a request was submitted and never
-- even got a driver assigned at all (driver_status still NULL, sometimes
-- for weeks). Nothing was ever actually closing these out server-side.
-- Every previous fix (client-side 24h hide in coordination.tsx, the admin
-- STALE badge) only changed what one screen *displayed*; the underlying
-- row, and every other screen reading it, never agreed. This fixes it at
-- the source, covering both cases.
--
-- Two-stage flow so a human gets a chance to intervene before the client
-- sees a cancellation:
--   T+2h no update -> staff alert, one time, "will auto-cancel in 1h"
--   T+3h no update -> actually cancelled: client notified, staff notified
--
-- Requires the pg_cron extension. Enable via Supabase Dashboard ->
-- Database -> Extensions (or Integrations -> Cron Jobs) if not already on.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_resolve_stale_rides()
RETURNS void AS $$
DECLARE
  req RECORD;
BEGIN
  -- STAGE 1 (2h): warn staff early, once per request, before anything client-facing happens.
  FOR req IN
    SELECT r.id, r.reference, r.driver_status
    FROM public.requests r
    WHERE r.service_type IN ('driving', 'driving-service', 'logistics')
      AND r.status NOT IN ('completed', 'cancelled')
      AND (r.driver_status IS NULL OR r.driver_status IN ('assigned', 'en_route', 'arrived'))
      AND r.updated_at < now() - interval '2 hours'
      AND COALESCE(r.details->>'stale_warning_sent', 'false') != 'true'
  LOOP
    UPDATE public.requests
    SET details = jsonb_set(COALESCE(details, '{}'::jsonb), '{stale_warning_sent}', 'true')
    WHERE id = req.id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Ride Needs Attention — No Update in 2h',
           'Request ' || COALESCE(req.reference, req.id::text) || ' (' || COALESCE(req.driver_status, 'no driver assigned') || ') has had no update in 2 hours. It will auto-cancel in 1 hour unless resolved.',
           'status_alert', req.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END LOOP;

  -- STAGE 2 (3h): genuinely abandoned — actually cancel it, not just hide it.
  FOR req IN
    SELECT id, user_id, reference, driver_status
    FROM public.requests
    WHERE service_type IN ('driving', 'driving-service', 'logistics')
      AND status NOT IN ('completed', 'cancelled')
      AND (driver_status IS NULL OR driver_status IN ('assigned', 'en_route', 'arrived'))
      AND updated_at < now() - interval '3 hours'
  LOOP
    UPDATE public.requests
    SET status = 'cancelled',
        driver_status = NULL,
        admin_notes = COALESCE(admin_notes || E'\n', '') || 'Auto-cancelled: no update for 3+ hours (' || COALESCE(req.driver_status, 'no driver assigned') || ').'
    WHERE id = req.id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, request_id, read)
    VALUES (
      req.user_id,
      'Your Chauffeur Request Was Cancelled',
      'We were unable to arrange your chauffeur in time, so this request has been cancelled. Please reach out or submit a new request — we will prioritize getting you a chauffeur right away.',
      'request', req.id, req.id, false
    );

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Ride Auto-Cancelled — No Update',
           'Request ' || COALESCE(req.reference, req.id::text) || ' was auto-cancelled after 3+ hours with no update (' || COALESCE(req.driver_status, 'no driver assigned') || '). The client has been notified — please follow up to help them rebook.',
           'status_alert', req.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the check every 15 minutes.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('auto-resolve-stale-rides')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-resolve-stale-rides');

SELECT cron.schedule(
  'auto-resolve-stale-rides',
  '*/15 * * * *',
  $$ SELECT public.auto_resolve_stale_rides(); $$
);

-- One-time cleanup: run this manually right now to immediately resolve your
-- existing stuck test requests instead of waiting for the next scheduled tick.
-- SELECT public.auto_resolve_stale_rides();
