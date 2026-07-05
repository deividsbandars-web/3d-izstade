# Staging Supabase Smoke Report

## Scope

- Goal: verify staging readiness for the restored Supabase project without touching production
- Production env changed: no
- Production deploy run: no
- Staging env changed in this task: no direct remote env mutation was performed
- Secrets printed or committed: no

## Context Reviewed

- `docs/SUPABASE_VERCEL_HETZNER_ENV_APPLY_STEPS.md`
- `docs/SUPABASE_SMOKE_CHECK_REPORT.md`
- `docs/staging-deploy-flow.md`
- `scripts/vercel-staging-preview-deploy.mjs`
- `scripts/deploy-staging-backend-hetzner.ps1`
- `scripts/check-staging-readiness.mjs`
- `scripts/check-expo-staging-browser-smoke.mjs`
- `docker-compose.staging.yml`
- `deployment/configs/nginx.conf`

## Existing Staging Conventions Found

Frontend staging:

- local Vercel link points to project `app-staging`
- staging domain is `https://staging.30sek24.com`
- repo contains safe preview/promote scripts for staging deployments
- repo does not contain a dedicated Vercel staging env sync script

Backend staging:

- backend staging runs through `docker-compose.staging.yml`
- existing deploy script is `scripts/deploy-staging-backend-hetzner.ps1`
- that script assumes a remote `/.env.docker` already exists on the VPS
- repo does not contain an automated remote secret sync step for staging backend env

Resulting operator conclusion:

- staging env application is still a manual or external-integrated step
- this task did not invent a new env-management pattern

## Required Staging Env Names

Frontend / Vercel Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`

Backend / Hetzner staging:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `UE5_SECRET_KEY`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`

Compose-required backend notes from `docker-compose.staging.yml`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `UE5_SECRET_KEY`
- `TURN_SERVER_URLS`
- `TURN_USERNAME`
- `TURN_PASSWORD`

## Doppler Runtime Name Check

Checked through `doppler run -- node -e ...` using names only.

Found:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `UE5_SECRET_KEY`
- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `SUPABASE_ANON_KEY`

Missing from the active local `stg` runtime injection during this check:

- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`

Interpretation:

- missing `PIXEL_STREAMING_STATUS_TIMEOUT_MS` is not currently a staging blocker because the backend runtime has a default and `docker-compose.staging.yml` also defaults it
- required staging Supabase and backend startup names are present

## Staging Env Apply Status

Direct staging env mutation was not performed in this task.

Reason:

- no repo-local automated Vercel env sync convention was found
- no repo-local automated VPS `.env.docker` secret sync convention was found
- existing backend deploy script assumes remote env is already present and only deploys code/container changes

Existing-convention manual apply paths, if an operator needs to reconcile staging secrets later:

Vercel staging preview env:

- use the existing Vercel `app-staging` project
- set only preview/staging values for:
  - `VITE_SUPABASE_URL=<redacted>`
  - `VITE_SUPABASE_ANON_KEY=<redacted>`
  - `VITE_PUBLIC_API_BASE_URL=<redacted>`
  - `VITE_SIGNALING_SERVER_URL=<redacted>`

Hetzner staging backend env:

- update only the staging VPS `/.env.docker` or the existing secure runtime source
- keep values redacted and sourced from Doppler
- required staging names include:
  - `SUPABASE_URL=<redacted>`
  - `SUPABASE_ANON_KEY=<redacted>`
  - `SUPABASE_SERVICE_KEY=<redacted>`
  - `SIGNALING_STATUS_BASE_URL=<redacted>`
  - `UE5_SECRET_KEY=<redacted>`
  - `TURN_SERVER_URLS=<redacted>`
  - `TURN_USERNAME=<redacted>`
  - `TURN_PASSWORD=<redacted>`

If backend code must be redeployed after env reconciliation, the existing repo convention is:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-staging-backend-hetzner.ps1 -AllowDirty
```

That command was not run in this task.

## Staging Smoke Checks Run

Commands and public results:

1. `curl.exe -s -o NUL -w "STATUS %{http_code} https://api-staging.30sek24.com/health\n" https://api-staging.30sek24.com/health`
Result:
- `200`

2. `curl.exe -s https://api-staging.30sek24.com/api/expo/scene | ConvertFrom-Json`
Result:
- HTTP `200`
- `authPolicy=public-readonly`
- `sectors=3`
- `companies=3`
- `booths=3`

3. `curl.exe -s -o NUL -w "STATUS %{http_code} https://staging.30sek24.com/\n" https://staging.30sek24.com/`
Result:
- `200`

4. `curl.exe -s -o NUL -w "STATUS %{http_code} https://staging.30sek24.com/expo-3d\n" https://staging.30sek24.com/expo-3d`
Result:
- `200`

## Result

- staging backend health endpoint is reachable
- staging public scene endpoint is reachable
- staging scene response is structurally valid for the current sponsor boulevard release path
- staging frontend root and `/expo-3d` both return `200`
- there is no evidence from these read-only checks that staging is still pointed at a broken Supabase configuration

## Blockers

- no repo-local automated staging env sync path was found for Vercel preview env
- no repo-local automated staging VPS secret sync path was found for remote `/.env.docker`
- this task did not open a browser-driven DOM smoke run; it verified staging frontend availability by HTTP status only

## Conclusion

- staging currently appears usable for the restored Supabase-backed release path
- direct staging env application was not required to obtain a passing public staging smoke result in this task
- if later secret reconciliation is still needed, use the existing Vercel `app-staging` and Hetzner `/.env.docker` conventions only
