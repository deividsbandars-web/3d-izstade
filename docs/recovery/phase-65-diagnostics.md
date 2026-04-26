# Phase 65 Diagnostics

## Files Audited

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/agents/system/scheduler/agentScheduler.js`
- `src/backend/queue/taskQueue.ts`
- `src/backend/agents/agentsApplicationService.ts`

## Key Findings

- `assignLead(...)` was the only scheduling entry in `leadEngine`
- payload shape was stable and minimal
- queue execution happens later in `taskQueue.ts`
- `agentsApplicationService` is downstream consumer logic, not part of the dispatch call
- scheduling could be isolated safely without touching queue or agents internals

## Code Changes

- added `src/backend/leads/agents/leadAgentSchedulingService.ts`
- added `src/backend/leads/agents/leadAgentSchedulingService.js`
- rewired `leadEngine.ts` to call the new helper
- rewired `leadEngine.js` for runtime parity
- tightened `check-backend-boundaries.mjs` with `leadEngine -> agentScheduler` hard-fail

## Commands Run

Passed in sandbox:

```powershell
npm.cmd run check:expo-boundaries
npm.cmd run check:backend-boundaries
npx.cmd tsc -b
npm.cmd --prefix backend-server run build
```

Failed in sandbox due environment restriction:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

Passed outside sandbox on the same machine:

```powershell
npm.cmd run build
npx.cmd tsx routes/__tests__/expoScene.test.ts
npx.cmd tsx routes/__tests__/expoScene.controller.test.ts
```

## Current Boundary Summary

- `check:backend-boundaries`: `PASS`
- `check:expo-boundaries`: `PASS`
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `8`
- billing boundary warnings: `0`
- violations: `0`

## Remaining `leadEngine` Responsibilities

- source collection
- validation
- scoring
- persistence via `leadService`
- lead-created event publishing via `leadEventService`
