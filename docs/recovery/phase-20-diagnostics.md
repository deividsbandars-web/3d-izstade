# Phase 20 Diagnostics

## Selected domain

- `src/backend/platform/**`

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

## Structural change completed

- moved controller-facing platform aggregation into:
  - `src/backend/platform/platformApplicationService.ts`
- reduced aggregation responsibility in:
  - `backend-server/controllers/platformController.ts`
  - `backend-server/controllers/dashboardController.ts`
- expanded `scripts/check-backend-boundaries.mjs` to:
  - scan `src/backend/platform/**`
  - reject direct platform imports into sibling backend domains
  - emit duplicate-risk warnings for `.js` / `.ts` pairs in the selected domain

## Changed file list

- `backend-server/controllers/dashboardController.ts`
- `backend-server/controllers/platformController.ts`
- `scripts/check-backend-boundaries.mjs`
- `src/backend/platform/platformApplicationService.ts`
- `docs/recovery/phase-20-backend-domain-expansion-and-duplicate-risk.md`
- `docs/recovery/phase-20-diagnostics.md`

## Boundary check output

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2809`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo/platform files scanned: `40`
- platform duplicate warnings: `4`
- violations: `0`
- status: `PASS`

Reported duplicate warnings:

- `src/backend/platform/intelligence/platformBrain.js` + `.ts`
- `src/backend/platform/metrics/platformMetrics.js` + `.ts`
- `src/backend/platform/monitoring/systemMonitor.js` + `.ts`
- `src/backend/platform/usageService.js` + `.ts`

## Remaining risks

- platform duplicate pairs remain present and could still create future runtime ambiguity if imports drift
- `platformApplicationService.ts` is an application boundary, not a full platform bounded-context redesign
- other backend domains still remain convention-based

## Explicit incomplete / deferred items

- no non-platform domain cleanup in this phase
- no duplicate deletion where runtime safety was unclear
- no backend-wide bounded-context rewrite
- no frontend/planning/operator changes

## Remaining backend boundary debt

- `backend-server/controllers/**` outside expo/platform may still contain too much composition or business logic
- route/controller/service discipline is now stronger for expo and platform, but not yet enforced across all backend domains
- duplicate risk is now surfaced for platform, but not yet remediated repo-wide
