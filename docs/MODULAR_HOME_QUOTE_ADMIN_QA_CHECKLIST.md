# Modular Home Quote Admin QA Checklist

## Scope

- Date: `2026-06-18`
- Change type: documentation only
- Target flow: Modular Home quote/admin follow-through MVP

## Prerequisites

Confirm all of these before manual QA starts:

- Doppler config is selected for the intended environment
- restored Supabase project is active
- backend smoke is green
  - expected baseline:
    - `/health -> 200`
    - `/api/expo/scene -> 200`
    - `authPolicy=public-readonly`
    - `sectors=3`
    - `companies=3`
    - `booths=3`
- root frontend build is green
- tester has:
  - customer-path access for `/modular-homes/studio`
  - admin/operator access for `/modular-homes/quotes`

## Test Surfaces

- Modular Home studio:
  - `/modular-homes/studio`
- Protected quote review:
  - `/modular-homes/quotes`
- Expo home demo fallback:
  - `/expo-3d?homeDemo=1`
- Public scene regression:
  - `/api/expo/scene`
  - `/expo-3d`
- Sponsor regression:
  - `/expo/admin`

## Customer Flow Checks

### Studio Load

Open `/modular-homes/studio` and confirm:

- the page loads successfully
- the Home Design Instance shell is visible
- the studio remains browser-based
- no Unreal, Pixel Streaming, GLB, GLTF, FBX, PlayCanvas, or Babylon copy appears in the MVP path

### Home Design Instance

Confirm the shell sections still render:

- `City Preview`
- `Exterior Design`
- `Floorplan`
- `Interior Rooms`
- `Quote`

Also confirm:

- exterior/options controls still respond
- floorplan section still renders as expected
- interior rooms/panorama placeholder section still renders
- no upload/storage workflow is introduced in these sections

### Quote Form

In the quote section, confirm:

- the quote form opens
- estimate/pricing display still looks consistent with prior preview behavior
- required customer fields are visible:
  - name
  - email
  - phone
  - country/city
  - land owned
  - target build date
  - budget range
  - project message
- consent copy is visible
- no GLB/upload/panorama upload copy appears in the quote request path

## Quote Submission Checks

### Submission Behavior

Confirm the current submission mode behaves as expected for the environment:

- preview/local mode:
  - save action stores the request locally
  - success message is clear
- backend-enabled staging-safe mode:
  - submission uses the existing backend route
  - `POST /api/modular-home/quote`
  - success confirmation is clear

### Failure Handling

Force at least one safe validation failure and confirm:

- missing required fields show readable customer-safe errors
- invalid email shows readable customer-safe error
- no raw secrets are exposed
- no internal stack traces are exposed
- no backend implementation details are shown beyond safe error codes/messages already intended for staging review

## Admin / Operator Checks

Open `/modular-homes/quotes` with an authorized admin/operator account and confirm:

- the page loads as a protected admin review surface
- submitted quote row is visible
- row status is visible
- consultant assignment is visible
- follow-up flag is visible
- internal note is visible
- estimate is visible
- customer contact is visible
- selected model/config summary is visible

### New Follow-Through Visibility

Confirm these new/existing admin visibility elements are present:

- summary card for `Follow-up flagged`
- summary card for `Unassigned`
- `Quote follow-up` panel on selected quote detail
- follow-up category looks understandable
- next-action copy looks understandable

## Admin Follow-Through Checks

Using safe staging/review data only, confirm the current flow works as intended:

- admin can mark or view `follow-up required`
- admin can assign consultant
- admin can add or update internal note
- status history remains understandable after change(s)
- quote detail remains readable after save/refresh

If status mutation is tested, confirm only existing statuses are used:

- `new`
- `contacted`
- `quoted`
- `won`
- `lost`

## Regression Checks

Confirm these still work after modular home quote/admin checks:

- `/api/expo/scene` returns `200`
- `/expo-3d` still loads
- sponsor admin pages still load
- modular home quote pricing display appears unchanged from the existing estimate logic
- no sponsor workflow regression is visible from this step

## Known MVP Limitations

- manual QA is still required for real quote row mutation
- no heavy upload/storage workflow exists
- no GLB/GLTF model upload path exists
- no payment or checkout flow is included here
- no CRM/email automation should be assumed unless already explicitly enabled in the current environment
- follow-up summary remains a lightweight UI heuristic, not a separate workflow engine

## Suggested QA Sequence

1. Open `/modular-homes/studio`.
2. Confirm Home Design Instance shell sections load.
3. Open the quote section and verify estimate/pricing display.
4. Enter required customer data and confirm validation behavior.
5. Submit a quote in the currently allowed mode.
6. Sign in as admin/operator and open `/modular-homes/quotes`.
7. Confirm the new quote row is visible.
8. Confirm consultant assignment, follow-up flag, internal note and status are visible.
9. Confirm `Follow-up flagged`, `Unassigned`, and `Quote follow-up` UI are visible.
10. Update follow-up/admin fields on safe staging/review data only.
11. Re-check `/api/expo/scene` and `/expo-3d`.

## Go / No-Go Recommendation

Go:

- acceptable for controlled demo/admin review after manual QA passes

No-go for broader commercial launch readiness yet:

- do not treat this as broadly launch-ready until real quote submission and admin follow-up are manually verified on staging/production-safe data
- do not treat this as self-service file/media intake workflow
