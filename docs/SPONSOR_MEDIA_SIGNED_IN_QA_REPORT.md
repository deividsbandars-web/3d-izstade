# Sponsor Media Signed-In QA Report

## Scope

- Date: `2026-06-18`
- Target environment: staging-safe validation path preferred
- Goal: confirm sponsor/admin review-promote flow behavior and confirm the old public upload bypass is not sponsor-accessible

## Environment Used

- Local validation:
  - root frontend build
  - root lint
  - `backend-server` build
  - Doppler-backed backend smoke helper
- Code-level audit:
  - protected upload/review routes
  - shared admin action helper rules
  - `CompanyAdmin` sponsor/admin UI guards
- Browser QA helper:
  - `scripts/qa-companyadmin-media-review.mjs`
  - CDP/Chrome read-only helper using env-only configuration
  - default browser profile now stays outside the repo under OS temp storage and is cleaned up automatically by default

No authenticated staging browser session was executed in this terminal round.

## Commands Run

- `npm run build`
- `npm run lint`
- `npm run build` in `backend-server`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- helper validation for review/promote transition rules
- `node scripts/qa-companyadmin-media-review.mjs --help`
- code inspection of:
  - `backend-server/controllers/expoDataController.ts`
  - `backend-server/routes/api.ts`
  - `src/shared/expo/mediaReviewUpload.ts`
  - `src/app/expo/mediaReviewUploadService.ts`
  - `src/services/expo.ts`
  - `src/pages/expo/CompanyAdmin.tsx`

## Baseline Results

- root build: passed
- lint: passed with pre-existing warnings only
- backend build: passed
- backend smoke: passed

Smoke facts:

- `/health -> 200`
- `/api/expo/scene -> 200`
- `authPolicy -> public-readonly`
- `sectors -> 3`
- `companies -> 3`
- `booths -> 3`

## Route Protection Results

Confirmed by code audit:

- `POST /api/expo/booths/:boothId/media-review-upload`
  - protected route
  - requires authenticated user
  - requires valid managed booth ownership/admin context
- `PATCH /api/expo/booths/:boothId/media-review-uploads`
  - protected route
  - additionally requires admin-only access

Result:

- sponsor/non-admin can upload for review only through the protected sponsor path
- sponsor/non-admin cannot approve, reject, or promote uploads

## Helper Validation Results

Validated:

- approve pending allowed
- reject pending allowed
- promote approved logo allowed
- promote approved reference to hero allowed
- promote pending blocked
- reject promoted blocked
- promote poster to logo blocked

Upload validation checks remained correct:

- valid PNG accepted
- valid MP4 accepted
- invalid GIF rejected
- oversized image rejected

## Old Public Upload Bypass Audit

Finding:

- older Sponsor Asset Pack upload controls in `CompanyAdmin` still used public `expo_assets`
- the same surface exposed booth-screen copy actions that could bypass the newer review-gated path for sponsor-visible public-facing booth content

Guard now in place:

- direct Sponsor Asset Pack uploads are hidden from sponsor/non-admin users
- booth-screen copy/public-release controls from that section are hidden from sponsor/non-admin users
- sponsor-facing copy now directs sponsors to the `Media Review` section

Result:

- sponsor self-service bypass through the old public path is no longer exposed in the existing `CompanyAdmin` surface
- admin/operator workflow remains available

## Signed-In QA Execution Status

Automated signed-in browser QA helper now exists, but a real signed-in staging run was not executed in this terminal round.

Why it was not executed:

- no safe disposable sponsor/admin browser credentials were available in this terminal session
- no approved authenticated storage-state file was available in this terminal session
- task constraints required avoiding unsafe staging/production mutation

Hardening note:

- the helper now defaults Chrome profile data to an OS temp path outside the repo
- repo-local profile dirs are refused unless explicitly overridden
- temp profile cleanup runs automatically unless `QA_KEEP_BROWSER=true` or an explicit profile dir is provided
- full local storage-state paths are redacted from helper output

Read-only execution follow-up:

- see `docs/SPONSOR_MEDIA_SIGNED_IN_READONLY_QA_REPORT.md`
- current status there is blocker-based, not pass-based, because sponsor/admin storage-state preconditions were not present locally for execution

## Helper Usage

Read-only sponsor QA:

```powershell
$env:QA_ROLE = "sponsor"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-sponsor.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Read-only admin QA:

```powershell
$env:QA_ROLE = "admin"
$env:QA_STORAGE_STATE_PATH = "C:\\qa\\storage-state-admin.json"
doppler run -- node scripts/qa-companyadmin-media-review.mjs
```

Storage-state reminder:

- keep storage-state files outside the repo
- do not place them under `handoff/`, `docs/`, `scripts/`, `review_artifacts/`, or any repo-local temp folder

Mutation QA:

- `QA_ALLOW_MUTATION` defaults to `false`
- production hosts are refused
- this minimal helper intentionally stops before upload/approve/promote mutation automation
- use only disposable staging/test data and follow the manual steps below

## Manual Signed-In Staging QA Still Required

Run these on staging with disposable sponsor/admin accounts and a non-production booth:

1. Sign in as sponsor.
2. Open `CompanyAdmin` for the test booth.
3. Confirm `Media Review` is visible.
4. Upload a small PNG test file for review.
5. Confirm the upload appears as `pending_review`.
6. Confirm sponsor cannot see approve, reject, or promote controls.
7. Confirm sponsor cannot use old direct `expo_assets` upload controls.
8. Confirm sponsor cannot use old booth-screen public-release shortcuts.
9. Sign in as admin/reviewer.
10. Open the same booth.
11. Confirm the pending upload is visible.
12. Approve the upload.
13. Promote the approved upload to one public slot such as poster or hero.
14. Confirm the public field updates only after explicit promote.
15. Confirm `/api/expo/scene` still returns `200`.
16. Confirm `/api/expo/scene` does not contain `expo_review_media` paths.

What remains manual even after the helper:

- real review upload file selection
- approve/reject click path on authenticated staging data
- explicit promote click path on authenticated staging data
- confirmation that the promoted public field changed on the intended booth only

## Blockers

- no authenticated browser session available here
- no approved staging test account details available here
- no local non-committed authenticated storage-state file available here

## Go / No-Go Recommendation

- code-level and smoke-level readiness: `GO`
- signed-in sponsor/admin staging workflow verification: `PENDING MANUAL QA`
- broad sponsor-facing readiness claim: `NO-GO` until the manual signed-in staging steps above are completed once on disposable test data
