# Supabase Restore Execution Report

## Status

- Result: restore push succeeded after a minimal compatibility patch to the previously blocked migration
- Reason patch was needed: earlier `CREATE TABLE IF NOT EXISTS` migrations allowed `public.companies` and `public.booths` to exist in narrower pre-expo shapes, so the release seed migration needed explicit `ADD COLUMN IF NOT EXISTS` guards before using expo-specific columns

## Repo Context Verification

- `PROJECT_CONTEXT_LOCK.md`: present
- `docs/SUPABASE_RESTORE_RECONNECT_RUNBOOK.md`: present
- `supabase/migrations/`: present
- Migration files found: 35
- Git working tree: dirty before this task; existing unrelated changes were preserved

## Doppler Verification

- Doppler CLI: available
- Doppler project: `-3d-izstade`
- Doppler config: `stg`

Secret-name audit was run without printing values.

Present Supabase-related names:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Project ref verification:

- final linked project ref: redacted, suffix `crmh`

## Supabase CLI Verification

- Global `supabase`: not available in PATH
- `npx.cmd supabase --version`: available
- Version resolved: `2.106.0`
- `npx.cmd supabase init`: passed
- `supabase/config.toml`: created locally in the earlier restore step

## Link Status

- Local Supabase metadata before link: `.supabase` not present
- Local `supabase/config.toml` metadata: created
- Link executed: yes
- Link result: success
- Linked project ref: redacted, suffix `crmh`

## Migration Status

- Migration status command: run
- Remote migration push: succeeded
- Destructive reset commands: not run

Applied migrations visible on the linked remote after the successful retry:

- `20260303000000`
- `20260305000000`
- `20260308000000`
- `20260308000001`
- `20260309000000`
- `20260310000000`
- `20260310000001`
- `20260310000002`
- `20260310000003`
- `20260310000004`
- `20260310000005`
- `20260310000006`
- `20260310000007`
- `20260310000008`
- `20260310000009`
- `20260310000010`
- `20260310000011`
- `20260310000012`
- `20260310000013`
- `20260311000000`
- `20260312000000`
- `20260314163542`
- `20260318`
- `20260327061000`
- `20260328093000`
- `20260407123000`
- `20260418090000`
- `20260531113000`
- `20260603193000`
- `20260604002000`
- `20260604014500`
- `20260609040000`
- `20260609164000`

Non-timestamp helper files still skipped by Supabase CLI as expected:

- `create_expo_tables_and_seed.sql`
- `run_me.sql`

## Patched Migration

- File: `supabase/migrations/20260327061000_expo_sponsor_release_seed.sql`

Why it failed before:

- the migration referenced `public.companies.sector_id`
- earlier schema creation paths could leave `public.companies` without expo-specific columns because later `CREATE TABLE IF NOT EXISTS` statements do not backfill missing columns

What was patched:

- added idempotent `ALTER TABLE public.companies ... ADD COLUMN IF NOT EXISTS` guards for:
  - `sector_id`
  - `description`
  - `logo_url`
  - `website`
  - `location`
  - `contact_email`
  - `tier`
  - `sponsor_tier`
  - `priority`
  - `booth_type`
  - `tagline`
  - `booking_url`
  - `poster_url`
  - `hero_asset_url`
  - `cta_label`
  - `slug`
- added idempotent `ALTER TABLE public.booths ... ADD COLUMN IF NOT EXISTS` guards for:
  - `model_url`
  - `booth_type`
  - `poster_url`
  - `hero_asset_url`
  - `cta_label`

Patch scope rules preserved:

- no new migration was added
- no destructive reset or migration repair command was used
- no runtime code was changed
- the seed intent stayed the same

## Schema Verification Status

Remote schema was verified after the successful push using:

- `supabase migration list --linked`
- a read-only schema dump of `public,storage`

Verified tables and schema surfaces:

- `/api/expo/scene` related:
  - `public.sectors`
  - `public.companies`
  - `public.booths`
- sponsor leads related:
  - `public.service_requests`
  - `public.expo_lead_ops`
- sponsor packages / assets related:
  - `public.marketplace_services`
  - `storage.objects` policies for `expo_assets`
- booth / screen / analytics related:
  - `public.booth_analytics`
  - `public.city_screens`
  - `public.booth_screen_reservations`
- modular home quote related:
  - `public.modular_home_quote_requests`

Verified `public.companies` expo columns:

- `sector_id`
- `logo_url`
- `website`
- `location`
- `contact_email`
- `tier`
- `sponsor_tier`
- `priority`
- `booth_type`
- `tagline`
- `booking_url`
- `poster_url`
- `hero_asset_url`
- `cta_label`
- `slug`

Verified `public.booths` release columns:

- `model_url`
- `booth_type`
- `poster_url`
- `hero_asset_url`
- `cta_label`

Verified `public.modular_home_quote_requests` sales-ops columns:

- `consultant_assignment`
- `follow_up_required`
- `status_history`

## Storage / Auth Follow-up Status

Auth and storage were inspected at schema level only.

Confirmed from restored schema / policies:

- `auth.users` references exist in earlier schema paths
- `expo_assets` storage policies exist on `storage.objects`

Manual or later-approved follow-up still recommended:

- verify the `expo_assets` bucket record in Supabase dashboard or via a later approved read-only check
- perform application-level auth and sponsor asset smoke checks after Vercel/VPS env reconciliation

## Supabase Types

- Existing generated types convention found: no clear repo-wide target found during this run
- Type generation executed: no
- Result: skipped
- Reason: no clear existing generated types target was identified

## Env Update Checklist

- Document: `docs/SUPABASE_DOPPLER_ENV_AFTER_RESTORE.md`

## Next Required Operator Action

No immediate migration blocker remains.

Recommended next steps:

1. reconcile Vercel frontend env from Doppler-managed Supabase values
2. reconcile Hetzner/VPS `backend-server` env from Doppler-managed Supabase values
3. run application smoke checks for:
   - `/api/expo/scene`
   - sponsor leads
   - booth assets / managed screen flows
   - modular home quote submission

## Safety Notes

- No real secrets were printed, committed, or written into docs.
- No `.env` files were created or modified.
- No deployment commands were run.
- No runtime code, routes, pricing, quote logic, lead logic, Redis, TURN, signaling, or Docker files were changed.
