-- ========================================================
-- LAPEQ - Auto-Soft-Delete Expired Events (1 day after event date)
-- Run this in: Supabase Dashboard > SQL Editor
-- ========================================================

-- 1. Create a function to soft-delete events older than 1 day
create or replace function public.soft_delete_expired_events()
returns void as $$
begin
  update public.events
  set deleted_at = now()
  where date < now() - interval '1 day'
    and deleted_at is null;
end;
$$ language plpgsql security definer;

-- 2. Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- 3. Schedule the cron job to run daily at midnight
-- Note: we use do blocks to safely schedule/unschedule
do $$
begin
  perform cron.unschedule('soft-delete-expired-events-job');
exception
  when others then null;
end $$;

select cron.schedule(
  'soft-delete-expired-events-job',
  '0 0 * * *', -- Daily at midnight
  'select public.soft_delete_expired_events()'
);
