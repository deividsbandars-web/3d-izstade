-- Adds managed screen-content compatibility fields to the legacy expo_booth table.
-- Staging currently falls back to public.expo_booth when public.expo_booths is absent.
-- The Expo Admin save flow stores sanitized screen payloads in assets_3d.screen_content.

ALTER TABLE public.expo_booth
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS industry_sector TEXT,
  ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS assets_3d JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.expo_booth
SET
  company_name = COALESCE(company_name, title),
  subscription_type = COALESCE(subscription_type, plan_type, 'basic'),
  status = COALESCE(status, 'active'),
  assets_3d = COALESCE(assets_3d, '{}'::jsonb),
  contact_info = COALESCE(contact_info, '{}'::jsonb),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW());

CREATE INDEX IF NOT EXISTS expo_booth_company_name_idx
  ON public.expo_booth (company_name);

CREATE INDEX IF NOT EXISTS expo_booth_status_idx
  ON public.expo_booth (status);
