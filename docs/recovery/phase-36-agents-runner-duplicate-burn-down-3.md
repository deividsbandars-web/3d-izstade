# Phase 36: Agents Runner Duplicate Burn-Down 3

## Outcome

Phase 36 removed the third runner-level legacy duplicate:

- `src/backend/agents/runners/marketingRunner.js`

The authoritative implementation remains:

- `src/backend/agents/runners/marketingRunner.ts`

This phase stayed inside the runner slice and did not touch `agentTools` or `salesRunner`.

## Why This Pair

`marketingRunner.js` was the priority candidate for this cycle and its import graph stayed narrow:

- `src/backend/agents/execution/agentExecutor.ts` imports `../runners/marketingRunner.js`

No worker, event subscriber, package script, or dynamic import required a physical `marketingRunner.js` source file.

## Audit Findings

Audited files:

- `src/backend/agents/runners/marketingRunner.ts`
- `src/backend/agents/runners/salesRunner.ts`
- `src/backend/agents/engine/agentTools.ts`
- `src/backend/agents/execution/agentExecutor.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `backend-server/worker.ts`
- `backend-server/events/subscribers.ts`

Audit result:

- remaining runner `.js` files are consumed through `agentExecutor.ts`
- `marketingRunner.ts` is the maintained implementation
- there was no stronger runtime dependency on the physical `marketingRunner.js` file than in earlier agents duplicate-removal phases

## Runtime Safety Proof

The runtime proof for this phase is:

1. `agentExecutor.ts` still imports `../runners/marketingRunner.js`.
2. The source `marketingRunner.js` file was deleted.
3. The repo still passed:
   - `npm run check:expo-boundaries`
   - `npm run check:backend-boundaries`
   - `npx tsc -b`
   - `npm --prefix backend-server run build`
   - `npm run build` outside sandbox
   - backend expo route/controller tests outside sandbox

That is sufficient proof that the repo does not require a physical `marketingRunner.js` source file on the current runtime path.

## Post-Phase State

After this removal:

- agents duplicate warnings: `3 -> 2`
- distribution duplicate warnings: `0`
- platform duplicate warnings: `0`

Remaining agents duplicate warnings are now:

- `src/backend/agents/engine/agentTools.js`
- `src/backend/agents/runners/salesRunner.js`

## Deferred

This phase did not change:

- `agentTools`
- `salesRunner`
- broader agents architecture outside the single runner duplicate target
