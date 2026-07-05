# Sponsor Media Review Promotion QA Report

## Scope

- Date: `2026-06-18`
- Goal: QA and bypass audit for sponsor media review/promote flow before any next feature work
- Environment actually exercised:
  - local build/lint/backend build
  - local Doppler-backed backend smoke
  - code-level route and helper audit

## Commands Run

- `npm run build`
- `npm run lint`
- `npm run build` in `backend-server`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- helper validation for `canApplyExpoMediaReviewUploadAdminAction(...)`
- code inspection of:
  - `backend-server/controllers/expoDataController.ts`
  - `backend-server/routes/api.ts`
  - `src/shared/expo/mediaReviewUpload.ts`
  - `src/app/expo/mediaReviewUploadService.ts`
  - `src/services/expo.ts`
  - `src/pages/expo/CompanyAdmin.tsx`
  - `docs/SPONSOR_MEDIA_REVIEW_PROMOTION_IMPLEMENTATION.md`

## Baseline Validation

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

## Route Protection Findings

### Review Upload Route

Route:

- `POST /api/expo/booths/:boothId/media-review-upload`

Protection:

- mounted under `protectedRouter`
- `protectedRouter` uses `authMiddleware`
- upload handler also checks managed booth ownership/admin access through existing managed booth lookup

Conclusion:

- authenticated protected route required
- unauthenticated caller blocked
- non-owner/non-admin blocked

### Review / Promote Route

Route:

- `PATCH /api/expo/booths/:boothId/media-review-uploads`

Protection:

- mounted under `protectedRouter`
- additionally wrapped in `adminOnly`

Conclusion:

- authenticated admin required
- sponsor/non-admin cannot approve, reject, or promote through this route

## Helper Validation Findings

Validated rules:

- approve pending allowed
- reject pending allowed
- promote approved logo allowed
- promote approved reference to hero allowed
- promote pending blocked
- reject promoted blocked
- promote poster to logo blocked

Validated upload input rules:

- valid PNG accepted
- valid MP4 accepted
- invalid GIF blocked
- oversized image blocked

## CompanyAdmin Bypass Audit

## What Was Found

Older direct public asset-pack upload controls still existed in `CompanyAdmin`:

- sponsor asset-pack file uploads use public bucket:
  - `expo_assets`
- sponsor asset-pack UI also exposed:
  - `Send asset pack to booth screen`
  - `Use image on booth screen`
  - `Use video slot on booth screen`

Risk:

- the asset-pack upload itself is not a public scene field by default
- but the same surface could copy sponsor asset-pack media into booth screen content and mark it `Published`
- that made the old public `expo_assets` path an avoidable bypass around the new review-gated media flow

## Minimal Guard Added

Guard applied only in `src/pages/expo/CompanyAdmin.tsx`:

- direct `expo_assets` sponsor asset-pack upload buttons are now disabled for non-admin users
- booth-screen copy controls from sponsor asset-pack are now disabled for non-admin users
- admin workflow is preserved
- sponsor-facing copy now points sponsors to the `Media Review` section for sponsor-submitted assets

## Why This Is Sufficient For This Step

- sponsor review uploads now remain on the private review path
- old public asset-pack uploads remain available only for admin/operator workflow
- no backend contract change was needed for this guard
- no deploy or env change was required

## Signed-In QA Results / Blockers

No safe authenticated browser mutation was run in this terminal-only round.

Blockers:

- no browser automation path was used here
- no safe sponsor/admin session or explicit disposable test data was provided for mutation
- task required avoiding unsafe production data mutation

## Manual Signed-In QA Steps Remaining

Run these on staging or another safe environment with a sponsor account and an admin account:

1. Sign in as sponsor and open `CompanyAdmin`.
2. Confirm `Media Review` upload controls are visible.
3. Upload a review PNG or MP4.
4. Confirm the upload shows `pending review`.
5. Confirm sponsor does **not** see approve/reject/promote controls.
6. Confirm old `expo_assets` asset-pack upload controls show as admin-only/disabled for sponsor.
7. Confirm `Send asset pack to booth screen` controls are disabled for sponsor.
8. Sign in as admin and open the same booth.
9. Confirm pending upload is visible with approve/reject controls.
10. Approve the upload.
11. Confirm promote controls appear only after approval.
12. Promote approved upload to the matching public slot.
13. Confirm public field updates only after promote.
14. Confirm `/api/expo/scene` remains `200`.
15. Confirm `/api/expo/scene` does not include `expo_review_media` bucket paths.

## Go / No-Go Recommendation

- controlled QA/demo: `GO`
- next feature work: only after the signed-in manual QA above is completed once on safe staged data
- broad sponsor launch claims: `NO-GO` until the signed-in sponsor/admin path is manually confirmed end to end
