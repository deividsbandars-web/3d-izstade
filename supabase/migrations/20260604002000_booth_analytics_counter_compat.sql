-- Add counter-style booth analytics fields to the legacy event analytics table.
-- This keeps existing sponsor event rows intact while allowing the expo admin
-- dashboard to read per-booth visits/interactions/lead counts safely.

ALTER TABLE public.booth_analytics
  ADD COLUMN IF NOT EXISTS booth_id UUID,
  ADD COLUMN IF NOT EXISTS visits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interactions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_generated INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS booth_analytics_booth_id_unique_idx
  ON public.booth_analytics (booth_id)
  WHERE booth_id IS NOT NULL;
