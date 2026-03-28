CREATE TABLE IF NOT EXISTS public.expo_release_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL CHECK (event_name IN (
        'scene_loaded',
        'sector_entered',
        'booth_viewed',
        'booth_clicked',
        'website_opened',
        'booking_clicked',
        'demo_room_entered'
    )),
    session_id TEXT,
    booth_id TEXT,
    booth_template TEXT,
    company_id TEXT,
    company_slug TEXT,
    sector_id TEXT,
    sector_name TEXT,
    sponsor_tier TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expo_release_analytics_event_name_idx
    ON public.expo_release_analytics (event_name);

CREATE INDEX IF NOT EXISTS expo_release_analytics_company_slug_idx
    ON public.expo_release_analytics (company_slug);

CREATE INDEX IF NOT EXISTS expo_release_analytics_session_id_idx
    ON public.expo_release_analytics (session_id);
