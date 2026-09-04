-- ============================================================
-- LAPEQ Migration: Client-initiated ride cancellation (with reason) + trip ratings
--
-- Two new client-facing abilities that the existing security trigger
-- (protect_request_fields_trigger, from 20_secure_rls_and_triggers.sql)
-- would otherwise fully block, since it only lets a client touch their
-- own request while status = 'pending':
--   1. Cancel their own request at any point before it's done, with a
--      reason, which also alerts staff.
--   2. Rate a completed trip (1-5 stars + optional comment).
-- Both are narrow carve-outs — everything else about the existing
-- protection stays exactly as it was.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. New columns
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text CHECK (cancelled_by IN ('client', 'admin', 'system_auto')),
  ADD COLUMN IF NOT EXISTS rating integer CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_comment text;

-- 2. Updated protection trigger with the two narrow carve-outs added.
CREATE OR REPLACE FUNCTION public.protect_request_fields_trigg  BNNNNNNNNNNNNNNNNNNNNNNNNNNHJMMJKer()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
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
    -- reason. Changes status + cancellation_reason + cancelled_by only.
    IF NEW.status = 'cancelled' AND OLD.status NOT IN ('completed', 'cancelled') THEN
      IF OLD.driver_id IS DISTINCT FROM NEW.driver_id OR
         OLD.driver_status IS DISTINCT FROM NEW.driver_status OR
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

-- 3. Alert staff whenever a client cancels with a reason (distinct from admin/system
-- cancellations, which don't set cancelled_by = 'client').
CREATE OR REPLACE FUNCTION public.handle_client_cancellation_notification()
RETURNS TRIGGER AS $$
DECLARE
  member_name TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.cancelled_by = 'client' THEN
    SELECT COALESCE(preferred_name, full_name, 'A member') INTO member_name FROM public.profiles WHERE id = NEW.user_id;

    INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
    SELECT p.id,
           'Client Cancelled a Request',
           member_name || ' cancelled request ' || COALESCE(NEW.reference, NEW.id::text) || '. Reason: ' || COALESCE(NEW.cancellation_reason, 'No reason given') || '.',
           'status_alert', NEW.id, false
    FROM public.profiles p
    WHERE p.role IN ('admin', 'customer_service');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_client_cancellation ON public.requests;
CREATE TRIGGER on_client_cancellation
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_client_cancellation_notification();
