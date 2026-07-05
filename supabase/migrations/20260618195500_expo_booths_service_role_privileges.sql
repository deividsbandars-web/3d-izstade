-- Staging data-plane fix for controlled sponsor media review mutation.
-- The backend service-role client needs to read and update public.expo_booths
-- so managed booth lookup and media-review metadata updates can run against
-- the approved disposable staging fixture.

GRANT SELECT, UPDATE ON TABLE public.expo_booths TO service_role;
