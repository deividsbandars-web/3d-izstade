# Phase 32: Agents Execution-Adjacent Duplicate Burn-Down 3

## Outcome

Phase 32 removed the next execution-adjacent legacy duplicate:

- `src/backend/agents/engine/agentPlanner.js`

The authoritative implementation remains:

- `src/backend/agents/engine/agentPlanner.ts`

This keeps the Phase 29 agents application-service boundary intact and continues the proof-driven duplicate burn-down inside the narrow execution slice.

## Why This Pair

`agentPlanner.js` was the next lowest-risk execution-adjacent candidate after:

- `src/backend/agents/execution/agentExecutor.js`
- `src/backend/agents/engine/agentExecutionLoop.js`

The import graph stayed narrow:

- `src/backend/agents/engine/agentExecutionLoop.ts` imports `./agentPlanner.js`

No worker entry point, event subscriber, package script, or dynamic import required a physical `agentPlanner.js` source file.

## Audit Findings

Audited files:

- `src/backend/agents/engine/agentPlanner.ts`
- `src/backend/agents/engine/agentExecutionLoop.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `src/backend/queue/taskQueue.ts`
- `src/agents/system/brain/agentBrain.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`
- `backend-server/package.json`

Audit result:

- `agentPlanner.ts` is the maintained implementation.
- `agentPlanner.js` was a legacy duplicate.
- The remaining `.js` specifier in `agentExecutionLoop.ts` was left unchanged on purpose to preserve the same runtime proof pattern used in earlier phases.

## Runtime Safety Proof

The runtime proof for this phase is:

1. `agentExecutionLoop.ts` still imports `./agentPlanner.js`.
2. The source `agentPlanner.js` file was deleted.
3. The repo still passed:
   - `npm run check:expo-boundaries`
   - `npm run check:backend-boundaries`
   - `npx tsc -b`
   - `npm --prefix backend-server run build`
   - `npm run build` outside sandbox
   - backend expo route/controller tests outside sandbox

That is sufficient proof that the repo does not require a physical `agentPlanner.js` source file on the current build/runtime path.

## Post-Phase State

After this removal:

- agents duplicate warnings: `7 -> 6`
- distribution duplicate warnings: `0`
- platform duplicate warnings: `0`

Remaining agents duplicate warnings are now:

- `src/backend/agents/engine/agentTools.js`
- `src/backend/agents/memoryService.js`
- `src/backend/agents/runners/leadRunner.js`
- `src/backend/agents/runners/marketingRunner.js`
- `src/backend/agents/runners/salesRunner.js`
- `src/backend/agents/runners/seoRunner.js`

## Deferred

This phase did not change:

- `agentTools`
- runner implementations
- `memoryService`
- agents domain design outside the execution-adjacent duplicate surface
