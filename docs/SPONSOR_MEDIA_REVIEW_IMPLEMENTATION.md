# Sponsor Media Review Implementation

## Scope

- Date: `2026-06-17`
- Goal: lightweight MVP sponsor media review workflow
- Change type: minimal runtime + docs diff

## Fields Reused

This step reuses existing managed booth content structures instead of adding new tables or a heavy upload workflow.

Existing sponsor/booth fields and structures reused:

- `assets_3d.sponsor_asset_pack`
  - `logoUrl`
  - `heroImageUrl`
  - `demoVideoUrl`
  - `websiteUrl`
  - `ctaPrimary`
  - `shortPitch`
- `assets_3d.screen_content`
  - existing booth screen image/video reference path
- `contact_info.description`
  - existing general sponsor/admin booth description
- existing booth status workflow:
  - `draft`
  - `review`
  - `approved`
  - `active`
  - `rejected`
  - `archived`

New lightweight review-reference payload reused inside existing JSON storage only:

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

No new database table or migration was added.

## Frontend Changes

Updated existing sponsor/admin surface only:

- `src/pages/expo/CompanyAdmin.tsx`

Added:

- a new `Media Review` section in the existing sponsor/admin booth surface
- sponsor-facing copy explaining that media references are submitted for review before public publish
- admin-facing copy explaining that reviewed media should be checked before moving a booth to `Approved` or `Published`
- text/reference-only fields:
  - logo URL/reference
  - poster URL/reference
  - hero image URL/reference
  - hero video URL/reference
  - website link
  - booking link
  - desired CTA label
  - tagline
  - short media notes

The section does not introduce a new upload pipeline.

## Backend Validation Changes

No new route was added.

Reused existing managed booth save path:

- `PATCH /api/expo/booths/:boothId`
- `POST /api/expo/booths`

Validation changes:

- added a shared sanitizer for `assets_3d.media_review`
- only public HTTPS references are accepted
- image references are constrained to supported image extensions
- video references are constrained to supported video extensions
- local/private/internal URLs are blocked
- embedded credentials are blocked
- free-text fields are trimmed to safe bounded lengths

## Limitations

- no direct public upload flow was added
- no signed uploads, CDN uploads, storage approval queue, or moderation queue was added
- no new public scene field mapping was introduced from `assets_3d.media_review` in this step
- public scene compatibility is preserved because `/api/expo/scene` continues using the existing release-safe response path
- this is still a lightweight sponsor/admin review workflow, not a fully self-service sponsor media management system

## Next Steps

Recommended next step for a fuller workflow:

1. connect reviewed media references to the final approved public-scene mapping intentionally
2. add a reviewed asset handoff path from reference URLs to controlled storage when approved
3. add explicit reviewer notes or approval metadata only if needed after manual QA
4. keep direct public uploads disabled until a reviewed asset workflow is ready
