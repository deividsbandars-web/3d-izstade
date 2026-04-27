# Phase 106 Diagnostics

## Scope

Phase:
- `SERPAPI HELPER FINAL DUPLICATE BURN-DOWN REVIEW`

Intent:
- verify whether `src/backend/leads/sources/serpApiHelper.js` is now only a stale duplicate artifact after all search callers were moved to the canonical search service

## Reference Classification

Active source import/call:
- none

Shim definition:
- `src/backend/leads/sources/serpApiHelper.ts`

Boundary checker:
- `scripts/check-backend-boundaries.mjs`

Docs / diagnostics:
- `docs/recovery/**`
- `diagnostics/**`

Duplicate artifact:
- `src/backend/leads/sources/serpApiHelper.js`

## Canonical Search Caller Set

- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

All of the above now use:
- `src/backend/dataSources/serpApiSearchService.ts`

## Email Guessing Ownership

Email guessing is owned by:
- `src/backend/leads/sources/leadEmailGuessingService.ts`

No active caller requires:
- `serpApiHelper.guessEmail(...)`

## Runtime / Build Audit Result

No direct dependency found from:
- root `package.json`
- `backend-server/package.json`
- tests
- worker entrypoints
- dynamic imports
- route/controller imports

to:
- `src/backend/leads/sources/serpApiHelper.js`

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

## Decision

- selected decision: `deletion next`
- exact next target: `src/backend/leads/sources/serpApiHelper.js`
