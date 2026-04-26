# Phase 76 Diagnostics

## Commands Run

### Duplicate / runtime graph audit

- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadEngine\\.js|directoryLeadSource\\.js|googleMapsLeadSource\\.js|leadSourceCollectionService\\.js|linkedinLeadSource\\.js|serpApiHelper\\.js|import\\(|dynamic import|worker" src backend-server scripts`
- `Get-Content package.json`
- `Get-Content backend-server/package.json`
- `Get-Content src/backend/leads/sources/leadSourceCollectionService.ts`
- `Get-Content src/backend/revenue/prospecting/prospectingAdapters.ts`
- `Get-Content src/backend/growth/nicheDiscovery.ts`
- `Get-Content src/backend/dataSources/googleSearchService.ts`
- `Get-Content src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `Get-Content src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `Get-Content src/agents/leadAgent.ts`

### Validation

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `EPERM`, rerun outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Backend Boundary Summary

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `69`
- domain duplicate warnings: `0`
- leads duplicate warnings: `6`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Notes

- No source-cluster files were deleted in this phase.
- The selected next deletion candidate is `src/backend/leads/sources/directoryLeadSource.js`.
