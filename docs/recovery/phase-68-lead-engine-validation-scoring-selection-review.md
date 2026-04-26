# Phase 68 - Lead Engine Validation / Scoring Selection Review

## Summary

This phase was a pure audit/selection pass.

No validation or scoring implementation was refactored.

Selected next implementation slice:
- `Validation boundary`

Recommended next phase target:
- `src/backend/leads/validation/leadValidationService.ts`

## Validation Flow Audit

### Where validation lives

Validation currently lives directly inside:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Method:

```ts
validateLead(lead)
```

### Input/output shape

Input:
- raw lead object returned from the source collection service/providers

Validation rules:
- reject if `company_name` missing
- reject if all of `website`, `phone`, and `email` are missing

Output:
- boolean only

Usage:

```ts
const validLeads = leads.filter(this.validateLead);
```

### Isolation status

Validation is currently only an engine-local helper:
- it has no separate module
- it is not reused elsewhere
- it is not parameterized or externally owned

That means validation still contributes directly to `leadEngine` responsibility count.

## Scoring Flow Audit

### Where scoring lives

Scoring already lives outside the engine in:
- `src/backend/leads/leadScoring.ts`
- runtime mirror: `src/backend/leads/leadScoring.js`

Engine usage:

```ts
const score = leadScoring.scoreLead(lead);
```

### Input shape

Scoring consumes the validated lead object and directly reads:
- `company_name`
- `website`
- `email`
- `phone`

### Output shape

Output:
- number in the `0..100` range
- `0` fallback on internal scoring error

### Downstream usage

The computed score is used in:
- persistence payload through `leadService.persistCollectedLead(...)`
- event payload through `leadEventService.publishLeadCreated(...)`

### Isolation status

Scoring is already materially isolated:
- algorithm is outside `leadEngine`
- engine performs only one direct call

That means a future `leadScoringService` wrapper is possible, but it would mostly be call-shape cleanup rather than major responsibility removal.

## Slice Candidate Comparison

### A. Validation boundary

Possible target:
- `src/backend/leads/validation/leadValidationService.ts`

Pros:
- removes one of the last engine-local responsibilities
- keeps the next change very small and reviewable
- creates a cleaner seam before any future duplicate cleanup in the leads domain

Cons:
- lower architectural leverage than earlier source/persistence/event moves

Risk:
- low

Leverage:
- medium

### B. Scoring boundary

Possible target:
- `src/backend/leads/scoring/leadScoringService.ts`

Pros:
- also low risk
- clean wrapper shape is easy to implement

Cons:
- scoring is already mostly isolated today
- adds less structural value than validation extraction
- duplicates existing abstraction more than it removes engine complexity

Risk:
- low

Leverage:
- low to medium

## Selected Next Implementation Slice

Selected next implementation slice:
- `Validation boundary`

## Selection Rationale

This is the better next move because:
- scoring is already outside the engine as a dedicated module
- validation still lives directly inside `leadEngine`
- extracting validation removes a real remaining responsibility, not just a thin wrapper opportunity
- it keeps the next implementation slice small and low-risk

## Files Likely Affected Next Phase

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/validation/leadValidationService.ts`
- `src/backend/leads/validation/leadValidationService.js`

Audit context:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`

## Files Explicitly Out Of Scope Next Phase

Do not touch:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`
- `src/backend/leads/sources/**`
- `src/backend/leads/leadService.ts`
- `src/backend/leads/events/leadEventService.ts`
- `src/backend/leads/agents/leadAgentSchedulingService.ts`
- `src/backend/leads/leadsApplicationService.ts`
- duplicate deletion
- scoring algorithm logic
- growth/leadCapture

## Boundary Check Notes

No new hard-fail rules were added in this audit phase.

Existing protections remain:
- `leadEngine.ts` must not import `supabaseClient` directly
- `leadEngine.ts` must not import `eventPublisher` directly
- `leadEngine.ts` must not import `agentScheduler` directly
- `leadEngine.ts` must not import source providers directly
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
