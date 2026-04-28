# Phase 100 Diagnostics

## Scope

Phase:
- `REMAINING LEADS PROVIDER SERPAPI SEARCH MIGRATION REVIEW`

Intent:
- audit the two remaining leads provider search callers
- select one next single-provider migration target

## Files Audited

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/leadEmailGuessingService.ts`

## Audit Findings

- both providers still call `serpApiHelper.search(...)`
- both providers now use `leadEmailGuessingService.guessEmail(...)`
- both migrations would be mechanically 1:1 at the search import layer
- `directoryLeadSource.ts` is the lower-risk candidate because it uses `google` + `organic_results` and a smaller mapping surface than `googleMapsLeadSource.ts`

## Selected Next Candidate

- `src/backend/leads/sources/directoryLeadSource.ts`

## Non-Goals Preserved

- no provider migration performed
- no `serpApiHelper.js` deletion
- no multi-provider migration
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
