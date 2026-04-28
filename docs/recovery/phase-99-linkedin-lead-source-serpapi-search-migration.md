# Phase 99 - LinkedIn Lead Source SerpAPI Search Migration

## Summary

Phase 99 migrated the LinkedIn leads provider from the SerpAPI compatibility shim to the canonical search boundary:

- from `src/backend/leads/sources/serpApiHelper.ts`
- to `src/backend/dataSources/serpApiSearchService.ts`

This phase intentionally did not:
- migrate `googleMapsLeadSource.ts`
- migrate `directoryLeadSource.ts`
- delete `src/backend/leads/sources/serpApiHelper.js`
- redesign provider behavior

## Behavior Audit

Preserved behavior in `src/backend/leads/sources/linkedinLeadSource.ts`:
- input:
  - `engine: "google"`
  - `q: site:linkedin.com/company "<industry>" "<location>"`
  - `num: limit`
- output mapping:
  - `organic_results -> company_name / website / email / phone / location / source`
- error behavior:
  - `response.error || !response.data` triggers throw
  - catch returns `{ data: null, error: String(error) }`

## Import Migration

Updated:
- `src/backend/leads/sources/linkedinLeadSource.ts`

Before:
- imported `serpApiHelper` from `./serpApiHelper.js`
- called `serpApiHelper.search(...)`

After:
- imports `serpApiSearchService` from `../../dataSources/serpApiSearchService.js`
- calls `serpApiSearchService.search(...)`

## Boundary Notes

Updated:
- `scripts/check-backend-boundaries.mjs`

Added narrow enforcement:
- `src/backend/leads/sources/linkedinLeadSource.ts` must not import the SerpAPI compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No new rule was added for `googleMapsLeadSource.ts` or `directoryLeadSource.ts` in this phase.

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

The next clean seam is a new review for the remaining provider callers:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

Now that `guessEmail(...)` is isolated and LinkedIn is migrated, the next review can compare the remaining two providers directly.
