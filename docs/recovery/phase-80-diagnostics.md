# Phase 80 Diagnostics

## Commands Run

Deep audit:

- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadEngine\\.js|leadEngine\\.ts|googleMapsLeadSource\\.js|googleMapsLeadSource\\.ts|serpApiHelper\\.js|serpApiHelper\\.ts" C:\\3d\\src C:\\3d\\backend-server C:\\3d\\scripts`
- `Get-Content C:\\3d\\src\\backend\\leads\\engine\\leadEngine.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\googleMapsLeadSource.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\serpApiHelper.ts`
- `Get-Content C:\\3d\\package.json`
- `Get-Content C:\\3d\\backend-server\\package.json`
- `Get-Content C:\\3d\\src\\backend\\leads\\leadsApplicationService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\leadToolAdapters.ts`
- `Get-Content C:\\3d\\src\\agents\\leadAgent.ts`
- `Get-Content C:\\3d\\src\\backend\\revenue\\prospecting\\prospectingAdapters.ts`
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

## Risk Summary

- `leadEngine.js`: compatibility surface, high risk
- `googleMapsLeadSource.js`: cross-domain provider, high risk
- `serpApiHelper.js`: shared cross-domain helper, very high risk

## Sandbox Note

`npm.cmd run build` and the two backend `tsx` test commands hit the known sandbox `spawn EPERM` restriction when run inside the sandbox. They passed when rerun outside the sandbox on the same machine. This indicates sandbox execution limits, not a repository failure.
