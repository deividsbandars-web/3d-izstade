# Phase 102 Diagnostics

## Scope

Phase:
- `GOOGLE MAPS LEAD SOURCE SERPAPI SEARCH MIGRATION REVIEW`

Intent:
- audit the final remaining leads provider search caller
- decide whether migration is now mechanical and ready

## Files Audited

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/leadEmailGuessingService.ts`

## Audit Findings

- `googleMapsLeadSource.ts` still calls `serpApiHelper.search(...)`
- `guessEmail(...)` is already isolated in `leadEmailGuessingService.ts`
- `serpApiHelper.ts` adds no extra search behavior beyond delegation to `serpApiSearchService.ts`
- `local_results` and `metadata` mapping are local to the provider and do not depend on shim-specific behavior

## Decision

- `googleMaps migration next`

## Non-Goals Preserved

- no migration performed
- no `serpApiHelper.js` deletion
- no provider redesign

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
