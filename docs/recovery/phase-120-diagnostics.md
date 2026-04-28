# Phase 120 Diagnostics

## Scope

Phase:
- `MARKETPLACE AGENT REGISTRY DUPLICATE REVIEW`

Intent:
- determine whether `src/backend/marketplace/agents/agentRegistry.js` is a stale duplicate artifact or an active runtime/build/test surface

## Pair Summary

Audited:
- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/agents/agentRegistry.js`

Comparison result:
- exports match
- registry behavior matches
- database/table usage matches
- fallback mock agent list matches
- logger usage matches
- return shapes match
- no divergent runtime behavior found

Classification:
- `agentRegistry.js` appears to be a stale checked-in compiled duplicate of `agentRegistry.ts`

## Caller Summary

Active source caller found:
- `backend-server/controllers/marketplaceController.ts`

Import style:
- TypeScript source import using `.js` ESM specifier

Not found:
- package script target
- worker entry target
- dynamic import target
- direct test dependency
- additional source callers

## Boundary Summary

Confirmed:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Command Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM` only:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Decision

- selected decision: `deletion next`
- next target: `MARKETPLACE AGENT REGISTRY DUPLICATE BURN-DOWN`
