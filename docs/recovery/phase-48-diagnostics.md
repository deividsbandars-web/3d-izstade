# Phase 48 Diagnostics

## Scope

- Added `src/backend/billing/billingApplicationService.ts`
- Rewired `backend-server/controllers/billingController.ts`
- Hardened `scripts/check-backend-boundaries.mjs` for controller -> low-level billing regressions

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
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
- billing boundary warnings: `4`
- violations: `0`
- status: `PASS`

## Remaining Billing Warnings

- `backend-server/events/revenueSubscribers.ts`
- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`

## Tests

No billing-specific automated tests were found.
