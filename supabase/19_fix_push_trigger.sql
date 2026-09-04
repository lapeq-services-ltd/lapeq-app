-- Fix push notification trigger for pg_net compatibility
-- Run in Supabase SQL Editor if push notifications are not firing

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

  -- Use net.http_post (pg_net v0.7+). If this fails try extensions.http_post below.
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
      timeout_milliseconds := 5000
    ) INTO req_id;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: try extensions schema (older pg_net)
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
        timeout_ms := 5000
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
