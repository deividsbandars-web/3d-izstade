# Phase 88 Diagnostics

## Commands Run

Audit:

- `Get-Content src/backend/leads/sources/serpApiHelper.ts`
- `Get-Content src/backend/leads/sources/serpApiHelper.js`
- `Get-Content src/backend/leads/sources/googleMapsLeadSource.ts`
- `Get-Content src/backend/leads/sources/directoryLeadSource.ts`
- `Get-Content src/backend/leads/sources/linkedinLeadSource.ts`
- `Get-Content src/backend/growth/nicheDiscovery.ts`
- `Get-Content src/backend/dataSources/googleSearchService.ts`
- `Get-Content src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `Get-Content scripts/check-backend-boundaries.mjs`
- `rg -n 'serpApiHelper\.(search|guessEmail)' C:\3d\src`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Audit Notes

Current helper API:

- `search(params) -> { data, error }`
- `guessEmail(domain?, _companyName?) -> string`

Direct caller set:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Only leads providers use `guessEmail(...)`.

## Boundary Summary

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- `check:backend-boundaries`: `PASS`
- `check:expo-boundaries`: `PASS`

## Sandbox Note

The following commands hit the known sandbox-only `spawn EPERM` restriction and were rerun outside sandbox:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

These passed outside sandbox on the same machine.
