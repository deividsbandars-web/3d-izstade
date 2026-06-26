-- Staging managed-booth fixture provisioning support.
-- Adds the missing managed-booth company linkage and allows the backend
-- service-role client to create disposable staging fixtures when explicitly
-- requested by an operator-confirmed provisioning script.

ALTER TABLE public.expo_booths
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

GRANT INSERT ON TABLE public.expo_booths TO service_role;
