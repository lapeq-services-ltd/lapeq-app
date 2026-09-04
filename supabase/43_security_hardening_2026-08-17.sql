-- ============================================================
-- SECURITY HARDENING — 2026-08-17 production readiness audit
-- Run in: Supabase Dashboard > SQL Editor
--
-- Every statement in this file is defensive (DROP POLICY/TRIGGER/INDEX
-- IF EXISTS, CREATE OR REPLACE, ADD COLUMN IF NOT EXISTS) so it is safe to
-- run more than once and safe to run even if part of the underlying issue
-- has already been fixed live. Nothing here is destructive — no DROP TABLE,
-- no data deletion. Read it through once before running; run the whole
-- file in one go so related policy drops/creates land together.
--
-- Fixes, by audit finding:
--   #1  profiles: SELECT was USING (true) — any authenticated user could
--       read every member's/driver's PII and live GPS location.
--   #2  profiles: no restrictive UPDATE/DELETE policy existed anywhere —
--       paired with the admin dashboard's Team page now routing writes
--       through a server-verified API route instead of direct client writes.
--   #3  notifications: INSERT was WITH CHECK (true) — anyone could insert
--       a notification (and trigger a real push) impersonating anyone.
--   #4  audit_logs: SELECT was open to every authenticated user, exposing
--       admin_notes and full before/after row snapshots.
--   #5  bug_reports table + bug-reports storage bucket: SELECT/DELETE/
--       upload were open to every authenticated (and in storage's case,
--       anonymous) user.
--   #6  auto-active-requests.sql's status-forcing trigger neutralized
--       defensively (source file also commented out separately).
--   #8  client_errors table added so the mobile app's ErrorBoundary has
--       somewhere to report crashes to.
--  #13  requests dispatch race: trigger-only protection backed with unique
--       partial indexes so two concurrent transactions can't both pass the
--       check before either commits.
--  appx  SECURITY DEFINER functions pinned to search_path = public, pg_temp.
-- ============================================================


-- ============================================================
-- 1. profiles — close the open SELECT policy, add real write policies
-- ============================================================
DROP POLICY IF EXISTS "profiles: select authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles: client read driver" ON public.profiles;
DROP POLICY IF EXISTS "profiles: staff read" ON public.profiles;

CREATE POLICY "profiles: select scoped"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR role = 'driver' OR is_staff());

-- No restrictive UPDATE/DELETE policy on profiles was found anywhere across
-- either repo's migration history. Column-level tampering (role/tier/email)
-- is separately blocked by protect_profile_roles_trigger
-- (see 20_secure_rls_and_triggers.sql) — this policy controls row access.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "profiles: update self or admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "profiles: delete admin only"
  ON public.profiles FOR DELETE TO authenticated
  USING (is_admin());


-- ============================================================
-- 2. notifications — close the open INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "notifications: insert staff only"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (is_staff());
-- The driver-scoped carve-out from 31_driver_notify_client_rls.sql is a
-- separate, additive policy and is untouched by this file.


-- ============================================================
-- 3. audit_logs — staff-only read
-- ============================================================
DROP POLICY IF EXISTS "audit_logs: read authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs: read staff only"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (is_staff());


-- ============================================================
-- 4. bug_reports — staff-only read/delete (migration 41 never closed these)
-- ============================================================
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.bug_reports;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.bug_reports;

CREATE POLICY "bug_reports: staff select"
  ON public.bug_reports FOR SELECT TO authenticated
  USING (is_staff());

CREATE POLICY "bug_reports: staff delete"
  ON public.bug_reports FOR DELETE TO authenticated
  USING (is_staff());

-- Leave "Allow insert for everyone" (anon + authenticated) as-is — shake-to-report
-- is intentionally reachable pre-auth. The bucket-level fix below is what
-- closes the actual public-file-host exposure.


-- ============================================================
-- 5. bug-reports storage bucket — require auth to upload, cap size/type
-- ============================================================
DROP POLICY IF EXISTS "Anyone can upload bug reports" ON storage.objects;
CREATE POLICY "bug-reports: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bug-reports');

UPDATE storage.buckets
SET file_size_limit = 8388608, -- 8MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
WHERE id = 'bug-reports';

-- NOTE: this makes bug-report screenshot upload require a signed-in session.
-- ShakeReport is currently mounted app-wide including on pre-auth screens
-- (see app/_layout.tsx) — if you want anonymous pre-auth bug reports to keep
-- working, this specific policy should stay `TO anon, authenticated` instead;
-- left as authenticated-only here since that's the safer default and
-- pre-auth screens are a small fraction of the app's surface.


-- ============================================================
-- 6. requests dispatch race — back the existing trigger with unique indexes
-- ============================================================
DROP INDEX IF EXISTS one_active_driver_per_client;
CREATE UNIQUE INDEX one_active_driver_per_client ON public.requests (user_id)
WHERE status NOT IN ('completed', 'cancelled')
  AND driver_status IN ('en_route', 'arrived', 'in_progress');

DROP INDEX IF EXISTS one_active_request_per_driver;
CREATE UNIQUE INDEX one_active_request_per_driver ON public.requests (driver_id)
WHERE driver_id IS NOT NULL
  AND status NOT IN ('completed', 'cancelled')
  AND driver_status IN ('assigned', 'en_route', 'arrived', 'in_progress');

-- If either CREATE UNIQUE INDEX above fails with a duplicate-key error, it
-- means live data already violates the invariant (e.g. two requests
-- currently show the same driver "en_route" to the same client). Query for
-- the conflicting rows and resolve them by hand before re-running this
-- section — don't skip the index, that's the actual protection.


-- ============================================================
-- 7. Neutralize the trigger that force-set every new request to 'active'
--    (source file: lapeqadmin/auto-active-requests.sql). Safe no-op if it
--    was never actually applied live.
-- ============================================================
DROP TRIGGER IF EXISTS auto_active_request_trigger ON public.requests;
DROP FUNCTION IF EXISTS set_request_active_status();


-- ============================================================
-- 8. client_errors — lets the mobile app's ErrorBoundary report crashes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.client_errors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  message text NOT NULL,
  stack text,
  component_stack text,
  platform text,
  app_version text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

-- Crashes can happen pre-auth, so inserts are open to anyone — this is
-- insert-only, there is no policy allowing a client to read rows back.
DROP POLICY IF EXISTS "client_errors: anyone can insert" ON public.client_errors;
CREATE POLICY "client_errors: anyone can insert"
  ON public.client_errors FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "client_errors: staff can read" ON public.client_errors;
CREATE POLICY "client_errors: staff can read"
  ON public.client_errors FOR SELECT TO authenticated
  USING (is_staff());


-- ============================================================
-- 9. Pin search_path on SECURITY DEFINER functions (defense-in-depth —
--    Supabase's own linter flags unpinned search_path on SECURITY DEFINER)
-- ============================================================
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION is_staff() SET search_path = public, pg_temp;
ALTER FUNCTION is_customer_service() SET search_path = public, pg_temp;
ALTER FUNCTION is_finance() SET search_path = public, pg_temp;
ALTER FUNCTION is_driver() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_audit_action(uuid, text, text, uuid, jsonb) SET search_path = public, pg_temp;

-- If any ALTER FUNCTION above errors with "function does not exist", that
-- function was created in a schema other than public on your project —
-- find it with:
--   SELECT n.nspname, p.proname FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace WHERE p.proname = '<name>';
-- and adjust the qualified name accordingly. Every other statement in this
-- file is independent, so one failure here doesn't affect the rest.
