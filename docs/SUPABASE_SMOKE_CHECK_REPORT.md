# Supabase Smoke Check Report

## Scope

- Goal: verify that the restored managed Supabase project is structurally usable by the existing frontend and `backend-server` through Doppler-managed env names
- Runtime code changes: none
- Deployments performed: none
- Secret values printed or stored: none
- Project ref: redacted, suffix `crmh`

## Input Context

- Restore baseline: `docs/SUPABASE_RESTORE_EXECUTION_REPORT.md`
- Env mapping baseline: `docs/SUPABASE_DOPPLER_ENV_AFTER_RESTORE.md`
- Secret source of truth: Doppler

## Env Variable Names Verified

Frontend Supabase env names found in repo usage or examples:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Backend Supabase env names found in repo usage or examples:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Related non-Supabase frontend/backend env names present in Doppler and relevant to smoke checks:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`

## Repo Usage Inspection

Frontend usage locations inspected:

- `src/config/runtimeEnv.ts`
- `src/lib/supabaseClient.ts`
- `src/vite-env.d.ts`
- `src/__tests__/runtimeEnv.test.ts`
- `.env.example`
- `.env.docker.example`
- `README.md`

Backend usage locations inspected:

- `backend-server/config/runtimeEnv.ts`
- `src/backend/lib/supabaseAdmin.ts`
- `.env.example`
- `.env.docker.example`
- `docs/release/ENVIRONMENT_MATRIX.md`

Findings:

- frontend release runtime expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- backend release runtime expects `SUPABASE_URL` plus `SUPABASE_SERVICE_KEY`
- legacy compatibility references still mention `SUPABASE_SERVICE_ROLE_KEY`; keep it available in Doppler until operator cleanup is explicitly approved

## Doppler Secret-Name Audit

Command class used:

- names-only audit, no secret values printed

Verified present names:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`

Result:

- required Supabase variable names for the current frontend/backend surfaces are present in Doppler

## Migration Status Summary

From `docs/SUPABASE_RESTORE_EXECUTION_REPORT.md`:

- remote restore push succeeded after the compatibility patch to `20260327061000_expo_sponsor_release_seed.sql`
- timestamped migrations reached local/remote alignment
- verified schema surfaces include:
  - `public.sectors`
  - `public.companies`
  - `public.booths`
  - `public.service_requests`
  - `public.expo_lead_ops`
  - `public.marketplace_services`
  - `public.booth_analytics`
  - `public.city_screens`
  - `public.booth_screen_reservations`
  - `public.modular_home_quote_requests`

## Smoke Check Commands Attempted

1. `doppler secrets --only-names`
Result: passed

2. `doppler run -- npm.cmd run build`
Result: passed

3. `doppler run -- npm.cmd run lint`
Result: passed with warnings only

4. `doppler run -- npm.cmd run test`
Result: not run
Reason: no root `test` script exists

5. Local backend start / endpoint smoke
Result: replaced with a bounded helper
Reason: the documented root helper path `start:backend` includes `npm install` and a long-running server start, so a dedicated bounded smoke helper was added instead

6. `doppler run -- node scripts/smoke-backend-supabase.mjs`
Result: passed
Reason: bounded helper started `backend-server` on a reserved localhost port, waited for `/health`, requested `/api/expo/scene`, and shut the child process down cleanly

Windows fallback for the same smoke command:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs
```

## Results

- restored Supabase env names required by the release frontend/backend are present in Doppler
- root frontend build passes with Doppler-injected env
- root lint passes with existing repo warnings only
- no immediate evidence was found that the restored Supabase project blocks the release frontend build path
- backend runtime smoke path now exists locally through `scripts/smoke-backend-supabase.mjs`
- restored Supabase runtime was verified through `backend-server` without deploying production
- local bounded backend smoke succeeded with:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `expoScene.authPolicy -> public-readonly`
  - `expoScene.sectors -> 3`
  - `expoScene.companies -> 3`
  - `expoScene.booths -> 3`

## Existing Warnings Observed

`npm run lint` completed with warnings only. No fixes were applied in this task.

Observed warning categories:

- unused eslint-disable directives under signaling and handoff mirror trees
- `react-hooks/exhaustive-deps` warnings in existing operator/dashboard code

These warnings are pre-existing and unrelated to the Supabase restore verification step.

## Backend Smoke Approach

- helper path: `scripts/smoke-backend-supabase.mjs`
- child entrypoint: `backend-server/server.ts`
- launcher: local `backend-server/node_modules/tsx/dist/cli.mjs`
- port strategy: reserve an ephemeral localhost port and inject it via `PORT`
- endpoints checked:
  - `/health`
  - `/api/expo/scene`
- write paths intentionally skipped:
  - sponsor lead capture
  - modular home quote submission
  - any auth-protected admin or package mutation route
- sponsor packages read check:
  - no safe public read-only sponsor packages endpoint was discovered in backend routes, so no package endpoint request was performed
- Windows-local Doppler fallback:
  - `scripts/run-with-doppler.ps1`
  - resolution order: `DOPPLER_BIN`, `Get-Command doppler`, known WinGet path

## Blocked Items

- no existing bounded root `test` script was available
- no remote Vercel or Hetzner/VPS env was changed in this task by design

## Next Step

- follow `docs/SUPABASE_VERCEL_HETZNER_ENV_APPLY_STEPS.md`
- update staging env from Doppler-managed values
- restart staging backend
- run staging smoke checks for:
  - `/health`
  - `/api/expo/scene`
  - sponsor lead flow
  - modular home quote submission

## Staging Follow-up

- staging-only report: `docs/STAGING_SUPABASE_SMOKE_REPORT.md`
- current staging smoke outcome:
  - `https://api-staging.30sek24.com/health -> 200`
  - `https://api-staging.30sek24.com/api/expo/scene -> 200`
  - `authPolicy=public-readonly`
  - `sectors=3`
  - `companies=3`
  - `booths=3`
  - `https://staging.30sek24.com -> 200`
  - `https://staging.30sek24.com/expo-3d -> 200`

## Production Follow-up

- production cutover checklist is prepared in `docs/PRODUCTION_SUPABASE_CUTOVER_CHECKLIST.md`
- production cutover report: `docs/PRODUCTION_SUPABASE_CUTOVER_REPORT.md`
- production smoke outcome:
  - `https://api.30sek24.com/health -> 200`
  - `https://api.30sek24.com/api/expo/scene -> 200`
  - `authPolicy=public-readonly`
  - `sectors=3`
  - `companies=3`
  - `booths=3`
  - `https://www.30sek24.com -> 200`
  - `https://www.30sek24.com/expo-3d -> 200`
- no runtime code, migrations, or `.env` files were changed during the production cutover run
