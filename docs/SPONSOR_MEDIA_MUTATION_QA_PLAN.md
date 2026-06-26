# Sponsor Media Mutation QA Plan

## Scope

- Date: `2026-06-18`
- Environment: staging only
- Goal: prepare a safe sponsor media lifecycle QA round for:
  1. sponsor uploads private review media
  2. admin sees pending review item
  3. admin approves or rejects
  4. admin promotes approved media
  5. promotion copies to public `expo_assets`
  6. public scene fields update only after explicit promote
  7. `/api/expo/scene` never exposes private `expo_review_media`

## Current Audit

Frontend surface:

- `src/pages/expo/CompanyAdmin.tsx`
- sponsor-facing upload controls exist in the `Media Review` section
- admin-only approve/reject/promote controls are rendered only for saved upload rows
- current empty-state copy:
  - `No saved booths loaded for this account yet. Fill the booth details below and save to create one.`

Frontend service layer:

- `src/app/expo/mediaReviewUploadService.ts`
- `src/services/expo.ts`
- upload route:
  - `POST /api/expo/booths/:boothId/media-review-upload`
- admin review/promote route:
  - `PATCH /api/expo/booths/:boothId/media-review-uploads`

Shared media review contract:

- `src/shared/expo/mediaReviewUpload.ts`
- private review bucket:
  - `expo_review_media`
- allowed media kinds:
  - `logo`
  - `poster`
  - `hero`
  - `reference`
- allowed admin actions:
  - `approve`
  - `reject`
  - `promote`
- promote is allowed only from `approved`

Backend implementation:

- `backend-server/controllers/expoDataController.ts`
- upload path:
  - `sponsor-media/{companyId}/{boothId}/{timestamp}-{safeFilename}`
- upload stays private in:
  - `expo_review_media`
- promote copies to public bucket:
  - `expo_assets`
- public fields are updated only during explicit admin promote
- `/api/expo/scene` remains the public contract and must not expose private review paths

## Staging-Only Prerequisites

- staging frontend:
  - `https://staging.30sek24.com`
- staging backend:
  - `https://api-staging.30sek24.com`
- read-only signed-in QA already closed:
  - sponsor visibility: `PASS`
  - admin route/render visibility: `PASS`
  - admin review-action controls: `NOT_COVERED`
- disposable sponsor account exists
- disposable admin account exists
- disposable booth/company fixture exists on staging
- outside-repo storage-state files exist for sponsor and admin
- no production domain, production data, or production accounts are used

## Required Disposable Fixture

Required fixture shape:

- disposable staging company
- disposable staging booth
- sponsor account that owns that booth
- admin account with review/promote permission
- booth appears in `CompanyAdmin`
- fixture may start with no uploads

Preferred identifiers to prepare before mutation QA:

- `QA_TEST_BOOTH_ID`
- optional `QA_TEST_COMPANY_ID`
- sponsor storage-state outside repo
- admin storage-state outside repo

`QA_TEST_BOOTH_ID` requirements:

- must be a real disposable staging booth id
- must not be blank
- must not contain `<` or `>`
- must not use placeholders such as:
  - `disposable-staging-booth-id`
  - `test-booth-id`
  - `booth-id`
  - `placeholder`
  - `todo`
  - `example`

Preferred booth confirmation path:

- choose a booth that exists only for staging QA
- confirm that sponsor and admin test accounts both point to the same disposable booth workflow
- if public `/api/expo/scene` exposes booth ids and the chosen booth id is present there, readiness may proceed directly
- if public `/api/expo/scene` does not expose enough id detail to verify the chosen booth, manual confirmation is required before setting:
  - `QA_CONFIRM_DISPOSABLE_BOOTH=true`

`QA_CONFIRM_DISPOSABLE_BOOTH=true` is allowed only when:

- the booth id is clearly non-placeholder
- the booth fixture was manually confirmed as disposable on staging
- the public scene check is otherwise healthy
- production is not involved

## Safe Test Media Constraints

- small disposable media only
- outside repo or OS temp only
- no real sponsor brand assets
- recommended formats:
  - `.png`
  - `.jpg`
  - `.webp`
- `.mp4` only if explicitly needed and kept small
- recommended image size:
  - <= `5 MB`
- recommended video size:
  - <= `25 MB`

## Expected State Transitions

Upload step:

- request goes through protected backend route
- storage bucket:
  - `expo_review_media`
- upload metadata saved into:
  - `assets_3d.media_review.uploads`
- expected metadata:
  - `bucket`
  - `path`
  - `originalFilename`
  - `mimeType`
  - `size`
  - `uploadedAt`
  - `reviewStatus=pending_review`

Approve / reject step:

- admin only
- approve:
  - `reviewStatus` becomes `approved`
- reject:
  - `reviewStatus` becomes `rejected`
- asset remains private in `expo_review_media`

Promote step:

- admin only
- allowed only from `approved`
- backend copies file from `expo_review_media` to public bucket:
  - `expo_assets`
- upload metadata gains:
  - `publicBucket`
  - `publicPath`
  - `publicUrl`
  - `promotedAt`
  - `promotedTarget`
  - `reviewStatus=promoted`
- only after this step may public company/booth fields update

## Required Assertions

- sponsor cannot approve/reject/promote
- sponsor cannot bypass review using old public upload controls
- admin can see pending review upload row only after sponsor upload
- admin can approve or reject pending upload
- admin can promote only approved upload
- rejected upload does not become public
- promote copies media to `expo_assets`
- `/api/expo/scene` stays `200`
- `/api/expo/scene` does not contain `expo_review_media`
- public scene fields change only after explicit promote

## Rollback / Cleanup

Cleanup target is the disposable fixture only.

After QA:

- remove test upload row if a safe admin cleanup path exists
- or leave it attached only to the disposable fixture and record final state
- if promoted public media was created:
  - remove public reference from disposable booth/company if a safe admin cleanup path exists
  - remove promoted public object from `expo_assets` only if a safe approved cleanup task exists
- do not delete or alter production data

If cleanup is not fully automated:

- record:
  - booth id
  - company id
  - uploaded filename
  - promoted public path
  - final review status

## No-Production Guard

- do not use `www.30sek24.com`
- do not use `api.30sek24.com`
- do not use real sponsor/company assets
- do not run without disposable staging accounts
- do not run without outside-repo storage-state files
- do not run without a disposable booth fixture
- do not run with placeholder booth ids

## Pass / Fail Criteria

Pass:

- sponsor upload succeeds into private review storage
- admin sees a pending review item
- admin approve or reject succeeds
- approved item can be promoted explicitly
- promotion creates public media only after explicit admin action
- `/api/expo/scene` stays healthy and does not expose private paths

Fail:

- sponsor can self-promote
- sponsor can use old public bypass controls
- private `expo_review_media` path appears in `/api/expo/scene`
- promote updates public fields before explicit admin promote
- wrong fixture or non-staging environment is used
- placeholder or unconfirmed booth id is used

## Helper Status

- repo now has a guarded readiness helper:
  - `scripts/qa-companyadmin-media-review-mutation.mjs`
- current status:
  - readiness only
  - dry-run by default
  - refuses production
  - does not upload or mutate
  - refuses placeholder booth ids

## Recommended Next Command

Help:

```powershell
node scripts/qa-companyadmin-media-review-mutation.mjs --help
```

Readiness only after fixture paths are prepared:

```powershell
$env:QA_BASE_URL = "https://staging.30sek24.com"
$env:QA_SPONSOR_STORAGE_STATE_PATH = "<outside-repo sponsor storage-state>"
$env:QA_ADMIN_STORAGE_STATE_PATH = "<outside-repo admin storage-state>"
$env:QA_TEST_BOOTH_ID = "<real-disposable-staging-booth-id>"
$env:QA_TEST_MEDIA_PATH = "<outside-repo tiny test image>"
node scripts/qa-companyadmin-media-review-mutation.mjs
```

If booth existence cannot be verified from public scene ids, only then:

```powershell
$env:QA_CONFIRM_DISPOSABLE_BOOTH = "true"
```

Use that override only after manual confirmation that the booth fixture is disposable staging-only test data.
