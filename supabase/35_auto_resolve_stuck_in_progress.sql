-- ============================================================
-- LAPEQ Migration: Close the "stuck in_progress" gap in auto-resolve
--
-- 24_auto_resolve_stale_rides.sql only ever watched driver_status
-- NULL / assigned / en_route / arrived. A ride that a driver marked
-- 'in_progress' (picked the client up) and then never tapped
-- "complete" on falls outside all of those buckets, so it was never
-- being caught by anything — found LPQ-D8OTB stuck for 9 days.
--
-- Resolution: a stuck in_progress ride almost certainly means the
-- driver forgot to close out an actually-completed trip, not that
-- the trip never happened. So instead of cancelling it (which would
-- void the fare), auto-complete it exactly the way the driver portal
-- does — same field changes as driver/page.tsx's updateDriverStatus
-- ('completed') — so it flows into the normal Ride Fare Due payment
-- step instead of silently losing the fare.
--
-- Run this in: Supabase Dashboard > SQL Editor
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
      AND (r.driver_status IS NULL OR r.driver_status IN ('assigned', 'en_route', 'arrived', 'in_progress'))
      AND r.updated_at < now() - interval '2 hours'
      AND COALESCE(r.details->>'stale_warning_sent', 'false') != 'true'
  LOOP
    UPDATE public.requests
    SET details = jsonb_set(COALESCE(details, '{}'::jsonb), '{stale_warning_sent}', 'true')
    WHERE id = req.id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Ride Needs Attention — No Update in 2h',
           'Request ' || COALESCE(req.reference, req.id::text) || ' (' || COALESCE(req.driver_status, 'no driver assigned') || ') has had no update in 2 hours. It will auto-resolve in 1 hour unless updated.',
           'status_alert', req.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END LOOP;

  -- STAGE 2a (3h): never actually started — genuinely abandoned, cancel it.
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

  -- STAGE 2b (3h): trip was already in progress — auto-complete, not cancel,
  -- so the fare still gets collected.
  FOR req IN
    SELECT id, user_id, reference
    FROM public.requests
    WHERE service_type IN ('driving', 'driving-service', 'logistics')
      AND status NOT IN ('completed', 'cancelled')
      AND driver_status = 'in_progress'
      AND updated_at < now() - interval '3 hours'
  LOOP
    UPDATE public.requests
    SET status = 'completed',
        driver_status = 'completed',
        admin_notes = COALESCE(admin_notes || E'\n', '') || 'Auto-completed: stuck in_progress with no update for 3+ hours — driver likely forgot to close out the trip.'
    WHERE id = req.id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, request_id, read)
    VALUES (
      req.user_id,
      'Trip Complete',
      'Your chauffeur ride has been marked complete. Thank you for riding with LAPEQ.',
      'trip_status', req.id, req.id, false
    );

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Ride Auto-Completed — Stuck In Progress',
           'Request ' || COALESCE(req.reference, req.id::text) || ' was stuck in_progress with no update for 3+ hours and has been auto-completed. Please verify the fare and follow up with the driver if anything looks off.',
           'status_alert', req.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
