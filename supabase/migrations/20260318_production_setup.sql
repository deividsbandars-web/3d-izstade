-- PRODUCTION SPONSORSHIP SYSTEM
-- Izpildīt šo Supabase SQL Editor

-- 1. Sponsoru tabula
CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT CHECK (tier IN ('BASIC', 'INTERACTIVE', 'PREMIUM')),
  balance NUMERIC DEFAULT 1000.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Analītikas tabula
CREATE TABLE IF NOT EXISTS booth_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sponsor_id TEXT REFERENCES sponsors(id),
  event_type TEXT CHECK (event_type IN ('ENTRY', 'EXIT', 'CLICK', 'DOWNLOAD')),
  duration INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Billing kopsavilkums
CREATE TABLE IF NOT EXISTS sponsor_billing (
  sponsor_id TEXT PRIMARY KEY REFERENCES sponsors(id),
  total_entries INT DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Funkcija automātiskai norēķinu veikšanai (Anti-Spam 1h)
CREATE OR REPLACE FUNCTION handle_booth_entry(s_id TEXT, u_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM booth_analytics 
    WHERE user_id = u_id AND sponsor_id = s_id AND event_type = 'ENTRY' 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) THEN
    INSERT INTO booth_analytics (user_id, sponsor_id, event_type)
    VALUES (u_id, s_id, 'ENTRY');

    UPDATE sponsors SET balance = balance - 0.50 WHERE id = s_id;
    
    INSERT INTO sponsor_billing (sponsor_id, total_entries, total_spent)
    VALUES (s_id, 1, 0.50)
    ON CONFLICT (sponsor_id) DO UPDATE SET
      total_entries = sponsor_billing.total_entries + 1,
      total_spent = sponsor_billing.total_spent + 0.50,
      last_updated = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
