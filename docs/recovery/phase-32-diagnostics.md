# Phase 32 Diagnostics

## Commands Run

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted with `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Results

- `check:expo-boundaries`: PASS
- `check:backend-boundaries`: PASS
- root TypeScript build: PASS
- backend TypeScript build: PASS
- root production build: PASS outside sandbox
- backend expo route/controller tests: PASS outside sandbox

## Boundary Check Output

`check:backend-boundaries` after removal:

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `59`
- domain duplicate warnings: `6`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Duplicate warnings remaining:

- `src/backend/agents/engine/agentTools.js`
- `src/backend/agents/memoryService.js`
- `src/backend/agents/runners/leadRunner.js`
- `src/backend/agents/runners/marketingRunner.js`
- `src/backend/agents/runners/salesRunner.js`
- `src/backend/agents/runners/seoRunner.js`

## Changed Files

- deleted `src/backend/agents/engine/agentPlanner.js`
- `docs/recovery/phase-32-agents-execution-adjacent-duplicate-burn-down-3.md`
- `docs/recovery/phase-32-diagnostics.md`

## Audit Notes

Audited import/runtime paths:

- `src/backend/agents/engine/agentPlanner.*`
- `src/backend/agents/engine/agentExecutionLoop.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `src/backend/queue/taskQueue.ts`
- `src/agents/system/brain/agentBrain.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`

Audit conclusion:

- `agentPlanner.js` was only part of a normal `.js` specifier chain from `agentExecutionLoop.ts`
- no worker, package script, dynamic import, or subscriber path required a physical `agentPlanner.js` source file

## Remaining Risks

- agents duplicate debt still exists in `agentTools`, `memoryService`, and runner files
- TypeScript source still uses `.js` specifiers, so the proof still depends on current TypeScript/tsx resolution behavior

## Explicit Deferred Items

- no `agentTools` cleanup
- no runner cleanup
- no `memoryService` cleanup
- no broader agents redesign
