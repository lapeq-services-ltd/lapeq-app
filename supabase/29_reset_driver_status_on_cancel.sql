-- ============================================================
-- LAPEQ Migration: Reset driver_status when a request is cancelled
--
-- Bug found: cancelling a request (either the auto-resolve cron, or the
-- client's own Cancel Ride button) only ever set `status = 'cancelled'`.
-- `driver_status` was left exactly as it was (e.g. still 'assigned'), so
-- any screen reading driver_status without also checking status showed
-- stale info — e.g. "Your driver has been assigned" persisting on an
-- already-cancelled request's detail page.
--
-- This updates the client-cancellation carve-out in
-- protect_request_fields_trigger() to allow driver_status to be cleared
-- (set to NULL) specifically as part of cancelling — nothing else about
-- that carve-out changes. 24_auto_resolve_stale_rides.sql was already
-- updated separately to clear driver_status on auto-cancellation too.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_request_fields_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(current_user_role, '') IN ('admin', 'manager', 'customer_service', 'concierge') THEN
    RETURN NEW;
  END IF;

  -- Driver checks (unchanged)
  IF auth.uid() = OLD.driver_id AND COALESCE(current_user_role, '') = 'driver' THEN
    IF OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id OR
       OLD.service_type IS DISTINCT FROM NEW.service_type OR
       OLD.title IS DISTINCT FROM NEW.title OR
       OLD.pickup_location IS DISTINCT FROM NEW.pickup_location OR
       OLD.dropoff_location IS DISTINCT FROM NEW.dropoff_location OR
       OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time OR
       OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
       OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
       OLD.reference IS DISTINCT FROM NEW.reference OR
       OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
      RAISE EXCEPTION 'Access Denied: Drivers can only update status, driver_status, and details.';
    END IF;
    RETURN NEW;
  END IF;

  -- Client/Rider checks
  IF auth.uid() = OLD.user_id THEN

    -- CARVE-OUT 1: client cancelling their own not-yet-finished request, with a
    -- reason. Changes status + driver_status (clearing it only) + cancellation
    -- fields — nothing else.
    IF NEW.status = 'cancelled' AND OLD.status NOT IN ('completed', 'cancelled') THEN
      IF OLD.driver_id IS DISTINCT FROM NEW.driver_id OR
         (OLD.driver_status IS DISTINCT FROM NEW.driver_status AND NEW.driver_status IS NOT NULL) OR
         OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id OR
         OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
         OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
         OLD.reference IS DISTINCT FROM NEW.reference OR
         OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
        RAISE EXCEPTION 'Access Denied: Cancelling cannot change any other field.';
      END IF;
      RETURN NEW;
    END IF;

    -- CARVE-OUT 2: client rating their own completed trip. Changes rating +
    -- rating_comment only.
    IF OLD.status = 'completed' AND
       OLD.driver_id IS NOT DISTINCT FROM NEW.driver_id AND
       OLD.driver_status IS NOT DISTINCT FROM NEW.driver_status AND
       OLD.status IS NOT DISTINCT FROM NEW.status AND
       OLD.assigned_staff_id IS NOT DISTINCT FROM NEW.assigned_staff_id AND
       OLD.payment_status IS NOT DISTINCT FROM NEW.payment_status AND
       OLD.admin_notes IS NOT DISTINCT FROM NEW.admin_notes AND
       OLD.reference IS NOT DISTINCT FROM NEW.reference AND
       OLD.receipt_url IS NOT DISTINCT FROM NEW.receipt_url THEN
      RETURN NEW;
    END IF;

    -- Otherwise, existing restriction: only pending requests can be touched at all.
    IF OLD.status != 'pending' THEN
      RAISE EXCEPTION 'Access Denied: Cannot modify a request once it is active or completed.';
    END IF;

    IF OLD.driver_id IS DISTINCT FROM NEW.driver_id OR
       OLD.driver_status IS DISTINCT FROM NEW.driver_status OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id OR
       OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
       OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
       OLD.reference IS DISTINCT FROM NEW.reference OR
       OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
      RAISE EXCEPTION 'Access Denied: Clients cannot modify status, payment, driver, or staff assignments.';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Access Denied: Unauthorized request update.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_request_fields ON public.requests;
CREATE TRIGGER trg_protect_request_fields
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_request_fields_trigger();
  
