# Production Supabase Cutover Checklist

## Scope

- Goal: prepare a production-only Supabase cutover checklist based on passing local and staging verification
- This document does not execute production changes
- Production env changed by this task: no
- Production deploy run by this task: no
- Secrets included in this document: no

## Current Readiness Summary

Current evidence supporting production readiness:

- restored Supabase migrations are aligned on the managed project
- local bounded backend smoke through Doppler passed
- local backend smoke verified:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy=public-readonly`
  - non-zero `sectors`, `companies`, and `booths`
- staging backend smoke verified:
  - `https://api-staging.30sek24.com/health -> 200`
  - `https://api-staging.30sek24.com/api/expo/scene -> 200`
  - `authPolicy=public-readonly`
  - `sectors=3`
  - `companies=3`
  - `booths=3`
- staging frontend availability verified:
  - `https://staging.30sek24.com -> 200`
  - `https://staging.30sek24.com/expo-3d -> 200`
- production has not been touched

## Required Production Env Names

Use Doppler as the source of truth. List variable names only.

### Vercel Production Frontend

- `VITE_SUPABASE_URL=<redacted>`
- `VITE_SUPABASE_ANON_KEY=<redacted>`
- `VITE_PUBLIC_API_BASE_URL=<redacted>`
- `VITE_SIGNALING_SERVER_URL=<redacted>`

Optional existing frontend names to preserve if production currently uses them:

- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS=<redacted>`
- `VITE_STUN_SERVER_URL=<redacted>`
- `VITE_TURN_SERVER_URL=<redacted>`

### Hetzner VPS Production Backend

- `SUPABASE_URL=<redacted>`
- `SUPABASE_SERVICE_KEY=<redacted>`
- `SUPABASE_SERVICE_ROLE_KEY=<redacted>`
- `SIGNALING_STATUS_BASE_URL=<redacted>`
- `UE5_SECRET_KEY=<redacted>`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS=<redacted>`

Operationally required existing backend names to keep aligned:

- `NODE_ENV=<redacted>`
- `PORT=<redacted>`

Compatibility note:

- `backend-server` runtime expects `SUPABASE_SERVICE_KEY`
- if production secret storage still exposes `SUPABASE_SERVICE_ROLE_KEY`, map it consistently to the backend runtime expectation before restart

## Doppler Source Of Truth Check

Before any production cutover:

1. confirm the active Doppler project is still `-3d-izstade`
2. confirm the production Doppler config is the intended production config
3. confirm required production names exist in Doppler
4. do not copy values into committed files or ad-hoc text notes

Names to confirm in Doppler production config:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `UE5_SECRET_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`

## Preconditions

Do not start production cutover until all of the following are true:

1. explicit user approval for production cutover is given
2. staging smoke is still recent and still passing
3. backup or export status of any older production Supabase project is known
4. production Doppler secret-name coverage is confirmed
5. operator understands current Vercel and VPS production rollback path

## Production Cutover Steps

### 1. Confirm Backup / Export Status

- if an older production Supabase project still exists, confirm whether data backup/export is needed
- if old production data matters and backup/export status is unknown, stop here
- do not delete or mutate the older production project during this checklist step

### 2. Confirm Doppler Production Names

- verify production Doppler config contains the required production names
- do not proceed if any required names are missing

### 3. Update Vercel Production Env

Use the existing production Vercel project convention only.

- set or confirm:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_PUBLIC_API_BASE_URL`
  - `VITE_SIGNALING_SERVER_URL`
- preserve any already-required frontend env names unrelated to Supabase
- keep values sourced from Doppler only

If the project uses manual Vercel env management:

- apply the production values manually in the existing Vercel project
- do not use staging project `app-staging` for production

If the project later adopts an approved Vercel sync path:

- use that existing approved production convention only

### 4. Update Hetzner / VPS Production Backend Env

Use the existing production backend runtime convention only.

- set or confirm:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `SIGNALING_STATUS_BASE_URL`
  - `UE5_SECRET_KEY`
  - `PIXEL_STREAMING_STATUS_TIMEOUT_MS` if production chooses an explicit non-default value
- preserve other already-required production backend env names
- keep values sourced from Doppler only

If the production backend still uses service-role naming:

- keep `SUPABASE_SERVICE_ROLE_KEY` available as needed
- ensure runtime-compatible mapping to `SUPABASE_SERVICE_KEY`

### 5. Restart Production Backend

- restart the production backend only after env confirmation is complete
- do not run migrations during the restart step
- do not touch Redis, TURN, signaling, Docker topology, or routes

### 6. Smoke Production Backend Before Frontend Promotion

Check:

- `https://api.30sek24.com/health`
- `https://api.30sek24.com/api/expo/scene`

Expected results:

- `health` returns `200`
- `scene` returns `200`
- `authPolicy=public-readonly`
- `sectors > 0`
- `companies > 0`
- `booths > 0`

If backend smoke fails:

- stop before any production frontend promotion or deploy
- move to rollback plan

### 7. Deploy or Promote Production Frontend

- only after backend smoke passes
- use the existing production Vercel project convention
- do not reuse staging preview/promote flow for production unless the existing production scripts explicitly require it

### 8. Smoke Production Frontend

Check:

- `https://www.30sek24.com`
- `https://www.30sek24.com/expo-3d`

Expected results:

- both routes return `200`
- client loads against the intended production API and Supabase-backed release path

## Production Smoke Checklist

Backend:

- `https://api.30sek24.com/health`
- `https://api.30sek24.com/api/expo/scene`
- expected `authPolicy=public-readonly`
- expected non-zero `sectors`, `companies`, `booths`

Frontend:

- `https://www.30sek24.com`
- `https://www.30sek24.com/expo-3d`

Optional later-approved functional smoke:

- sponsor lead flow
- sponsor inbox auth path
- modular home quote path
- sponsor asset/storage access

Do not perform destructive writes or create test leads unless a safe explicit test mode is approved.

## Rollback Plan

If production cutover fails:

1. keep previous env references available through Doppler, Vercel secret history, VPS runtime secret history, or operator backup records if available
2. revert production frontend and backend env references to the previous Supabase project
3. restart production backend
4. re-run production smoke:
   - `https://api.30sek24.com/health`
   - `https://api.30sek24.com/api/expo/scene`
   - `https://www.30sek24.com`
   - `https://www.30sek24.com/expo-3d`
5. do not run migrations during rollback unless explicitly approved in a separate task

## Go / No-Go Gates

Go only if all conditions are true:

- explicit user approval for production cutover exists
- production Doppler names are present
- backup/export status of any old production Supabase is known or intentionally accepted
- staging smoke is recent and passing
- rollback path is understood before change execution

No-go conditions:

- no explicit approval
- missing production Doppler names
- old production data may matter and backup/export status is unknown
- staging smoke is stale or failing
- production backend smoke fails after env update

## Execution Note

- production cutover is prepared but not executed
- this checklist is intended for a later approved production task only
