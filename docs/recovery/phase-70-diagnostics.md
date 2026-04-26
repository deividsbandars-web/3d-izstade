# Phase 70 Diagnostics

## Commands Run

### Audit

- `Get-Content src/backend/leads/engine/leadEngine.ts`
- `Get-Content src/backend/leads/engine/leadEngine.js`
- `Get-Content src/backend/leads/leadScoring.ts`
- `Get-Content src/backend/leads/leadScoring.js`
- `rg -n "scoreLead\\(|leadScoring" src backend-server`

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

- `scoreLead(...)` is currently used only by `leadEngine`.
- No leads/scoring-specific automated tests were found.
