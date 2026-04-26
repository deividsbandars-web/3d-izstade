# Phase 66 - Lead Engine Scoring / Source Collection Selection Review

## Summary

This phase was a pure audit/selection pass.

No `leadEngine`, scoring, or source provider implementation was refactored.

Selected next implementation slice:
- `B. Source collection boundary`

Recommended next phase target:
- `src/backend/leads/sources/leadSourceCollectionService.ts`

## Scoring Flow Audit

### Where scoring happens

`src/backend/leads/engine/leadEngine.ts` computes scoring in one place:

```ts
const score = leadScoring.scoreLead(lead);
```

### Input shape

The scoring input is the validated lead object returned from the source providers.

Observed lead fields used by `leadScoring`:
- `company_name`
- `website`
- `email`
- `phone`

### How the score is used

The score currently feeds two downstream paths:
- persistence payload through `leadService.persistCollectedLead(lead, score, userId)`
- event payload through `leadEventService.publishLeadCreated(data.id, score, industry)`

### Isolation status

Scoring is already materially isolated:
- algorithm lives in `src/backend/leads/leadScoring.ts`
- `leadEngine` only performs one direct function call

That means there is still a possible future wrapper/service extraction, but it would mostly change call shape rather than remove major orchestration complexity.

## Source Collection Flow Audit

### Provider selection

`leadEngine.collectLeads(...)` directly imports and orchestrates:
- `googleMapsLeadSource`
- `directoryLeadSource`
- `linkedinLeadSource`

### Collection sequencing

Current execution model:

1. call Google Maps source
2. wait 1 second
3. call directory source
4. wait 1 second
5. call LinkedIn source

The pause logic lives directly inside `leadEngine.ts`:

```ts
await new Promise(r => setTimeout(r, 1000));
```

### Merge behavior

Collected results are merged directly inside `leadEngine.collectLeads(...)`:

```ts
const allLeads = [
  ...(maps.data || []),
  ...(directory.data || []),
  ...(linkedin.data || [])
];
```

### Source internals

Each provider is already separately isolated, but the orchestration is not:
- `googleMapsLeadSource` uses `serpApiHelper.search(...)`
- `directoryLeadSource` uses `serpApiHelper.search(...)`
- `linkedinLeadSource` uses `serpApiHelper.search(...)`
- shared helper: `serpApiHelper`

### Isolation status

Source provider implementation is already split, but the provider orchestration is still centralized in `leadEngine`.

That orchestration currently owns:
- provider ordering
- rate-limit pauses
- result fan-in/merge
- the collection boundary itself

## Slice Candidate Comparison

### A. Scoring boundary

Possible target:
- `src/backend/leads/scoring/leadScoringService.ts`

Pros:
- low risk
- very reviewable
- easy mechanical extraction

Cons:
- lower leverage
- scoring is already nearly isolated
- does little to reduce the bulk of `leadEngine`
- does little to prepare source duplicate cleanup

Risk:
- low

Leverage:
- low to medium

### B. Source collection boundary

Possible target:
- `src/backend/leads/sources/leadSourceCollectionService.ts`

Pros:
- higher leverage
- removes the largest remaining internal orchestration cluster from `leadEngine`
- localizes provider ordering, merge behavior, and pause logic
- creates a cleaner seam before any future source duplicate burn-down

Cons:
- broader than scoring extraction
- must preserve provider order and delay timing exactly

Risk:
- medium

Leverage:
- high

## Selected Next Implementation Slice

Selected next implementation slice:
- `B. Source collection boundary`

## Selection Rationale

This is the stronger next move because:
- scoring is already mostly isolated as a separate module
- source collection still leaves the largest orchestration blob inside `leadEngine`
- moving collection orchestration behind a leads-local collector service would reduce `leadEngine` more materially without opening persistence/events/scheduling again
- it also prepares the cleanest future path for source duplicate burn-down

## Files Likely Affected Next Phase

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Audit context:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

## Files Explicitly Out Of Scope Next Phase

Do not touch:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`
- `src/backend/leads/leadService.ts`
- `src/backend/leads/events/leadEventService.ts`
- `src/backend/leads/agents/leadAgentSchedulingService.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `growth/leadCapture`
- duplicate deletion
- provider-specific scraping logic
- scoring algorithm internals

## Boundary Check Notes

No new hard-fail rules were added in this audit phase.

Existing protections remain:
- `leadEngine.ts` must not import `supabaseClient` directly
- `leadEngine.ts` must not import `eventPublisher` directly
- `leadEngine.ts` must not import `agentScheduler` directly
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

Leads-specific automated tests were not found in the repo.
