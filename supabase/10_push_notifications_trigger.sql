-- ============================================================
-- LAPEQ Migration 10: Trigger Push Notifications on Insert
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Trigger function — reads the anon key from Vault at runtime.
--    No credentials live in this file or in version control.
CREATE OR REPLACE FUNCTION public.handle_notification_inserted_trigger()
RETURNS TRIGGER AS $$
DECLARE
  project_url    TEXT := 'https://iwedpnipbuurohaqibag.supabase.co';
  webhook_secret TEXT;
BEGIN
  -- Fetch the shared webhook secret from Vault.
  -- One-time setup — run once in SQL Editor:
  --   SELECT vault.create_secret('<your_secret>', 'internal_webhook_secret');
  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
   WHERE name = 'internal_webhook_secret'
   LIMIT 1;

  IF webhook_secret IS NULL THEN
    RAISE WARNING 'send-push-notification: vault secret internal_webhook_secret not found — skipping';
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    url     := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type',    'application/json',
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notification_inserted_trigger();
