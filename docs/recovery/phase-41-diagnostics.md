# Phase 41 Diagnostics

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

Revenue-specific tests:

- none found in repo

## Boundary check output

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2821`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `3`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Revenue duplicate warnings now surfaced:

- `src/backend/revenue/conversionTracker.js` / `conversionTracker.ts`
- `src/backend/revenue/offerGenerator.js` / `offerGenerator.ts`
- `src/backend/revenue/salesSequence.js` / `salesSequence.ts`

Agents/platform/distribution duplicate warnings remain `0`.

## Changed files

Source:

- `src/backend/revenue/revenueApplicationService.ts`
- `src/backend/agents/tools/adapters/revenueToolAdapters.ts`
- `src/agents/salesAgent.ts`
- `scripts/check-backend-boundaries.mjs`

Docs:

- `docs/recovery/phase-41-revenue-bounded-context-cleanup.md`
- `docs/recovery/phase-41-diagnostics.md`

## Audit notes

- No dedicated revenue controllers or revenue routes were found for the selected slice.
- The selected bounded-context cut was service-oriented, not HTTP-layer oriented.
- The main improvement was replacing direct agents-to-revenue implementation imports with a revenue-facing application service boundary.

## Remaining risks

- revenue duplicate pairs still exist
- revenue implementation still depends on AI, data sources, events, outreach, and leads infrastructure
- `clientProspector.ts` still couples revenue to leads infrastructure and was left outside the selected slice

## Deferred

- revenue duplicate burn-down
- billing domain cleanup
- broader revenue bounded-context split
