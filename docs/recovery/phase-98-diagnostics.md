# Phase 98 Diagnostics

## Scope

Phase:
- `LEADS PROVIDER SERPAPI SEARCH MIGRATION REVIEW`

Intent:
- audit the three remaining leads provider `search(...)` callers
- select one next single-provider migration target

## Files Audited

- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/dataSources/serpApiSearchService.ts`

## Audit Findings

- all three providers still call `serpApiHelper.search(...)`
- `guessEmail(...)` no longer blocks provider search migration
- `linkedinLeadSource.ts` remains the lowest-risk search-only migration candidate
- `googleMapsLeadSource.ts` and `directoryLeadSource.ts` are now technically 1:1 migration candidates too, but carry denser domain mapping surfaces

## Selected Next Candidate

- `src/backend/leads/sources/linkedinLeadSource.ts`

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
