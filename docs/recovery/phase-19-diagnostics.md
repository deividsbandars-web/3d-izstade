# Phase 19 Diagnostics

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
- frontend production build: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`
- backend build: `PASS`
- backend expo route/controller tests: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`

Environment note:

- the remaining `spawn EPERM` failures match the previously proven machine/sandbox child-process restriction
- they do not indicate a repo-side build or test defect

## Boundary cleanup completed

- moved managed-booth ownership logic from `backend-server/controllers/expoDataController.ts` into:
  - `src/backend/expo/booths/expoBoothManagementService.ts`
- moved expo review snapshot/booth/lead-ops business logic from `backend-server/controllers/expoDataController.ts` into:
  - `src/backend/expo/review/expoReviewService.ts`
- moved landing route composition logic from `backend-server/routes/landing.ts` into:
  - `backend-server/controllers/landingController.ts`
- added backend import-boundary enforcement:
  - `scripts/check-backend-boundaries.mjs`

## Changed file list

- `backend-server/controllers/expoDataController.ts`
- `backend-server/controllers/landingController.ts`
- `backend-server/routes/landing.ts`
- `package.json`
- `scripts/check-backend-boundaries.mjs`
- `src/backend/expo/booths/expoBoothManagementService.ts`
- `src/backend/expo/review/expoReviewService.ts`
- `docs/recovery/phase-19-backend-domain-boundary-cleanup.md`
- `docs/recovery/phase-19-diagnostics.md`

## Import/boundary proof

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2808`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo files scanned: `29`
- violations: `0`
- status: `PASS`

## JS/TS duplicate audit

Findings:

- no duplicate `.js` / `.ts` implementation pairs were found inside `src/backend/expo/**`
- broader duplicate pairs still exist elsewhere under `src/backend/**`

Examples of broader duplicate areas:

- `src/backend/agents/**`
- `src/backend/distribution/**`
- `src/backend/platform/**`
- `src/backend/revenue/**`

These were not changed in this phase because they are outside the expo backend boundary target.

## Remaining risks

- `backend-server/controllers/expoDataController.ts` is still a large controller, even though the main expo review and booth-management domain logic moved out.
- `backend-server/controllers/landingController.ts` still reaches into `src/backend/distribution/analyticsTracker.js`; this is acceptable but remains a cross-domain dependency.
- broader backend JS/TS duplicate debt remains in non-expo domains.

## Explicit incomplete / deferred items

- no broad backend rewrite
- no non-expo bounded-context reorg
- no Supabase migration cleanup
- no frontend/planning/operator changes
- no broad JS/TS duplicate purge outside the expo boundary

## Remaining backend boundary debt

- some controller files outside expo may still contain more business logic than ideal
- broader backend domains still rely on convention more than hard bounded-context rules
- `check:backend-boundaries` currently targets the expo path and route/controller layering that this phase changed; it is not yet a repo-wide backend boundary linter
