-- WP-B: Stripe checkout/session accounting.
-- All direct client access remains denied; backend service role writes these rows.

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'eur',
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.billing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    product_kind TEXT NOT NULL CHECK (product_kind IN ('plan', 'credits')),
    product_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('checkout_started', 'payment_completed', 'payment_failed', 'refunded')),
    amount_cents INTEGER,
    currency TEXT NOT NULL DEFAULT 'eur',
    stripe_session_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent_id TEXT,
    stripe_customer_id TEXT,
    stripe_checkout_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_payments_default_deny" ON public.billing_payments;
CREATE POLICY "billing_payments_default_deny"
ON public.billing_payments
FOR ALL
USING (false)
WITH CHECK (false);

REVOKE ALL ON TABLE public.billing_payments FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE ON TABLE public.billing_payments TO service_role;

REVOKE ALL ON TABLE public.invoices FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE ON TABLE public.invoices TO service_role;
