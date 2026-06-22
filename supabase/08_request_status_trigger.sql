-- ============================================================
-- LAPEQ Migration: Notify users of request status changes
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_request_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  service_label TEXT;
  notif_title TEXT;
  notif_body TEXT;
BEGIN
  -- Check if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Resolve a human-friendly name for the service
    service_label := CASE NEW.service_type
      WHEN 'driving-service' THEN 'Chauffeur Service'
      WHEN 'logistics' THEN 'Logistics'
      WHEN 'lifestyle-travel' THEN 'Hospitality & Travel'
      WHEN 'corporate-pairing' THEN 'Corporate Pairing'
      WHEN 'project-trust' THEN 'Project Trust'
      ELSE 'Concierge Request'
    END;

    -- Formulate the notification content
    notif_title := 'Request Update';
    notif_body := 'Your request for ' || service_label || 
                  CASE 
                    WHEN NEW.reference IS NOT NULL THEN ' (' || NEW.reference || ')'
                    ELSE ''
                  END || 
                  ' has been updated to ' || LOWER(NEW.status) || '.';

    -- Insert a new row into the notifications table
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      type,
      target_id,
      request_id,
      read
    )
    VALUES (
      NEW.user_id,
      notif_title,
      notif_body,
      'request',
      NEW.id,
      NEW.id,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger specifically on update of the status column to save DB resources
DROP TRIGGER IF EXISTS on_request_status_updated ON public.requests;
CREATE TRIGGER on_request_status_updated
  AFTER UPDATE OF status ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_request_status_notification();
