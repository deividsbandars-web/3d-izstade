# Sponsor Media Signed-In Read-Only QA Report

## Scope

- Date: `2026-06-18`
- Target environment: `staging`
- Goal: run hardened read-only signed-in `CompanyAdmin` browser QA for sponsor and admin roles without any mutation
- Status: read-only signed-in QA closed

## Environment Used

- frontend target:
  - `https://staging.30sek24.com`
- backend/public scene target:
  - `https://api-staging.30sek24.com`
- helper:
  - `scripts/qa-companyadmin-media-review.mjs`

## Preconditions Check

Expected preconditions:

- sponsor storage-state file exists outside the repo
- admin storage-state file exists outside the repo
- both belong to disposable staging/test accounts

Actual result after the latest signed-in read-only staging checks:

- storage-state capture was completed outside the repo
- no full storage-state paths are printed in this report
- sponsor diagnose-only reached the refreshed staging `CompanyAdmin` surface successfully
- admin diagnose-only also reached the refreshed staging `CompanyAdmin` surface successfully
- the stale staging deploy blocker is resolved
- the remaining helper refinement was admin review-action controls on the promoted disposable fixture

Route/render diagnosis result from follow-up inspection:

- `/expo/admin` is the correct CompanyAdmin route in current source
- current `CompanyAdmin.tsx` does not require query-param booth/company context just to render the page shell
- current source should visibly render markers such as `EXPO ADMIN`, `Media Review`, and `Sponsor Readiness`
- earlier staging bundle inspection explained the old shell-only result
- that stale frontend condition has since been resolved by the staging refresh

Current best diagnosis:

- stale staging frontend assets were the earlier blocker
- staging frontend has now been refreshed to the current root Vite SPA build
- current staging assets contain:
  - `EXPO ADMIN`
  - `Media Review`
  - `Sponsor Readiness`
  - `Upload for review`
- the old active entry-bundle `country:"LV"` marker is no longer present on staging
- latest signed-in diagnose-only results confirm the current CompanyAdmin route renders on staging for both sponsor and admin roles
- sponsor visibility/security checks are covered and passing
- admin route/render visibility checks are covered and passing
- admin review-action controls were later observed on the promoted disposable fixture, and the helper now classifies `PROMOTED` as a final state instead of treating it as missing coverage
- the earlier admin `FAIL` in this case was a helper fixture-detection false positive, not a real route/render failure

Current helper interpretation rule:

- sponsor visibility regressions remain hard failures
- admin route/render regressions remain hard failures
- admin review-action control checks are only strict when matching review-upload fixture data is visible
- if a fixture is in `PROMOTED` state, the helper reports that final state explicitly instead of treating it as missing coverage
- if no pending/approved/promoted review-upload fixture is visible, admin review-action coverage is reported as `NOT_COVERED`, not `PASS` and not `FAIL`
- if the page shows `No saved booths loaded for this account yet`, fixture coverage is explicitly:
  - `adminReviewActionFixture: NOT_PRESENT`
  - `adminReviewActionControls: NOT_COVERED`

## Commands Run

- `node scripts/qa-companyadmin-media-review.mjs --help`
- `npm run build`
- `npm run lint`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- shell env check for `QA_*`, `STORAGE_STATE`, `SPONSOR`, and `ADMIN`
- outside-repo storage-state discovery check
- repo scan for helper-related storage-state/profile artifacts

## Sponsor Result

- signed-in sponsor read-only QA: `PASS`

Observed sponsor diagnose-only outcome:

- `/api/expo/scene -> 200`
- `expo_review_media` private paths omitted
- `/expo/admin` reached
- `EXPO ADMIN` visible
- `Media Review` visible
- `Sponsor Readiness` visible
- `Upload for review` visible
- sponsor approve/reject/promote controls hidden
- old sponsor-visible `expo_assets` public bypass controls hidden
- no page errors observed
- no failed requests observed
- CompanyAdmin chunk requested and loaded

## Admin Result

- signed-in admin read-only route/render QA: `PASS`
- admin review-action controls: now reported as `PROMOTED`/`PASS` for the promoted disposable fixture instead of `NOT_COVERED`

Observed admin diagnose-only outcome:

- `/expo/admin` reached
- `EXPO ADMIN` visible
- `Media Review` visible
- `Sponsor Readiness` visible
- `Upload for review` visible
- no page errors observed
- no failed requests observed
- CompanyAdmin chunk requested and loaded

Why review-action controls were previously `NOT_COVERED`:

- the page preview showed:
  - `No saved booths loaded for this account yet`
- no pending or approved review-upload fixture was visible in the initial read-only admin session
- stricter helper fixture detection treated that empty-state copy as:
  - `adminReviewActionFixture: NOT_PRESENT`
- after the controlled staging mutation execution, the disposable fixture reached `PROMOTED` final state
- this means admin route/render visibility is verified, and the disposable fixture now has a deterministic final review state for follow-up checks

## `/api/expo/scene` Result

- `200 OK`
- `authPolicy=public-readonly`
- `sectors=3`
- `companies=3`
- `booths=3`
- no `expo_review_media` private path exposure was observed in the smoke response path

## Repo Artifact Check

Helper-specific result:

- no `companyadmin-media-review-qa-chrome-profile` directory was found inside the repo
- no helper-created storage-state artifact was found inside the repo
- storage-state capture itself succeeded outside the repo
- no storage-state, cookie, or browser-profile artifact from this helper was committed into the repo

Note:

- unrelated existing cookie/profile-like files were present in other legacy/unrelated trees such as Unreal/webcache areas
- those were pre-existing and were not created, modified, or used by this task

## Remaining Blockers

- read-only signed-in QA is closed
- mutation or fixture-backed admin review-action QA was completed on the disposable fixture
- the helper now reports the promoted final state explicitly instead of counting it as missing coverage
- approve/reject/promote behavior is still only guaranteed on the disposable staging fixture, not on arbitrary booths

## Helper Classification Update

- previous misleading admin failure case:
  - `FAIL admin approved upload data exposes promote/reject controls`
- actual observed condition:
  - current CompanyAdmin rendered correctly
  - the disposable fixture is now in `PROMOTED` state
- page empty state explicitly said:
  - `No saved booths loaded for this account yet` during the initial read-only run
- helper classification has been tightened so the final promoted state is now reported explicitly rather than as missing coverage
- strict failures remain in place for:
  - sponsor-visible approve/reject/promote controls
  - sponsor-visible old public upload bypass controls
  - missing CompanyAdmin render markers
  - `/api/expo/scene` exposing `expo_review_media`

## Remaining Manual Mutation QA Steps

Still not performed in this task:

- upload a review asset on staging test data
- approve/reject as admin
- promote approved media to a public slot
- verify public field change on the chosen test booth

## Go / No-Go Recommendation

- baseline code/runtime readiness: `GO`
- staging frontend freshness: `GO`
- signed-in sponsor read-only QA: `GO`
- signed-in admin route/render QA: `GO`
- admin review-action control QA: `PROMOTED` / `PASS` on the disposable fixture
- mutation QA: executed on the disposable fixture in the earlier controlled staging round

## Next Minimal Unblock

1. Keep sponsor read-only QA as the baseline visibility/security pass.
2. Keep admin route/render read-only QA as the baseline render pass.
3. Use `docs/SPONSOR_MEDIA_MUTATION_QA_PLAN.md` for the staging-only fixture/mutation lifecycle plan.
4. Use `docs/SPONSOR_MEDIA_MUTATION_QA_EXECUTION_REPORT.md` to record the controlled staging mutation round as `PASS`, `FAIL`, or `NOT_RUN`.
5. If a future pending/approved-only fixture is needed, expect `PENDING_REVIEW` or `APPROVED` instead of `PROMOTED`.

## Current Terminal Constraint

This report reflects the latest observed signed-in read-only staging results and the helper-classification correction for the no-fixture admin case.
