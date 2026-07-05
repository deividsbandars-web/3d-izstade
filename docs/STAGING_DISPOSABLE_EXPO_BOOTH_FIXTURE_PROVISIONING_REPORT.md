# Staging Disposable Expo Booth Fixture Provisioning Report

## Scope

- Date: `2026-06-19`
- Environment: staging only
- Supabase project: `aasovfczmqytdtugcrmh`
- Status: **fixture provisioned; no media lifecycle mutation performed**

## What Was Done

Applied the minimal staging data-plane migration and inserted one new disposable managed booth fixture in `public.expo_booths`.

### Migration applied

- `supabase/migrations/20260619000000_expo_booths_company_id_and_insert_privileges.sql`

This migration:

- added `company_id` to `public.expo_booths` if it was missing
- granted `INSERT` on `public.expo_booths` to `service_role`

### Provisioning script used

- `scripts/provision-disposable-expo-booth-fixture.mjs`

The script was run with the operator-confirmed staging-only disposable inputs and created a fresh row with a new UUID.

## Fixture Created

- fixture id: `88184da3-6da2-4c8e-b88d-be13dfd38ae1`
- status: `draft`
- company: `Demo Room Access`
- company id: `08aef028-7f4c-4c0d-84a5-00eda10e8a6a`
- owner user id: redacted staging disposable sponsor user
- owner email: redacted staging disposable sponsor email
- booth name: `Disposable Staging Booth 2026-06-19`

## Validation Summary

### Build and lint

- `npm run build` passed
- `npm run lint` passed with the same pre-existing warnings already present in the repo

### Backend smoke

- `doppler run -- node scripts/smoke-backend-supabase.mjs` passed
- `/health -> 200`
- `/api/expo/scene -> 200`
- `authPolicy -> public-readonly`
- `sectors -> 5`
- `companies -> 3`
- `booths -> 3`

### Scene leak check

- `/api/expo/scene` still omits `expo_review_media`

### Service-role probe

- `public.expo_booths` read returned `200`
- the new fixture id is present in `public.expo_booths`

### Admin QA

- existing read-only CompanyAdmin QA remained `PASS` for the staging admin session
- admin render visibility remained green
- no review-upload fixture was exercised in this task

## What Was Not Done

- no sponsor media upload was performed
- no approve/reject/promote action was performed
- no private review media was uploaded
- no public scene asset was changed
- no production data was touched

## GO / NO-GO

- `GO` for the next controlled mutation step because the disposable staging managed-booth fixture now exists and the read-only staging scene/admin checks remain green
- `NO-GO` for any production work or for mutation against any booth other than `88184da3-6da2-4c8e-b88d-be13dfd38ae1`

