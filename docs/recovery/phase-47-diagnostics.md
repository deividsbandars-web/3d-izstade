# Phase 47 Diagnostics

## Commands run

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

Billing/revenue/usage tests:

- none found in repo

## Boundary check output

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2825`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- agents cross-domain warnings: `0`
- billing boundary warnings: `5`
- violations: `0`
- status: `PASS`

Billing boundary warnings emitted for:

- `backend-server/controllers/billingController.ts`
- `backend-server/events/revenueSubscribers.ts`
- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`

## Files changed

Source:

- `scripts/check-backend-boundaries.mjs`

Docs:

- `docs/recovery/phase-47-billing-monetization-bounded-context-audit.md`
- `docs/recovery/phase-47-diagnostics.md`

## Notes

- no billing application-service was introduced in this phase
- this was an audit-first phase with warning-level billing boundary surfacing only
- existing hard boundary protections remained unchanged
