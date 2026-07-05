# Production Supabase Cutover Report

## Scope

- Goal: execute the approved production Supabase cutover path as far as the existing repo and operator access conventions safely allow
- Production secrets printed: no
- `.env` files created or changed: no
- Migrations run during this task: no
- Runtime code changed: no

## Cutover Timestamp

- Execution time: `2026-06-17T11:23:43.5713382+03:00`

## Doppler Context

Local active Doppler selection during this run:

- project: `-3d-izstade`
- config: `stg`

Production verification path used in this run:

- explicit production Doppler scope via `--config prd`

Reason:

- local repo scope remained on `stg`
- production verification was performed without changing the repo-local default selection

## Production Env Names Verified

Verified in Doppler `prd` by names only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `UE5_SECRET_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`

Verified in Vercel production project `app` by names only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `UE5_SECRET_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`

Additional production names also visible in Vercel by names only:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `DOPPLER_PROJECT`
- `DOPPLER_CONFIG`
- `DOPPLER_ENVIRONMENT`

No secret values were printed.

## Backend Actions

Actions performed:

- verified production Doppler secret-name coverage using `--config prd`
- verified public production backend health and scene endpoints

Actions not performed:

- no destructive Supabase command
- no production backend code change
- no production VPS `.env.docker` file edit from this repo
- no explicit production backend restart command from this repo

Operator note:

- the repository still does not contain a dedicated production Hetzner deploy/apply script comparable to the staging backend script
- public backend smoke passed, so no additional production backend mutation was forced from this task

## Frontend Actions

Actions performed:

- verified Vercel production project `app` env-name presence without printing values
- verified public production frontend routes

Actions not performed:

- no production frontend code change
- no explicit production preview deploy
- no production alias promotion

Operator note:

- because public production frontend smoke already passed and required Vercel production env names were visible, no additional production redeploy was forced in this task

## Production Smoke Results

Backend:

- `https://api.30sek24.com/health -> 200`
- `https://api.30sek24.com/api/expo/scene -> 200`
- `authPolicy=public-readonly`
- `sectors=3`
- `companies=3`
- `booths=3`

Frontend:

- `https://www.30sek24.com -> 200`
- `https://www.30sek24.com/expo-3d -> 200`

## Result

- production public backend smoke passed
- production public frontend smoke passed
- required production Supabase env names are present in Doppler `prd`
- required production frontend env names are present in Vercel project `app`
- production cutover appears operational for the current sponsor boulevard release path

## Remaining Caveat

- this run did not directly mutate or inspect live Hetzner production backend secret storage
- the evidence for backend alignment in this run is:
  - required production names exist in Doppler `prd`
  - public production backend endpoints passed smoke

## Rollback Note

- if a later production regression appears, follow `docs/PRODUCTION_SUPABASE_CUTOVER_CHECKLIST.md`
- revert frontend/backend secret references to the previous production Supabase project if needed
- restart the backend
- re-run production smoke

## Final Status

- production cutover smoke: passed
- production runtime logic: unchanged
- production secrets: not exposed
