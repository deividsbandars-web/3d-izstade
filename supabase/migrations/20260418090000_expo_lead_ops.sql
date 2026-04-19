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
