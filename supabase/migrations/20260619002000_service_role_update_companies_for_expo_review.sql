-- Staging-only minimal grant for controlled sponsor media review promotion.
-- Service-role promotion needs to update public.companies.logo_url after an approved
-- review upload is explicitly promoted. Keep this narrow to the backend service role.

GRANT UPDATE ON TABLE public.companies TO service_role;
