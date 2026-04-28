# Phase 97 - Lead Email Guessing Service Seed

## Summary

Phase 97 extracted the leads-local `guessEmail(...)` behavior from the SerpAPI compatibility shim into a dedicated helper at `src/backend/leads/sources/leadEmailGuessingService.ts`.

This phase intentionally did not:
- delete `src/backend/leads/sources/serpApiHelper.js`
- migrate provider `search(...)` imports
- migrate `linkedinLeadSource.ts`
- redesign SerpAPI behavior

## Behavior Audit

The existing `guessEmail(...)` contract in `src/backend/leads/sources/serpApiHelper.ts` was preserved 1:1:
- input: optional domain / URL-like string
- output: `string`
- normalization: strips `http://`, `https://`, optional `www.`, then keeps the host segment before `/`
- fallback: returns `info@<normalized-domain>`
- empty input or empty normalized host returns `''`

## Implementation

Added:
- `src/backend/leads/sources/leadEmailGuessingService.ts`

The new helper exports:
- `leadEmailGuessingService.guessEmail(domain?, _companyName?)`

## Provider Rewiring

Rewired only these two callers:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

Changes:
- `serpApiHelper.search(...)` remains unchanged
- `serpApiHelper.guessEmail(...)` call sites were replaced with `leadEmailGuessingService.guessEmail(...)`

Left untouched:
- `src/backend/leads/sources/linkedinLeadSource.ts`

## SerpAPI Shim Notes

`src/backend/leads/sources/serpApiHelper.ts` remains a compatibility shim:
- `search(...)` still delegates to `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` now delegates to `src/backend/leads/sources/leadEmailGuessingService.ts`

`src/backend/leads/sources/serpApiHelper.js` was not deleted in this phase.

## Boundary Notes

`scripts/check-backend-boundaries.mjs` was updated with an audit-level note:
- canonical leads-local `guessEmail` home is expected at `src/backend/leads/sources/leadEmailGuessingService.ts`

No new hard-fail provider migration rule was added in this phase.

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

The next clean seam is a provider search migration review/execution cycle, now that `guessEmail(...)` is isolated from the shared SerpAPI search compatibility path.
