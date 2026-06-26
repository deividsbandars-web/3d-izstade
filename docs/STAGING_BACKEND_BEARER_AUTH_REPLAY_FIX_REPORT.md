## 2026-06-19 staging backend bearer replay diagnostic

> Historical diagnostic from before the live staging backend env sync. The current fix and validation live in `docs/STAGING_BACKEND_AUTH_ENV_DEPLOYMENT_FIX_REPORT.md`.

### Summary

The replay path was diagnosed with a fresh, refreshed admin session from outside-repo storage-state. The result is a **NO-GO** for a repo-side auth fix:

- the Supabase session refresh succeeds
- the refreshed bearer belongs to the current staging project `aasovfczmqytdtugcrmh`
- the refreshed user is the expected admin account
- the real staging API route still returns `401 Invalid or expired token`

This means the token freshness problem is not the root cause. The live staging backend deployment still rejects a valid refreshed admin bearer token on the `/api` mount.

### Inputs Used

- `QA_BASE_URL=https://staging.30sek24.com`
- `QA_API_BASE_URL=https://api-staging.30sek24.com`
- `QA_TARGET_PATH=/api/expo/booths/managed`
- `QA_STORAGE_STATE_PATH=%TEMP%\\admin-storage-state-fresh.json`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` from Doppler

### Diagnostic Helper

Added:

- `scripts/diagnose-backend-bearer-auth.mjs`

Purpose:

- load outside-repo Playwright storage-state
- refresh the Supabase session
- decode the stale and refreshed JWT claims without printing token values
- replay a protected staging backend route with a refreshed bearer
- confirm the no-token negative path still returns `401`

### Evidence

- Storage-state key present: `sb-aasovfczmqytdtugcrmh-auth-token`
- Supabase claims on the stored token:
  - issuer: current staging Supabase project
  - audience: `authenticated`
  - role: `admin`
  - not expired at diagnostic time
- Supabase claims on the refreshed token:
  - issuer: current staging Supabase project
  - audience: `authenticated`
  - role: `admin`
  - not expired at diagnostic time
- `supabase.auth.getUser(freshAccessToken)` succeeded and returned the expected admin user
- no-token replay against `/api/expo/booths/managed` returned `401`
- refreshed bearer replay against `/api/expo/booths/managed` also returned `401 Invalid or expired token`

### Conclusion

- The staging backend route is still rejecting a valid fresh admin bearer.
- The issue is not stale storage-state freshness.
- No repository-side backend code fix was applied because the live staging backend appears to need an environment or deployment correction outside this repo.
- `/api/expo/scene` remained `200` and continued to omit `expo_review_media`.
- CompanyAdmin admin read-only QA remained `PASS`.

### Next Action

Check the deployed staging backend environment / deployment path for the current Supabase auth configuration before attempting any more protected-route replay work.
