# Phase 86 Diagnostics

## Commands Run

Audit:

- `rg -n --glob '!docs/**' --glob '!diagnostics/**' --glob '!dist/**' --glob '!node_modules/**' "leadEngine\\.js|leadEngine\\.ts|import\\(|dynamic import|worker" C:\\3d\\src C:\\3d\\backend-server C:\\3d\\scripts`

Validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Audit Notes

`leadEngine.js` direct callers before deletion:

- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

No direct runtime entry usage was found via:

- root `package.json` scripts
- `backend-server/package.json` scripts
- worker entry paths
- dynamic imports

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
