-- EXTEND SPONSORS WITH STRIPE FIELDS
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'BASIC', 'INTERACTIVE', 'PREMIUM'));

-- SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY, -- Stripe Subscription ID
  sponsor_id TEXT REFERENCES sponsors(id),
  status TEXT,
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, -- Stripe Payment Intent ID
  sponsor_id TEXT REFERENCES sponsors(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  type TEXT CHECK (type IN ('SUBSCRIPTION', 'OVERAGE', 'ADDON')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USAGE TRACKING FOR PAY-PER-VISITOR
-- We already have booth_analytics, we can aggregate from there.
-- But we might want a billing period summary.

CREATE TABLE IF NOT EXISTS billing_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id TEXT REFERENCES sponsors(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  visitor_count INT DEFAULT 0,
  amount_due NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_subscriptions_sponsor ON subscriptions(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_payments_sponsor ON payments(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_sponsor ON billing_periods(sponsor_id);
