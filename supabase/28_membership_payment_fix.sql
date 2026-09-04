-- ============================================================
-- LAPEQ Migration: Fix membership tier upgrade — two silent bugs found
-- while investigating whether real payment actually works.
--
-- Bug 1: protect_profile_roles_trigger() silently reverts any change to
-- `tier` back to its old value unless the CALLER's own role is 'admin'.
-- The app updates a paying member's own tier using their own session
-- (role = 'member'), so this trigger has been quietly undoing every real
-- member's tier upgrade after payment — no error, the app just believed it
-- worked. It only ever appeared to work when an admin account tested it,
-- since admins are exempt from their own restriction.
--
-- Bug 2: notify_tier_upgrade() only matches capitalized tier values
-- ('Silver','Gold','Black'), but the app only ever writes lowercase
-- ('silver','gold','black'). SQL string comparison is case-sensitive, so
-- this trigger has never actually fired for a real app-driven upgrade —
-- only for manual Table Editor tests where a capitalized value was typed
-- in by hand. That's also why the app inserts its own duplicate "welcome"
-- notification client-side — a workaround for this trigger silently never
-- firing for real users.
--
-- This does NOT by itself make membership payment secure — see
-- supabase/functions/verify-membership-payment for the server-side
-- verification that should replace the client directly setting its own
-- tier. This migration just fixes the trigger layer so that a legitimate
-- server-side (service-role) tier update can actually take effect and
-- correctly notify the member.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Fix 1: allow service-role/system context (auth.uid() IS NULL) through,
-- same reasoning as the requests-table fix in 27_fix_service_role_update_block.sql.
CREATE OR REPLACE FUNCTION public.protect_profile_roles_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  IF COALESCE(current_user_role, '') != 'admin' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      NEW.role := OLD.role;
    END IF;
    IF OLD.tier IS DISTINCT FROM NEW.tier THEN
      NEW.tier := OLD.tier;
    END IF;
    IF OLD.member_code IS DISTINCT FROM NEW.member_code THEN
      NEW.member_code := OLD.member_code;
    END IF;
    IF OLD.email IS DISTINCT FROM NEW.email AND NEW.email IS DISTINCT FROM (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
      NEW.email := OLD.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_roles ON public.profiles;
CREATE TRIGGER trg_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_roles_trigger();

-- Fix 2: match tier values case-insensitively, so this fires for the app's
-- real (lowercase) values, not just manually-typed capitalized test values.
CREATE OR REPLACE FUNCTION notify_tier_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    tier_name TEXT;
BEGIN
    IF OLD.tier IS DISTINCT FROM NEW.tier AND UPPER(NEW.tier) IN ('SILVER', 'GOLD', 'BLACK') THEN
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
