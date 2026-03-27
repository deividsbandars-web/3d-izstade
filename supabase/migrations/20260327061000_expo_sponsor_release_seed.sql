-- Release hardening: replace legacy expo demo seed data with sponsor-ready minimum content.

-- 1. Ensure sponsor-ready columns exist on the public expo tables used by /api/expo/scene.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sponsor_tier TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booth_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS booking_url TEXT,
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_asset_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS booth_type TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_asset_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT;

UPDATE public.companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

-- 2. Remove legacy demo content that keeps the live scene in a non-sponsor-ready state.
DELETE FROM public.booths
WHERE company_id IN (
  SELECT id
  FROM public.companies
  WHERE name IN ('Demo Company 1', 'Demo Company 2')
);

DELETE FROM public.companies
WHERE name IN ('Demo Company 1', 'Demo Company 2');

DELETE FROM public.sectors
WHERE name IN ('Construction', 'Technology')
  AND id NOT IN (
    SELECT DISTINCT sector_id
    FROM public.companies
    WHERE sector_id IS NOT NULL
  );

-- 3. Create sponsor-ready baseline sectors for the release boulevard.
WITH sponsor_sectors AS (
  INSERT INTO public.sectors (name, description, color_theme, map_position)
  VALUES
    (
      'Platform Partners',
      'Core platform, title sponsors, and primary arrival boulevard partners',
      '#2563eb',
      '{"x": 0, "y": 0, "z": -110}'::jsonb
    ),
    (
      'Meetings & Demos',
      'Live demos, meeting booking, and sponsor follow-up actions',
      '#0f766e',
      '{"x": 0, "y": 0, "z": -250}'::jsonb
    )
  ON CONFLICT DO NOTHING
  RETURNING id, name
),
all_target_sectors AS (
  SELECT id, name FROM sponsor_sectors
  UNION
  SELECT id, name
  FROM public.sectors
  WHERE name IN ('Platform Partners', 'Meetings & Demos')
)
INSERT INTO public.companies (
  sector_id,
  name,
  description,
  logo_url,
  website,
  location,
  tier,
  is_active,
  sponsor_tier,
  priority,
  booth_type,
  tagline,
  booking_url,
  poster_url,
  hero_asset_url,
  cta_label,
  slug
)
SELECT
  (SELECT id FROM all_target_sectors WHERE name = payload.sector_name),
  payload.name,
  payload.description,
  payload.logo_url,
  payload.website,
  payload.location,
  payload.tier,
  true,
  payload.sponsor_tier,
  payload.priority,
  payload.booth_type,
  payload.tagline,
  payload.booking_url,
  NULL,
  NULL,
  payload.cta_label,
  payload.slug
FROM (
  VALUES
    (
      'Platform Partners',
      'Warpala Platform',
      'Primary platform showcase and sponsor boulevard entry point',
      NULL,
      'https://warpala.com',
      'Warpala Expo Boulevard',
      'enterprise',
      'hero',
      100,
      'hero',
      'Platform overview, sponsor discovery, and live expo entry point.',
      NULL,
      NULL,
      'warpala-platform'
    ),
    (
      'Meetings & Demos',
      'Sponsor Concierge',
      'Meeting booking and sponsor support desk for live demos and follow-up',
      NULL,
      'https://warpala.com/contact',
      'Warpala Expo Meetings',
      'pro',
      'gold',
      80,
      'premium',
      'Book sponsor meetings and navigate the boulevard without disruption.',
      'https://warpala.com/contact',
      'Book Meeting',
      'sponsor-concierge'
    ),
    (
      'Meetings & Demos',
      'Demo Room Access',
      'Internal guided product demos and sponsor handoff room',
      NULL,
      'https://warpala.com',
      'Warpala Demo Rooms',
      'pro',
      'silver',
      60,
      'standard',
      'Open a guided product demo room with stable fallback navigation.',
      NULL,
      'Open Demo',
      'demo-room-access'
    )
) AS payload(
  sector_name,
  name,
  description,
  logo_url,
  website,
  location,
  tier,
  sponsor_tier,
  priority,
  booth_type,
  tagline,
  booking_url,
  cta_label,
  slug
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.companies existing
  WHERE existing.slug = payload.slug
     OR existing.name = payload.name
);

-- 4. Ensure each release sponsor has a matching booth record with no placeholder media.
INSERT INTO public.booths (
  company_id,
  video_url,
  model_url,
  images,
  services,
  products,
  booth_type,
  poster_url,
  hero_asset_url,
  cta_label
)
SELECT
  c.id,
  NULL,
  NULL,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  c.booth_type,
  NULL,
  NULL,
  c.cta_label
FROM public.companies c
WHERE c.slug IN ('warpala-platform', 'sponsor-concierge', 'demo-room-access')
  AND NOT EXISTS (
    SELECT 1
    FROM public.booths b
    WHERE b.company_id = c.id
  );

-- 5. Normalize any leftover fake booth model identifiers from legacy seeds.
UPDATE public.booths
SET model_url = NULL
WHERE model_url IN ('L_Booth_Default', 'L_Booth_Default.glb', '');
