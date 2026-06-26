# Supabase Vercel Hetzner Env Apply Steps

## Rule

- Doppler remains the source of truth
- use only Doppler-managed values
- do not copy values into committed files
- use redacted references only in operator notes

## Vercel Frontend Env

Set or confirm these frontend env names in Vercel:

- `VITE_SUPABASE_URL=<redacted>`
- `VITE_SUPABASE_ANON_KEY=<redacted>`
- `VITE_PUBLIC_API_BASE_URL=<redacted>`
- `VITE_PUBLIC_APP_URL=<redacted>`
- `VITE_SIGNALING_SERVER_URL=<redacted>`

Optional existing frontend env names to preserve if used by the project:

- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS=<redacted>`
- `VITE_STUN_SERVER_URL=<redacted>`
- `VITE_TURN_SERVER_URL=<redacted>`

Operator note:

- values should be copied from the matching Doppler config, not from local scratch files

## Hetzner VPS Backend Env

Set or confirm these backend env names for `backend-server` on the VPS runtime:

- `SUPABASE_URL=<redacted>`
- `SUPABASE_SERVICE_KEY=<redacted>`

Keep existing backend runtime variables aligned as already required by the deployment:

- `NODE_ENV=<redacted>`
- `PORT=<redacted>`
- `SIGNALING_STATUS_BASE_URL=<redacted>`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS=<redacted>`
- `UE5_SECRET_KEY=<redacted>`

Compatibility note:

- if any existing backend path still expects `SUPABASE_SERVICE_ROLE_KEY`, map it from the same Doppler-managed service-role value until cleanup is explicitly approved

## Doppler Mapping Checklist

Required Doppler-managed Supabase names:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Related release env names that should remain aligned:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_PUBLIC_APP_URL`
- `VITE_SIGNALING_SERVER_URL`

## Apply Order

1. update Vercel frontend env from Doppler-managed values
2. update Hetzner/VPS `backend-server` env or confirm Doppler runtime injection for the backend process
3. restart the backend service on staging
4. run staging smoke checks
5. only after staging passes, proceed with any production deploy or env rollout

## Staging Smoke Checks

Run after env application and backend restart:

1. frontend loads with Supabase-backed features enabled
2. backend `/health` responds
3. `/api/expo/scene` responds with expected scene payload
4. sponsor lead flow reaches the expected backend path
5. modular home quote submission reaches the expected backend path
6. sponsor asset/storage paths are checked if the restored project uses `expo_assets`

## Risk Notes

- mismatched frontend/backend Supabase projects can produce hard-to-diagnose auth and data drift
- missing service-role mapping on the VPS backend will break admin or write paths even if the frontend build succeeds
- Vercel preview/staging env and production env must be checked separately if they are split
