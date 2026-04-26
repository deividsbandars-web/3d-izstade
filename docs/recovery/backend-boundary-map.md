# Backend Boundary Map

## Purpose

This document describes the canonical backend import boundaries currently enforced by:

- `npm.cmd run check:backend-boundaries`
- `npm.cmd run check:expo-boundaries`

It is a reviewer-facing map of the current recovery state, not a replacement for the
check scripts.

## How To Run

From repo root:

```powershell
npm.cmd run check:backend-boundaries
npm.cmd run check:expo-boundaries
```

Optional full validation:

```powershell
npx.cmd tsc -b
npm.cmd run build
npm.cmd --prefix backend-server run build
```

## Route And Controller Boundaries

### Routes

`backend-server/routes/**` may:

- import route-local files
- import `backend-server/controllers/**`
- import `backend-server/middleware/**`

`backend-server/routes/**` must not:

- import `src/backend/**` directly
- import `src/modules/expo/**`
- import unrelated backend-server implementation layers

### Controllers

Selected controllers are restricted to their application-service boundary:

- `landingController.ts` -> `src/backend/distribution/distributionApplicationService.ts`
- `platformController.ts` -> `src/backend/platform/platformApplicationService.ts`
- `dashboardController.ts` -> `src/backend/platform/platformApplicationService.ts`
- `agentsController.ts` -> `src/backend/agents/agentsApplicationService.ts`
- `billingController.ts` -> `src/backend/billing/billingApplicationService.ts`

## Expo Boundary

Backend-side code must not import `src/modules/expo/**` directly unless it is the
dedicated expo backend surface already protected by `check:expo-boundaries`.

This keeps the shared/expo runtime boundary separate from backend service code.

## Distribution Boundary

`src/backend/distribution/**` must not import:

- `src/backend/platform/**`
- `src/backend/agents/**`

Distribution stays behind its own application-service boundary.

## Platform Boundary

`src/backend/platform/**` must not import sibling backend domains directly, except the
explicitly allowlisted infrastructure surfaces already used by the current platform
application service.

Platform is treated as its own bounded context, not as a generic shared import bucket.

## Agents Boundary

`src/backend/agents/**` must not import:

- `src/backend/platform/**`
- `src/backend/distribution/**`
- `src/backend/expo/**`

The canonical controller entry for the agents domain is:

- `src/backend/agents/agentsApplicationService.ts`

### Agents Tool Layer

`src/backend/agents/engine/agentTools.ts` must not import sibling backend domains
directly.

It must go through:

- `src/backend/agents/tools/**`

### Agents Tool Adapters

Tool adapters are domain-scoped:

- `dataSourceToolAdapters.ts` -> leads + dataSources
- `leadToolAdapters.ts` -> leads
- `workflowToolAdapters.ts` -> business/workflows
- `revenueToolAdapters.ts` -> revenue via `revenueApplicationService.ts`
- `marketingToolAdapters.ts` -> growth

`revenueToolAdapters.ts` may import from revenue only:

- `src/backend/revenue/revenueApplicationService.ts`

## Revenue Boundary

`src/backend/revenue/**` must not import:

- `src/backend/agents/**`
- `src/backend/platform/**`
- `src/backend/distribution/**`
- `src/backend/expo/**`

Canonical caller-facing entry:

- `src/backend/revenue/revenueApplicationService.ts`

### Prospecting

Agents and `src/agents/**` must not import:

- `src/backend/revenue/clientProspector.ts`
- `src/backend/revenue/prospecting/**`

They must go through:

- `src/backend/revenue/revenueApplicationService.ts`

`clientProspector.ts` is compatibility-only, not canonical.

## Billing Boundary

Canonical controller-facing boundary:

- `src/backend/billing/billingApplicationService.ts`

Canonical event-driven boundary:

- `src/backend/billing/events/billingEventService.ts`

Thin event adapter:

- `src/backend/billing/events/billingEventHandlers.ts`

### Billing Event Imports

`backend-server/events/revenueSubscribers.ts` may import from billing only:

- `src/backend/billing/events/billingEventHandlers.ts`

`billingEventHandlers.ts` may import from billing only:

- `src/backend/billing/events/billingEventService.ts`

This preserves:

- subscriber = subscription/delegation
- handler = payload adapter
- service = event-driven billing orchestration

### Billing Usage / Quota

Canonical billing-facing usage entry:

- `src/backend/billing/usage/billingUsageService.ts`

Canonical quota/cost helper:

- `src/backend/billing/usage/billingQuotaService.ts`

Billing-local lower-level usage implementation:

- `src/backend/billing/usage/billingUsageStorage.ts`

AI and governance callers must go through:

- `src/backend/billing/billingApplicationService.ts`

They must not import old usage/quota helpers directly.

## Compatibility Surfaces Still Present

Current recovery state still allows a few compatibility or lower-level internal surfaces:

- billing-local `.ts/.js` helper mirrors under `src/backend/billing/usage/**`

These are not caller-facing boundaries. They exist for current runtime compatibility and
have separate review history from the domain boundary rules themselves.

## Duplicate Discipline

The backend boundary check also scans for `.js/.ts` duplicate pairs in the stabilized
domains:

- revenue
- agents
- platform
- distribution

The expected state is:

- duplicate warnings = `0`

## CI Intent

The checks are designed to protect current bounded-context contracts, not to behave like
a general-purpose linter framework.

Principles:

- hard-fail for known boundary regressions
- warnings only where the repo still has explicit transitional surfaces
- no silent drift in controller, event, or caller-facing service boundaries
