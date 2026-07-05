# Staging Managed Booth Fixture Reconciliation Report

## Scope

- Date: `2026-06-18`
- Environment: staging only
- Approved fixture id under review: `684aadc9-b538-4880-a78f-b2285bb3ecbf`
- Status: **fixture reconciliation complete; fixture provisioning still pending operator confirmation**

## Executive Summary

The staging data-plane privilege gap is fixed, but the approved booth id does **not** currently exist in the managed booth table used by the sponsor media review backend.

Read-only evidence shows:

- `public.expo_booths` is readable again for the service-role client
- `/api/expo/scene` still returns `200`
- `/api/expo/scene` still omits `expo_review_media`
- CompanyAdmin admin read-only QA still passes
- the approved fixture id `684aadc9-b538-4880-a78f-b2285bb3ecbf` is not present in `public.expo_booths`
- the same id is not present in read-accessible `public.booths`
- the legacy `public.expo_booth` table could not be verified from the current service-role path because it still returns `403` without an explicit grant

## Read-Only Table Probes

### Approved fixture id probe

- `public.booths?id=eq.684aadc9-b538-4880-a78f-b2285bb3ecbf&select=id` -> `[]`
- `public.expo_booths?id=eq.684aadc9-b538-4880-a78f-b2285bb3ecbf&select=id` -> `[]`
- `public.expo_booth?id=eq.684aadc9-b538-4880-a78f-b2285bb3ecbf&select=id` -> `403 permission denied for table expo_booth`

### Baseline table shape probes

- `public.expo_booths?select=*&limit=1` -> `200` with an empty set
- `public.booths?select=*&limit=1` -> `200` with active scene rows

## Why the Current Booth Id Cannot Be Used Yet

The approved fixture id was carried over from earlier planning, but the actual managed booth row is not present in `public.expo_booths`.

The sponsor media review backend prefers `public.expo_booths` first. That table is now reachable, but the row itself is missing, so the lifecycle cannot start there yet.

In addition, the upload path requires a company context:

- `uploadBoothMediaReviewAsset()` calls `getBoothCompanyId(booth)`
- `getBoothCompanyId()` expects `company_id`
- the direct REST probe for `company_id` on `public.expo_booths` returned `42703 column expo_booths.company_id does not exist`

That means the current managed-booth schema does not provide the company linkage required by the upload route as written.

## Current Auth Replay Finding

A protected backend booth read was replayed with the staged admin storage-state token.

The decoded JWT claims show:

- `iss` = `https://aasovfczmqytdtugcrmh.supabase.co/auth/v1`
- `aud` = `authenticated`
- `app_metadata.role` = `admin`
- the token was **expired** (`expiresInSeconds` was negative)

The backend still returned:

- `401 Invalid or expired token`

Conclusion:

- this is a stale bearer-token replay issue, not an issuer/audience mismatch
- it does **not** block the fixture provisioning plan itself
- it does mean any later CLI-style replay should use a fresh browser-issued token or a freshly captured storage-state

## Answers

1. Does `684aadc9-b538-4880-a78f-b2285bb3ecbf` exist in `public.booths`, `public.expo_booths`, or a related managed booth table?
   - `public.booths`: no
   - `public.expo_booths`: no
   - `public.expo_booth`: not verifiable from the current service-role path because it still returns `403`

2. If it exists only in `public.booths`, can it safely be mirrored/cloned into `public.expo_booths`?
   - Not applicable for the approved id, because it does not exist in `public.booths` either.
   - The safest path is to create a new disposable staging managed-booth row in `public.expo_booths`.

3. Is there already another disposable row in `public.expo_booths` that is safer to use?
   - No disposable row was found. The table currently returned an empty set for the approved fixture id probe and no alternate disposable row was identified through the read-accessible probes.

4. What columns are required to create a minimal valid `public.expo_booths` fixture?
   - Required by the repository schema:
     - `company_name`
     - `assets_3d`
     - `contact_info`
     - `status`
     - `created_at`
     - `updated_at`
   - Required by the media-review backend path:
     - `company_id` must be available, because the upload route calls `getBoothCompanyId()`
     - `contact_info.owner_user_id` and/or `contact_info.owner_email` should be set so ownership checks can work
   - Practical default fields for a disposable staging fixture:
     - `industry_sector`
     - `subscription_type`
     - `description`
     - `booth_type`
     - `"3d_model_url"`
     - `logo`
     - `contact_email`
     - `district`

5. Which backend route expects the managed booth row?
   - `POST /api/expo/booths/:boothId/media-review-upload`
   - `PATCH /api/expo/booths/:boothId/media-review-uploads`
   - Supporting managed-booth reads:
     - `GET /api/expo/booths/:boothId`
     - `PATCH /api/expo/booths/:boothId`

6. Why does protected backend booth read return `401 Invalid or expired token`?
   - The replayed bearer token is stale/expired.
   - The token claims still match the current staging project issuer and audience.
   - So the failure is token freshness, not a wrong Supabase project or a malformed header.

7. Is the backend validating JWTs against the current Supabase project `aasovfczmqytdtugcrmh`?
   - Yes, the replayed token issuer points at `https://aasovfczmqytdtugcrmh.supabase.co/auth/v1`.
   - The failure happened because the token was expired, not because the issuer was wrong.

8. Is backend protected booth read required for the next mutation run?
   - Not as a separate prerequisite for the browser-driven mutation path.
   - The actual mutation flow can use the valid staging admin browser session if it obtains a fresh access token.
   - Any direct CLI replay must use a freshly issued token, not the stale stored snapshot.

## Safe Fixture Strategy

The safest staging-only path is:

1. Create a **new** disposable row in `public.expo_booths`.
2. Give it a fresh ID.
3. Attach it to a disposable staging company context via `company_id`.
4. Populate `contact_info.owner_user_id` / `contact_info.owner_email` for the staging sponsor account.
5. Leave `status = 'draft'`.
6. Keep `assets_3d = '{}'::jsonb` and no public media fields.

Do **not** reuse the old approved fixture id, because it is absent from the managed booth table.

## GO / NO-GO

- `GO-PENDING-CONFIRMATION` for a new fixture provisioning step
- `NO-GO` for the media review mutation lifecycle until a fresh disposable `public.expo_booths` row exists and the browser-auth replay uses a fresh token

## Separate Operator-Confirmation SQL / Provisioning Template

Do not run this from Codex in this task. This is the next manual operator step if the staging owner wants to provision a disposable managed-booth fixture:

```sql
-- If the current staging schema still lacks company_id, add it first in a separate operator-approved change.
-- Then create a fresh disposable managed booth fixture for the sponsor media review run.

ALTER TABLE public.expo_booths
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

INSERT INTO public.expo_booths (
  id,
  company_id,
  company_name,
  industry_sector,
  subscription_type,
  assets_3d,
  contact_info,
  status,
  description,
  booth_type,
  "3d_model_url",
  logo,
  contact_email,
  district,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '<staging-company-id>',
  'Disposable Staging Booth',
  NULL,
  'standard',
  '{}'::jsonb,
  jsonb_build_object(
    'owner_user_id', '<staging-sponsor-user-id>',
    'owner_email', '<staging-sponsor-email>'
  ),
  'draft',
  'Disposable staging-only fixture',
  'standard',
  NULL,
  NULL,
  '<staging-sponsor-email>',
  '<canonical-district>',
  NOW(),
  NOW()
)
RETURNING id;
```

Notes:

- The company id and sponsor identity must come from a staging-only disposable account.
- The resulting returned booth id becomes the new controlled-mutation fixture.
- Do not use production data, and do not promote or upload media until the operator explicitly confirms the fixture.

