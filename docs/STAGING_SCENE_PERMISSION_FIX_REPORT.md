# Staging Scene Permission Fix Report

## Problem

`/api/expo/scene` started failing on staging with:

- `500`
- `permission denied for table sectors`

The backend scene smoke had previously been green, and the public scene contract still needed to stay `public-readonly` while keeping `expo_review_media` private.

## Root Cause

The public Expo scene path reads `public.sectors`, `public.companies`, and `public.booths`.

The restored staging database had the RLS policies in place, but it was missing table-level `SELECT` grants for the scene tables. That caused the backend smoke to fail even though the code path itself was correct.

## Minimal Fix

Added one idempotent Supabase migration:

- `supabase/migrations/20260618194500_expo_public_scene_select_grants.sql`

It grants read access for the public scene tables to:

- `anon`
- `authenticated`
- `service_role`

The private sponsor media review bucket was not changed.

One tiny TypeScript compatibility fix was also kept in the scene builder to satisfy the build:

- `src/backend/expo/sceneBuilder.ts`

## Validation

Commands run:

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run build` inside `backend-server`
- `doppler run -- npx.cmd supabase db push --linked`
- `doppler run -- npx.cmd supabase migration list --linked`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- `doppler run -- node backend-server\node_modules\tsx\dist\cli.mjs -e ...` for a non-secret scene payload sanity check

Results:

- Root build passed.
- Lint passed with the existing repository warnings only.
- Backend-server build passed.
- Supabase push applied the new grant migration to the linked staging project.
- Migration list showed the new migration as applied remotely.
- Backend smoke passed:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy -> public-readonly`
  - `sectors -> 5`
  - `companies -> 3`
  - `booths -> 3`
- Scene payload sanity check confirmed:
  - `containsPrivateBucket -> false`

## Safety Notes

- No production data was mutated.
- No private review-media bucket paths were exposed through `/api/expo/scene`.
- No frontend auth UX changes were made in this task.
- No unrelated backend routes were changed.

