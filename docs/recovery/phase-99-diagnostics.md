# Phase 99 Diagnostics

## Scope

Phase:
- `LINKEDIN LEAD SOURCE SERPAPI SEARCH MIGRATION`

Intent:
- migrate one leads provider search caller from the compatibility shim to the canonical SerpAPI search service

## Files Changed

- `src/backend/leads/sources/linkedinLeadSource.ts`
- `scripts/check-backend-boundaries.mjs`

## Behavior Assertions

Preserved:
- `engine: "google"`
- `q: site:linkedin.com/company "<industry>" "<location>"`
- `num: limit`
- `organic_results` mapping into leads payload
- throw on `response.error || !response.data`
- catch result `{ data: null, error: String(error) }`

Non-goals preserved:
- no `googleMapsLeadSource.ts` migration
- no `directoryLeadSource.ts` migration
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
