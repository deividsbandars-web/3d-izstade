# Phase 41: Revenue Bounded-Context Cleanup

## Selected slice

This phase selected the revenue slice already consumed by agents:

- offer generation
- outreach start
- conversion tracking

This was the narrowest reviewable revenue boundary because it already had a real caller in:

- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`

There were no dedicated revenue HTTP routes or revenue controllers to clean up in this slice, so the correct cut for this phase was an application-service boundary rather than a route/controller refactor.

## What was mixed before

Before this phase:

- `src/backend/agents/tools/adapters/revenueToolAdapters.ts` imported low-level revenue services directly
  - `offerGenerator`
  - `salesSequence`
  - `conversionTracker`
- `src/agents/salesAgent.ts` also imported `salesSequence` directly
- the selected revenue slice had no explicit application-service boundary
- revenue duplicate pairs existed and were not surfaced by the backend boundary check

This meant the agents-to-revenue boundary was still implementation-level rather than contract-level.

## Boundary change

Added:

- `src/backend/revenue/revenueApplicationService.ts`

It now provides the selected revenue-facing contract:

- `generateOfferForProspect(...)`
- `startProspectOutreach(...)`
- `trackRevenueConversion(...)`

Updated callers:

- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`

Both now depend on `revenueApplicationService` instead of low-level revenue services.

## Agents to revenue boundary

The agents boundary is now cleaner:

- agents revenue adapter no longer knows about multiple revenue implementation files
- `salesAgent` no longer reaches straight into `salesSequence`
- revenue logic remains authored inside `src/backend/revenue/**`

The application service is now the only revenue boundary needed by the selected agents-facing slice.

## Cross-domain imports found

Within `src/backend/revenue/**` the selected slice still depends on:

- `src/backend/ai/**`
- `src/backend/dataSources/**`
- `src/backend/events/**`
- `src/backend/logging/**`
- `src/backend/outreach/**`
- `src/backend/leads/**` via `clientProspector.ts`

These remain acceptable in this phase because:

- they are part of existing revenue implementation behavior
- the selected goal was bounded-context cleanup, not business logic redesign

What this phase did enforce:

- revenue must not import agents/platform/distribution/expo directly
- agents revenue adapter must use `revenueApplicationService.ts` as its revenue-facing boundary

## Duplicate audit

Revenue duplicate pairs found:

- `src/backend/revenue/offerGenerator.js` / `offerGenerator.ts`
- `src/backend/revenue/salesSequence.js` / `salesSequence.ts`
- `src/backend/revenue/conversionTracker.js` / `conversionTracker.ts`

No duplicate was removed in this phase.

Reason:

- this phase was boundary-first
- runtime proof for duplicate removal should be done in a separate revenue duplicate burn-down cycle

## Boundary check protection

`scripts/check-backend-boundaries.mjs` now also:

- scans `src/backend/revenue/**`
- warns on revenue `.js/.ts` duplicate pairs
- fails if revenue imports `src/modules/expo/**`
- fails if revenue imports `src/backend/agents/**`, `src/backend/platform/**`, `src/backend/distribution/**`, or `src/backend/expo/**` directly
- fails if `src/backend/agents/tools/adapters/revenueToolAdapters.ts` imports revenue implementation files other than `revenueApplicationService.ts`
- fails if `revenueApplicationService.ts` reaches into sibling backend domains

## Deferred

- no revenue route/controller cleanup outside the selected slice
- no billing domain changes
- no revenue business logic redesign
- no revenue duplicate removal
- no broader agents redesign
