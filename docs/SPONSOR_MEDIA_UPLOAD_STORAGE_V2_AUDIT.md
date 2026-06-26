# Sponsor Media Upload Storage V2 Audit

## Scope

- Date: `2026-06-18`
- Goal: determine whether the repo already has a safe reviewed sponsor media upload/storage path
- Initial audit result: existing storage support was present, but it was **not yet safe enough** for the requested review-gated v2 workflow without additional storage/policy work

## Implementation Outcome

Follow-up implementation in this repo round added a safer minimal private review path:

- private bucket:
  - `expo_review_media`
- protected backend upload route:
  - `POST /api/expo/booths/:boothId/media-review-upload`
- upload metadata persistence only in:
  - `assets_3d.media_review.uploads`

What changed versus the original audit state:

- unreviewed sponsor uploads no longer need to use public `expo_assets`
- the new path is backend-managed rather than frontend-direct public URL upload
- uploaded review media stays private and review-gated

Closeout verification result:

- migration `20260618113000_expo_review_media_storage.sql` is now aligned on the linked remote project
- remote bucket `expo_review_media` has been verified as:
  - present
  - `public = false`
  - file size limit `26214400`
  - allowed MIME types `image/jpeg`, `image/png`, `image/webp`, `video/mp4`
- no additional runtime hygiene patch was needed in this closeout pass

What still remains intentionally out of scope:

- no promotion workflow from private review media to public released booth media
- no heavy DAM or moderation platform
- no public-scene mapping changes for private review media

## Files Inspected

- `supabase/migrations/20260603193000_expo_sponsor_assets_storage.sql`
- `src/app/expo/sponsorAssetUploadService.ts`
- `src/backend/expo/booths/expoBoothManagementService.ts`
- `src/app/expo/expoDashboardService.ts`
- `src/pages/expo/CompanyAdmin.tsx`
- `src/shared/expo/mediaReviewReferences.ts`
- `backend-server/controllers/expoDataController.ts`
- `docs/SPONSOR_MEDIA_REVIEW_IMPLEMENTATION.md`

## Current Storage State

### What Already Exists

The repo already contains a Supabase Storage setup for sponsor assets:

- bucket name:
  - `expo_assets`
- migration:
  - `supabase/migrations/20260603193000_expo_sponsor_assets_storage.sql`
- current bucket mode:
  - `public = true`
- current bucket file size limit:
  - `83886080` bytes
- current allowed MIME types include:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `video/mp4`
  - `video/webm`
  - `application/pdf`
  - `model/gltf+json`
  - `model/gltf-binary`
  - `application/octet-stream`

The repo also already contains a direct frontend upload helper:

- `src/app/expo/sponsorAssetUploadService.ts`

This helper:

- uploads through the frontend Supabase client
- requires an authenticated user session
- stores files under:
  - `sponsor-assets/{auth.uid()}/{boothId}/{target}/{timestamp}-{safeFilename}`
- immediately calls `getPublicUrl(...)`
- returns:
  - `publicUrl`
  - `storagePath`

### Current UI Usage

`src/pages/expo/CompanyAdmin.tsx` already uses this upload helper for the existing sponsor asset pack flow.

That existing upload path is described in UI copy as:

- uploaded media to 3D booth preview
- uploads use bucket `expo_assets`
- save booth settings to attach the asset pack

## Existing Review-Gated Support

### What Already Works

The repo already has a lightweight review-reference workflow:

- `assets_3d.media_review`
  - `logoUrl`
  - `posterUrl`
  - `heroImageUrl`
  - `heroVideoUrl`
  - `websiteUrl`
  - `bookingUrl`
  - `ctaLabel`
  - `tagline`
  - `mediaNotes`

This workflow is already:

- persisted through the existing booth save route
- sanitized in:
  - `src/backend/expo/booths/expoBoothManagementService.ts`
- validated in:
  - `src/shared/expo/mediaReviewReferences.ts`
- kept separate from automatic public scene publication

### What Does Not Yet Exist

The repo does **not** currently provide a safe reviewed upload path that satisfies the requested v2 constraints.

Missing pieces:

- no private or review-only sponsor media bucket
- no storage policy that keeps uploaded sponsor media non-public until approval
- no backend upload route that can accept a file and store it without immediate public URL exposure
- no explicit review-state metadata for an uploaded file beyond storing a URL/reference string
- no dedicated scoped upload target for:
  - logo review asset
  - poster review asset
  - hero review asset
- no policy split between:
  - internal reviewed-upload storage
  - public released booth media

## Why The Existing Upload Path Is Not Safe Enough For V2

The current asset-pack upload path should **not** be reused as-is for Sponsor Media Upload/Storage v2.

Reasons:

1. `expo_assets` is currently a public-read bucket.

This means:

- uploaded files become publicly retrievable by URL immediately
- that is incompatible with a stronger interpretation of "no direct unreviewed public uploads"

2. The current upload helper is frontend-direct and returns a public URL immediately.

This means:

- there is no backend-controlled approval gate before the file is publicly addressable
- there is no opportunity to enforce review-only storage before exposure

3. The current bucket allows broader media types than this task allows.

Current bucket allows:

- PDFs
- GLTF / GLB
- GIF
- WEBM
- octet-stream fallback

Requested v2 should support only:

- `image/png`
- `image/jpeg`
- `image/webp`
- `video/mp4` only if safely supported

4. The current storage path is user-scoped, not company/booth review-workflow scoped first.

Current path:

- `sponsor-assets/{auth.uid()}/{boothId}/{target}/...`

Requested v2 target shape:

- `sponsor-media/{companyId}/{boothId}/{timestamp}-{safeFilename}`

The existing shape is not wrong, but it is not the explicit reviewed-media convention requested for this flow.

## Safe Conclusion

The original direct-public asset-pack upload path should still **not** be reused for review-gated sponsor uploads.

That original conclusion remains correct.

The safer minimal v2 implementation therefore uses:

- private bucket `expo_review_media`
- backend upload route
- metadata-only persistence in `assets_3d.media_review`
- no automatic public media overwrite

## Recommended Bucket Design

Recommended reviewed upload bucket:

- `expo_review_media`

Recommended characteristics:

- `public = false`
- tighter MIME allowlist:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `video/mp4` only if explicitly retained
- lower file size limits than the current `expo_assets` bucket

Recommended usage split:

- `expo_review_media`
  - sponsor uploads for review only
- `expo_assets`
  - released/public-facing media after approval handoff only

## Recommended Path Convention

For review uploads:

- `sponsor-media/{companyId}/{boothId}/{timestamp}-{safeFilename}`

Optional stricter variant:

- `sponsor-media/{companyId}/{boothId}/{target}/{timestamp}-{safeFilename}`

Where `target` is one of:

- `logo`
- `poster`
- `hero-image`
- `hero-video`

## Recommended Review-Gated Flow

1. Sponsor signs in and opens `CompanyAdmin`.
2. Sponsor uploads file for review through a minimal backend route.
3. Backend verifies:
   - authenticated user
   - sponsor ownership or admin role
   - allowed MIME type
   - file size
   - safe filename
4. Backend stores file in a **non-public** review bucket/path.
5. Backend writes only review metadata into existing `assets_3d.media_review`, for example:
   - review storage path
   - internal or signed review URL if needed
   - original filename
   - MIME type
   - uploaded timestamp
6. Existing sponsor publish/review workflow remains separate:
   - upload does not publish
   - upload does not overwrite `logo_url`, `poster_url`, or `hero_asset_url`
7. Admin reviews media.
8. Only after approval should a later controlled step promote/copy the asset into the public asset path or map it into released fields.

## Minimal Backend/Frontend Shape Recommended

### Backend

Add only one minimal protected route in the future, for example:

- `POST /api/expo/booths/:boothId/media-review-upload`

Requirements:

- multipart file handling
- sponsor ownership or admin check
- MIME allowlist
- size limit
- filename sanitization
- write to private review bucket only
- no service-role exposure to frontend

### Frontend

Add upload UI only inside existing `Media Review` section:

- `Upload for review`
- `Uploads are not public until approved`
- preserve existing text/reference fields

The upload result should populate only review metadata fields, not public release fields.

## Recommended Next Implementation Prompt

Use this prompt for the next safe implementation step:

`Read PROJECT_CONTEXT_LOCK.md, docs/SPONSOR_MEDIA_UPLOAD_STORAGE_V2_AUDIT.md, docs/SPONSOR_MEDIA_REVIEW_IMPLEMENTATION.md and docs/SPONSOR_PUBLISH_REVIEW_IMPLEMENTATION.md first.

Non-negotiables:

- Preserve the root Vite SPA and backend-server.
- Do not create direct public sponsor uploads.
- Do not expose service-role credentials to the frontend.
- Do not change sponsor pricing, lead logic, quote logic, routes, Docker Compose, Redis, TURN or signaling.
- Do not touch apps/frontend.
- Make a minimal focused diff.

Goal:
Implement the first safe private sponsor media review upload path.

Work only in:

- supabase/migrations only if an explicit private review bucket/policy migration is required
- backend-server upload route/controller wiring
- src/app/expo upload client helpers
- src/pages/expo/CompanyAdmin.tsx
- docs/

Tasks:

1. Add a private Supabase bucket for review-only sponsor media with a strict MIME allowlist and smaller file size limits.
2. Add the smallest protected backend upload route for sponsor/admin review uploads.
3. Store files under sponsor-media/{companyId}/{boothId}/{target}/{timestamp}-{safeFilename}.
4. Persist only review metadata into existing assets_3d.media_review.
5. Do not overwrite public logo_url/poster_url/hero_asset_url automatically.
6. Add CompanyAdmin UI copy:
   - Upload for review
   - Uploads are not public until approved
7. Keep the existing reference fields intact.
8. Update readiness to count uploaded review metadata as media completeness.
9. Run npm run build, npm run lint, backend build if touched, and Doppler backend smoke.`

## Final Recommendation

- Current storage support was useful as groundwork only.
- The direct-public `expo_assets` path should remain separate from review-gated sponsor uploads.
- The minimal private review-upload path is now the correct base for later approval/promote work.
