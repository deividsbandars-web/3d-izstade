# Phase 67 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/serpApiHelper.ts`
- `scripts/check-backend-boundaries.mjs`

## Key Findings

- provider order before the change was:
  - Google Maps
  - Directory
  - LinkedIn
- delay timing was:
  - 1 second after Google Maps
  - 1 second after Directory
- merge behavior was direct fan-in of the three provider result arrays
- result/error shape was already narrow and safe to preserve

## Code Changes

- added `src/backend/leads/sources/leadSourceCollectionService.ts`
- added `src/backend/leads/sources/leadSourceCollectionService.js`
- rewired `leadEngine.ts` to delegate source collection
- rewired `leadEngine.js` for runtime parity
- tightened `check-backend-boundaries.mjs` with `leadEngine -> source providers` hard-fail

## Commands Run

Passed in sandbox:

```powershell
npm.cmd run check:expo-boundaries
npm.cmd run check:backend-boundaries
npx.cmd tsc -b
npm.cmd --prefix backend-server run build
```

Failed in sandbox due environment restriction:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

Passed outside sandbox on the same machine:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

## Current Boundary Summary

- `check:backend-boundaries`: `PASS`
- `check:expo-boundaries`: `PASS`
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `9`
- billing boundary warnings: `0`
- violations: `0`

## Remaining `leadEngine` Responsibilities

- validation
- scoring
- persistence via `leadService`
- lead-created event publishing via `leadEventService`
- lead assignment scheduling via `leadAgentSchedulingService`
