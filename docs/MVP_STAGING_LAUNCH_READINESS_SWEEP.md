# MVP Staging Launch Readiness Sweep

**Date:** 2026-06-19
**Verdict:** GO WITH WARNINGS

## Scope

Read-only sweep of the current staging MVP release state for:

- root frontend on `https://staging.30sek24.com`
- backend API on `https://api-staging.30sek24.com`
- Supabase project `aasovfczmqytdtugcrmh`
- `/api/expo/scene`
- `/api/expo/booths/managed`
- `/login?next=/expo/admin`
- `/expo/admin`
- CompanyAdmin media review QA helper in diagnose-only mode
- sponsor media review closeout state
- browser console warning state
- build / lint / smoke state
- rollback and recovery notes

No staging data was mutated in this sweep.

## Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Frontend | Ready | Live staging serves the redeployed root bundle at `https://app-staging-83bgpsr99-esaukans-6934s-projects.vercel.app` via `staging.30sek24.com`. |
| Backend | Ready | Staging backend smoke passed and protected routes stayed protected. |
| Auth | Ready | `/login?next=/expo/admin` reaches `/expo/admin`; ADMIN chip, LOGOUT, and hidden LOGIN match the expected state. |
| Scene contract | Ready | `/api/expo/scene` returns `200`, stays public-readonly, and omits `expo_review_media`. |
| CompanyAdmin QA | Ready with documented coverage gap | Diagnose-only helper passed; `NOT_COVERED` on review-action controls remains non-blocking because the disposable fixture was intentionally archived. |
| Browser warnings | Ready with one benign warning | The fixed PWA manifest and Multiple GoTrueClient warnings are gone on live staging; only the documented benign `THREE.Clock` warning remains. |
| Build / lint | Ready | `npm run build` passed; `npm run lint` passed with zero warnings. |
| Rollback | Available | Staging alias promotion and existing backend deployment paths remain the recovery levers if a revert is needed. |

## Checks

### Build and lint

- `npm run build` passed.
- `npm run lint` passed with zero warnings.
- Vite still emitted the existing non-blocking chunk-size warning during build, but the build completed successfully.

### Backend smoke

- `node scripts/smoke-backend-supabase.mjs` passed through the Windows Doppler wrapper.
- `/health -> 200`
- `/api/expo/scene -> 200`
- `expoScene.authPolicy -> public-readonly`
- `expoScene.sectors -> 5`
- `expoScene.companies -> 3`
- `expoScene.booths -> 3`

### Scene contract

- `GET https://api-staging.30sek24.com/api/expo/scene` returned `200`.
- The payload omits `expo_review_media`.
- The payload does not expose private review storage paths.
- The payload does not expose private media-review metadata.

### Protected backend

- `GET /api/expo/booths/managed` without a token returned `401`.
- Fresh bearer replay against the current staging project returned `200`.
- The protected route remains protected.

### Login and admin browser path

- `/login?next=/expo/admin` reaches `/expo/admin`.
- ADMIN chip is visible.
- LOGOUT is visible.
- LOGIN is hidden.
- No `permission denied for table user_profiles` browser error appeared.
- No direct browser writes to `companies` or `user_profiles` were observed.

### CompanyAdmin media review

- `scripts/qa-companyadmin-media-review.mjs` ran in diagnose-only mode.
- The helper did not fail auth.
- The archived fixture is now intentionally outside the live review-action coverage path.
- `NOT_COVERED` for review-action controls is documented and non-blocking because the disposable fixture cleanup is complete.

### Browser warnings

- The fixed PWA manifest icon warning is gone on live staging after redeploy and cache-warmup rerun.
- The Multiple GoTrueClient warning is gone on live staging after redeploy and cache-warmup rerun.
- The remaining `THREE.Clock` warning is still present and is documented as benign runtime noise.

### Deployment evidence

- Current staging frontend deployment target: `https://app-staging-83bgpsr99-esaukans-6934s-projects.vercel.app`
- Current staging alias: `https://staging.30sek24.com`
- Supabase project ref: `aasovfczmqytdtugcrmh`
- Backend smoke and protected-route checks were run on 2026-06-19.

## Rollback Notes

- If the staging frontend must be reverted, repoint the staging alias to the prior known-good preview deployment.
- If the backend needs to be reverted, restore the prior staging backend environment through the existing deployment path rather than changing app code.
- The source-side browser warning cleanup is already committed to the staging bundle; rollback is a staging-only recovery action, not a product change.

## Risk Register

| Risk | Severity | Status | Mitigation | Launch blocker |
| --- | --- | --- | --- | --- |
| Remaining benign `THREE.Clock` warning | Low | Accepted | Documented as benign browser/runtime noise; no functional impact observed. | No |
| Existing Vite build chunk-size warning | Low | Accepted | Build still passes; chunk-size follow-up can be handled separately if needed. | No |
| Windows bare `doppler run` access-denied issue | Low | Mitigated | Use `scripts/run-with-doppler.ps1` or `DOPPLER_BIN` on this machine. | No |
| Admin storage-state expiry / spent-token behavior | Medium | Accepted | Keep the last known good outside-repo storage-state evidence and rerun capture only when needed. | No |
| CompanyAdmin `NOT_COVERED` on archived fixture | Low | Documented | Review-action controls are intentionally out of scope for the cleaned disposable fixture. | No |

## Go / No-Go

**GO WITH WARNINGS**

Reasons:

- The fixed browser warnings are no longer present on live staging.
- The backend smoke and protected-route checks are green.
- The scene contract remains public-readonly and non-leaking.
- Auth/profile bootstrap remains stable.
- The sponsor media review workstream remains closed.

Warnings carried forward:

- benign `THREE.Clock` browser/runtime warning
- existing build chunk-size warning
- Windows local Doppler fallback requirement on this machine
- archived-fixture `NOT_COVERED` classification for CompanyAdmin review-action controls

