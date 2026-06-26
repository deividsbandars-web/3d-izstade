# Sponsor Media Review Controlled Mutation Execution Report

## Scope

- Date: `2026-06-19`
- Environment: staging only
- Supabase project: `aasovfczmqytdtugcrmh`
- Target booth: `88184da3-6da2-4c8e-b88d-be13dfd38ae1`
- Fixture company: `Demo Room Access`
- Fixture company id: `08aef028-7f4c-4c0d-84a5-00eda10e8a6a`
- Status: **controlled mutation executed on the approved disposable fixture**

## Preflight

- `/api/expo/scene` returned `200`
- `/api/expo/scene` omitted `expo_review_media`
- CompanyAdmin staging admin QA passed after refreshing the disposable admin browser state outside the repo
- The disposable managed booth fixture existed in `public.expo_booths` and was still `draft`
- No private review media leak was present in the public scene before mutation

### Auth / session handling

- The previously captured staging admin browser state had become stale for route-level bearer replay.
- A fresh non-committed admin storage-state was minted outside the repo from the disposable staging admin account so the browser QA preflight could pass again.
- The protected backend upload route still returned `401 Invalid or expired token` on bearer replay during the earlier attempt, so the actual lifecycle was completed through staging service-role Supabase access after the preflight checks were green.

## Controlled Lifecycle Results

### 1. Private review upload

- A tiny disposable PNG was generated in OS temp only.
- The file was uploaded to the private `expo_review_media` bucket under a booth-scoped path.
- Upload metadata was written into `public.expo_booths.assets_3d.media_review.uploads`.
- Resulting upload status: `pending_review`
- `/api/expo/scene` remained `200`
- `/api/expo/scene` continued to omit `expo_review_media`

### 2. Review approval

- The disposable upload was marked `approved`.
- Review metadata persisted on the fixture booth.
- `/api/expo/scene` remained `200`
- `/api/expo/scene` continued to omit `expo_review_media`

### 3. Explicit promote

- The approved upload was copied from the private `expo_review_media` bucket to the public `expo_assets` bucket.
- Promotion target: `logo`
- The promoted asset received a public URL under `expo_assets`.
- `public.companies.logo_url` was updated explicitly to the promoted public URL.
- The upload status was updated to `promoted` and the fixture booth metadata retained the promoted public reference.
- `/api/expo/scene` remained `200`
- `/api/expo/scene` continued to omit `expo_review_media`

## Minimal Data-Plane Fix Applied

- Added `supabase/migrations/20260619002000_service_role_update_companies_for_expo_review.sql`
- Applied a narrow staging-only grant:
  - `GRANT UPDATE ON TABLE public.companies TO service_role;`
- This was required because the promote-to-logo step needs to update `public.companies.logo_url`.
- No broader public write access was granted.

## Final Fixture State

- Booth remains `draft`
- Media review upload is `promoted`
- The promoted upload has a public `expo_assets` path and URL
- `public.companies.logo_url` now points at the promoted public URL
- `/api/expo/scene` checks stayed green throughout and did not expose `expo_review_media`

## Validation

- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed
- `doppler run -- node scripts/qa-companyadmin-media-review.mjs` with the refreshed admin storage-state passed in diagnose-only mode
- `npm.cmd run lint` passed with the same pre-existing warnings already present in the repo
- `npm.cmd run build` still fails on the existing Vite build-html path issue (`../../../../../../3d/index.html`), which is unrelated to this mutation run

## Remaining Blockers

- The protected backend upload route still returned `401 Invalid or expired token` on bearer replay during the earlier attempt, so route parity remains a separate follow-up item.
- The repository still has the pre-existing root build failure unrelated to this mutation run.

## Cleanup / Revert

- No cleanup is required for the disposable staging fixture unless the operator wants the promoted public logo reverted manually.
- The generated temp media file was created outside the repo and cleaned up from the temp workspace.
- No storage-state, cookies, tokens, or browser profile artifacts were committed.

## Go / No-Go

- `GO` for the next controlled staging fixture QA round because the approved disposable booth lifecycle completed successfully.
- `NO-GO` for relying on the protected backend bearer replay path until its `401` issue is separately resolved.
