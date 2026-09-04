-- ============================================================
-- LAPEQ Migration 20: Secure Profile Roles & Request Updates
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Ensure public.messages has all required columns and constraints
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.requests(id) ON DELETE CASCADE;

-- Drop old sender_type check constraint and update to allow 'driver'
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_type_check CHECK (sender_type IN ('client', 'admin', 'driver'));


-- 2. Trigger to automatically extract and sync request_id from message type
CREATE OR REPLACE FUNCTION public.sync_message_request_id()
RETURNS TRIGGER AS $$
DECLARE
  trip_uuid_text TEXT;
BEGIN
  IF NEW.type LIKE 'driver_chat:%' THEN
    trip_uuid_text := substring(NEW.type from 'driver_chat:([a-fA-F0-9-]{36})');
    IF trip_uuid_text IS NOT NULL THEN
      NEW.request_id := trip_uuid_text::uuid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_message_request_id ON public.messages;
CREATE TRIGGER trg_sync_message_request_id
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_message_request_id();


-- 3. Row Level Security Policies for messages (Allow drivers to access client chats)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: driver select" ON public.messages;
CREATE POLICY "messages: driver select" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = messages.request_id
      AND requests.driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages: driver insert" ON public.messages;
CREATE POLICY "messages: driver insert" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = (
        CASE 
          WHEN type LIKE 'driver_chat:%' THEN (substring(type from 'driver_chat:([a-fA-F0-9-]{36})'))::uuid
          ELSE NULL
        END
      )
      AND requests.driver_id = auth.uid()
    )
  );


-- 4. Trigger to protect sensitive columns in the profiles table (Prevent role escalation)
CREATE OR REPLACE FUNCTION public.protect_profile_roles_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Fetch the role of the user attempting the update
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  -- If the user is NOT an admin, prevent them from changing role, tier, or member_code
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
    -- Restrict email updates to only match their actual Auth account email
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


-- 5. Trigger to restrict client and driver request updates (Guarded fields)
CREATE OR REPLACE FUNCTION public.protect_request_fields_trigger()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Fetch the role of the updating user
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();

  -- Admins, managers, customer service, and concierge staff bypass all restrictions
  IF COALESCE(current_user_role, '') IN ('admin', 'manager', 'customer_service', 'concierge') THEN
    RETURN NEW;
  END IF;

  -- Driver checks
  IF auth.uid() = OLD.driver_id AND COALESCE(current_user_role, '') = 'driver' THEN
    -- A driver is ONLY allowed to update driver_status, status, and details (for logging transcripts)
    IF OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id OR
       OLD.service_type IS DISTINCT FROM NEW.service_type OR
       OLD.title IS DISTINCT FROM NEW.title OR
       OLD.pickup_location IS DISTINCT FROM NEW.pickup_location OR
       OLD.dropoff_location IS DISTINCT FROM NEW.dropoff_location OR
       OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time OR
       OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
       OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
       OLD.reference IS DISTINCT FROM NEW.reference OR
       OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
      RAISE EXCEPTION 'Access Denied: Drivers can only update status, driver_status, and details.';
    END IF;
    RETURN NEW;
  END IF;

  -- Client/Rider checks
  IF auth.uid() = OLD.user_id THEN
    -- Clients cannot update requests once they are no longer pending
    IF OLD.status != 'pending' THEN
      RAISE EXCEPTION 'Access Denied: Cannot modify a request once it is active or completed.';
    END IF;

    -- Clients cannot modify assignment, status, pricing, internal notes, or driver fields
    IF OLD.driver_id IS DISTINCT FROM NEW.driver_id OR
       OLD.driver_status IS DISTINCT FROM NEW.driver_status OR
       OLD.status IS DISTINCT FROM NEW.status OR
       OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id OR
       OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
       OLD.admin_notes IS DISTINCT FROM NEW.admin_notes OR
       OLD.reference IS DISTINCT FROM NEW.reference OR
       OLD.receipt_url IS DISTINCT FROM NEW.receipt_url THEN
      RAISE EXCEPTION 'Access Denied: Clients cannot modify status, payment, driver, or staff assignments.';
    END IF;
    RETURN NEW;
  END IF;

  -- If we reach this point, the user is unauthorized to update this request
  RAISE EXCEPTION 'Access Denied: Unauthorized request update.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_request_fields ON public.requests;
CREATE TRIGGER trg_protect_request_fields
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_request_fields_trigger();


-- 6. Trigger to record server-side timestamps for chauffeur phases (Secure billing & metrics timestamps)
CREATE OR REPLACE FUNCTION public.record_driver_arrival_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if driver_status transitioned to 'arrived'
  IF (OLD.driver_status IS DISTINCT FROM NEW.driver_status OR OLD.driver_status IS NULL) AND NEW.driver_status = 'arrived' THEN
    -- Inject arrived_at timestamp into requests.details JSONB column
    NEW.details := jsonb_set(
      COALESCE(NEW.details, '{}'::jsonb),
      '{arrived_at}',
      to_jsonb(now()::text)
    );
  END IF;

  -- Check if driver_status transitioned to 'in_progress'
  IF (OLD.driver_status IS DISTINCT FROM NEW.driver_status OR OLD.driver_status IS NULL) AND NEW.driver_status = 'in_progress' THEN
    -- Inject started_at timestamp into requests.details JSONB column
    NEW.details := jsonb_set(
      COALESCE(NEW.details, '{}'::jsonb),
      '{started_at}',
      to_jsonb(now()::text)
    );
  END IF;

  -- Check if driver_status transitioned to 'completed'
  IF (OLD.driver_status IS DISTINCT FROM NEW.driver_status OR OLD.driver_status IS NULL) AND NEW.driver_status = 'completed' THEN
    -- Inject completed_at timestamp into requests.details JSONB column
    NEW.details := jsonb_set(
      COALESCE(NEW.details, '{}'::jsonb),
      '{completed_at}',
      to_jsonb(now()::text)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_record_driver_arrival ON public.requests;
CREATE TRIGGER trg_record_driver_arrival
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.record_driver_arrival_timestamp();
