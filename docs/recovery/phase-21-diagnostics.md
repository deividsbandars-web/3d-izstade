# Phase 21 Diagnostics

## Selected domain

- `src/backend/distribution/**`

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

## Structural change completed

- added:
  - `src/backend/distribution/distributionApplicationService.ts`
- reduced controller responsibility in:
  - `backend-server/controllers/landingController.ts`
- removed one real duplicate safely:
  - `src/backend/distribution/analyticsTracker.js`
- expanded backend boundary enforcement to:
  - scan `src/backend/distribution/**`
  - reject distribution imports into `src/backend/platform/**`
  - reject distribution imports into `src/backend/agents/**`
  - enforce selected-controller application-service-only imports
  - warn on domain duplicate pairs

## Changed file list

- `backend-server/controllers/landingController.ts`
- `scripts/check-backend-boundaries.mjs`
- `src/backend/distribution/distributionApplicationService.ts`
- `src/backend/distribution/analyticsTracker.js` (removed)
- `docs/recovery/phase-21-distribution-domain-hardening.md`
- `docs/recovery/phase-21-diagnostics.md`

## Boundary check output

### `check:expo-boundaries`

- shared files scanned: `6`
- backend-server files scanned: `2811`
- `src/backend/expo` files scanned: `12`
- violations: `0`
- status: `PASS`

### `check:backend-boundaries`

- route files scanned: `3`
- controller/expo/distribution/platform files scanned: `48`
- domain duplicate warnings: `7`
- violations: `0`
- status: `PASS`

Duplicate warnings currently reported:

- `src/backend/distribution/communityPublisher.js` + `.ts`
- `src/backend/distribution/contentScheduler.js` + `.ts`
- `src/backend/distribution/socialPublisher.js` + `.ts`
- `src/backend/platform/intelligence/platformBrain.js` + `.ts`
- `src/backend/platform/metrics/platformMetrics.js` + `.ts`
- `src/backend/platform/monitoring/systemMonitor.js` + `.ts`
- `src/backend/platform/usageService.js` + `.ts`

## Remaining risks

- three distribution duplicate pairs still remain and may still create future runtime ambiguity if imports drift
- landing-page HTML generation still lives in the distribution application service rather than in a narrower dedicated content/render helper
- broader backend domains outside expo/platform/distribution still remain convention-based

## Explicit incomplete items

- no broad backend rewrite
- no non-distribution domain cleanup in this phase
- no duplicate deletion where runtime certainty was not strong enough
- no frontend, expo, planning, or operator changes

## Remaining coupling assumptions

- `distributionApplicationService.ts` still depends on backend-server Supabase service wiring
- distribution still depends on shared backend infrastructure such as logging, events, and publisher integrations
- selected-controller discipline is now enforced only for the controllers tightened in recent phases, not all backend controllers
