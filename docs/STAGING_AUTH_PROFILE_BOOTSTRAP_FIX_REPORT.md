# Staging Auth/Profile Bootstrap Fix Report

## Verdict
GO WITH WARNINGS

## What Changed

- Moved the login/register bootstrap flow off direct browser inserts into a protected backend endpoint: `POST /api/auth/bootstrap`.
- Added an idempotent backend bootstrap controller that creates or repairs the authenticated user's `user_profiles` row and a matching company row when needed.
- Added a narrow staging-safe Supabase migration grant so authenticated users can read `public.user_profiles`, which the existing company ownership policy depends on during authenticated reads.
- Removed the direct `companies` and `user_profiles` inserts from `src/pages/Login.tsx`.

## Why It Broke

- The previous signup path wrote `companies` and `user_profiles` directly from the browser.
- The existing `companies` ownership policy resolves through `public.user_profiles`, and the authenticated browser path was hitting `permission denied for table user_profiles`.
- That meant the bootstrap path was brittle both for existing signed-in users and for new registrations.

## Final Fix Shape

- Browser login/register now signs in or signs up, then calls the backend bootstrap endpoint with the active session bearer.
- The backend performs the profile/company repair with the service-role client instead of relying on browser-side table writes.
- `authenticated` now has read access to `public.user_profiles`, which prevents the ownership policy from failing during intended authenticated reads.

## Validation Evidence

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed with the same pre-existing warnings already present in the repository.
- `npm.cmd --prefix backend-server run build` passed.
- `doppler.exe run -- node scripts/smoke-backend-supabase.mjs` passed.
- The login page no longer contains direct `from('"'"'companies'"'"')` or `from('"'"'user_profiles'"'"')` browser writes.

## Live Staging Validation

- The affected existing staging account can sign in again through `/login?next=/expo/admin`.
- The signed-in browser reached `/expo/admin` and showed the current account chip with the ADMIN role marker, plus `LOGOUT` visible and `LOGIN` hidden.
- The browser flow called `/api/auth/bootstrap` and the protected backend bearer replay returned `200` for `/api/expo/booths/managed`.
- The no-token probe against the protected backend route still returned `401`.
- The browser console no longer showed `permission denied for table user_profiles`.
- The browser network trace did not show direct browser writes to `companies` or `user_profiles`.
- A fresh disposable staging registration showed the intended confirmation UX: `Registration successful. Please confirm your email if required and then sign in.`
- `/api/expo/scene` remained `200` and continued to omit `expo_review_media` in staging smoke validation.

## Remaining Warning

- Existing repository warnings remain in lint output, including the pre-existing hook dependency warnings and the benign staging PWA icon warning observed during browser smoke.

## Next Recommended Step

- Keep the auth/profile bootstrap fix in the staging handoff and proceed only if a later unrelated auth regression appears.

