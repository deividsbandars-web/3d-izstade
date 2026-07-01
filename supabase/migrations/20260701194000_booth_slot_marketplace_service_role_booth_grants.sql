-- WP-C follow-up: paid booth-slot finalization writes into the release scene booths table.
-- Direct client access remains denied; these grants are only for backend service-role writes.

GRANT SELECT, INSERT, UPDATE ON TABLE public.booths TO service_role;
