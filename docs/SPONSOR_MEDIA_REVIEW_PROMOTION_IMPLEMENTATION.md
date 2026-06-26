# Sponsor Media Review Promotion Implementation

## Scope

- Date: `2026-06-18`
- Goal: minimal admin approve/reject/promote flow for private sponsor review uploads
- Change type: minimal runtime + docs diff

## Backend Routes / Actions

Existing private upload route remains:

- `POST /api/expo/booths/:boothId/media-review-upload`

New admin-only review route:

- `PATCH /api/expo/booths/:boothId/media-review-uploads`

Payload shape:

- `action`
  - `approve`
  - `reject`
  - `promote`
- `path`
  - existing private review upload path from `assets_3d.media_review.uploads`
- `promoteTarget`
  - `logo`
  - `poster`
  - `hero`
  - only when action is `promote`

Route wiring:

- `backend-server/routes/api.ts`
- `backend-server/controllers/expoDataController.ts`

## Admin-Only Behavior

The new review/promote action is protected by existing admin middleware:

- `adminOnly`

Result:

- sponsors can upload for review
- sponsors can see review statuses
- sponsors cannot approve, reject, or promote uploads
- only admin/reviewer users can change upload review state or public media fields

No service-role credentials are exposed to the frontend.

## Review Statuses

`assets_3d.media_review.uploads` now supports:

- `pending_review`
- `approved`
- `rejected`
- `promoted`

Additional metadata stored when available:

- `reviewedAt`
- `promotedAt`
- `promotedTarget`
- `publicBucket`
- `publicPath`
- `publicUrl`

## Allowed Action Rules

Implemented in shared validation:

- `pending_review -> approved`
- `pending_review -> rejected`
- `rejected -> approved`
- `approved -> rejected`
- `approved -> promoted`

Blocked:

- `promoted -> reject`
- `pending_review -> promote`
- invalid promote target for kind

Promote target rules:

- `logo` upload -> `logo`
- `poster` upload -> `poster`
- `hero` upload -> `hero`
- `reference` upload -> `hero`

There is no direct public field target for a generic `reference` slot beyond hero-style public media.

## Promotion Behavior

Promotion is explicit and admin-triggered only.

Flow:

1. sponsor uploads to private `expo_review_media`
2. upload metadata is stored in `assets_3d.media_review.uploads`
3. admin approves or rejects the upload
4. only approved uploads may be promoted
5. promote copies the file into public `expo_assets`
6. explicit public fields are then updated

No auto-promotion happens on upload or on approval.

## Storage Behavior

Private review source remains:

- bucket:
  - `expo_review_media`

Public release copy on promote goes to:

- bucket:
  - `expo_assets`

Promoted public path shape:

- `review-promoted/{companyId}/{boothId}/{target}/{timestamp}-{safeFilename}`

The original private review upload remains preserved in review metadata for audit/history.

## Public Field Update Rules

Public release fields are updated only by explicit admin promote:

- promote `logo`
  - updates `companies.logo_url`
- promote `poster`
  - updates `companies.poster_url`
  - updates `booths.poster_url`
- promote `hero`
  - updates `companies.hero_asset_url`
  - updates `booths.hero_asset_url`

This keeps `/api/expo/scene` on public URLs only.

Private review bucket paths are not used directly in public scene output.

## Frontend Surface

Updated existing surface only:

- `src/pages/expo/CompanyAdmin.tsx`

Added:

- visible upload status badges
- admin-only approve/reject buttons
- admin-only promote-to-logo/poster/hero buttons for approved uploads
- sponsor-visible status without admin controls
- copy explaining that promoted media becomes public only after explicit admin action

Readiness updates:

- pending uploads count as media submitted
- promoted uploads count as public media ready
- rejected uploads do not count as ready

## Files Changed

- `backend-server/controllers/expoDataController.ts`
- `backend-server/routes/api.ts`
- `src/shared/expo/mediaReviewUpload.ts`
- `src/app/expo/mediaReviewUploadService.ts`
- `src/services/expo.ts`
- `src/pages/expo/CompanyAdmin.tsx`
- `docs/SPONSOR_MEDIA_REVIEW_PROMOTION_IMPLEMENTATION.md`

## Validation

- `npm run build`
- `npm run lint`
- `npm run build` in `backend-server`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- upload helper validation checks
- review/promote helper validation checks

Validated behavior:

- valid PNG upload input accepted
- valid MP4 upload input accepted
- invalid GIF blocked
- oversized image blocked
- approve pending upload allowed
- reject pending upload allowed
- promote approved logo allowed
- promote approved reference to hero allowed
- reject promoted upload blocked
- promote pending upload blocked
- promote poster upload to logo blocked

## Limitations

- no authenticated browser click-through was performed in this task
- no reviewer note field was added
- no rollback transaction exists across storage copy + public field update + managed booth metadata save
- no dedicated admin queue page was added
- reference uploads can be approved and can promote only to the hero public slot path
