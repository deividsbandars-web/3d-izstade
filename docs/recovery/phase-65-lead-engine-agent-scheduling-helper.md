# Phase 65 - Lead Engine Agent Scheduling Helper

## Summary

This phase removed the direct scheduling dependency from `src/backend/leads/engine/leadEngine.ts` and moved it behind a leads-local helper:

- `src/backend/leads/agents/leadAgentSchedulingService.ts`

`leadEngine` still owns:
- source collection
- validation
- scoring
- persistence call
- lead-created event publishing

Only the scheduling authority moved.

## Before

`leadEngine.ts` imported:
- `src/agents/system/scheduler/agentScheduler.js`

and `assignLead(...)` directly called:

```ts
agentScheduler.dispatchTask({
  agent_id: salesAgentId,
  status: 'pending',
  task_data: {
    action: 'Perform Outreach',
    lead_id: leadId
  }
})
```

The result was then wrapped as:

```ts
{ data: taskResult.data, error: null }
```

Errors were handled locally by the `assignLead(...)` `try/catch`.

## Scheduling Audit

Observed scheduling flow:

- scheduling happens only in `assignLead(...)`
- it is not part of `processAndStoreLeads(...)`
- it is not chained after persistence or event publishing
- it is a separate lead-assignment use-case

Observed dispatch payload:

```ts
{
  agent_id: salesAgentId,
  status: 'pending',
  task_data: {
    action: 'Perform Outreach',
    lead_id: leadId
  }
}
```

Observed dependency behavior:
- `agentScheduler.dispatchTask(...)` returns `{ data, error }`
- `leadEngine.assignLead(...)` previously only used `taskResult.data`
- `assignLead(...)` still catches and normalizes thrown errors to `{ data: null, error: string }`

This made the scheduling dependency safe to move behind a leads-local helper without changing payload or behavior.

## Boundary Decision

Added:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

Responsibility:
- expose a single narrow use-case:
  - `scheduleLeadOutreach(leadId, salesAgentId)`
- hide direct `agentScheduler` usage from `leadEngine`

This phase does not redesign queue processing or the agents system.

## Implementation

### `leadAgentSchedulingService.ts`

Added:
- `scheduleLeadOutreach(leadId, salesAgentId)`

Internally it still calls:
- `agentScheduler.dispatchTask(...)`

The payload shape is unchanged.

### `leadEngine.ts`

Changed:
- removed direct `agentScheduler` import
- added `leadAgentSchedulingService` import
- replaced direct `dispatchTask(...)` call with:

```ts
leadAgentSchedulingService.scheduleLeadOutreach(leadId, salesAgentId)
```

The return behavior remains:
- success: `{ data: taskResult.data, error: null }`
- failure: `{ data: null, error: String(error) }`

## Runtime Parity Note

The repo still contains a checked-in `leadEngine.js` duplicate, and call sites still resolve `.js` paths.

To preserve runtime parity, the same scheduling-helper shift was mirrored in:
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/agents/leadAgentSchedulingService.js`

This is not duplicate burn-down.

## Boundary Check

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `leadEngine.ts` imports `supabaseClient` directly
- `leadEngine.ts` imports `eventPublisher` directly
- `leadEngine.ts` imports `agentScheduler` directly

Expected path:
- `leadEngine.ts -> leadAgentSchedulingService.ts -> agentScheduler`

Existing protections remain:
- `leadsController.ts -> leadsApplicationService.ts`
- stabilized domain duplicate warnings remain `0`
- billing boundary warnings remain `0`

## Validation

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

Leads/agents-specific automated tests were not found in the repo.

## Deferred

Still deferred:
- queue redesign
- agentsApplicationService redesign
- source collection split
- scoring redesign
- duplicate burn-down
- growth cleanup

## Next Recommended Slice

Next phase should stay audit-first:
- `LEAD ENGINE SCORING / SOURCE COLLECTION SELECTION REVIEW`

Reason:
- direct external side-effects are now materially reduced
- the next decision is whether the next narrow engine slice should be scoring or source fan-out, not another agents/queue refactor
