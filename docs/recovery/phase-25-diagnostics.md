# Phase 25 Diagnostics

## Duplicate audit scope

Audited:

- `src/backend/platform/intelligence/platformBrain.*`
- `src/backend/platform/metrics/platformMetrics.*`
- `src/backend/platform/monitoring/systemMonitor.*`
- `src/backend/platform/usageService.*`
- `backend-server/controllers/platformController.ts`
- `backend-server/controllers/dashboardController.ts`
- `src/backend/platform/platformApplicationService.ts`
- `backend-server/routes/api.ts`
- `backend-server/package.json`

## Removal completed

Safely removed:

- `src/backend/platform/metrics/platformMetrics.js`

Reason for removal:

- the authoritative implementation already existed in `platformMetrics.ts`
- active imports used normal `.js` specifiers from:
  - `src/backend/platform/platformApplicationService.ts`
  - `src/backend/platform/intelligence/platformBrain.ts`
- there were no special package-script, worker, or dynamic-import paths depending on a physical `platformMetrics.js` source file
- the existing `.js` import shape stayed intact and validated after removal

## Commands run

### Passed in sandbox

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

### Sandbox-restricted with `spawn EPERM`

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Passed outside sandbox on the same machine

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Results

- `check:expo-boundaries`: `PASS`
- `check:backend-boundaries`: `PASS`
- root TypeScript build: `PASS`
- backend build: `PASS`
- frontend production build: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`
- backend expo route/controller tests: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`

## Boundary check result

`check:backend-boundaries` output after removal:

- route files scanned: `3`
- controller/expo/distribution/platform files scanned: `44`
- domain duplicate warnings: `3`
- violations: `0`
- status: `PASS`

Important outcome:

- platform duplicate warnings fell from `4` to `3`
- distribution duplicate warnings remain `0`
- `platformMetrics.js` no longer appears in duplicate warnings

Remaining duplicate warnings:

- `src/backend/platform/intelligence/platformBrain.js` + `.ts`
- `src/backend/platform/monitoring/systemMonitor.js` + `.ts`
- `src/backend/platform/usageService.js` + `.ts`

## Files changed

- `src/backend/platform/metrics/platformMetrics.js` (removed)
- `docs/recovery/phase-25-platform-duplicate-burn-down-1.md`
- `docs/recovery/phase-25-diagnostics.md`

## Remaining duplicate risks

Platform:

- `platformBrain.js` / `.ts`
- `systemMonitor.js` / `.ts`
- `usageService.js` / `.ts`

Distribution:

- none

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety still depends on the existing TypeScript/tsx resolution behavior mapping those specifiers onto `.ts` source correctly

## Deferred items

- no platform duplicate cleanup beyond `platformMetrics.js`
- no agents cleanup
- no revenue cleanup
- no broader backend refactor
