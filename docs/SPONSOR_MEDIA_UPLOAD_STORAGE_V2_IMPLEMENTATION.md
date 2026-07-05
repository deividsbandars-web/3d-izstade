# Sponsor Media Upload Storage V2 Implementation

## Scope

- Date: `2026-06-18`
- Goal: minimal private, review-gated sponsor media upload path
- Change type: minimal frontend + backend + one storage migration + docs

## Closeout Status

- follow-up closeout completed on `2026-06-18`
- no additional runtime code fix was required in this pass
- `backend-server/controllers/expoDataController.ts` was rechecked and does **not** contain a duplicate `mimeType` field in uploaded review metadata
- migration status is now aligned on the linked Supabase project
- bucket verification now confirms the review bucket exists remotely as private storage

## Bucket / Policy Choice

Implemented a new private Supabase Storage bucket:

- `expo_review_media`

Migration:

- `supabase/migrations/20260618113000_expo_review_media_storage.sql`

Bucket characteristics:

- `public = false`
- file size limit:
  - `26214400` bytes
- allowed MIME types:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
  - `video/mp4`

Why this choice:

- unreviewed sponsor uploads must not use the existing public `expo_assets` bucket
- backend service-role access already exists in repo conventions
- the minimal safe path is a private bucket plus a backend-managed upload route

## Migration Status

Verified with the already available local Supabase CLI binary:

- CLI path used:
  - cached local Windows Supabase CLI
- CLI version:
  - `2.106.0`
- linked project migration status:
  - local and remote both include `20260618113000_expo_review_media_storage.sql`

Applied safely with the existing Doppler-managed flow:

- `doppler run -- "<local-supabase-cli>" db push --linked`

No destructive Supabase commands were used:

- no `db reset`
- no migration repair
- no remote reset

## Bucket Verification Result

Remote bucket verification now confirms:

- bucket:
  - `expo_review_media`
- `public`:
  - `false`
- file size limit:
  - `26214400`
- allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `video/mp4`

Operational note:

- migration status aligned first
- the Storage API still did not report `expo_review_media`
- bucket existence was then reconciled non-destructively through the existing service-role backend convention
- final verification confirms the bucket now exists with the expected private settings

## Backend Route

Added protected upload route:

- `POST /api/expo/booths/:boothId/media-review-upload`

Route wiring:

- `backend-server/routes/api.ts`
- `backend-server/controllers/expoDataController.ts`

Upload transport:

- protected authenticated request
- raw binary request body
- headers:
  - `X-Media-Kind`
  - `X-Upload-Filename`
  - `Content-Type`

Why raw binary instead of multipart:

- repo did not already contain a multipart parser dependency or convention
- this avoids adding a new upload library for the MVP step
- keeps the diff smaller while still enforcing backend-only upload handling

## Auth / Authorization

The backend route reuses existing sponsor/admin booth ownership protection:

- authenticated Supabase JWT via existing `authMiddleware`
- booth ownership/admin check via existing managed booth lookup

The route rejects:

- missing auth
- missing booth id
- empty body
- invalid booth ownership
- booth without valid company context

## Accepted MIME Types And Size Limits

Implemented upload kinds:

- `logo`
- `poster`
- `hero`
- `reference`

Allowed MIME types:

- images:
  - `image/png`
  - `image/jpeg`
  - `image/webp`
- video:
  - `video/mp4`
  - accepted only for `hero` and `reference`

Size limits:

- images:
  - `5 MB`
- video:
  - `25 MB`

Rejected by backend and frontend validation:

- unsupported MIME types
- oversized files
- empty files
- unsafe filenames

## Storage Path Convention

Uploaded review files are stored under:

- `sponsor-media/{companyId}/{boothId}/{timestamp}-{safeFilename}`

This is generated server-side and uses sanitized path segments.

## Metadata Written To `assets_3d.media_review`

Uploads do not overwrite public release fields.

Instead the backend appends metadata to:

- `assets_3d.media_review.uploads`

Stored metadata fields:

- `bucket`
- `path`
- `originalFilename`
- `mimeType`
- `size`
- `uploadedAt`
- `reviewStatus`
- `kind`

Current review status value:

- `pending_review`

Existing media review text/reference fields remain intact:

- `logoUrl`
- `posterUrl`
- `heroImageUrl`
- `heroVideoUrl`
- `websiteUrl`
- `bookingUrl`
- `ctaLabel`
- `tagline`
- `mediaNotes`

## Review-Gating Behavior

Implemented review-gating rules:

- uploads go to private `expo_review_media`
- frontend never receives service-role credentials
- backend returns metadata only
- uploaded files are not mapped into:
  - `logo_url`
  - `poster_url`
  - `hero_asset_url`
- `/api/expo/scene` is unchanged and does not expose private review media

This means:

- upload counts as media submitted for review
- upload does not count as public scene media publish

## Frontend Changes

Updated existing sponsor/admin surface only:

- `src/pages/expo/CompanyAdmin.tsx`

Added:

- `Upload for review` controls inside the existing `Media Review` section
- per-kind upload actions for:
  - logo
  - poster
  - hero
  - reference
- pending review upload list
- clear copy:
  - uploads are private
  - uploads are not public until approved
  - uploads do not overwrite public booth media automatically

Kept intact:

- existing URL/reference inputs
- existing sponsor publish/review workflow
- existing sponsor readiness panel

Readiness update:

- pending review uploads now count as media submitted for review
- they do not change public-scene publish status

## Files Changed

- `supabase/migrations/20260618113000_expo_review_media_storage.sql`
- `src/shared/expo/mediaReviewUpload.ts`
- `src/shared/expo/mediaReviewReferences.ts`
- `backend-server/routes/api.ts`
- `backend-server/controllers/expoDataController.ts`
- `src/services/serverApi.ts`
- `src/services/expo.ts`
- `src/app/expo/mediaReviewUploadService.ts`
- `src/app/expo/expoDashboardService.ts`
- `src/pages/expo/CompanyAdmin.tsx`
- `docs/SPONSOR_MEDIA_UPLOAD_STORAGE_V2_AUDIT.md`
- `docs/SPONSOR_MEDIA_UPLOAD_STORAGE_V2_IMPLEMENTATION.md`

## Validation Commands

- `npm run build`
- `npm run lint`
- `npm run build` in `backend-server`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- `doppler run -- "<local-supabase-cli>" migration list`
- read-only bucket verification through Doppler-managed service-role access
- local helper validation for:
  - valid PNG
  - valid MP4
  - invalid GIF
  - oversized image

## Limitations

- no public preview URL is returned for private uploads
- no reviewer note or approval-comment model was added
- no promotion/copy flow from private review bucket to public released media bucket was added
- no automatic mapping from pending review upload to booth/public scene media was added
- no heavy DAM, moderation queue, or asset management platform was introduced
- no new sponsor/company/booth/media tables were created

## Next Safe Step

If the workflow needs one more hardening pass later, the safest next step is:

1. add explicit admin approve/promote action from `expo_review_media` to public released asset mapping
2. optionally add reviewer notes for media approval/rejection
3. keep public scene mapping separate from upload persistence

## Remaining Manual QA

- authenticated browser upload in `CompanyAdmin` still remains manual QA
- confirm sponsor/admin session can upload a valid small PNG and MP4 through the new route
- confirm unsupported file types and oversized files are rejected in-browser with safe messages
- confirm pending review uploads remain private and do not appear in `/api/expo/scene`
