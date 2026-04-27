# Phase 105 Diagnostics

## Scope

Phase:
- `GOOGLE MAPS LEAD SOURCE SERPAPI SEARCH MIGRATION`

Intent:
- close the exact blocker identified in Phase 104 by migrating the final active provider search seam off `serpApiHelper`

## Files Changed

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `scripts/check-backend-boundaries.mjs`

## Behavior Assertions

Preserved:
- `engine: "google_maps"`
- `q: <query> in <location>`
- `type: "search"`
- `response.data.local_results || []`
- `results.slice(0, limit)`
- `company_name / website / email / phone / location / metadata`
- throw on `response.error || !response.data`
- catch result `{ data: null, error: String(error) }`
- `leadEmailGuessingService.guessEmail(...)`

Non-goals preserved:
- no `serpApiHelper.js` deletion
- no `serpApiHelper.ts` retirement
- no provider redesign
- no multi-provider migration

## Reference Results

After migration, active source search callers using `serpApiSearchService` are:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

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
