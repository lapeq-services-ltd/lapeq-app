-- ============================================================
-- LAPEQ Migration 45: Drop the broken welcome-email webhook trigger
-- Run this in: Supabase Dashboard > SQL Editor
--
-- notify_welcome_email() references a `webhook_secret` variable that is
-- never declared or fetched, and the whole thing runs unwrapped (no
-- exception handling) inside the same transaction as the auth.users
-- insert. Every new signup has been failing with "Database error saving
-- new user" because of it (Postgres: column "webhook_secret" does not
-- exist, 42703).
--
-- It calls https://lapeq.net/api/auth/welcome, which does not exist
-- anywhere in the lapeqadmin codebase, and duplicates the in-app
-- "Welcome to Lapeq" notification that register.tsx already inserts
-- directly after a successful signup. Safe to remove outright.
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
DROP FUNCTION IF EXISTS public.notify_welcome_email();
