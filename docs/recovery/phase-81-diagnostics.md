# Phase 81 Diagnostics

## Commands Run

Audit:

- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\googleMapsLeadSource.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\googleMapsLeadSource.js`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\leadSourceCollectionService.ts`
- `Get-Content C:\\3d\\src\\backend\\revenue\\prospecting\\prospectingAdapters.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\serpApiHelper.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\serpApiHelper.js`
- `Get-Content C:\\3d\\scripts\\check-backend-boundaries.mjs`
- `Get-Content C:\\3d\\src\\backend\\leads\\leadsApplicationService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\leadToolAdapters.ts`
- `Get-Content C:\\3d\\src\\agents\\leadAgent.ts`
- `Get-Content C:\\3d\\src\\backend\\growth\\nicheDiscovery.ts`
- `Get-Content C:\\3d\\src\\backend\\dataSources\\googleSearchService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\dataSourceToolAdapters.ts`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Boundary Summary

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `69`
- domain duplicate warnings: `0`
- leads duplicate warnings: `3`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Audit Conclusion

- leads uses `googleMapsLeadSource` through `leadSourceCollectionService`
- revenue uses `googleMapsLeadSource` directly through `prospectingAdapters`
- `googleMapsLeadSource.js` duplicate deletion is not yet safe while this cross-domain direct usage remains
- next safe seam is a revenue-local adapter boundary

## Sandbox Note

`npm.cmd run build` and the two backend `tsx` test commands hit the known sandbox `spawn EPERM` restriction when run inside the sandbox. They passed when rerun outside the sandbox on the same machine. This indicates sandbox execution limits, not a repository failure.
