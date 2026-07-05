# Staging Backend Auth Env Deployment Fix Report

## Scope

- Date: `2026-06-19`
- Target: `https://api-staging.30sek24.com`
- Goal: make the live staging backend accept the current Supabase admin bearer for protected `/api` routes
- Deployment model: Hetzner VPS Docker Compose staging backend, not Vercel

## Root Cause

- The live staging backend deployment was still loading an old Supabase project ref from its backend environment.
- Redacted audit of the running staging backend container showed the stale ref `gbmxrposlrhctyaaznmj`.
- The repo-side bearer replay diagnostic had already proven the current staging admin session was fresh and valid against the current Supabase project `aasovfczmqytdtugcrmh`, so the remaining failure was in the live backend environment, not token freshness.

## Fix Applied

- Synced the live staging backend environment to the current staging Supabase project values from Doppler.
- Refreshed the backend container on the Hetzner staging host with the updated `.env.docker` values.
- Recreated the staging backend container through the existing Docker Compose deployment path.

## Deployment Details

- Host model: Hetzner VPS
- Service: `backend-staging`
- Compose file: `docker-compose.staging.yml`
- Env file: `.env.docker`
- Result: the running container now reports the current Supabase project ref `aasovfczmqytdtugcrmh`

## Validation Evidence

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed with the same pre-existing warnings already present in the repository.
- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed with:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy -> public-readonly`
  - `sectors -> 5`
  - `companies -> 3`
  - `booths -> 3`
- `scripts/diagnose-backend-bearer-auth.mjs` with a fresh outside-repo staging admin storage-state now reports:
  - current Supabase project ref: `aasovfczmqytdtugcrmh`
  - stale token replay: still rejected as expected when stale/invalid
  - fresh bearer replay: `200`
  - no-token replay: `401`
- The protected staging backend route `/api/expo/booths/managed` now accepts a fresh current admin bearer.

## Notes

- No media review lifecycle mutation was performed in this task.
- `/api/expo/scene` remained `200` and continued to omit `expo_review_media`.
- The separate CompanyAdmin review-action control visibility issue is unrelated to this backend env fix and was left for a follow-up UI/helper task.

## Conclusion

- The live staging backend auth environment is now aligned with the current staging Supabase project.
- Fresh current Supabase admin bearers are accepted by the protected staging backend route.
- Missing/invalid bearer tokens still return `401`.
