CREATE TABLE IF NOT EXISTS public.modular_home_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),
  internal_note TEXT,
  requester JSONB NOT NULL DEFAULT '{}'::jsonb,
  project JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimate JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent JSONB NOT NULL DEFAULT '{}'::jsonb,
  attribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  source JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS modular_home_quote_requests_created_at_idx
  ON public.modular_home_quote_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS modular_home_quote_requests_status_idx
  ON public.modular_home_quote_requests (status);

CREATE INDEX IF NOT EXISTS modular_home_quote_requests_project_product_idx
  ON public.modular_home_quote_requests ((project->>'productId'));

CREATE INDEX IF NOT EXISTS modular_home_quote_requests_requester_email_idx
  ON public.modular_home_quote_requests ((lower(requester->>'email')));

CREATE OR REPLACE FUNCTION public.set_modular_home_quote_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_modular_home_quote_requests_updated_at
  ON public.modular_home_quote_requests;

CREATE TRIGGER set_modular_home_quote_requests_updated_at
  BEFORE UPDATE ON public.modular_home_quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_modular_home_quote_requests_updated_at();

ALTER TABLE public.modular_home_quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Modular home quote requests denied by default"
  ON public.modular_home_quote_requests;

CREATE POLICY "Modular home quote requests denied by default"
  ON public.modular_home_quote_requests
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.modular_home_quote_requests
  IS 'Staging-gated Modular Home quote requests. Backend service role inserts/selects; anon/auth clients have no direct table access.';
