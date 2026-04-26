# Phase 61 - Lead Engine Internal Slice Audit

## Goal

Audit `src/backend/leads/engine/leadEngine.ts` and choose one narrow next internal
implementation slice.

This phase is audit-only:

- no leadEngine refactor
- no duplicate burn-down
- no growth cleanup
- no event bus redesign
- no source/scoring/storage redesign

## Audited Files

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/leads/leadService.ts`
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/sources/**`
- `src/backend/events/eventPublisher.ts`
- `src/backend/events/eventTypes.ts`
- agent scheduling call path used by `leadEngine`

## LeadEngine Responsibility Map

`leadEngine.ts` currently owns six distinct responsibilities:

### 1. Source collection

Imports:

- `googleMapsLeadSource`
- `directoryLeadSource`
- `linkedinLeadSource`

Behavior:

- sequential collection from multiple sources
- rate-limit spacing via `setTimeout(...)`
- aggregation of collected results

### 2. Validation

Behavior:

- `validateLead(...)`
- checks `company_name`
- checks presence of at least one contact point

### 3. Scoring

Imports:

- `leadScoring`

Behavior:

- calls `leadScoring.scoreLead(lead)`

### 4. Storage / persistence

Imports:

- `supabaseClient`

Behavior:

- inserts lead records directly into the `leads` table
- maps collected lead data into persistence shape

### 5. Event publishing

Imports:

- `eventPublisher`
- `PlatformEvent`

Behavior:

- emits `PlatformEvent.LEAD_CREATED` after successful storage

### 6. Agent scheduling

Imports:

- `agentScheduler`

Behavior:

- `assignLead(...)`
- dispatches outreach task to agent scheduler

## Slice Candidate Comparison

### A. Storage + persistence boundary

Files likely touched:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadService.ts`
- possibly a new internal storage-oriented leads helper

Benefits:

- removes direct Supabase write logic from `leadEngine`
- creates a clean seam for later duplicate burn-down and event isolation
- aligns well with the existing `leadService.ts`

Regression risk:

- moderate

Reviewability:

- high

Duplicate-burn-down leverage:

- high, because storage separation reduces engine fan-in before duplicate cleanup

### B. Event publishing isolation

Files likely touched:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/events/eventPublisher.ts`
- possibly a new leads-internal event adapter

Benefits:

- reduces event side-effects inside engine

Regression risk:

- moderate to high, because event side-effects are easy to mis-sequence

Reviewability:

- medium

Duplicate-burn-down leverage:

- medium

### C. Agent scheduling isolation

Files likely touched:

- `src/backend/leads/engine/leadEngine.ts`
- a new leads-internal assignment helper

Benefits:

- isolates one clear external dependency

Regression risk:

- low to moderate

Reviewability:

- high

Duplicate-burn-down leverage:

- low to medium

Why not first:

- `assignLead(...)` is smaller and less central than persistence flow

### D. Source collection boundary

Files likely touched:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/sources/**`
- possibly a new collection service

Benefits:

- isolates source fan-out

Regression risk:

- high, because source timing/rate-limit behavior is packed into collection flow

Reviewability:

- medium

Duplicate-burn-down leverage:

- high later, but risky as a first slice

### E. Scoring boundary

Files likely touched:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadScoring.ts`

Benefits:

- low-risk conceptual cleanup

Regression risk:

- low

Reviewability:

- high

Duplicate-burn-down leverage:

- low, because scoring is already relatively isolated compared to storage/events

Why not first:

- it gives the least structural leverage

## Selected Next Implementation Slice

Selected next slice:

- **A. Storage + persistence boundary**

## Selection Rationale

Storage/persistence is the best next narrow slice because it sits in the middle of the
main `processAndStoreLeads(...)` path and unlocks later cleanup without opening the most
risky edges first.

Why this wins:

- direct database writes are still embedded in `leadEngine`
- there is already a nearby domain service:
  - `src/backend/leads/leadService.ts`
- moving persistence behind a narrower internal boundary is more reviewable than splitting
  sources or events first
- it prepares cleaner follow-up phases for:
  - event publishing isolation
  - duplicate burn-down

Why not event publishing first:

- event ordering is coupled to successful persistence
- moving events first risks creating awkward persistence/event sequencing logic

Why not source collection first:

- source collection has the broadest fan-out and timing behavior
- it is not the safest first internal cut

Why not agent scheduling first:

- useful, but lower leverage than persistence

## Files Likely Affected Next Phase

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/leadService.ts`
- possibly a new leads-internal persistence helper or a small expansion of
  `leadService.ts`
- audit context:
  - `src/backend/events/eventPublisher.ts`
  - `src/backend/events/eventTypes.ts`

## Files Explicitly Out Of Scope Next Phase

- `backend-server/controllers/leadsController.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/growth/leadCapture.ts`
- `src/backend/leads/sources/**`
- `src/backend/leads/leadScoring.ts`
- event bus core
- agent scheduler core
- duplicate removal

## Boundary Check Notes

No new hard-fail rule was added in this phase.

Current protections remain:

- `leadsController -> leadsApplicationService`
- existing backend domain rules
- duplicate warnings for stabilized domains stay `0`
- leads duplicate warnings remain visible as audit-only warnings
