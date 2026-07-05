# Sponsor Media Review MVP Final Clean Closeout

## Executive Verdict

**CLOSED / GO WITH WARNINGS**

The staging sponsor media review MVP workstream is closed. The QA evidence remains preserved in the prior reports, and the disposable staging test debt has been removed from the live staging data plane.

## Final Status Table

| Area | Status | Evidence |
| --- | --- | --- |
| Frontend Supabase env | PASS | Staging frontend was aligned to `aasovfczmqytdtugcrmh` during the workstream and remained healthy through cleanup. |
| Backend Supabase env | PASS | Live staging backend was aligned to `aasovfczmqytdtugcrmh` and accepted fresh admin bearers. |
| Admin auth/JWT | PASS | Live browser validation showed the ADMIN account chip and `LOGOUT` visible. |
| Protected backend bearer replay | PASS | `GET /api/expo/booths/managed` accepted a fresh current admin bearer. |
| No-token route protection | PASS | No-token probe remained `401`. |
| Disposable managed-booth fixture | PASS | Disposable fixture `88184da3-6da2-4c8e-b88d-be13dfd38ae1` was provisioned and then archived/cleaned. |
| Controlled media lifecycle | PASS | Controlled lifecycle completed through `private upload -> pending_review -> approved -> promoted` before cleanup. |
| CompanyAdmin review-action visibility | PASS WITH KNOWN WARNING | Helper passed on the promoted fixture, and after cleanup the fixture is intentionally no longer actionable. |
| `/api/expo/scene` | PASS | Remained `200` throughout and continued to behave as `public-readonly`. |
| `expo_review_media` non-leak | PASS | Scene checks continued to omit `expo_review_media`. |
| Production untouched | PASS | All work was staging-only. |
| Remaining blockers | NOT BLOCKING | No engineering blocker remains for the sponsor media review MVP closeout. |

## What Was Proven

- The current staging frontend and backend point at the same Supabase project: `aasovfczmqytdtugcrmh`.
- The protected staging backend route accepts a fresh current admin bearer.
- The staging backend still returns `401` for missing tokens.
- The public scene stays healthy and never exposes `expo_review_media`.
- The disposable staging fixture could be exercised end-to-end and then cleaned up safely.

## What Was Fixed During the Workstream

- Frontend Supabase env alignment was corrected.
- Backend Supabase env alignment was corrected.
- Protected backend bearer replay was restored.
- The CompanyAdmin media review helper was hardened to classify the fixture state deterministically.
- The disposable staging fixture was provisioned, exercised, and then cleaned up.
- The cleanup helper was adjusted to key off immutable ids and object ownership instead of a drifting human-readable company label.

## Final QA Evidence

- `npm run build` passed.
- `npm run lint` passed with the same pre-existing warnings already present in the repository.
- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed.
- `doppler run -- node scripts/diagnose-backend-bearer-auth.mjs` with the outside-repo admin storage-state passed:
  - current Supabase project ref: `aasovfczmqytdtugcrmh`
  - fresh bearer replay: `200`
  - no-token replay: `401`
- `doppler run -- node scripts/qa-companyadmin-media-review.mjs` in diagnose-only mode with the same storage-state passed before cleanup on the promoted disposable fixture.
- After cleanup, the fresh bearer replay still passed and `/api/expo/scene` still omitted `expo_review_media`.

## Cleanup Status

- `public.companies.logo_url` was cleared because it pointed to the disposable promoted asset.
- The disposable public `expo_assets` object was deleted.
- The disposable private `expo_review_media` object was deleted.
- The fixture `assets_3d.media_review.uploads` metadata was cleared.
- The disposable `public.expo_booths` row was archived.

## Remaining Non-Blocking Warnings

- Existing lint warnings remain in the repo.
- The browser/runtime helper still emits benign warnings:
  - multiple GoTrueClient instances detected in the same browser context
  - PWA manifest icon fetch warning
  - THREE.Clock deprecation warning
- A bare local `doppler run` still hits a Windows access-denied issue in this shell, so `scripts/run-with-doppler.ps1` or the explicit Doppler executable path remains the reliable local smoke command here.

## Remaining Blockers

- None for the sponsor media review MVP staging closeout.

## Rollback / Cleanup Notes

- The disposable fixture is archived and neutralized on staging.
- No production data was touched.
- No storage-state, cookies, tokens, signed URLs, private media paths, generated media, uploaded media, or browser profiles were committed.

## Exact Next Recommended Task

- Move on to the next operator-approved release item; no further sponsor media review MVP staging cleanup is required.
