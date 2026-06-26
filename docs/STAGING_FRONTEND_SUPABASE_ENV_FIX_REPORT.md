# Staging Frontend Supabase Env Fix Report

## Scope

- Date: `2026-06-18`
- Target: `https://staging.30sek24.com`
- Goal: make the root Vite SPA on staging resolve Supabase auth against the current project ref `aasovfczmqytdtugcrmh`

## Root Cause

- The staging frontend was still resolving its hosted Supabase fallback from `src/config/runtimeEnv.ts` to the old project ref `gbmxrposlrhctyaaznmj`.
- The `app-staging` Vercel production env was the active env source for the staging deployment workflow, but it had not been refreshed to the current Supabase values.
- The repo-local `.env` files still contained the old project ref, so a local build alone was not sufficient to fix staging.

## Fix Applied

- Updated the frontend runtime fallback in `src/config/runtimeEnv.ts` to the current hosted Supabase project URL:
  - `https://aasovfczmqytdtugcrmh.supabase.co`
- Removed the stale hardcoded hosted anon key from the source fallback path.
- Updated `src/__tests__/runtimeEnv.test.ts` to reflect the new hosted fallback behavior.
- Hardened the staging deployment wrappers to disable the Vercel update-notifier path on this Windows shell:
  - `scripts/vercel-staging-preview-deploy.mjs`
  - `scripts/vercel-staging-promote.mjs`
- Refreshed the `app-staging` Vercel production env with the current Supabase URL and anon key from Doppler.

## Deployment Target

- Vercel project: `app-staging`
- Staging alias: `staging.30sek24.com`
- Preview deployment URL: `https://app-staging-poe5u2bwq-esaukans-6934s-projects.vercel.app`
- Alias target: `https://staging.30sek24.com`

## Validation Evidence

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed with pre-existing warnings only.
- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed.
- `https://staging.30sek24.com/` returned `200`.
- `https://staging.30sek24.com/login?next=/expo/admin` returned `200`.
- `https://staging.30sek24.com/expo/admin` returned `200`.
- Active staging bundle filename:
  - `assets/index-CNoXGb0E.js`
- Bundle grep results:
  - old ref `gbmxrposlrhctyaaznmj` -> absent
  - current ref `aasovfczmqytdtugcrmh` -> present
- Auth marker checks in the active bundle:
  - `LOGIN` -> present
  - `LOGOUT` -> present
  - `Current account` -> present

## Browser QA Note

- A fresh signed-in browser storage-state replay was not rerun in this shell because no outside-repo storage-state path was supplied here.
- The active bundle evidence confirms the current auth markers are present in the deployed staging build.

## Notes

- The staging deployment path uses `--prod` on the `app-staging` project, so its production env is the relevant env source for the staging alias.
- The old `gbmx...` Supabase project ref should no longer appear in the active staging bundle.
- No database roles were changed in this task.
- No production deployment was performed.
