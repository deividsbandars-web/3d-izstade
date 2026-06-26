# Sponsor Media Review Staging Fixture Cleanup Report

## Executive Verdict

**PASS**

The disposable staging sponsor media review fixture cleanup completed successfully on the approved staging fixture and left the public scene contract intact.

## Scope

- Date: `2026-06-19`
- Environment: staging only
- Supabase project: `aasovfczmqytdtugcrmh`
- Fixture id: `88184da3-6da2-4c8e-b88d-be13dfd38ae1`
- Company id: `08aef028-7f4c-4c0d-84a5-00eda10e8a6a`
- Fixture company name observed during cleanup: `Disposable Staging Booth 2026-06-19`
- Cleanup model: archive the disposable booth row and neutralize the disposable media artifacts

## Preflight

- Fresh outside-repo admin storage-state used:
  - `C:\qa\companyadmin\admin-storage-state-cleanup-2026-06-19T19-34-44-109Z.json`
- Protected backend bearer replay passed for `/api/expo/booths/managed`.
- No-token probe returned `401`.
- `/api/expo/scene` returned `200`.
- `/api/expo/scene` omitted `expo_review_media`.
- The target booth row and company row matched the approved fixture ids.
- The cleanup candidate objects were scoped exactly to:
  - private review object under `expo_review_media/08aef028-7f4c-4c0d-84a5-00eda10e8a6a/88184da3-6da2-4c8e-b88d-be13dfd38ae1/`
  - public promoted object under `expo_assets/review-promoted/08aef028-7f4c-4c0d-84a5-00eda10e8a6a/88184da3-6da2-4c8e-b88d-be13dfd38ae1/`
- `public.companies.logo_url` pointed to the disposable promoted test asset before cleanup.
- The human-readable `company_name` had drifted from the older provisioning note, but the immutable fixture id and company id still matched, so cleanup remained safely scoped.

## Cleanup Applied

The cleanup helper `scripts/cleanup-disposable-expo-booth-fixture.mjs` was run in staging-only apply mode with the explicit confirmation gates.

Material steps completed:

1. Cleared `public.companies.logo_url` because it pointed to the disposable promoted asset.
2. Deleted the promoted public storage object from `expo_assets`.
3. Deleted the private review storage object from `expo_review_media`.
4. Cleared the fixture `assets_3d.media_review.uploads` metadata.
5. Archived the disposable `public.expo_booths` row.

## Post-Cleanup Validation

- The protected backend bearer replay still passed.
- The no-token probe still returned `401`.
- `/api/expo/scene` remained `200`.
- `/api/expo/scene` still omitted `expo_review_media`.
- The CompanyAdmin helper still reached `/expo/admin` without auth regression.
- The fixture row now shows `status = archived`.
- The fixture media review upload list is empty.
- `public.companies.logo_url` is `null`.

## Cleanup Outcome

- No active `public.companies.logo_url` points to the disposable test asset.
- The disposable promoted public object was deleted.
- The disposable private review object was deleted.
- The fixture row was archived and its `media_review.uploads` list was emptied.
- No staging production-facing scene regression was introduced.

## Remaining Notes

- The CompanyAdmin read-only helper still reports `adminReviewActionControls: NOT_COVERED` for the now-cleaned fixture because there is no remaining actionable review upload fixture, which is expected after cleanup.
- No production data was touched.

## Next Recommended Step

- Treat the sponsor media review MVP staging workstream as fully cleaned up and close the staging data debt for this fixture.
