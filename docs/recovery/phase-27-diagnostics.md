# Phase 27 Diagnostics

## Duplicate audit scope

Audited:

- `src/backend/platform/usageService.*`
- `src/backend/platform/intelligence/platformBrain.*`
- `src/backend/platform/platformApplicationService.ts`
- `backend-server/controllers/platformController.ts`
- `backend-server/controllers/dashboardController.ts`
- `backend-server/routes/api.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`
- `src/backend/ai/llmService.ts`
- `src/backend/governance/costMonitor.ts`

## Removal completed

Safely removed:

- `src/backend/platform/usageService.js`

Reason for removal:

- the authoritative implementation already existed in `usageService.ts`
- active imports used normal `.js` specifiers from:
  - `src/backend/ai/llmService.ts`
  - `src/backend/governance/costMonitor.ts`
- there were no special package-script, worker, or dynamic-import paths depending on a physical `usageService.js` source file
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
- controller/expo/distribution/platform files scanned: `42`
- domain duplicate warnings: `1`
- violations: `0`
- status: `PASS`

Important outcome:

- platform duplicate warnings fell from `2` to `1`
- distribution duplicate warnings remain `0`
- `usageService.js` no longer appears in duplicate warnings

Remaining duplicate warnings:

- `src/backend/platform/intelligence/platformBrain.js` + `.ts`

## Files changed

- `src/backend/platform/usageService.js` (removed)
- `docs/recovery/phase-27-platform-duplicate-burn-down-3.md`
- `docs/recovery/phase-27-diagnostics.md`

## Remaining duplicate risks

Platform:

- `platformBrain.js` / `.ts`

Distribution:

- none

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety still depends on the existing TypeScript/tsx resolution behavior mapping those specifiers onto `.ts` source correctly

## Deferred items

- no platform duplicate cleanup beyond `usageService.js`
- no agents cleanup
- no revenue cleanup
- no frontend/expo/operator/planning changes
- no broader backend refactor
