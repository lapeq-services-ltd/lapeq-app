-- ============================================================
-- LAPEQ Migration 38: Realtime broadcast authorization for driver location
--
-- driver-location:<driverId> broadcasts were public — any client holding
-- the project's anon key (shipped inside the app, trivially extractable)
-- could subscribe to any driver's live GPS by UUID, with no check that
-- they were an actual assigned rider on an active trip with that driver.
-- Realtime Authorization (RLS on realtime.messages) locks both sending and
-- receiving down. The client channel() calls also need { private: true }
-- to be subject to these policies at all — see coordination.tsx and
-- lapeqadmin's driver/page.tsx.
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Only the driver themselves can broadcast (send) to their own location topic.
DROP POLICY IF EXISTS "driver can broadcast own location" ON realtime.messages;
CREATE POLICY "driver can broadcast own location"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'driver-location:%'
  AND auth.uid()::text = split_part(realtime.topic(), ':', 2)
);

-- Only the driver themselves, an assigned rider on an active (not
-- completed/cancelled) trip with that driver, or staff can receive it.
DROP POLICY IF EXISTS "authorized parties can receive driver location" ON realtime.messages;
CREATE POLICY "authorized parties can receive driver location"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'driver-location:%'
  AND (
    auth.uid()::text = split_part(realtime.topic(), ':', 2)
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.driver_id::text = split_part(realtime.topic(), ':', 2)
        AND r.user_id = auth.uid()
        AND r.status NOT IN ('completed', 'cancelled')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager', 'customer_service', 'concierge')
    )
  )
);
