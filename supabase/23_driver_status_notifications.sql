-- ============================================================
-- LAPEQ Migration: Notify the client when their chauffeur's driver_status changes
-- (assigned/en_route/arrived/in_progress/completed) — previously only the request's
-- overall `status` column triggered a notification, so a client got no in-app
-- notification, badge, or push when their chauffeur actually started moving,
-- arrived, or began the trip.
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_driver_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  notif_title TEXT;
  notif_body TEXT;
BEGIN
  IF OLD.driver_status IS DISTINCT FROM NEW.driver_status THEN
    notif_title := CASE NEW.driver_status
      WHEN 'en_route'    THEN 'Your Chauffeur Is On The Way'
      WHEN 'arrived'     THEN 'Your Chauffeur Has Arrived'
      WHEN 'in_progress' THEN 'Your Trip Has Started'
      ELSE NULL
    END;

    IF notif_title IS NOT NULL THEN
      notif_body := CASE NEW.driver_status
        WHEN 'en_route'    THEN 'Your chauffeur is heading to your pickup location.'
        WHEN 'arrived'     THEN 'Your chauffeur is waiting outside.'
        WHEN 'in_progress' THEN 'You are on your way to your destination.'
        ELSE ''
      END;

      INSERT INTO public.notifications (
        user_id, title, body, type, target_id, request_id, read
      )
      VALUES (
        NEW.user_id, notif_title, notif_body, 'request', NEW.id, NEW.id, false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_driver_status_updated ON public.requests;
CREATE TRIGGER on_driver_status_updated
  AFTER UPDATE OF driver_status ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_driver_status_notification();
