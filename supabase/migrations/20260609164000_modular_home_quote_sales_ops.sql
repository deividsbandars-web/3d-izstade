ALTER TABLE public.modular_home_quote_requests
  ADD COLUMN IF NOT EXISTS consultant_assignment TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.modular_home_quote_requests.consultant_assignment
  IS 'Admin-only sales operations placeholder for consultant assignment.';

COMMENT ON COLUMN public.modular_home_quote_requests.follow_up_required
  IS 'Admin-only sales operations flag indicating manual follow-up is required.';

COMMENT ON COLUMN public.modular_home_quote_requests.status_history
  IS 'Admin-only status history entries for Modular Home quote review workflow.';
