# CompanyAdmin Review Action Controls Visibility Fix Report

## Scope

- Date: `2026-06-19`
- Target environment: `staging`
- Goal: make the CompanyAdmin media review QA helper report the disposable staging fixture’s final promoted state deterministically instead of misclassifying it as missing coverage

## Background

- Live staging auth/backend/data-plane state is green:
  - frontend/backend Supabase project: `aasovfczmqytdtugcrmh`
  - `/api/expo/scene -> 200`
  - `/api/expo/scene` omits `expo_review_media`
  - protected backend bearer replay now passes for the current admin bearer
  - the disposable staging fixture `88184da3-6da2-4c8e-b88d-be13dfd38ae1` exists
- The fixture is currently in the `promoted` final state from the controlled staging mutation run.
- The helper previously treated that promoted state as a generic actionable review fixture and then failed because `approve` / `reject` / `promote` controls are not supposed to remain visible on a promoted item.

## Root Cause

- `scripts/qa-companyadmin-media-review.mjs` was only distinguishing between:
  - no fixture
  - pending/approved fixture
- It did not classify the final `promoted` state separately.
- That caused the helper to keep expecting review-action buttons on a final promoted upload and to emit a false failure.

## Fix Applied

- Updated `scripts/qa-companyadmin-media-review.mjs` so it now classifies fixture state as:
  - `PENDING_REVIEW`
  - `APPROVED`
  - `PROMOTED`
  - `REJECTED`
  - `NOT_PRESENT`
- Added a promoted-state branch so the helper now reports the final promoted state explicitly and treats hidden review buttons as the expected outcome.
- Kept strict behavior for the real actionable states:
  - pending review -> expect Approve / Reject controls
  - approved -> expect Promote control

## Validation Evidence

- `node --check scripts/qa-companyadmin-media-review.mjs` passed.
- `npm.cmd run build` passed.
- `npm.cmd run lint` passed with the same pre-existing warnings already present in the repository.
- `& 'C:\\Users\\esauk\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Doppler.doppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\doppler.exe' run -- node scripts/smoke-backend-supabase.mjs` passed.
- `doppler run -- node scripts/qa-companyadmin-media-review.mjs` with the fresh outside-repo admin storage-state now reports:
  - `CompanyAdmin media review QA: PASS (admin)`
  - `adminReviewActionControls: PASS`
  - `adminReviewFixtureState: PROMOTED`
  - `failureCount: 0`

## Notes

- No production data was touched.
- No media review lifecycle was rerun.
- No backend auth or route protection was weakened.
- No `/api/expo/scene` leak regression was introduced.

## Conclusion

- The CompanyAdmin media review helper now reports the disposable promoted fixture deterministically.
- The helper no longer misclassifies the promoted final state as missing coverage.
- Review-action visibility remains strict for pending and approved fixtures.
