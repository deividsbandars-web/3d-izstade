# Phase 19: Backend Domain Boundary Cleanup

## Outcome

Phase 19 tightened the backend expo path into a clearer bounded context without widening into a broad backend rewrite.

The main changes were:

- `backend-server/routes/**` stayed at HTTP routing responsibility.
- `backend-server/controllers/**` became thinner request/response composition surfaces.
- `src/backend/expo/**` gained explicit expo use-case services for booth ownership and expo review flows.
- backend route/controller/expo paths remained forbidden from importing `src/modules/expo/**`.

## What moved out of routes/controllers

### Route cleanup

`backend-server/routes/landing.ts` no longer contains page composition, Supabase access, or analytics side effects.

That logic moved into:

- `backend-server/controllers/landingController.ts`

The route is now route-only:

- define router
- bind `GET /:slug`
- delegate to controller

### Controller cleanup

`backend-server/controllers/expoDataController.ts` no longer owns the expo review/managed-booth domain logic it previously carried.

That logic moved into:

- `src/backend/expo/booths/expoBoothManagementService.ts`
- `src/backend/expo/review/expoReviewService.ts`

The controller now primarily does:

- param extraction
- request validation
- response status mapping
- delegation to expo services/use-cases

## Expo backend bounded-context shape

After this phase the intended boundary is:

- `backend-server/routes/**`
  - HTTP routing only
- `backend-server/controllers/**`
  - request/response composition only
- `src/backend/expo/**`
  - expo backend use-cases and services
- `src/shared/expo/**`
  - shared expo contract and pure data-shaping
- `src/modules/expo/**`
  - frontend/runtime compatibility only

This keeps expo backend behavior out of route files and reduces controller drift into domain logic.

## Boundary checks

Phase 19 added:

- `scripts/check-backend-boundaries.mjs`
- `npm run check:backend-boundaries`

The check currently enforces:

- `backend-server/routes/**` must not import `src/modules/expo/**`
- `backend-server/controllers/**` must not import `src/modules/expo/**`
- `src/backend/expo/**` must not import `src/modules/expo/**`
- `backend-server/routes/**` must not import `src/backend/**` directly
- `backend-server/routes/**` must not import backend-server implementation layers other than controllers/middleware/routes

This complements the existing `check:expo-boundaries` guard rather than replacing it.

## JS/TS duplicate audit

The audit found:

- no `.js` / `.ts` duplicate implementation pairs inside `src/backend/expo/**`

It also found broader duplicate pairs elsewhere under `src/backend/**`, mostly in non-expo domains such as:

- `src/backend/agents/**`
- `src/backend/distribution/**`
- `src/backend/platform/**`
- `src/backend/revenue/**`

Those are documented as broader backend risk, not cleaned in this phase.

## What remains deferred

- `backend-server/controllers/expoDataController.ts` is thinner but still a large controller surface.
- `backend-server/controllers/landingController.ts` still directly imports `src/backend/distribution/analyticsTracker.js`, which is acceptable here but remains a cross-domain dependency.
- broader backend JS/TS duplicate cleanup remains deferred.
- no broad backend domain reorganization was attempted outside the expo path.
