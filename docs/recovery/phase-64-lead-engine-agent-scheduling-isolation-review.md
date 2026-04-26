# Phase 64 - Lead Engine Agent Scheduling Isolation Review

## Summary

This phase was a pure audit/selection slice.

No scheduler, queue, leads, or agents implementation was refactored.

The next selected implementation slice is:
- `A. Agent scheduling helper`

Recommended next phase target:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

## Scheduling Flow Audit

### Where scheduling happens

`src/backend/leads/engine/leadEngine.ts` contains one scheduling entry:

```ts
async assignLead(leadId: string, salesAgentId: string)
```

Inside it, the engine calls:

```ts
agentScheduler.dispatchTask(...)
```

### Scheduling payload

Observed payload:

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

### Ordering relative to persistence and events

Important finding:
- scheduling is **not** part of `processAndStoreLeads(...)`
- scheduling is **not** chained after persistence
- scheduling is **not** chained after `LEAD_CREATED` publishing

It is a separate lead-assignment use-case.

### Is it mandatory or best-effort?

Current behavior indicates best-effort side-effect semantics:
- `assignLead(...)` returns `{ data, error }`
- it catches failures and returns an error instead of crashing unrelated lead collection flow
- there is no local transaction tying it to persistence or event publishing

## Candidate Comparison

### A. Agent scheduling helper

Suggested target:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

Scope:
- move only task dispatch payload construction and `agentScheduler.dispatchTask(...)` call out of `leadEngine`

Pros:
- narrow and reviewable
- preserves current behavior
- isolates the last obvious external side-effect still directly imported by `leadEngine`
- does not require queue redesign

Risk:
- low to moderate

### B. Keep scheduling in engine for now

Pros:
- zero code churn

Cons:
- leaves `leadEngine` still coupled to an external scheduling subsystem
- blocks the next clean internal decomposition step

Verdict:
- not recommended yet, because the scheduling slice is already narrow enough

### C. Move scheduling to agentsApplicationService

Pros:
- could align with a future stronger agents boundary

Cons:
- too broad for the next step
- risks opening agents system redesign and queue boundary redesign
- not appropriate as the immediate next implementation slice

Verdict:
- keep only as a future architectural option

## Selected Next Slice

Selected next implementation slice:
- `A. Agent scheduling helper`

Recommended shape:
- `src/backend/leads/agents/leadAgentSchedulingService.ts`

Purpose:
- make `leadEngine.assignLead(...)` delegate to a leads-local helper
- keep the payload shape unchanged
- keep `agentScheduler` as the low-level dependency behind that helper

## Files Likely Affected Next Phase

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/agents/leadAgentSchedulingService.ts`
- `src/backend/leads/agents/leadAgentSchedulingService.js`
- `scripts/check-backend-boundaries.mjs`

Audit context:
- `src/agents/system/scheduler/agentScheduler.ts`
- `src/agents/system/scheduler/agentScheduler.js`
- `src/backend/queue/taskQueue.ts`

## Explicitly Out Of Scope Next Phase

Do not touch:
- source collection
- scoring logic
- persistence flow
- event publishing flow
- `growth/leadCapture`
- queue processing internals
- `agentsApplicationService`
- event bus internals
- duplicate burn-down

## Boundary Check Notes

No new hard-fail rule was added in this audit phase.

Existing protections remain:
- `leadEngine.ts` must not import `supabaseClient` directly
- `leadEngine.ts` must not import `eventPublisher` directly
- `leadsController.ts` may import from leads only `leadsApplicationService.ts`

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
