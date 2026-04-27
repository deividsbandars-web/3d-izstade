# Phase 92 Diagnostics

## Commands Run

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox restriction only:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Current Boundary Summary

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

## Selected Next Slice

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

## Deferred

- `src/backend/growth/nicheDiscovery.ts`
- any leads provider caller migration
- `guessEmail(...)` extraction
- `src/backend/leads/sources/serpApiHelper.js` deletion
