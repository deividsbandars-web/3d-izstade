# Phase 101 - Directory Lead Source SerpAPI Search Migration

## Summary

Phase 101 migrated one leads provider search caller from the SerpAPI compatibility shim to the canonical search boundary:

- from `src/backend/leads/sources/serpApiHelper.ts`
- to `src/backend/dataSources/serpApiSearchService.ts`

Target:
- `src/backend/leads/sources/directoryLeadSource.ts`

This phase intentionally did not:
- migrate `googleMapsLeadSource.ts`
- delete `src/backend/leads/sources/serpApiHelper.js`
- redesign provider behavior

## Behavior Audit

Preserved behavior in `src/backend/leads/sources/directoryLeadSource.ts`:
- input:
  - `engine: "google"`
  - `q: site:yellowpages.com OR site:yelp.com "<industry>" "<location>"`
  - `num: limit`
- output mapping:
  - `organic_results -> company_name / website / email / phone / location / source`
- error behavior:
  - `response.error || !response.data` triggers throw
  - catch returns `{ data: null, error: String(error) }`

## Import Migration

Updated:
- `src/backend/leads/sources/directoryLeadSource.ts`

Before:
- imported `serpApiHelper` from `./serpApiHelper.js`
- called `serpApiHelper.search(...)`

After:
- imports `serpApiSearchService` from `../../dataSources/serpApiSearchService.js`
- calls `serpApiSearchService.search(...)`

`leadEmailGuessingService.guessEmail(...)` remains unchanged in this phase.

## Boundary Notes

Updated:
- `scripts/check-backend-boundaries.mjs`

Added narrow enforcement:
- `src/backend/leads/sources/directoryLeadSource.ts` must not import the SerpAPI compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No new rule was added for `googleMapsLeadSource.ts` in this phase.

## Validation

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only restriction:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Current State

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

## Next Recommendation

The next clean seam is the final remaining provider search migration:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
