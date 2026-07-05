-- Staging-safe privilege fix for Modular Home quote submit/admin follow-through.
-- The backend service-role client needs table privileges on the existing
-- quote request table so public submission, admin review, and smoke cleanup
-- can operate without broadening anon/auth access.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.modular_home_quote_requests TO service_role;
