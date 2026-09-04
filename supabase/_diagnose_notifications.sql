-- Read-only. Part 1: are rows even being inserted recently?
-- Part 2: what do the live RLS policies on notifications actually say?
-- Run in: Supabase Dashboard > SQL Editor

SELECT id, user_id, title, type, created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 10;

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'notifications';
