# Phase 77 Diagnostics

## Commands Run

Pre-delete audit:

- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "directoryLeadSource\\.js|directoryLeadSource\\.ts|import\\(|dynamic import|worker" C:\\3d\\src C:\\3d\\backend-server C:\\3d\\scripts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\leadSourceCollectionService.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\leadSourceCollectionService.js`
- `Get-Content C:\\3d\\src\\backend\\leads\\sources\\directoryLeadSource.ts`
- `Get-Content C:\\3d\\package.json`
- `Get-Content C:\\3d\\backend-server\\package.json`

Deletion:

- removed `src/backend/leads/sources/directoryLeadSource.js`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Audit Result

`directoryLeadSource.js` was only referenced by:

- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Not found:

- package script entry
- backend-server package script entry
- worker entry path
- dynamic import path
- cross-domain caller

## Boundary Summary

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `69`
- domain duplicate warnings: `0`
- leads duplicate warnings: `5`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Sandbox Note

`npm.cmd run build` and the two backend `tsx` test commands hit the known sandbox `spawn EPERM` restriction when run inside the sandbox. They passed when rerun outside the sandbox on the same machine. This indicates sandbox execution limits, not a repository failure.
