# Phase 33: Agents Memory Duplicate Burn-Down

## Outcome

Phase 33 removed the next narrow agents duplicate:

- `src/backend/agents/memoryService.js`

The authoritative implementation remains:

- `src/backend/agents/memoryService.ts`

This keeps the agents execution/application-service boundary unchanged while continuing the proof-driven duplicate burn-down.

## Why This Pair

`memoryService.js` was the narrowest remaining non-runner candidate after:

- `src/backend/agents/execution/agentExecutor.js`
- `src/backend/agents/engine/agentExecutionLoop.js`
- `src/backend/agents/engine/agentPlanner.js`

Its active import graph stayed local to the agents engine:

- `src/backend/agents/engine/agentExecutionLoop.ts`
- `src/backend/agents/engine/agentCoordinator.ts`

No worker, subscriber, package script, or dynamic import required a physical `memoryService.js` source file.

## Audit Findings

Audited files:

- `src/backend/agents/memoryService.ts`
- `src/backend/agents/engine/agentExecutionLoop.ts`
- `src/backend/agents/engine/agentPlanner.ts`
- `src/backend/agents/engine/agentTools.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/runners/*.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`

Audit result:

- `memoryService.ts` is the maintained implementation.
- `memoryService.js` was a legacy duplicate.
- Existing `.js` specifiers were left unchanged to preserve the same runtime proof pattern as previous phases.

## Runtime Safety Proof

The runtime proof for this phase is:

1. `agentExecutionLoop.ts` still imports `../memoryService.js`.
2. `agentCoordinator.ts` still imports `../memoryService.js`.
3. The source `memoryService.js` file was deleted.
4. The repo still passed:
   - `npm run check:expo-boundaries`
   - `npm run check:backend-boundaries`
   - `npx tsc -b`
   - `npm --prefix backend-server run build`
   - `npm run build` outside sandbox
   - backend expo route/controller tests outside sandbox

That is sufficient proof that the current build/runtime path does not require a physical `memoryService.js` source file.

## Post-Phase State

After this removal:

- agents duplicate warnings: `6 -> 5`
- distribution duplicate warnings: `0`
- platform duplicate warnings: `0`

Remaining agents duplicate warnings are now:

- `src/backend/agents/engine/agentTools.js`
- `src/backend/agents/runners/leadRunner.js`
- `src/backend/agents/runners/marketingRunner.js`
- `src/backend/agents/runners/salesRunner.js`
- `src/backend/agents/runners/seoRunner.js`

## Deferred

This phase did not change:

- `agentTools`
- runner implementations
- broader agents architecture outside the duplicate surface
