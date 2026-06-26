# Sponsor MVP E2E QA Report

## Scope

- Date: `2026-06-18`
- Goal: end-to-end QA pass for the current sponsor MVP workflow
- Workflow surfaces covered:
  - sponsor publish/review status flow
  - media review references
  - sponsor readiness panel
  - public scene compatibility

## Commands Run

- `npm.cmd run build`
- `npm.cmd run lint`
- `node --input-type=module -e "import { canTransitionExpoBoothPublicationStatus } from './src/shared/expo/boothPublicationStatus.ts'; ..."`
- `doppler run -- node scripts/smoke-backend-supabase.mjs`
- source verification:
  - `Get-Content src/pages/expo/CompanyAdmin.tsx`
  - `Get-Content src/shared/expo/boothPublicationStatus.ts`
  - `Get-Content src/shared/expo/mediaReviewReferences.ts`
  - `Get-Content backend-server/controllers/expoDataController.ts`
  - `Get-Content src/backend/expo/booths/expoBoothManagementService.ts`
  - `Get-Content docs/SPONSOR_PUBLISH_REVIEW_QA_CHECKLIST.md`
  - `rg -n "Sponsor Readiness|Media Review|Submit for review|Publish to public scene|Archive booth|Return to draft|Approved|Published|Submitted" src/pages/expo/CompanyAdmin.tsx`

## What Passed

### Build / Lint / Smoke

- root `npm run build` passed
- root `npm run lint` passed with pre-existing warnings only
- backend Supabase smoke helper passed through Doppler
- `/health -> 200`
- `/api/expo/scene -> 200`
- `authPolicy -> public-readonly`
- `sectors -> 3`
- `companies -> 3`
- `booths -> 3`

### Status Transition Validation

Helper-level publication transition checks passed for:

- `draft -> review`
- `review -> approved`
- `review -> rejected`
- `approved -> active`
- `active -> archived`
- `rejected -> draft`

Invalid transitions were confirmed rejected by the helper for:

- `draft -> active`
- `approved -> rejected`
- `rejected -> review`

### Code-Level UI / Backend Contract Verification

Verified from current implementation source:

- `CompanyAdmin` includes a visible `Media Review` section
- `CompanyAdmin` includes a visible `Sponsor Readiness` panel
- `CompanyAdmin` includes sponsor/admin action labels:
  - `Submit for review`
  - `Return to draft`
  - `Publish to public scene`
  - `Archive booth`
- `CompanyAdmin` continues using sponsor-facing status labels:
  - `Draft`
  - `Submitted`
  - `Approved`
  - `Published`
  - `Archived`
- backend route validation in `backend-server/controllers/expoDataController.ts` still rejects invalid booth status transitions
- backend managed-booth payload sanitization in `src/backend/expo/booths/expoBoothManagementService.ts` still sanitizes `assets_3d.media_review`
- media review URL/reference validation in `src/shared/expo/mediaReviewReferences.ts` still blocks non-HTTPS, local/private, credentialed, or unsupported references

## What Was Manually Verified

Manual browser-level verification was **not executed** in this terminal-only QA step.

Not directly clicked through in a live browser session here:

- `CompanyAdmin` page load as sponsor/admin
- visual rendering of the `Sponsor Readiness` panel
- visual rendering of the `Media Review` section
- actual sponsor draft submission in UI
- actual admin approve/publish/archive clicks in UI
- actual booth visibility change in the public scene after a status mutation

These remain covered by the manual checklist in `docs/SPONSOR_PUBLISH_REVIEW_QA_CHECKLIST.md`.

## What Could Not Be Safely Verified Automatically

No safe isolated mutation path was found in current repo conventions for changing live booth workflow states without risk of mutating shared local/staging/managed data.

Because of that, this QA run did **not** perform automated state mutations for:

- `draft -> review`
- `review -> approved`
- `approved -> active`
- `active -> archived`

Reason:

- current sponsor/admin workflow uses the real managed booth update path
- no dedicated repo-documented ephemeral test booth fixture or local-only seed/reset harness was identified for sponsor workflow mutation
- task constraints explicitly prohibit mutating production data and discourage unsafe changes

## Manual QA Steps Required

Use the existing checklist and a clearly isolated non-production booth record:

1. Sign in with a sponsor-capable account and open `/expo/admin`.
2. Confirm `Sponsor Readiness` is visible.
3. Confirm `Media Review` is visible.
4. Open a `draft` booth and verify `Submit for review` is offered.
5. Switch to an admin account and verify a `review` booth can be approved.
6. Verify an `approved` booth can be published.
7. Confirm an `active` booth remains compatible with `/api/expo/scene`.
8. Confirm invalid transitions are not offered in the UI.
9. Confirm archived booths are no longer treated as public-scene eligible.

## Known Blockers

- no isolated automated mutation harness for sponsor booth workflow was found
- no browser automation or dedicated UI smoke runner for `CompanyAdmin` was found in current repo conventions
- lint still reports pre-existing warnings outside this task scope
- sponsor packages smoke endpoint remains unavailable as a safe public read-only backend check

## Go / No-Go Recommendation

Recommendation:

- `Go` for controlled sponsor demo and guided admin review

Conditions:

- keep using the existing manual QA checklist for live status-transition verification
- do not treat this as broad self-service sponsor launch evidence yet

No-go for broader launch confidence yet:

- if manual admin/sponsor transition QA has not been completed on an isolated non-production booth
- if reviewer/operator accounts and booth ownership paths have not been exercised end-to-end
