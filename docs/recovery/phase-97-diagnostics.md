# Phase 97 Diagnostics

## Scope

Phase:
- `LEAD EMAIL GUESSING SERVICE SEED`

Intent:
- extract leads-local `guessEmail(...)` behavior from `src/backend/leads/sources/serpApiHelper.ts`
- keep SerpAPI `search(...)` compatibility behavior intact

## Files Audited

- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `scripts/check-backend-boundaries.mjs`

## Files Changed

- `src/backend/leads/sources/leadEmailGuessingService.ts` (new)
- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `scripts/check-backend-boundaries.mjs`

## Behavior Assertions

Preserved `guessEmail(...)` behavior:
- input remains optional domain / URL-like string
- strips `http://`, `https://`, and `www.`
- trims to hostname before `/`
- returns `info@<domain>`
- returns empty string for empty input / empty normalized host

Non-goals kept intact:
- no `search(...)` provider migration
- no `linkedinLeadSource.ts` migration
- no `serpApiHelper.js` deletion

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
