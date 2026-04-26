# Phase 28 Diagnostics

## Audit scope

Audited:

- `src/backend/platform/intelligence/platformBrain.*`
- `backend-server/events/subscribers.ts`
- `src/backend/platform/platformApplicationService.ts`
- `backend-server/controllers/platformController.ts`
- `backend-server/controllers/dashboardController.ts`
- `backend-server/routes/api.ts`
- `backend-server/worker.ts`
- `backend-server/package.json`

## Removal completed

Safely removed:

- `src/backend/platform/intelligence/platformBrain.js`

Reason for removal:

- the authoritative implementation already existed in `platformBrain.ts`
- the active runtime-facing import was the normal `.js` specifier from `backend-server/events/subscribers.ts`
- there were no special package-script, worker, or dynamic-import paths depending on a physical `platformBrain.js` source file
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
- controller/expo/distribution/platform files scanned: `41`
- domain duplicate warnings: `0`
- violations: `0`
- status: `PASS`

Important outcome:

- platform duplicate warnings: `0`
- distribution duplicate warnings: `0`
- `platformBrain.js` no longer appears in duplicate warnings

## Files changed

- `src/backend/platform/intelligence/platformBrain.js` (removed)
- `docs/recovery/phase-28-final-platform-duplicate-removal.md`
- `docs/recovery/phase-28-diagnostics.md`

## Remaining duplicate risks

Platform:

- none

Distribution:

- none

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety still depends on the existing TypeScript/tsx resolution behavior mapping those specifiers onto `.ts` source correctly

## Deferred items

- no agents cleanup
- no revenue cleanup
- no frontend/expo/operator/planning changes
- no broader backend refactor
