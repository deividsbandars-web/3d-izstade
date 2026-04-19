-- Remote Expo lead-ops unblock
-- Purpose:
-- 1. restore `public.service_requests` if the remote project is missing it
-- 2. add `public.expo_lead_ops` for ops notes and follow-up persistence
-- 3. keep access conservative; backend service-role paths can still operate

CREATE TABLE IF NOT EXISTS public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    user_id UUID,
    service_name TEXT,
    client_name TEXT,
    client_email TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_requests_company_idx
    ON public.service_requests(company_id);

CREATE INDEX IF NOT EXISTS service_requests_service_name_idx
    ON public.service_requests(service_name);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service requests denied by default" ON public.service_requests;
CREATE POLICY "Service requests denied by default"
    ON public.service_requests
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.expo_lead_ops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    ops_notes TEXT,
    follow_up_at TIMESTAMPTZ,
    updated_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (service_request_id)
);

CREATE INDEX IF NOT EXISTS expo_lead_ops_service_request_idx
    ON public.expo_lead_ops(service_request_id);

ALTER TABLE public.expo_lead_ops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Expo lead ops denied by default" ON public.expo_lead_ops;
CREATE POLICY "Expo lead ops denied by default"
    ON public.expo_lead_ops
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Verification
SELECT to_regclass('public.service_requests') AS service_requests_table;
SELECT to_regclass('public.expo_lead_ops') AS expo_lead_ops_table;
