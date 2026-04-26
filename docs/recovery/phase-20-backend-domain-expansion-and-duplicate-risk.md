# Phase 20: Backend Domain Expansion and Duplicate Risk Reduction

## Selected domain

Phase 20 expanded the Phase 19 backend discipline into the `platform` domain.

This domain was selected because it already had:

- active API routes under `backend-server/routes/api.ts`
- dedicated controllers under `backend-server/controllers/**`
- existing service logic under `src/backend/platform/**`
- visible JS/TS duplicate risk inside the domain itself

That made it a good representative next step without turning this phase into a broad backend rewrite.

## Before

Before this phase:

- `backend-server/routes/**` were already structurally acceptable for the platform path
- `backend-server/controllers/platformController.ts` still owned platform metrics/health/optimization aggregation
- `backend-server/controllers/dashboardController.ts` still owned dashboard aggregation over platform services
- `src/backend/platform/**` had service modules, but no clear application-level boundary for controller-facing use-cases
- the backend boundary check did not explicitly protect platform-domain imports or report platform duplicate risk

## After

After this phase:

- controller-facing platform aggregation moved into:
  - `src/backend/platform/platformApplicationService.ts`
- `platformController.ts` became a thinner HTTP adapter over platform use-cases
- `dashboardController.ts` became a thinner HTTP adapter over platform use-cases
- `check:backend-boundaries` now also scans `src/backend/platform/**`
- the boundary check now rejects direct cross-domain imports from platform into sibling backend domains
- the boundary check now reports JS/TS duplicate warnings for the selected domain

## Boundary shape

The intended shape is now:

- `backend-server/routes/**`
  - routing only
- `backend-server/controllers/**`
  - request/response composition only
- `src/backend/platform/**`
  - platform use-cases/services
- `src/shared/**`
  - shared/pure contract only when needed

This mirrors the expo backend pattern, but only for a controlled slice of the backend.

## Duplicate risk findings

The platform-domain duplicate audit found these `.js` / `.ts` pairs:

- `src/backend/platform/intelligence/platformBrain.js` / `.ts`
- `src/backend/platform/metrics/platformMetrics.js` / `.ts`
- `src/backend/platform/monitoring/systemMonitor.js` / `.ts`
- `src/backend/platform/usageService.js` / `.ts`

These were documented, not deleted, because this phase did not establish enough runtime certainty to safely remove them without risk.

## What remains deferred

- no broad backend rewrite
- no repo-wide duplicate purge
- no refactor of other backend domains in this cycle
- no broader telemetry/platform contract extraction beyond the controller-facing application service added here
