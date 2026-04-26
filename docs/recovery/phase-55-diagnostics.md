# Phase 55 Diagnostics

## Scope

Phase 55 reviewed whether billing event orchestration should stay in
`src/backend/billing/events/billingEventService.ts` or converge into
`src/backend/billing/billingApplicationService.ts`.

Decision:

- keep separate boundaries
- keep `billingEventHandlers.ts` thin
- keep `revenueSubscribers.ts` as subscription/delegation only

## Validation

Passed:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Boundary Summary

`check:backend-boundaries` result:

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- agents cross-domain warnings: `0`
- billing boundary warnings: `2`
- violations: `0`
- status: `PASS`

`check:expo-boundaries` result:

- shared files scanned: `6`
- backend-server files scanned: `2830`
- src/backend/expo files scanned: `12`
- violations: `0`
- status: `PASS`

## Remaining Billing Boundary Warnings

- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`

These remain warning-level and were not escalated in this phase.

## Tests

No billing/events-specific automated tests were found in the repo.

Validation therefore relies on:

- boundary checks
- TypeScript build
- app build
- backend build
- existing expo scene route/controller tests
