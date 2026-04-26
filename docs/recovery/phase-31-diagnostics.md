# Phase 31 Diagnostics

## Selected slice

Chosen slice:

- `agents execution`

Pair targeted:

- `src/backend/agents/engine/agentExecutionLoop.js` / `.ts`

## Duplicate audit scope

Audited:

- `src/backend/agents/engine/agentExecutionLoop.*`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `src/backend/queue/taskQueue.ts`
- `backend-server/worker.ts`
- `backend-server/package.json`
- `backend-server/events/subscribers.ts`
- `src/agents/system/brain/agentBrain.ts`

## Removal completed

Safely removed:

- `src/backend/agents/engine/agentExecutionLoop.js`

Reason for removal:

- the authoritative implementation already existed in `agentExecutionLoop.ts`
- active imports used normal `.js` specifiers from:
  - `src/backend/agents/execution/agentExecutor.ts`
  - `src/backend/agents/engine/agentCoordinator.ts`
  - `src/agents/system/brain/agentBrain.ts`
- there were no special package-script, worker, dynamic-import, or event-subscriber paths depending on a physical `agentExecutionLoop.js` source file
- the existing `.js` import shape stayed intact and validated after removal

## Commands run

### Passed in sandbox

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

### Sandbox-restricted with `spawn EPERM`

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Passed outside sandbox on the same machine

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Results

- `check:expo-boundaries`: `PASS`
- `check:backend-boundaries`: `PASS`
- root TypeScript build: `PASS`
- backend build: `PASS`
- frontend production build: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`
- backend expo route/controller tests: `PASS` outside sandbox, blocked in sandbox by `spawn EPERM`

## Boundary check result

`check:backend-boundaries` output after removal:

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `60`
- domain duplicate warnings: `7`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Important outcome:

- agents duplicate warnings fell from `8` to `7`
- distribution duplicate warnings remain `0`
- platform duplicate warnings remain `0`
- `agentExecutionLoop.js` no longer appears in duplicate warnings

## Files changed

- `src/backend/agents/engine/agentExecutionLoop.js` (removed)
- `docs/recovery/phase-31-agents-execution-duplicate-burn-down-2.md`
- `docs/recovery/phase-31-diagnostics.md`

## Remaining duplicate risks

Agents:

- `engine/agentPlanner.js` / `.ts`
- `engine/agentTools.js` / `.ts`
- `memoryService.js` / `.ts`
- `runners/leadRunner.js` / `.ts`
- `runners/marketingRunner.js` / `.ts`
- `runners/salesRunner.js` / `.ts`
- `runners/seoRunner.js` / `.ts`

Distribution:

- none

Platform:

- none

## Remaining coupling assumptions

- TypeScript source still uses `.js` specifiers, and current safety still depends on the existing TypeScript/tsx resolution behavior mapping those specifiers onto `.ts` source correctly

## Deferred items

- no runner cleanup
- no planner cleanup
- no `agentTools` cleanup
- no `memoryService` cleanup
- no broader agents redesign
