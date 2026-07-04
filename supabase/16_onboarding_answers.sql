-- Add onboarding answers to profiles
alter table public.profiles add column if not exists onboarding_answers jsonb;
notify pgrst, 'reload schema';
