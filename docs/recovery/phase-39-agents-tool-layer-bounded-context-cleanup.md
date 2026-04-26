# Phase 39: Agents Tool-Layer Bounded-Context Cleanup

## Selected Boundary

This phase treated `src/backend/agents/engine/agentTools.ts` as the bounded-context choke point.

The problem before this phase was structural:

- `agentTools.ts` directly imported cross-domain implementations from:
  - `src/backend/leads/**`
  - `src/backend/revenue/**`
  - `src/backend/growth/**`
  - `src/backend/business/**`
  - `src/backend/dataSources/**`
- the file was both:
  - the agents-local tool registry
  - the direct cross-domain execution surface

That made `agentTools.ts` a cross-domain grab-bag rather than an agents-local boundary.

## What Moved

New agents-local tool-layer files:

- `src/backend/agents/tools/agentToolTypes.ts`
- `src/backend/agents/tools/agentToolAdapters.ts`
- `src/backend/agents/tools/agentToolService.ts`

Responsibilities after extraction:

- `agentToolTypes.ts`
  - owns the local `AgentTool` contract
- `agentToolAdapters.ts`
  - owns cross-domain adapter calls into leads/revenue/growth/business/dataSources
- `agentToolService.ts`
  - owns registry construction and tool execution wiring
- `agentTools.ts`
  - becomes a thin agents-engine entry surface that consumes the agents-local tool service

## New Tool-Layer Contract

The new boundary is:

- `src/backend/agents/engine/agentTools.ts`
  - may consume agents-local tool-layer service/types
- `src/backend/agents/tools/**`
  - may talk to explicitly allowlisted adapter dependencies
- sibling backend domains
  - are no longer imported directly by `agentTools.ts`

This is the key architectural change in this phase.

## Remaining Direct Imports

Some cross-domain calls still exist, but they now live behind the agents-local adapter boundary:

- leads
- revenue
- growth
- business
- dataSources

These were left in place because the phase goal was boundary cleanup, not redesign of those external domains.

## Boundary Enforcement

`scripts/check-backend-boundaries.mjs` now enforces:

- `src/backend/agents/engine/agentTools.ts` must not import sibling backend domains directly
- `src/backend/agents/tools/**` is the allowlisted adapter boundary
- duplicate warnings remain `0` for agents/platform/distribution

This keeps the new separation enforceable instead of relying only on discipline.

## Deferred

This phase did not do:

- tool-layer redesign
- LLM service redesign
- governance/leads/workflows redesign
- broader agents architecture rewrite

The goal was the boundary, and that boundary is now materially clearer.
