# Phase 22 Diagnostics

## Duplicate audit scope

Audited:

- `src/backend/distribution/communityPublisher.*`
- `src/backend/distribution/contentScheduler.*`
- `src/backend/distribution/socialPublisher.*`

Runtime-facing references checked:

- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- intra-domain imports inside `src/backend/distribution/**`

## Removal completed

Safely removed:

- `src/backend/distribution/contentScheduler.js`

Reason for removal:

- it was the strongest proof candidate because real backend runtime entry points still import the `.js` specifier
- removing the source `.js` file while keeping build/test green proves the `.ts` implementation is authoritative

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
- controller/expo/distribution/platform files scanned: `47`
- domain duplicate warnings: `6`
- violations: `0`
- status: `PASS`

Distribution duplicate warnings now remaining:

- `src/backend/distribution/communityPublisher.js` + `.ts`
- `src/backend/distribution/socialPublisher.js` + `.ts`

The removed `contentScheduler.js` warning no longer appears.

## Files changed

- `src/backend/distribution/contentScheduler.js` (removed)
- `docs/recovery/phase-22-distribution-duplicate-burn-down.md`
- `docs/recovery/phase-22-diagnostics.md`

## Remaining duplicate risks

Still present in distribution:

- `communityPublisher.js` / `.ts`
- `socialPublisher.js` / `.ts`

Still present in platform:

- `platformBrain.js` / `.ts`
- `platformMetrics.js` / `.ts`
- `systemMonitor.js` / `.ts`
- `usageService.js` / `.ts`

## Remaining coupling assumptions

- runtime entry points still use `.js` import specifiers in TypeScript source
- the safety proof here depends on current TypeScript/tsx resolution behavior continuing to resolve those specifiers to the `.ts` source where appropriate

## Deferred items

- no removal of `communityPublisher.js`
- no removal of `socialPublisher.js`
- no agents/revenue/platform cleanup
- no broader backend refactor
