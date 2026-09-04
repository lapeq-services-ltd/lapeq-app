-- ============================================================
-- LAPEQ Migration: Give the push-notification trigger enough time
--
-- Root cause found via net._http_response: every single call this
-- trigger has made to send-push-notification has failed with
-- "Timeout of 5000 ms reached" — never a real error, never a real
-- success, just a hard cutoff at 5 seconds every time. The edge
-- function hadn't been invoked in 18 days (per its own dashboard),
-- so cold start + querying push_subscriptions + round-tripping to
-- Expo's push API together consistently take longer than 5s.
--
-- This is why mobile push notifications (driver status, chauffeur
-- assigned, etc.) never arrived: the DB insert into `notifications`
-- always succeeded, the trigger always fired, but the HTTP call to
-- actually dispatch the push always got killed before finishing.
--
-- Bumping the timeout from 5s to 15s. Everything else in this
-- function is unchanged from 19_fix_push_trigger.sql.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_notification_inserted_trigger()
RETURNS TRIGGER AS $$
DECLARE
  project_url    TEXT := 'https://iwedpnipbuurohaqibag.supabase.co';
  webhook_secret TEXT;
  req_id         BIGINT;
BEGIN
  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
   WHERE name = 'internal_webhook_secret'
   LIMIT 1;

  IF webhook_secret IS NULL THEN
    RAISE WARNING 'send-push-notification: vault secret not found — skipping';
    RETURN NEW;
  END IF;

  BEGIN
    SELECT net.http_post(
      url     := project_url || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type',     'application/json',
        'x-webhook-secret', webhook_secret
      ),
      body    := jsonb_build_object(
        'record', jsonb_build_object(
          'id',        NEW.id,
          'user_id',   NEW.user_id,
          'title',     NEW.title,
          'body',      NEW.body,
          'type',      COALESCE(NEW.type, 'general'),
          'target_id', NEW.target_id
        )
      ),
      timeout_milliseconds := 15000
    ) INTO req_id;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      PERFORM extensions.http_post(
        url     := project_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type',     'application/json',
          'x-webhook-secret', webhook_secret
        ),
        body    := jsonb_build_object(
          'record', jsonb_build_object(
            'id',        NEW.id,
            'user_id',   NEW.user_id,
            'title',     NEW.title,
            'body',      NEW.body,
            'type',      COALESCE(NEW.type, 'general'),
            'target_id', NEW.target_id
          )
        ),
        timeout_ms := 15000
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Push trigger: could not call http_post: %', SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notification_inserted_trigger();
  
