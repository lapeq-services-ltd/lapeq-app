-- ============================================================
-- LAPEQ Migration: Prevent two drivers being dispatched to the same
-- client at the same time
--
-- Client can now have multiple queued/scheduled chauffeur requests
-- (they show under Upcoming) — that part is fine. What must never
-- happen is two different drivers both being en route / arrived /
-- in_progress for the SAME client at once — she can only be in one
-- place at a time.
--
-- This is enforced at the DB level (not just in the driver portal's
-- UI) because it's a hard business rule that must hold no matter which
-- driver session, admin override, or future client presses the button.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_concurrent_dispatch_trigger()
RETURNS TRIGGER AS $$
DECLARE
  conflict_id UUID;
BEGIN
  -- Only relevant when a request is newly entering an "actively being driven" state.
  IF NEW.driver_status IN ('en_route', 'arrived', 'in_progress')
     AND OLD.driver_status IS DISTINCT FROM NEW.driver_status THEN

    SELECT id INTO conflict_id
    FROM public.requests
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND status NOT IN ('completed', 'cancelled')
      AND driver_status IN ('en_route', 'arrived', 'in_progress')
    LIMIT 1;

    IF conflict_id IS NOT NULL THEN
      RAISE EXCEPTION 'This client already has another chauffeur en route or with them right now. Please wait until that trip is done before starting this one.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_concurrent_dispatch ON public.requests;
CREATE TRIGGER trg_prevent_concurrent_dispatch
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_concurrent_dispatch_trigger();

-- One-time cleanup: any already-cancelled/completed request from before the
-- driver_status-clearing fixes existed can still be left with a stale
-- 'en_route'/'arrived'/'in_progress' driver_status. That's dead data that
-- would otherwise falsely block a genuinely new dispatch (as seen with
-- LPQ-T3J59 and LPQ-IFSYC). Run this once to clear it out.
UPDATE public.requests
SET driver_status = NULL
WHERE status IN ('completed', 'cancelled')
  AND driver_status IS NOT NULL;
