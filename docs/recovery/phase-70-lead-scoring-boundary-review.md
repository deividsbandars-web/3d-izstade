# Phase 70 - Lead Scoring Boundary Review

## Summary

Phase 70 was an audit-only review of the remaining lead scoring boundary.

Conclusion:
- the current `leadScoring` module is already the effective scoring boundary
- adding `leadScoringService.ts` next would mostly create a wrapper layer without meaningful architectural leverage
- the recommended next step is to keep the current scoring boundary and move to a leads duplicate burn-down selection phase

No refactor was performed in this phase.

## Scoring Flow Audit Findings

### Current caller graph

`scoreLead(...)` is currently called only from:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

No other backend or controller callers were found.

### Current boundary shape

Scoring logic already lives outside the engine in:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`

`leadEngine.ts` only coordinates one call:
- `const score = leadScoring.scoreLead(lead);`

### Input shape

`scoreLead(lead)` consumes a validated lead-like object and uses these fields:
- `company_name`
- `website`
- `email`
- `phone`

### Output shape

`scoreLead(...)` returns:
- a `number`
- clamped to `0..100`
- fallback `0` on scoring error

### Downstream usage

The computed score is used in two places:
- persistence payload via `leadService.persistCollectedLead(lead, score, userId)`
- event payload via `leadEventService.publishLeadCreated(data.id, score, industry)`

This means scoring is already cleanly upstream of persistence and event publishing boundaries.

## Boundary Option Comparison

### A. Keep leadScoring as current boundary

Pros:
- already isolated in a dedicated module
- no extra abstraction layer
- keeps the current code honest: `leadEngine` coordinates a single scoring call and nothing more
- lowest risk

Cons:
- `leadEngine` still contains one direct coordination call to `leadScoring`

### B. Add leadScoringService

Potential target:
- `src/backend/leads/scoring/leadScoringService.ts`

Pros:
- uniform service naming if every lead responsibility becomes a service

Cons:
- weak leverage right now
- likely becomes a pass-through wrapper over `leadScoring.scoreLead(...)`
- adds another `.js/.ts` pair and increases leads duplicate warnings
- does not materially reduce real coupling

### C. Defer scoring and move to duplicate burn-down

Pros:
- focuses on the actual remaining pain surface in leads
- avoids service inflation

Cons:
- requires a clean selection phase first so duplicate work stays narrow and reviewable

## Selected Decision

Selected decision:
- keep the current scoring boundary

Recommended next implementation direction:
- do **not** implement a scoring service next
- start a leads duplicate burn-down selection review next

## Selection Rationale

Scoring is already isolated enough to count as a real boundary:
- separate module
- single caller
- stable input/output contract
- no direct persistence/event/scheduling coupling inside the scoring module

Creating `leadScoringService.ts` now would mostly add indirection without removing a meaningful responsibility from `leadEngine`.

The higher-value next step is to evaluate the remaining leads duplicate warning surface and choose one narrow duplicate burn-down slice instead of manufacturing a scoring wrapper.

## Files Likely Affected Next Phase

If the next phase follows the recommended direction, likely audit targets are:
- `src/backend/leads/**`
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/sources/**`
- `scripts/check-backend-boundaries.mjs`

## Files Explicitly Out Of Scope Next Phase

Still out of scope:
- scoring algorithm changes
- persistence changes
- event publishing changes
- scheduling changes
- growth cleanup
- source/provider redesign
- controller boundary changes

## Boundary Check Notes

No new hard-fail rules were added in this phase.

Existing protections remain:
- no direct `supabaseClient` import in `leadEngine.ts`
- no direct `eventPublisher` import in `leadEngine.ts`
- no direct `agentScheduler` import in `leadEngine.ts`
- no direct source provider imports in `leadEngine.ts`
- no local `validateLead(...)` helper in `leadEngine.ts`
- `leadsController.ts` may import only `leadsApplicationService.ts`

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

Leads/scoring-specific automated tests were not found.
