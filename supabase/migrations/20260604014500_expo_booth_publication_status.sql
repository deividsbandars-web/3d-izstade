-- Managed booth publication workflow.
-- Only `active` booths are eligible for public 3D scene screen-content merge.

DO $$
BEGIN
  IF to_regclass('public.expo_booths') IS NOT NULL THEN
    UPDATE public.expo_booths
    SET status = 'draft'
    WHERE status IS NULL
      OR status NOT IN ('draft', 'review', 'approved', 'active', 'rejected', 'archived');

    ALTER TABLE public.expo_booths
      ALTER COLUMN status SET DEFAULT 'draft';

    ALTER TABLE public.expo_booths
      DROP CONSTRAINT IF EXISTS expo_booths_status_check;

    ALTER TABLE public.expo_booths
      ADD CONSTRAINT expo_booths_status_check
      CHECK (status IN ('draft', 'review', 'approved', 'active', 'rejected', 'archived'));

    CREATE INDEX IF NOT EXISTS expo_booths_status_idx
      ON public.expo_booths (status);
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.expo_booth') IS NOT NULL THEN
    UPDATE public.expo_booth
    SET status = 'draft'
    WHERE status IS NULL
      OR status NOT IN ('draft', 'review', 'approved', 'active', 'rejected', 'archived');

    ALTER TABLE public.expo_booth
      ALTER COLUMN status SET DEFAULT 'draft';

    ALTER TABLE public.expo_booth
      DROP CONSTRAINT IF EXISTS expo_booth_status_check;

    ALTER TABLE public.expo_booth
      ADD CONSTRAINT expo_booth_status_check
      CHECK (status IN ('draft', 'review', 'approved', 'active', 'rejected', 'archived'));

    CREATE INDEX IF NOT EXISTS expo_booth_status_idx
      ON public.expo_booth (status);
  END IF;
END $$;
