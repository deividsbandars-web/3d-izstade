# Phase 23 Diagnostics

## Duplicate audit scope

Audited:

- `src/backend/distribution/socialPublisher.*`
- `src/backend/distribution/communityPublisher.*`
- `src/backend/distribution/contentScheduler.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- backend package scripts

## Removal completed

Safely removed:

- `src/backend/distribution/socialPublisher.js`

Reason for removal:

- it was referenced only through the `.js` specifier chain inside `contentScheduler.ts`
- no separate runtime script or dynamic-import path required the source `.js` file
- build/test/check gates stayed green after removal

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
- controller/expo/distribution/platform files scanned: `46`
- domain duplicate warnings: `5`
- violations: `0`
- status: `PASS`

Remaining distribution duplicate warning:

- `src/backend/distribution/communityPublisher.js` + `.ts`

The removed `socialPublisher.js` warning no longer appears.

## Files changed

- `src/backend/distribution/socialPublisher.js` (removed)
- `docs/recovery/phase-23-distribution-publisher-duplicate-burn-down.md`
- `docs/recovery/phase-23-diagnostics.md`

## Remaining duplicate risks

Still present in distribution:

- `communityPublisher.js` / `.ts`

Still present in platform:

- `platformBrain.js` / `.ts`
- `platformMetrics.js` / `.ts`
- `systemMonitor.js` / `.ts`
- `usageService.js` / `.ts`

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety depends on the existing TypeScript/tsx resolution behavior continuing to map them onto `.ts` source correctly

## Deferred items

- no removal of `communityPublisher.js`
- no platform duplicate cleanup
- no agents/revenue cleanup
- no broader backend refactor
