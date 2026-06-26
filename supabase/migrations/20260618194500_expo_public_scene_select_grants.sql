-- Grant read access for the public Expo scene contract.
-- This keeps /api/expo/scene public-readonly without touching private review-media storage.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.sectors TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.companies TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.booths TO anon, authenticated, service_role;
