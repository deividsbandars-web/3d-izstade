# Phase 50 Diagnostics

## Scope

- Rewired `src/backend/governance/agentGovernor.ts`
- Rewired `src/backend/governance/agentGovernor.js`
- Hardened `scripts/check-backend-boundaries.mjs` for governance -> costMonitor direct-import regressions

## Validation Results

Passed in sandbox:

- `npm.cmd run check:backend-boundaries`
- `npm.cmd run check:expo-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted with `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Boundary Check Summary

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- agents cross-domain warnings: `0`
- billing boundary warnings: `3`
- violations: `0`
- status: `PASS`

## Remaining Warning Surface

- `backend-server/events/revenueSubscribers.ts`
- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/governance/costMonitor.js`

## Tests

No billing/governance/usage-specific automated tests were found.
