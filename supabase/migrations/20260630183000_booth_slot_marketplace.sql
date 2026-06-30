-- WP-C: self-serve sponsor booth slot reservations.
-- Direct client access remains denied; availability/reservation writes flow through the backend.

CREATE TABLE IF NOT EXISTS public.booth_slot_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  company_name TEXT NOT NULL,
  contact_email TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'held',
  commercial_tier TEXT NOT NULL,
  screen_class TEXT NOT NULL,
  booth_type TEXT NOT NULL,
  sponsor_tier TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  stripe_session_id TEXT UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booth_slot_reservations_status_check
    CHECK (status IN ('held', 'checkout_started', 'assigned', 'expired', 'cancelled', 'payment_failed')),
  CONSTRAINT booth_slot_reservations_tier_check
    CHECK (commercial_tier IN ('common', 'premium', 'elite', 'hero')),
  CONSTRAINT booth_slot_reservations_screen_class_check
    CHECK (screen_class IN ('support', 'presentation', 'large-format', 'landmark')),
  CONSTRAINT booth_slot_reservations_booth_type_check
    CHECK (booth_type IN ('standard', 'premium', 'hero')),
  CONSTRAINT booth_slot_reservations_sponsor_tier_check
    CHECK (sponsor_tier IN ('standard', 'bronze', 'silver', 'gold', 'platinum', 'hero')),
  CONSTRAINT booth_slot_reservations_amount_check
    CHECK (amount_cents > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS booth_slot_reservations_active_slot_idx
  ON public.booth_slot_reservations (slot_id)
  WHERE status IN ('held', 'checkout_started', 'assigned');

CREATE INDEX IF NOT EXISTS booth_slot_reservations_user_status_idx
  ON public.booth_slot_reservations (user_id, status);

CREATE INDEX IF NOT EXISTS booth_slot_reservations_status_expires_idx
  ON public.booth_slot_reservations (status, expires_at);

ALTER TABLE public.booth_slot_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booth_slot_reservations_default_deny" ON public.booth_slot_reservations;
CREATE POLICY "booth_slot_reservations_default_deny"
  ON public.booth_slot_reservations
  FOR ALL
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE public.booth_slot_reservations FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.booth_slot_reservations TO service_role;

ALTER TABLE public.booths
  ADD COLUMN IF NOT EXISTS slot_id TEXT,
  ADD COLUMN IF NOT EXISTS marketplace_reservation_id UUID REFERENCES public.booth_slot_reservations(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS booths_slot_id_unique_idx
  ON public.booths (slot_id)
  WHERE slot_id IS NOT NULL;

ALTER TABLE public.billing_payments
  DROP CONSTRAINT IF EXISTS billing_payments_product_kind_check;

ALTER TABLE public.billing_payments
  ADD CONSTRAINT billing_payments_product_kind_check
  CHECK (product_kind IN ('plan', 'credits', 'booth-slot'));
