# Sponsor Media Review MVP Launch Readiness Closeout

## Executive Verdict

**GO WITH WARNINGS**

The staging sponsor media review MVP flow is engineering-ready from a QA standpoint:

- frontend Supabase env is aligned to the current staging project
- backend Supabase env is aligned to the current staging project
- admin auth is working and shows the ADMIN account chip
- protected backend bearer replay now accepts a fresh current admin bearer
- the no-token path still returns `401`
- the disposable staging fixture exists and the controlled lifecycle completed through `private upload -> pending_review -> approved -> promoted`
- the CompanyAdmin helper now reports the promoted final state deterministically with `adminReviewActionControls: PASS`
- `/api/expo/scene` remains stable and continues to omit `expo_review_media`

The remaining items are warnings, not blockers.

## Final Status Table

| Area | Status | Evidence |
| --- | --- | --- |
| Frontend Supabase env | PASS | Staging frontend targets the current Supabase project `aasovfczmqytdtugcrmh` and current bundle markers are present. |
| Backend Supabase env | PASS | Live staging backend env was synced to `aasovfczmqytdtugcrmh` and the running container reports the current ref. |
| Admin auth/JWT | PASS | Fresh admin storage-state shows `ADMIN` in the account chip and `LOGOUT` visible. |
| Protected backend bearer replay | PASS | `GET /api/expo/booths/managed` accepts a fresh current admin bearer. |
| No-token route protection | PASS | No-token probe still returns `401`. |
| Disposable managed-booth fixture | PASS | Disposable fixture `88184da3-6da2-4c8e-b88d-be13dfd38ae1` exists in `public.expo_booths`. |
| Controlled media lifecycle | PASS | Controlled staging lifecycle completed through `pending_review`, `approved`, and `promoted`. |
| CompanyAdmin review-action visibility | PASS | Helper reports `adminReviewActionControls: PASS` and `adminReviewFixtureState: PROMOTED` with `failureCount: 0`. |
| `/api/expo/scene` | PASS | Returns `200` and remains `public-readonly`. |
| `expo_review_media` non-leak | PASS | Smoke and helper checks continue to omit `expo_review_media`. |
| Production untouched | PASS | All work was staging-only; no production deployment or data mutation occurred. |
| Remaining blockers | NOT BLOCKING | No product blocker remains for the staging MVP QA closeout. Optional cleanup/revert of the disposable promoted logo remains operator choice. |

## What Was Proven

- The current staging frontend and backend are aligned to the same Supabase project: `aasovfczmqytdtugcrmh`.
- A fresh current admin bearer is accepted by the protected staging backend route.
- The staging backend still rejects missing tokens with `401`.
- The public scene remains healthy and does not leak private review media.
- The disposable staging fixture can support deterministic review-action QA.
- The CompanyAdmin helper no longer confuses the promoted final state with missing coverage.

## What Was Fixed During the Workstream

- Staging frontend Supabase env alignment was corrected.
- Live staging backend Supabase env alignment was corrected.
- Protected backend bearer replay on the staging `/api` mount was restored.
- The CompanyAdmin media review helper was hardened multiple times and now classifies:
  - `PENDING_REVIEW`
  - `APPROVED`
  - `PROMOTED`
  - `REJECTED`
  - `NOT_PRESENT`
- The helper now reports the promoted disposable fixture as a final state instead of a false `NOT_COVERED`.

## Final QA Evidence

- `npm run build` passed.
- `npm run lint` passed with pre-existing warnings only.
- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed in the recorded validation.
- `doppler run -- node scripts/diagnose-backend-bearer-auth.mjs` with a fresh outside-repo admin storage-state reported:
  - current staging Supabase project: `aasovfczmqytdtugcrmh`
  - fresh bearer replay: `200`
  - no-token replay: `401`
- `doppler run -- node scripts/qa-companyadmin-media-review.mjs` with a fresh outside-repo admin storage-state and diagnose-only mode reported:
  - `adminReviewActionControls: PASS`
  - `adminReviewFixtureState: PROMOTED`
  - `failureCount: 0`
- The controlled staging mutation execution report records the disposable fixture lifecycle as completed.

## Remaining Non-Blocking Warnings

- Existing lint warnings remain in the repo:
  - unused eslint-disable directives under `deployment/signaling/src/paths/*`
  - React hook dependency warnings in `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`
  - React hook dependency warning in `src/ui/Dashboard.tsx`
- The browser QA helper still emits benign browser/runtime warnings:
  - multiple GoTrueClient instances detected in the same browser context
  - PWA manifest icon fetch warning
  - THREE.Clock deprecation warning
- A bare local `doppler run` invocation in this shell previously hit a Windows access-denied issue, but the same smoke check succeeded using the full Doppler executable path.

## Remaining Blockers

- No engineering blocker remains for the staging sponsor media review MVP closeout.
- The disposable promoted staging fixture remains on staging by design; revert is optional and operator-controlled.

## Rollback / Cleanup Notes

- The disposable fixture is staging-only and limited to booth `88184da3-6da2-4c8e-b88d-be13dfd38ae1`.
- No production data was touched.
- The promoted public logo change on the disposable fixture can be reverted manually if the operator wants a clean staging reset.
- No storage-state, cookies, tokens, signed URLs, browser profiles, or generated media were committed.

## Exact Next Recommended Task

If no further staging QA is needed, move to the next operator-approved release step:

1. Keep the current staging fixture report as the engineering QA evidence of record.
2. Decide whether to revert the disposable promoted logo for staging cleanliness.
3. If release work resumes, use the existing production cutover checklist rather than inventing a new flow.
