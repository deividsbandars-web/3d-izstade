# Sponsor Publish Review QA Checklist

## Scope

- Date: `2026-06-17`
- Change type: documentation only
- Target flow: MVP sponsor publish/review

## Prerequisites

Confirm all of these before manual QA starts:

- Doppler config is selected for the intended environment
- restored Supabase project is active and connected through existing env conventions
- backend smoke helper is green
  - expected baseline:
    - `/health -> 200`
    - `/api/expo/scene -> 200`
    - `authPolicy=public-readonly`
    - `sectors=3`
    - `companies=3`
    - `booths=3`
- root frontend build is green
- tester has:
  - sponsor-capable account for booth ownership checks
  - admin account for approval/publish/archive checks

## Test Surfaces

- Sponsor/admin page:
  - `/expo/admin`
- Public scene:
  - `/expo-3d`
- Booth room:
  - `/expo/booth/:id`
- Sponsor packages:
  - `/expo/sponsor-packages`
- Sponsor lead inbox:
  - `/expo/sponsor-leads`
- Public API:
  - `/api/expo/scene`

## CompanyAdmin UI Checks

### Label Mapping

For a booth in each reachable status, confirm the UI shows sponsor-facing labels:

- `draft` shows `Draft`
- `review` shows `Submitted`
- `approved` shows `Approved`
- `active` shows `Published`
- `rejected` shows `Rejected`
- `archived` shows `Archived`

### Draft State

Open a booth in `draft` and confirm:

- status label shows `Draft`
- submit action is visible as `Submit for review`
- sponsor cannot directly choose `Approved`, `Published`, `Rejected`, or `Archived`
- save still works without changing the status

### Review / Submitted State

Open a booth in `review` and confirm:

- status label shows `Submitted`
- sponsor sees waiting/review copy, not public-release copy
- admin sees the `Approve` action
- sponsor does not get a direct publish action

### Approved State

Open a booth in `approved` and confirm:

- status label shows `Approved`
- admin sees `Publish to public scene`
- sponsor does not get a direct publish action
- booth is still not described as public/live until published

### Active / Published State

Open a booth in `active` and confirm:

- status label shows `Published`
- admin sees archive action only where intended
- sponsor does not get archive/publish escalation controls
- UI copy clearly indicates this booth is public-scene eligible/live

### Rejected State

Open a booth in `rejected` and confirm:

- status label shows `Rejected`
- rejection copy instructs the user to return to draft and resubmit
- `Return to draft` action exists if this implementation path is enabled
- direct `Rejected -> Submitted` is not offered

### Archived State

Open a booth in `archived` and confirm:

- status label shows `Archived`
- no accidental public-release action is offered
- no unarchive path is presented in this MVP step

## Backend / API Transition Checks

Use the existing UI or safe authenticated API calls through the current protected route only:

- `PATCH /api/expo/booths/:boothId`

### Allowed Transitions Must Succeed

Confirm these transitions succeed with the expected actor:

- `draft -> review`
  - sponsor or admin
- `review -> approved`
  - admin only
- `review -> rejected`
  - admin only
- `approved -> active`
  - admin only
- `active -> archived`
  - admin only
- `rejected -> draft`
  - confirm only if this path is enabled in the current UI/API

### Invalid Transitions Must Fail

Confirm these transitions fail:

- `draft -> active`
- `approved -> rejected`
- `rejected -> review`

Expected failure behavior:

- invalid transition order returns failure
- non-admin attempts to jump to admin-only states return failure
- UI should not present these invalid next steps under normal usage

## Public Scene Checks

After a valid publish path, confirm:

- `/api/expo/scene` still returns `200`
- active/published booths remain visible in the scene
- the demo scene is not accidentally hidden
- draft, submitted, approved, rejected, or archived-only content does not accidentally replace the public scene unless already `active`

## Regression Checks

Confirm these existing surfaces still load:

- `/expo/sponsor-packages`
- `/expo/sponsor-leads`
- `/expo/booth/:id`
- `/expo-3d`
- `/expo/admin`

Also confirm:

- sponsor package page still shows the current package catalog
- sponsor lead inbox still loads its protected surface
- booth room still loads the browser-based booth instance
- Expo 3D still loads the public sponsor boulevard scene

## Suggested QA Sequence

1. Start with a booth in `draft`.
2. Save a harmless content change and confirm the booth remains `Draft`.
3. Submit the booth for review.
4. Switch to admin and approve the booth.
5. Publish the booth to the public scene.
6. Confirm `/api/expo/scene` is still healthy and the public scene still renders.
7. Archive the booth from admin.
8. Confirm the archived booth no longer behaves like the active publish target.
9. Repeat a negative test for:
   - `draft -> active`
   - `approved -> rejected`
   - `rejected -> review`

## Known MVP Limitations

- no full self-service sponsor media upload flow yet
- no payment or checkout validation yet
- admin authorization still depends on the existing protection model
- no CI integration for the booth status transition helper yet
- no structured moderation notes or full publish audit trail yet
- sponsor media review remains lightweight rather than a full reviewed-asset workflow

## Release Recommendation

Current recommendation:

- acceptable for controlled demo and admin review after manual QA passes

Not yet sufficient for broad sponsor launch:

- do not treat this as broad sponsor self-service launch ready until:
  - manual QA passes end-to-end
  - sponsor media/review path is more complete
  - broader workflow verification is completed
