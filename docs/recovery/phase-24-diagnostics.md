# Phase 24 Diagnostics

## Duplicate audit scope

Audited:

- `src/backend/distribution/communityPublisher.*`
- `src/backend/distribution/contentScheduler.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`

## Removal completed

Safely removed:

- `src/backend/distribution/communityPublisher.js`

Reason for removal:

- no direct runtime entry path required the physical source `.js` file
- the authoritative implementation already existed in `communityPublisher.ts`
- the existing `.js` specifier path inside `contentScheduler.ts` stayed intact and still validated successfully

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
- controller/expo/distribution/platform files scanned: `45`
- domain duplicate warnings: `4`
- violations: `0`
- status: `PASS`

Important outcome:

- distribution duplicate warnings: `0`
- remaining warnings are platform-only

Remaining duplicate warnings:

- `src/backend/platform/intelligence/platformBrain.js` + `.ts`
- `src/backend/platform/metrics/platformMetrics.js` + `.ts`
- `src/backend/platform/monitoring/systemMonitor.js` + `.ts`
- `src/backend/platform/usageService.js` + `.ts`

## Files changed

- `src/backend/distribution/communityPublisher.js` (removed)
- `docs/recovery/phase-24-final-distribution-duplicate-removal.md`
- `docs/recovery/phase-24-diagnostics.md`

## Remaining duplicate risks

Distribution:

- none

Platform:

- `platformBrain.js` / `.ts`
- `platformMetrics.js` / `.ts`
- `systemMonitor.js` / `.ts`
- `usageService.js` / `.ts`

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety still depends on the established TypeScript/tsx resolution behavior mapping those specifiers onto `.ts` source correctly

## Deferred items

- no platform duplicate cleanup
- no agents cleanup
- no revenue cleanup
- no broader backend refactor
