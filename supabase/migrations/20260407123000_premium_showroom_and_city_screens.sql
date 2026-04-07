-- Premium showroom content slots + city screen inventory/reservations.
-- This extends the existing public.companies/public.booths expo model
-- instead of introducing a parallel booth schema.

ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS showroom_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_screen_type TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS hero_screen_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_screen_video_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_screen_title TEXT,
  ADD COLUMN IF NOT EXISTS hero_screen_text TEXT,
  ADD COLUMN IF NOT EXISTS featured_asset_type TEXT DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS featured_asset_url TEXT,
  ADD COLUMN IF NOT EXISTS featured_asset_title TEXT,
  ADD COLUMN IF NOT EXISTS featured_asset_description TEXT;

CREATE TABLE IF NOT EXISTS public.city_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  zone TEXT,
  location_label TEXT,
  size_class TEXT DEFAULT 'medium',
  tier_class TEXT DEFAULT 'premium',
  screen_width INTEGER,
  screen_height INTEGER,
  max_resolution TEXT,
  max_slots INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT city_screens_size_class_check CHECK (size_class IN ('small', 'medium', 'large', 'xl')),
  CONSTRAINT city_screens_tier_class_check CHECK (tier_class IN ('premium', 'elite'))
);

CREATE TABLE IF NOT EXISTS public.booth_screen_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
  city_screen_id UUID NOT NULL REFERENCES public.city_screens(id) ON DELETE CASCADE,
  content_type TEXT DEFAULT 'image',
  image_url TEXT,
  video_url TEXT,
  title TEXT,
  text TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT booth_screen_reservations_content_type_check CHECK (content_type IN ('image', 'video', 'mixed'))
);

CREATE INDEX IF NOT EXISTS booth_screen_reservations_booth_id_idx
  ON public.booth_screen_reservations (booth_id);

CREATE INDEX IF NOT EXISTS booth_screen_reservations_city_screen_id_idx
  ON public.booth_screen_reservations (city_screen_id);

CREATE INDEX IF NOT EXISTS booth_screen_reservations_active_window_idx
  ON public.booth_screen_reservations (is_active, starts_at, ends_at);

ALTER TABLE public.city_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_screen_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read city screens" ON public.city_screens;
CREATE POLICY "Public read city screens"
  ON public.city_screens
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Public read booth screen reservations" ON public.booth_screen_reservations;
CREATE POLICY "Public read booth screen reservations"
  ON public.booth_screen_reservations
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service-only booth screen reservations writes" ON public.booth_screen_reservations;
CREATE POLICY "Service-only booth screen reservations writes"
  ON public.booth_screen_reservations
  FOR ALL
  USING (false)
  WITH CHECK (false);

INSERT INTO public.city_screens (
  screen_code,
  name,
  zone,
  location_label,
  size_class,
  tier_class,
  screen_width,
  screen_height,
  max_resolution,
  max_slots
)
VALUES
  (
    'BLVD-HERO-01',
    'Boulevard Hero Screen',
    'arrival-boulevard',
    'Main arrival boulevard hero wall',
    'xl',
    'elite',
    7680,
    4320,
    '8k',
    1
  ),
  (
    'PLAZA-PREMIUM-01',
    'Plaza Premium Screen',
    'central-plaza',
    'Central plaza large-format display',
    'large',
    'premium',
    3840,
    2160,
    '4k',
    1
  ),
  (
    'PLAZA-PREMIUM-02',
    'Plaza Premium Screen B',
    'central-plaza',
    'Central plaza secondary display',
    'large',
    'premium',
    3840,
    2160,
    '4k',
    1
  )
ON CONFLICT (screen_code) DO NOTHING;
