# Controlled MVP Demo Execution Report 2026-06-18

## Scope

- Execution date: `2026-06-18`
- Runbook used: `docs/CONTROLLED_MVP_DEMO_RUNBOOK_20260618.md`
- Environment used for live checks: `staging`
- Execution mode: read-only validation plus code-backed UI evidence

This report does not claim a full authenticated browser walkthrough.

## Why Staging Was Used

The runbook prefers staging first unless production-safe read-only checks are specifically needed.

This execution therefore used:

- frontend: `https://staging.30sek24.com`
- backend: `https://api-staging.30sek24.com`

No production mutation was attempted.
No staging mutation was attempted.

## Commands and Checks Run

### Read-Only HTTP Checks

- `curl.exe -sS -D - -o NUL https://api-staging.30sek24.com/health`
- `curl.exe -sS https://api-staging.30sek24.com/api/expo/scene`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo-3d`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/admin`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/sponsor-packages`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/sponsor-leads`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/studio`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/modular-homes/quotes`
- `curl.exe -sS -D - -o NUL https://staging.30sek24.com/expo/booth/413f451f-0825-4afb-b7ca-51457df181ee`

### Backend Smoke

- `doppler run -- node scripts/smoke-backend-supabase.mjs`

### Route and UI Evidence Checks

- `rg -n "expo/admin|expo/sponsor-packages|expo/sponsor-leads|expo/booth/:|modular-homes/studio|modular-homes/quotes|expo-3d" src/App.tsx src/pages -g '!apps/frontend/**'`
- `Get-Content src/App.tsx`
- `rg -n "Sponsor Readiness|Media Review|Submit for review|Publish to public scene|Archive booth|Return to draft|Draft|Submitted|Approved|Published|Archived" src/pages/expo/CompanyAdmin.tsx`
- `rg -n "City Preview|Exterior Design|Floorplan|Interior Rooms|Quote|Quote follow-up|Follow-up flagged|Unassigned" src/modules/expo/runtime/modularHome src/pages/modularHome`
- `Get-Content src/shared/expo/boothPublicationStatus.ts`
- `Get-Content src/shared/expo/mediaReviewReferences.ts`

## URLs Checked

### Backend

- `https://api-staging.30sek24.com/health`
- `https://api-staging.30sek24.com/api/expo/scene`

### Frontend

- `https://staging.30sek24.com/expo-3d`
- `https://staging.30sek24.com/expo/admin`
- `https://staging.30sek24.com/expo/sponsor-packages`
- `https://staging.30sek24.com/expo/sponsor-leads`
- `https://staging.30sek24.com/modular-homes/studio`
- `https://staging.30sek24.com/modular-homes/quotes`
- `https://staging.30sek24.com/expo/booth/413f451f-0825-4afb-b7ca-51457df181ee`

## Pass / Fail Results

### Passed

- staging backend `/health -> 200`
- staging backend `/api/expo/scene -> 200`
- `/api/expo/scene` returned:
  - `authPolicy=public-readonly`
  - `sectors=3`
  - `companies=3`
  - `booths=3`
- staging frontend `/expo-3d -> 200`
- staging frontend `/expo/admin -> 200`
- staging frontend `/expo/sponsor-packages -> 200`
- staging frontend `/expo/sponsor-leads -> 200`
- staging frontend `/modular-homes/studio -> 200`
- staging frontend `/modular-homes/quotes -> 200`
- staging frontend booth route `/expo/booth/413f451f-0825-4afb-b7ca-51457df181ee -> 200`
- local Doppler-backed backend smoke passed:
  - `/health -> 200`
  - `/api/expo/scene -> 200`
  - `authPolicy=public-readonly`
  - `sectors=3`
  - `companies=3`
  - `booths=3`

### Passed As Code-Backed Evidence

These were confirmed from the canonical root frontend and shared workflow code:

- the root app defines routes for:
  - `/expo/admin`
  - `/expo/sponsor-packages`
  - `/expo/sponsor-leads`
  - `/expo-3d`
  - `/expo/booth/:id`
  - `/modular-homes/studio`
  - `/modular-homes/quotes`
- `CompanyAdmin` contains:
  - `Media Review`
  - `Sponsor Readiness`
  - `Submit for review`
  - `Return to draft`
  - `Publish to public scene`
  - `Archive booth`
- sponsor-facing booth status labels remain:
  - `Draft`
  - `Submitted`
  - `Approved`
  - `Published`
  - `Archived`
- booth publication rules still map public-scene eligibility to `active`
- media review references still use controlled HTTPS-only validation with blocked local/private/internal URLs
- modular home surfaces still expose:
  - `City Preview`
  - `Exterior Design`
  - `Floorplan`
  - `Interior Rooms`
  - `Quote`
- modular home admin review still exposes:
  - `Follow-up flagged`
  - `Unassigned`
  - `Quote follow-up`

### Not Fully Verified In Live Browser

The following were not directly executed in an authenticated interactive browser session in this terminal-only task:

- live sponsor sign-in and visual load of `/expo/admin`
- visible rendering of `Media Review` and `Sponsor Readiness` after auth
- live click-through of sponsor draft submission
- live admin approve/publish/archive actions
- visual confirmation that the sponsor boulevard rendered correctly on screen
- visual confirmation of booth-room presentation details in a browser
- visual confirmation that modular home studio sections rendered correctly after hydration
- live admin/operator interaction inside `/modular-homes/quotes`

## Sponsor Demo Script Execution Result

### What Was Confirmed

- sponsor packages route is present in the canonical frontend and returns `200` on staging
- sponsor/admin route is present in the canonical frontend and returns `200` on staging
- booth/admin source evidence shows:
  - sponsor-facing status labels are in place
  - media review references are in place
  - sponsor readiness panel is in place
  - publish/review messaging remains controlled and manual-review oriented

### What Was Not Safely Clicked

- no authenticated sponsor/admin browser session was used here
- no booth status mutation was executed
- no staging data was changed

## Expo 3D Demo Script Execution Result

### What Was Confirmed

- `/expo-3d` returns `200` on staging
- `/api/expo/scene` returns valid sponsor-boulevard scene payload
- returned scene data confirms non-zero:
  - sectors
  - companies
  - booths
- booth room route returns `200` on staging for a known booth id from the live scene payload
- current docs and source context remain aligned to a browser-based MVP path, not an Unreal or GLB-first baseline

### Manual Observation Limitation

This task did not include a live browser viewport, so sponsor boulevard visibility was inferred from:

- healthy route response
- healthy scene payload
- existing route wiring

## Modular Home Demo Script Execution Result

### What Was Confirmed

- `/modular-homes/studio` returns `200` on staging
- `/modular-homes/quotes` returns `200` on staging
- source evidence confirms the Home Design Instance shell still exposes:
  - `City Preview`
  - `Exterior Design`
  - `Floorplan`
  - `Interior Rooms`
  - `Quote`
- source evidence confirms the quote admin review surface still exposes:
  - `Follow-up flagged`
  - `Unassigned`
  - `Quote follow-up`

### What Was Not Safely Clicked

- no authenticated admin/operator session was used on `/modular-homes/quotes`
- no quote row was changed
- no quote submission was attempted against shared staging data

## Manual Observations / Screenshots

No screenshots were captured in this task.

Textual observation standard used here:

- live HTTP route availability
- live scene payload health
- code-backed confirmation of required UI labels and sections
- no claim of interactive authenticated completion where none occurred

## Blockers

### Blocker 1: No Interactive Browser Session In This Task

Reproducible condition:

- terminal-only execution with no authenticated browser automation harness

Effect:

- protected UI routes can be confirmed as reachable
- protected UI state after auth cannot be visually confirmed here

### Blocker 2: No Safe Automated Mutation Harness For Sponsor Workflow

Reproducible condition:

- no isolated staging-only booth status mutation harness is documented in repo conventions

Effect:

- sponsor publish/review steps remain manual QA items
- no live status transitions were executed in this report

### Blocker 3: No Safe Automated Mutation Harness For Modular Home Quote Follow-Through

Reproducible condition:

- no isolated staging-only quote submission/update harness was used in this task

Effect:

- quote/admin mutation path remains a manual QA item

## Demo-Safe Claims

These claims are supported by this execution plus prior repo QA evidence:

- the current platform is suitable for a controlled demo review
- staging backend health and public scene contract are green
- staging Expo 3D route is reachable
- sponsor/admin, sponsor packages, sponsor leads, booth room, modular home studio, and modular home quote review routes are all reachable on staging
- sponsor workflow direction is controlled review before public publish
- Web Booth Studio direction is browser-based
- Expo 3D remains the canonical browser-based public path
- modular home workflow is browser-based and manual-review oriented
- the current modular home MVP is not GLB-first

## Claims That Must Not Be Made Yet

- do not claim full sponsor self-service upload is complete
- do not claim payment or checkout is verified
- do not claim CRM/email automation is verified
- do not claim broad paid sponsor launch readiness
- do not claim a fully automated sponsor publish/review workflow
- do not claim full automated quote/admin follow-through verification
- do not claim Unreal or Pixel Streaming is the MVP baseline

## Recommendation For Next Feature

Recommended next feature:

- `sponsor media upload/storage v2`

Why this is the best next step:

- the controlled demo now clearly shows sponsor packages, readiness, media review references, and publish/review status flow
- the largest remaining sponsor-facing capability gap is still the reviewed-media workflow beyond lightweight URL/reference entry
- this closes a more immediate sponsor demo-to-operator gap than payment/checkout
- payment/checkout should follow after sponsor media flow is clearer
- quote follow-up hardening remains important, but the sponsor-facing release path is still the primary canonical MVP surface

Recommended order after this:

1. sponsor media upload/storage v2
2. quote follow-up hardening on safe staging test data
3. payment/checkout readiness only after workflow completeness improves

## Overall Recommendation

- `Go` for controlled operator-led demo on staging
- `No-go` for broad self-service or paid launch claims

The next feature round should stay focused on workflow completeness rather than new platform surface area.
