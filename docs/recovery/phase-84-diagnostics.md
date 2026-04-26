# Phase 84 Diagnostics

## Commands Run

Audit:

- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadEngine\\.js|leadEngine\\.ts|serpApiHelper\\.js|serpApiHelper\\.ts|import\\(|dynamic import|worker" C:\\3d\\src C:\\3d\\backend-server C:\\3d\\scripts`
- `Get-Content C:\\3d\\src\\backend\\leads\\leadsApplicationService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\leadToolAdapters.ts`
- `Get-Content C:\\3d\\src\\agents\\leadAgent.ts`
- `Get-Content C:\\3d\\src\\backend\\growth\\nicheDiscovery.ts`
- `Get-Content C:\\3d\\src\\backend\\dataSources\\googleSearchService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\dataSourceToolAdapters.ts`
- `Get-Content C:\\3d\\package.json`
- `Get-Content C:\\3d\\backend-server\\package.json`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Boundary Summary

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- leads duplicate warnings: `2`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Audit Conclusion

- `leadEngine.js` remains an active compatibility/runtime surface
- `serpApiHelper.js` remains a shared cross-domain helper
- neither remaining duplicate file is safe for direct deletion without a preparation phase

## Sandbox Note

`npm.cmd run build` and the two backend `tsx` test commands hit the known sandbox `spawn EPERM` restriction when run inside the sandbox. They passed when rerun outside the sandbox on the same machine. This indicates sandbox execution limits, not a repository failure.
