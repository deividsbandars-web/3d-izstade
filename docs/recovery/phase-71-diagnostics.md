# Phase 71 Diagnostics

## Commands Run

### Duplicate / import graph audit

- `rg -n "leadEngine\\.js|leadScoring\\.js|directoryLeadSource\\.js|googleMapsLeadSource\\.js|linkedinLeadSource\\.js|serpApiHelper\\.js|leadEventService\\.js|leadAgentSchedulingService\\.js|leadSourceCollectionService\\.js|leadValidationService\\.js" C:\3d`
- `Get-ChildItem src/backend/leads -Recurse -File`
- `Get-Content scripts/check-backend-boundaries.mjs`
- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadValidationService\\.js|leadEventService\\.js|leadAgentSchedulingService\\.js|leadSourceCollectionService\\.js|leadScoring\\.js|leadEngine\\.js|serpApiHelper\\.js|googleMapsLeadSource\\.js|directoryLeadSource\\.js|linkedinLeadSource\\.js" C:\3d`
- `Get-Content package.json`
- `Get-Content backend-server/package.json`

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
- leads duplicate warnings: `10`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Notes

- No leads files were deleted or rewritten in this phase.
- The selected next deletion candidate is `src/backend/leads/validation/leadValidationService.js`.
