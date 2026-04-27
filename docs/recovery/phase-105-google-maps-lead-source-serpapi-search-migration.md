# Phase 105 - Google Maps Lead Source SerpAPI Search Migration

## Summary

Phase 105 migrated the final remaining active leads provider search caller from the SerpAPI compatibility shim to the canonical search boundary:

- from `src/backend/leads/sources/serpApiHelper.ts`
- to `src/backend/dataSources/serpApiSearchService.ts`

Target:
- `src/backend/leads/sources/googleMapsLeadSource.ts`

No deletion was performed in this phase.

## Implementation Change

Updated:
- `src/backend/leads/sources/googleMapsLeadSource.ts`

Before:
- imported `serpApiHelper` from `./serpApiHelper.js`
- called `serpApiHelper.search(...)`

After:
- imports `serpApiSearchService` from `../../dataSources/serpApiSearchService.js`
- calls `serpApiSearchService.search(...)`

## Behavior Preservation Audit

Preserved search input:
- `engine: "google_maps"`
- `q: <query> in <location>`
- `type: "search"`

Preserved output mapping:
- `response.data.local_results || []`
- `results.slice(0, limit)`
- `company_name`
- `website`
- `email`
- `phone`
- `location`
- `metadata.rating`
- `metadata.reviews`
- `metadata.type`
- `metadata.serpapi_id`

Preserved error behavior:
- `response.error || !response.data` triggers throw
- catch returns `{ data: null, error: String(error) }`

Preserved email behavior:
- `leadEmailGuessingService.guessEmail(...)`

## Reference Audit

`src/backend/leads/sources/googleMapsLeadSource.ts` no longer contains:
- `serpApiHelper`
- `./serpApiHelper.js`

Active source search callers now using `src/backend/dataSources/serpApiSearchService.ts`:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

Remaining `serpApiHelper` references after this phase are limited to:
- `src/backend/leads/sources/serpApiHelper.ts` shim definition
- `scripts/check-backend-boundaries.mjs`
- docs / diagnostics references

## Boundary Check Notes

Updated:
- `scripts/check-backend-boundaries.mjs`

Added narrow guardrail:
- `src/backend/leads/sources/googleMapsLeadSource.ts` must not import the SerpAPI compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No broad checker rewrite was done.

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

The next phase should be:
- `SERPAPI HELPER FINAL DUPLICATE BURN-DOWN REVIEW`

That review should confirm no active source caller remains on the shim and decide whether `src/backend/leads/sources/serpApiHelper.js` is safe to delete in a separate phase.
