# Phase 106 - SerpAPI Helper Final Duplicate Burn-Down Review

## Summary

Phase 106 re-ran the final duplicate audit around:

- `src/backend/leads/sources/serpApiHelper.js`

Decision:
- `deletion next`

No deletion was performed in this review phase.

## Reference Audit

Active source/runtime references:
- none found to `./serpApiHelper.js`

Shim definition:
- `src/backend/leads/sources/serpApiHelper.ts`

Boundary checker references:
- `scripts/check-backend-boundaries.mjs`

Docs / diagnostics references:
- `docs/recovery/**`
- `diagnostics/**`

Checked-in duplicate artifact:
- `src/backend/leads/sources/serpApiHelper.js`

## Active Source Caller Audit

Confirmed these files no longer import `serpApiHelper`:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/dataSources/googleSearchService.ts`

Canonical search callers now all use:
- `src/backend/dataSources/serpApiSearchService.ts`

Current canonical callers:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

Email guessing no longer uses `serpApiHelper.guessEmail(...)`.
Leads-local email guessing lives at:
- `src/backend/leads/sources/leadEmailGuessingService.ts`

## Runtime / Build / Test Dependency Audit

Audited:
- `package.json`
- `backend-server/package.json`
- tests
- route/controller imports
- worker/dynamic import paths
- scripts

Findings:
- no package script directly targets `src/backend/leads/sources/serpApiHelper.js`
- no worker entry targets `src/backend/leads/sources/serpApiHelper.js`
- no dynamic import targets `src/backend/leads/sources/serpApiHelper.js`
- no route/controller/test dependency requires `serpApiHelper.js` as an active runtime source file

## serpApiHelper.ts Shim Status

`src/backend/leads/sources/serpApiHelper.ts` remains a thin compatibility shim:
- `search(...)` delegates to `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` delegates to `src/backend/leads/sources/leadEmailGuessingService.ts`

## serpApiHelper.js Duplicate Status

`src/backend/leads/sources/serpApiHelper.js` now appears to be:
- a checked-in duplicate JS artifact
- not an active source caller seam
- not a runtime/build/test required entry

## Deletion Risk Assessment

Deletion risk for the next phase is:
- `low`

Reason:
- no active source caller remains on the shim
- build/test/runtime audit found no dependency on the duplicate JS artifact

## Boundary Check Notes

`scripts/check-backend-boundaries.mjs` references to `serpApiHelper` are enforcement-only.
They are not runtime dependencies.

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

Remaining duplicate:
- `src/backend/leads/sources/serpApiHelper.js`

## Next Recommendation

The next phase should be:
- `SERPAPI HELPER FINAL DUPLICATE BURN-DOWN`

That phase should delete only:
- `src/backend/leads/sources/serpApiHelper.js`

and then validate that:
- leads duplicate warnings drop `1 -> 0`
