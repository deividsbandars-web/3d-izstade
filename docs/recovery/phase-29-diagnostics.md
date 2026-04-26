# Phase 29 Diagnostics

## Selected slice

Chosen slice:

- `agent task execution`

Reason:

- it is the clearest controller-facing agents use-case
- it is exercised both by HTTP entry (`/agents/run`) and queue runtime (`taskQueue`)
- it allowed a bounded-context improvement without widening into a full agents redesign

## What changed

Added:

- `src/backend/agents/agentsApplicationService.ts`

Refactored:

- `backend-server/controllers/agentsController.ts`
- `src/backend/queue/taskQueue.ts`
- `src/backend/queue/taskQueue.js`

Outcome:

- controller no longer imports `agentExecutor` directly
- queue runtime no longer imports `agentExecutor` directly
- both now pass through the same application-service boundary

## Cross-domain audit findings

Selected-slice coupling that remains:

- governance:
  - `src/backend/governance/agentGovernor.js`
- events:
  - `src/backend/events/eventPublisher.js`
  - `src/backend/events/eventTypes.js`
- logging:
  - `src/backend/logging/logger.js`
- scheduler:
  - `src/agents/system/scheduler/agentScheduler.js`

Broader agents-domain coupling outside the selected slice remains in:

- `src/backend/agents/engine/agentTools.ts`
  - leads
  - business
  - growth
  - revenue
  - dataSources
- runners importing `src/backend/ai/llmService`

These were audited and deferred.

## JS/TS duplicate audit

Agents duplicate warnings found:

- `src/backend/agents/engine/agentExecutionLoop.js` + `.ts`
- `src/backend/agents/engine/agentPlanner.js` + `.ts`
- `src/backend/agents/engine/agentTools.js` + `.ts`
- `src/backend/agents/execution/agentExecutor.js` + `.ts`
- `src/backend/agents/memoryService.js` + `.ts`
- `src/backend/agents/runners/leadRunner.js` + `.ts`
- `src/backend/agents/runners/marketingRunner.js` + `.ts`
- `src/backend/agents/runners/salesRunner.js` + `.ts`
- `src/backend/agents/runners/seoRunner.js` + `.ts`

No duplicate was removed in this phase.

Reason:

- the phase target was bounded-context cleanup, not duplicate burn-down
- agents runtime paths are broader and need a dedicated proof-driven duplicate phase

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

Agents tests:

- none found in repo

## Boundary check result

`check:backend-boundaries` output after expansion:

- route files scanned: `3`
- controller/expo/distribution/platform/agents files scanned: `62`
- domain duplicate warnings: `9`
- agents cross-domain warnings: `0`
- violations: `0`
- status: `PASS`

Important outcome:

- distribution duplicate warnings remain `0`
- platform duplicate warnings remain `0`
- agents duplicate warnings are now surfaced explicitly

## Files changed

- `backend-server/controllers/agentsController.ts`
- `src/backend/agents/agentsApplicationService.ts`
- `src/backend/queue/taskQueue.ts`
- `src/backend/queue/taskQueue.js`
- `scripts/check-backend-boundaries.mjs`
- `docs/recovery/phase-29-agents-bounded-context-cleanup.md`
- `docs/recovery/phase-29-diagnostics.md`

## Remaining coupling assumptions

- agents task execution still relies on governance/events/logging/scheduler dependencies outside `src/backend/agents/**`
- TypeScript source still uses `.js` specifiers
- agents duplicate pairs remain unresolved and may still affect runtime ambiguity if imported paths drift

## Deferred items

- no agents duplicate removal
- no agents engine/tool redesign
- no revenue cleanup
- no frontend/expo/operator/planning changes
- no broad backend rewrite
