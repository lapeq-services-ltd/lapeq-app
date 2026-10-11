-- ============================================================
-- LAPEQ Migration: Robust Auto-Cancel for Expired Itineraries & Experiences
--
-- Fixes:
-- 1. Covers both 'experience' packages and 'lifestyle-travel' Curated Itineraries.
-- 2. Evaluates non-completed statuses ('pending', 'arranged', 'active', 'in-progress').
-- 3. Safely parses ISO dates ('YYYY-MM-DD') and UK text dates ('DD Mon YYYY')
--    without crashing on unexpected formats.
-- 4. Checks the final travel date (end_date / dateTo) or start date (start_date / dateFrom).
-- 5. Auto-cancels past requests and notifies both client and admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.safe_parse_date(d_str text)
RETURNS date AS $$
BEGIN
  IF d_str IS NULL OR trim(d_str) = '' THEN
    RETURN NULL;
  END IF;
  
  d_str := trim(d_str);
  
  -- ISO format: 2026-09-22 or 2026-09-22T...
  IF d_str ~ '^\d{4}-\d{2}-\d{2}' THEN
    RETURN substring(d_str from 1 for 10)::date;
  END IF;
  
  -- "20 Aug 2026" or "02 Aug 2026" or "2 Aug 2026"
  IF d_str ~ '^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}' THEN
    RETURN to_date(substring(d_str from '^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}'), 'DD Mon YYYY');
  END IF;

  -- "20/08/2026"
  IF d_str ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
    RETURN to_date(substring(d_str from '^\d{1,2}/\d{1,2}/\d{4}'), 'DD/MM/YYYY');
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.auto_cancel_expired_itineraries()
RETURNS void AS $$
DECLARE
  req RECORD;
  date_label text;
BEGIN
  FOR req IN
    SELECT 
      r.id, 
      r.user_id, 
      r.reference, 
      r.title,
      r.service_type,
      r.status,
      r.details,
      COALESCE(
        public.safe_parse_date(r.details->>'end_date'),
        public.safe_parse_date(r.details->>'dateTo'),
        public.safe_parse_date(r.details->>'start_date'),
        public.safe_parse_date(r.details->>'dateFrom'),
        public.safe_parse_date(r.details->>'date')
      ) AS resolved_date,
      COALESCE(
        r.details->>'end_date',
        r.details->>'dateTo',
        r.details->>'start_date',
        r.details->>'dateFrom',
        r.details->>'date'
      ) AS raw_date_str
    FROM public.requests r
    WHERE (
      r.service_type IN ('lifestyle-travel', 'experience')
      OR r.details->>'serviceType' ILIKE '%itinerary%'
      OR r.title ILIKE '%itinerary%'
      OR r.title ILIKE '%experience%'
    )
    AND r.status NOT IN ('completed', 'cancelled')
  LOOP
    IF req.resolved_date IS NOT NULL AND req.resolved_date < current_date THEN
      date_label := COALESCE(req.raw_date_str, req.resolved_date::text);

      UPDATE public.requests
      SET status = 'cancelled',
          admin_notes = COALESCE(admin_notes || E'\n', '') || 'Auto-cancelled: itinerary/travel date (' || date_label || ') has passed without completion.'
      WHERE id = req.id;

      INSERT INTO public.notifications (user_id, title, body, type, target_id, request_id, read)
      VALUES (
        req.user_id,
        'Itinerary Request Cancelled',
        'Your itinerary request for ' || date_label || ' has passed and has been cancelled. Please submit a new request with updated dates whenever you''re ready.',
        'itinerary_cancelled', req.id, req.id, false
      );

      INSERT INTO public.notifications (user_id, title, body, type, target_id, read)
      SELECT p.id,
             'Itinerary Auto-Cancelled — Travel Date Passed',
             'Request ' || COALESCE(req.reference, req.id::text) || ' (' || COALESCE(req.title, req.service_type) || ' - ' || date_label || ') was auto-cancelled because the travel date passed.',
             'status_alert', req.id, false
      FROM public.profiles p
      WHERE p.role IN ('admin', 'customer_service');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
