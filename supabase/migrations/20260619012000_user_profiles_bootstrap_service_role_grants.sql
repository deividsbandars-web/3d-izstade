-- Minimal staging-safe grants for the protected auth/profile bootstrap path.
-- The backend bootstrap controller uses the Supabase service-role client to
-- read, create, and repair the authenticated user's profile/company records.
-- Keep this narrow to the backend service role only.

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO service_role;
GRANT INSERT ON TABLE public.companies TO service_role;
