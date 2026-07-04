-- Race-resistant duplicate suppression and PII-safe submission provenance for
-- the public Expo and calculator lead endpoints.

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS submission_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS submission_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS submission_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS submission_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS service_requests_submission_fingerprint_unique
  ON public.service_requests (submission_fingerprint)
  WHERE submission_fingerprint IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leads_submission_fingerprint_unique
  ON public.leads (submission_fingerprint)
  WHERE submission_fingerprint IS NOT NULL;

COMMENT ON COLUMN public.service_requests.submission_metadata IS
  'PII-safe request provenance. Raw IP addresses, emails, query strings, and user-agent values are excluded.';

COMMENT ON COLUMN public.leads.submission_metadata IS
  'PII-safe request provenance. Raw IP addresses, emails, query strings, and user-agent values are excluded.';
