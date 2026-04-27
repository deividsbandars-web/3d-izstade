# Phase 104 Diagnostics

## Scope

Phase:
- `SERPAPI HELPER FINAL DUPLICATE BURN-DOWN REVIEW`

Intent:
- audit whether `src/backend/leads/sources/serpApiHelper.js` is safe to remove

## Files Audited

- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/serpApiHelper.js`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `scripts/check-backend-boundaries.mjs`

## Audit Findings

- one active source caller still imports the shim:
  - `src/backend/leads/sources/googleMapsLeadSource.ts`
- all other previously reviewed search callers are already on `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` is already owned by `src/backend/leads/sources/leadEmailGuessingService.ts`
- no package script, worker path, or dynamic import directly targets `serpApiHelper.js`

## Decision

- `defer`

Exact blocker:
- `src/backend/leads/sources/googleMapsLeadSource.ts` still imports `./serpApiHelper.js`

## Non-Goals Preserved

- no deletion performed
- no provider redesign
- no SerpAPI redesign

## Command Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM` only:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Boundary Summary

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

Remaining leads duplicate:
- `src/backend/leads/sources/serpApiHelper.js`
