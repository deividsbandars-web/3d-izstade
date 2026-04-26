# Phase 87 Diagnostics

## Commands Run

Audit:

- `rg -n 'serpApiHelper\.js|from \".*serpApiHelper\.js\"|from ''.*serpApiHelper\.js''|import\(.*serpApiHelper|worker' C:\3d\src C:\3d\backend-server C:\3d\scripts`
- `rg -n "serpApiHelper\.(search|guessEmail)" C:\3d\src`

Files inspected:

- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `package.json`
- `backend-server/package.json`
- `scripts/check-backend-boundaries.mjs`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Audit Notes

Direct callers found:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

`guessEmail(...)` callers:

- `googleMapsLeadSource.ts`
- `directoryLeadSource.ts`

`search(...)` callers:

- all six direct callers above except `guessEmail`-only distinction

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
