# Phase 21: Distribution Domain Boundary Hardening + Safe Duplicate Elimination

## Selected domain

Phase 21 applied the Phase 19/20 backend model to:

- `src/backend/distribution/**`

This domain was selected because it had:

- a real HTTP-facing path through `backend-server/controllers/landingController.ts`
- orchestration logic mixed into the controller
- visible `.js` / `.ts` duplicate pairs
- a clear opportunity to prove safe duplicate elimination without touching expo or frontend

## Before

Before this phase:

- `landingController.ts` directly owned:
  - landing-page query composition
  - Supabase page loading
  - distribution analytics triggering
  - HTML response assembly
- there was no distribution application-layer boundary for controller-facing use-cases
- distribution duplicate pairs still existed in source:
  - `analyticsTracker`
  - `communityPublisher`
  - `contentScheduler`
  - `socialPublisher`
- backend boundary enforcement did not explicitly protect distribution-domain imports or selected-controller discipline

## After

After this phase:

- controller-facing orchestration moved into:
  - `src/backend/distribution/distributionApplicationService.ts`
- `landingController.ts` became a thinner HTTP adapter:
  - normalize params/query
  - call application service
  - map response to HTTP
- `check:backend-boundaries` now also protects the distribution domain:
  - distribution must not import `src/backend/platform/**`
  - distribution must not import `src/backend/agents/**`
  - selected controllers must only import their domain application service from `src/backend/**`

## Safe duplicate elimination

Removed:

- `src/backend/distribution/analyticsTracker.js`

Why this was considered safe:

- the authoritative implementation already existed in:
  - `src/backend/distribution/analyticsTracker.ts`
- backend TypeScript build and required runtime checks passed after removal
- `check:backend-boundaries`, `tsc -b`, backend build, frontend build, and required expo route/controller tests all stayed green

This was a real duplicate-risk reduction, not just documentation.

## Remaining duplicates

Still present in distribution:

- `src/backend/distribution/communityPublisher.js` / `.ts`
- `src/backend/distribution/contentScheduler.js` / `.ts`
- `src/backend/distribution/socialPublisher.js` / `.ts`

They were not removed in this phase because runtime safety was not yet strong enough to justify deletion without risking scheduler/publisher execution paths.

## New boundary shape

- `backend-server/routes/**`
  - routing only
- `backend-server/controllers/**`
  - request/response composition only
- `src/backend/distribution/**`
  - distribution services/use-cases

This brings distribution materially closer to the expo/platform backend pattern without widening the phase into a broad rewrite.
