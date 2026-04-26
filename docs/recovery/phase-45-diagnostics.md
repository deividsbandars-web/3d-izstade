# Phase 45 Diagnostics

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

Revenue/leads/prospecting tests:

- none found in repo

## Boundary check output

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2822`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Important result:

- revenue duplicate warnings: `0`
- agents duplicate warnings: `0`
- platform duplicate warnings: `0`
- distribution duplicate warnings: `0`

## Changed files

Source:

- `src/backend/revenue/clientProspector.ts`
- `src/backend/revenue/revenueApplicationService.ts`
- `src/backend/revenue/prospecting/prospectingTypes.ts`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`
- `src/backend/revenue/prospecting/revenueProspectingService.ts`
- `scripts/check-backend-boundaries.mjs`

Docs:

- `docs/recovery/phase-45-revenue-client-prospector-leads-coupling-cleanup.md`
- `docs/recovery/phase-45-diagnostics.md`

## Notes

- `clientProspector.ts` had no active callers before the refactor
- the new revenue prospecting slice localizes the leads coupling instead of removing it entirely
- enforcement was kept narrow to the boundary actually introduced in this phase
