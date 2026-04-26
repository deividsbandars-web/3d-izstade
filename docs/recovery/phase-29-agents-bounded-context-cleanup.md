# Phase 29: Agents Bounded-Context Cleanup

## Selected slice

This phase intentionally targeted a narrow agents slice:

- `agent task execution`

Entry points:

- `POST /agents/run`
- queue-driven task execution via `src/backend/queue/taskQueue.ts`

This slice was selected because it is the clearest controller-facing agents use-case and already touched both HTTP and worker runtime paths.

## What was mixed before

Before this phase:

- `backend-server/controllers/agentsController.ts` directly imported `agentExecutor`
- the controller coordinated request validation, analytics tracking, and direct task execution itself
- `src/backend/queue/taskQueue.ts` also imported `agentExecutor` directly
- there was no controller-facing agents application-service boundary
- `check:backend-boundaries` did not scan `src/backend/agents/**`

## Boundary improvement

Added:

- `src/backend/agents/agentsApplicationService.ts`

This new boundary now owns the controller/queue-facing task execution use-case:

- validates task execution inputs
- calls `agentExecutor`
- normalizes execution failures into a consistent result shape

`agentsController.ts` is now thinner:

- reads request body
- validates request shape
- emits observability events
- delegates task execution to `agentsApplicationService`
- maps HTTP response

`taskQueue.ts` now also delegates task execution through the same application-service boundary instead of importing `agentExecutor` directly.

## Cross-domain coupling status

The selected slice still depends on justified non-agents backend infrastructure:

- governance:
  - `agentGovernor`
- events:
  - `eventPublisher`
  - `eventTypes`
- logging:
  - `logger`
- external scheduler path:
  - `src/agents/system/scheduler/agentScheduler`

These remain because they are part of the current execution contract for agent tasks.

Broader agents cross-domain coupling still exists outside the selected slice, especially in:

- `agentTools.ts`
- runners importing `llmService`
- revenue/growth/leads/business tool integrations

Those were audited and left deferred rather than rewritten in this phase.

## JS/TS duplicate audit

Agents duplicate pairs found:

- `engine/agentExecutionLoop.js` / `.ts`
- `engine/agentPlanner.js` / `.ts`
- `engine/agentTools.js` / `.ts`
- `execution/agentExecutor.js` / `.ts`
- `memoryService.js` / `.ts`
- `runners/leadRunner.js` / `.ts`
- `runners/marketingRunner.js` / `.ts`
- `runners/salesRunner.js` / `.ts`
- `runners/seoRunner.js` / `.ts`

No duplicate was removed in this phase.

Reason:

- this phase focused on bounded-context cleanup and enforcement
- runtime safety for agents duplicates is less isolated than the earlier distribution/platform burn-downs

## Boundary check protection

`check:backend-boundaries` now protects agents by:

- scanning `src/backend/agents/**`
- warning on agents `.js/.ts` duplicate pairs
- failing if agents import `src/modules/expo/**`
- failing if agents import `src/backend/platform/**`, `src/backend/distribution/**`, or `src/backend/expo/**` directly
- enforcing that `agentsController.ts` imports only `agentsApplicationService.ts` from `src/backend/**`

## Deferred

Still deferred after this phase:

- broader agents engine/tool bounded-context cleanup
- agents duplicate burn-down
- deeper event/subscriber cleanup
- sibling-domain reduction inside `agentTools.ts`
