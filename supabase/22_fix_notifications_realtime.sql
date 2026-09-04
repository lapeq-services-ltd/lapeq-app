-- 1. Enable realtime on notifications (badge updates) and profiles (tier popup)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 2. Re-apply the fixed tier upgrade trigger (only fires for actual paid upgrades)
CREATE OR REPLACE FUNCTION notify_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    tier_name TEXT;
BEGIN
    -- Only fire for genuine upgrades to a paid tier — never for Standard/free/downgrades
    IF OLD.tier IS DISTINCT FROM NEW.tier AND NEW.tier IN ('Silver', 'Gold', 'Black') THEN
        tier_name := initcap(NEW.tier);

        INSERT INTO notifications (user_id, title, body, type, read)
        VALUES (
            NEW.id,
            'Welcome to Lapeq ' || tier_name,
            'Your ' || tier_name || ' membership is now active. Your concierge is ready — make your first request anytime.',
            'welcome',
            false
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_tier_upgrade ON profiles;

CREATE TRIGGER on_tier_upgrade
AFTER UPDATE OF tier ON profiles
FOR EACH ROW
EXECUTE FUNCTION notify_tier_upgrade();
