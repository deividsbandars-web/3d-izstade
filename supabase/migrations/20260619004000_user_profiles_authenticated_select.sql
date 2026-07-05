-- Allow authenticated Supabase users to read their own profile-linked data.
-- This keeps the existing company/profile bootstrap flow from failing during
-- authenticated scene and dashboard reads that resolve ownership through
-- public.user_profiles.

GRANT SELECT ON TABLE public.user_profiles TO authenticated;
