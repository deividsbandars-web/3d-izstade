# Phase 85 Diagnostics

## Commands Run

Audit:

- `Get-Content C:\\3d\\src\\backend\\leads\\engine\\leadEngine.ts`
- `Get-Content C:\\3d\\src\\backend\\leads\\leadsApplicationService.ts`
- `Get-Content C:\\3d\\src\\backend\\agents\\tools\\adapters\\leadToolAdapters.ts`
- `Get-Content C:\\3d\\src\\agents\\leadAgent.ts`
- `Get-Content C:\\3d\\tsconfig.app.json`
- `Get-Content C:\\3d\\tsconfig.node.json`
- `Get-Content C:\\3d\\backend-server\\tsconfig.json`
- `Get-Content C:\\3d\\backend-server\\tsconfig.docker.json`
- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadEngine\\.js|leadEngine\\.ts|serpApiHelper\\.js|serpApiHelper\\.ts|import\\(|dynamic import|worker" C:\\3d\\src C:\\3d\\backend-server C:\\3d\\scripts`

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
- controller/expo/distribution/platform/agents files scanned: `70`
- domain duplicate warnings: `0`
- leads duplicate warnings: `2`
- agents cross-domain warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Audit Conclusion

- all three `leadEngine` callers are TypeScript files using normal `.js` ESM specifiers
- repo compiler configuration is bundler-mode, so this import style is intentional
- no import migration or compatibility barrel is justified as a preparation step
- next useful step is a direct `leadEngine.js` deletion-proof review

## Sandbox Note

`npm.cmd run build` and the two backend `tsx` test commands hit the known sandbox `spawn EPERM` restriction when run inside the sandbox. They passed when rerun outside the sandbox on the same machine. This indicates sandbox execution limits, not a repository failure.
