# Staging Expo Booths Data Plane Access Fix Report

## Scope

- Date: `2026-06-18`
- Environment: staging only
- Target fixture booth: `684aadc9-b538-4880-a78f-b2285bb3ecbf`
- Status: **minimum data-plane grant applied; controlled mutation still not executed**

## What Changed

Applied an idempotent Supabase migration:

- `supabase/migrations/20260618195500_expo_booths_service_role_privileges.sql`

This grants the backend service-role client the minimum table privileges needed for the managed booth surface:

- `SELECT` on `public.expo_booths`
- `UPDATE` on `public.expo_booths`

No broader public access was added and no sponsor media lifecycle mutation was performed.

## Why This Was Needed

The controlled staging mutation run was blocked by a table-level privilege failure on `public.expo_booths`.

The backend media-review path reads and updates managed booths through `expoService` / `expoBoothStore`, which prefer `public.expo_booths` before any legacy fallback.

The public scene contract remains separate and continues to use `public.booths`.

## Validation Summary

### Read-only scene contract

- `/api/expo/scene` returned `200`
- `/api/expo/scene` still omitted `expo_review_media`

### Admin QA

- CompanyAdmin read-only QA remained `PASS`
- admin account chip showed `ADMIN`
- logout remained visible
- login remained hidden
- `adminReviewActionControls` stayed `NOT_COVERED` because no review-upload fixture row was visible

### Expo booth service-role probe

- `public.expo_booths` is now readable with the staging service-role key
- a targeted read for the approved fixture id returned `200` with an empty result set
- that means the specific fixture id is **not present in `public.expo_booths`** at the moment

### Protected backend booth read

- a direct protected booth read with the current staged admin bearer token still returned:
  - `401 Invalid or expired token`

This indicates a separate route/auth token replay issue remains, even though the browser-side QA session itself is valid.

## Questions Answered

1. What is `public.expo_booths` used for?
   - It is the managed expo booth table used by backend expo booth services for admin/sponsor booth operations and media-review metadata updates.

2. How does it relate to `public.booths` and `/api/expo/scene`?
   - `public.booths` is the public scene table used by `/api/expo/scene`.
   - `public.expo_booths` is the managed admin/backend booth surface and is not exposed through the public scene contract.

3. Which backend routes need to read or write `expo_booths` for sponsor media review?
   - `GET /api/expo/booths/:boothId`
   - `PATCH /api/expo/booths/:boothId`
   - `POST /api/expo/booths/:boothId/media-review-upload`
   - `PATCH /api/expo/booths/:boothId/media-review-uploads`

4. Which Postgres roles need privileges on `expo_booths`?
   - `service_role` needs `SELECT` and `UPDATE` for the backend-managed review flow.
   - `anon` / `authenticated` were not expanded for this fix.

5. Does `service_role` currently lack table-level privileges?
   - It lacked the needed `expo_booths` privileges before the migration.
   - The staging grant is now in place.

6. Are RLS policies present and correct?
   - Existing `expo_booths` RLS policies remain in place and were not changed by this task.

7. Why does protected backend booth read still return `401 Invalid or expired token`?
   - The direct bearer-token replay still fails against the backend auth middleware.
   - The browser QA session itself remains valid, so the remaining issue is likely token replay / backend auth handling rather than the scene data plane.

8. Is the approved fixture id present in `expo_booths`, `booths`, or another table?
   - The targeted read against `public.expo_booths` returned an empty result set for the approved fixture id.
   - The public scene table remains separate and did not expose the private review media path.

9. What is the safest path for the next controlled mutation run?
   - Reconfirm the disposable fixture row exists in `public.expo_booths` before any upload.
   - Re-run the protected backend booth read with a fresh browser-issued token, not a stale replay token.
   - Only then attempt sponsor upload / review lifecycle mutation.

## Go / No-Go

- `NO-GO` for the actual sponsor media mutation lifecycle until the fixture row is confirmed present in `public.expo_booths` and the backend booth auth replay path returns a non-401 response.
- `GO` for the next diagnostic step because the minimum `expo_booths` service-role privilege gap is now closed.

