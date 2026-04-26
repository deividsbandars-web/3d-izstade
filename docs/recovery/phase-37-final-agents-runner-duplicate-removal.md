# Phase 37: Final Agents Runner Duplicate Removal

## Outcome

Phase 37 removed the final runner-level legacy duplicate:

- `src/backend/agents/runners/salesRunner.js`

The authoritative implementation remains:

- `src/backend/agents/runners/salesRunner.ts`

This phase stayed inside the runner slice and did not touch `agentTools`.

## Why This Pair

`salesRunner.js` was the last remaining runner duplicate and its import graph stayed narrow:

- `src/backend/agents/execution/agentExecutor.ts` imports `../runners/salesRunner.js`

No worker, event subscriber, package script, or dynamic import required a physical `salesRunner.js` source file.

## Audit Findings

Audited files:

- `src/backend/agents/runners/salesRunner.ts`
- `src/backend/agents/engine/agentTools.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`

Audit result:

- runner `.js` imports are consumed through `agentExecutor.ts`
- `salesRunner.ts` is the maintained implementation
- there was no stronger runtime dependency on the physical `salesRunner.js` file than in earlier runner duplicate-removal phases

## Runtime Safety Proof

The runtime proof for this phase is:

1. `agentExecutor.ts` still imports `../runners/salesRunner.js`.
2. The source `salesRunner.js` file was deleted.
3. The repo still passed:
   - `npm run check:expo-boundaries`
   - `npm run check:backend-boundaries`
   - `npx tsc -b`
   - `npm --prefix backend-server run build`
   - `npm run build` outside sandbox
   - backend expo route/controller tests outside sandbox

That is sufficient proof that the repo does not require a physical `salesRunner.js` source file on the current runtime path.

## Post-Phase State

After this removal:

- agents duplicate warnings: `2 -> 1`
- distribution duplicate warnings: `0`
- platform duplicate warnings: `0`

Remaining agents duplicate warning:

- `src/backend/agents/engine/agentTools.js`

## Deferred

This phase did not change:

- `agentTools`
- broader agents architecture outside the final runner duplicate target
