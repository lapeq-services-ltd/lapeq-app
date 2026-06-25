-- ============================================================
-- LAPEQ Migration 10: Trigger Push Notifications on Insert
-- Run this in: Supabase Dashboard > SQL Editor
-- This automatically calls the send-push-notification edge function
-- when a new record is inserted into the notifications table.
-- ============================================================

-- 1. Enable the pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_notification_inserted_trigger()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT := 'https://iwedpnipbuurohaqibag.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';
BEGIN
  -- Call the Supabase Edge Function using extensions.pg_net
  PERFORM extensions.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'type', COALESCE(NEW.type, 'general'),
        'target_id', NEW.target_id
      )
    ),
    timeout_ms := 5000
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notification_inserted_trigger();
