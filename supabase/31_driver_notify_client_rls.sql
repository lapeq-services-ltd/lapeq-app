-- ============================================================
-- LAPEQ Migration: Let a driver notify their assigned trip's client
--
-- Root cause found: the `notifications` table's INSERT policy only
-- allows admins:
--
--   create policy "Admins can insert notifications"
--     on public.notifications for insert
--     with check (public.is_admin());
--
-- But driver/page.tsx's updateDriverStatus() inserts a notification row
-- for the CLIENT every time the driver taps En Route / Arrived / In
-- Progress / Completed — from the DRIVER's own (non-admin) session. RLS
-- was silently rejecting every one of those inserts, so the row never
-- existed, so the AFTER INSERT push trigger (19_fix_push_trigger.sql)
-- never fired. This is why the client only ever saw status changes while
-- physically on the coordination screen (via its local realtime listener)
-- and never got a real push for "driver en route" / "driver arrived".
--
-- This adds a second INSERT policy scoped narrowly: a driver may only
-- insert a notification whose target_id points at a request they are
-- actually assigned to, and whose user_id matches that request's client
-- — they can't notify anyone else.
-- Run this whole file in: Supabase Dashboard > SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "Drivers can notify their assigned trip's client" ON public.notifications;
CREATE POLICY "Drivers can notify their assigned trip's client"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = notifications.target_id
        AND requests.driver_id = auth.uid()
        AND requests.user_id = notifications.user_id
    )
  );
