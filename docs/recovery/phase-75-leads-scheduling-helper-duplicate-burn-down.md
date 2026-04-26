# Phase 75 - Leads Scheduling Helper Duplicate Burn-Down

## Summary

Phase 75 removed one leads duplicate file:
- `src/backend/leads/agents/leadAgentSchedulingService.js`

The authoritative implementation remains:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

No scheduling payload or result behavior was changed.

## Scheduling Helper Duplicate Audit Findings

Before deletion, the scheduling helper duplicate surface was:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`
- `src/backend/leads/agents/leadAgentSchedulingService.js`

Real code importers for the `.js` specifier were only:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Additional proof gathered before deletion:
- no package script referenced `leadAgentSchedulingService.js`
- no backend worker entry referenced `leadAgentSchedulingService.js`
- no dynamic import path referenced `leadAgentSchedulingService.js`
- no cross-domain callers referenced `leadAgentSchedulingService.js`

Current TS implementation still preserves the same dispatch path:
- `agentScheduler.dispatchTask(...)`
- payload:
  - `agent_id: salesAgentId`
  - `status: 'pending'`
  - `task_data.action: 'Perform Outreach'`
  - `task_data.lead_id: leadId`

## Deletion Decision

Deleted:
- `src/backend/leads/agents/leadAgentSchedulingService.js`

Kept:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

No import rewrites were required.

## Runtime Safety Proof

Post-deletion proof:

1. `check:backend-boundaries` passed and leads duplicate warnings dropped from `7` to `6`.
2. `npx tsc -b` passed.
3. `npm --prefix backend-server run build` passed.
4. Full app build passed outside sandbox after the known `spawn EPERM` sandbox restriction was bypassed.
5. Backend `tsx` route tests passed outside sandbox after the same sandbox restriction was bypassed.

This shows the deleted checked-in `.js` file was not required as a separate runtime implementation for the validated project paths.

## Boundary Check Result

Boundary protections remain intact:
- `leadsController -> leadsApplicationService`
- `leadEngine -> supabaseClient` direct import ban
- `leadEngine -> eventPublisher` direct import ban
- `leadEngine -> agentScheduler` direct import ban
- `leadEngine -> source provider direct import` ban
- local `validateLead(...)` ban in `leadEngine`

Current summary after deletion:
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `6`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Validation Results

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

Leads/agents-specific automated tests were not found.

## Deferred

- no queue redesign
- no agentsApplicationService redesign
- no scheduler redesign
- no leadEngine redesign
- no source provider cleanup
