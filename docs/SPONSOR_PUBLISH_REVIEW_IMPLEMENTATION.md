# Sponsor Publish Review Implementation

## Scope

- Date: `2026-06-17`
- Goal: first MVP sponsor publish/review flow
- Change type: minimal runtime + docs diff

## Files Changed

- `src/shared/expo/boothPublicationStatus.ts`
- `backend-server/controllers/expoDataController.ts`
- `src/pages/expo/CompanyAdmin.tsx`
- `docs/SPONSOR_PUBLISH_REVIEW_IMPLEMENTATION.md`

## Existing Status Model Reused

Canonical stored statuses remain:

- `draft`
- `review`
- `approved`
- `active`
- `rejected`
- `archived`

Sponsor-facing label mapping now presents:

- `draft` -> `Draft`
- `review` -> `Submitted`
- `approved` -> `Approved`
- `active` -> `Published`
- `rejected` -> `Rejected`
- `archived` -> `Archived`

## Allowed Transitions

Implemented allowed transitions:

- `draft -> review`
- `review -> approved`
- `review -> rejected`
- `approved -> active`
- `active -> archived`
- `rejected -> draft`

Also allowed:

- same-status saves such as `review -> review`

Not added:

- direct `draft -> approved`
- direct `draft -> active`
- direct `approved -> archived`
- direct `rejected -> review`
- any unarchive path

## Backend Changes

Reused the existing booth update route:

- `PATCH /api/expo/booths/:boothId`

Reused the existing booth create route:

- `POST /api/expo/booths`

No new route was added.

### Validation Added

`backend-server/controllers/expoDataController.ts` now:

- keeps the existing ownership/admin checks
- keeps non-admin restriction against setting approval/publish/archive/reject states directly
- validates booth status transitions before create/update persistence
- returns `400` for invalid transition order
- returns `403` when a non-admin tries to set an admin-only target status

## Frontend Surfaces Changed

Updated existing sponsor/admin surface only:

- `src/pages/expo/CompanyAdmin.tsx`

Behavior changes:

- publication labels shown in the UI now use sponsor-facing wording
- publication status select is constrained to the allowed next statuses for the current booth status
- sponsors can submit `Draft` booths for review
- rejected booths can return to `Draft`
- admins can move:
  - `Submitted -> Approved`
  - `Approved -> Published`
  - `Published -> Archived`
- invalid transitions are blocked client-side before the request is sent

No changes were made to:

- sponsor pricing
- sponsor lead capture data flow
- modular home quote flow
- `/api/expo/scene` contract
- Unreal / Pixel Streaming / GLB workflows

## Public Scene Compatibility

- Public scene compatibility is preserved.
- `active` remains the public scene status.
- `/api/expo/scene` should continue to expose the current published demo scene.
- This task did not change scene filtering logic or scene contract shape.

## Known MVP Limitations

- review feedback and rejection reasons are still lightweight; there is no new structured moderation note model in this step
- no publish audit trail table or migration was added
- no new admin queue page was added; the flow stays inside the existing `CompanyAdmin` and review endpoints
- archive and reject actions are still driven through the existing admin surface rather than a dedicated reviewer dashboard
- no deployment or env work was performed here
