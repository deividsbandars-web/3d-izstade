# Phase 59 - New Backend Domain Selection Audit

## Goal

Select the next backend bounded-context recovery target based on actual remaining risk,
not on opportunistic cleanup.

This phase is audit-only:

- no domain refactor
- no file deletion
- no boundary rewrite
- no new architecture implementation

## Audited Scope

- `src/backend/**`
- `backend-server/controllers/**`
- `backend-server/routes/**`
- `backend-server/events/**`
- `src/backend/leads/**`
- `src/backend/business/**`
- `src/backend/growth/**`
- `src/backend/dataSources/**`
- `src/backend/workflows/**`
- `src/backend/governance/**`
- `src/backend/ai/**`
- `src/backend/events/**`

## Audit Findings By Domain

### leads

Strongest remaining candidate.

Signals:

- `backend-server/controllers/leadsController.ts` imports
  `src/backend/leads/engine/leadEngine.js` directly
- the same controller also reaches into `growth` dynamically for lead capture
- `src/backend/leads/engine/leadEngine.ts` mixes:
  - source collection
  - validation
  - scoring
  - storage
  - event publishing
  - agent scheduling
- large remaining `.js/.ts` duplicate surface:
  - `leadScoring`
  - `leadEngine`
  - `googleMapsLeadSource`
  - `directoryLeadSource`
  - `linkedinLeadSource`
  - `serpApiHelper`

This is the clearest combination of:

- controller boundary gap
- cross-domain orchestration
- event side-effects
- duplicate debt

### growth

High risk, but second to leads.

Signals:

- `backend-server/controllers/growthController.ts` imports multiple low-level growth
  services directly
- `src/backend/growth/**` imports AI, events, and leads-related helpers
- `leadCapture.ts` stores leads directly into the CRM table

Why not first:

- `growth` currently overlaps semantically with `leads`
- cleaning `growth` first risks touching the same lead-capture surface from the wrong
  side
- leads is the tighter recovery entry point

### ai

Moderate risk.

Signals:

- `backend-server/controllers/aiController.ts` imports `llmService` directly
- AI usage/quota boundary is already fixed
- remaining issue is mostly missing application-service shape, not uncontrolled
  cross-domain spread

Why not first:

- lower immediate forward-progress risk than leads
- less duplicate debt than leads
- less event-orchestration entanglement than leads

### workflows

Moderate risk.

Signals:

- `backend-server/controllers/workflowsController.ts` imports workflow services directly
- still contains direct Supabase access in the controller

Why not first:

- narrower and more isolated than leads
- lower cross-domain fan-out
- fewer immediate duplication or event-side-effect risks

### business

Moderate to low risk.

Signals:

- `backend-server/controllers/businessController.ts` imports low-level business service
  directly
- `businessGenerator.ts` depends on AI

Why not first:

- smaller surface area
- fewer evident cross-domain side-effects than leads/growth

### events

Architecturally important, but not the next slice.

Signals:

- `backend-server/events/subscribers.ts` still orchestrates cross-domain reactions
- event layer touches sequences, distribution and platform

Why not first:

- event cleanup is broader and easier to turn into an event-bus redesign by accident
- current event boundaries around billing are already stabilized
- not the safest next narrow implementation slice

### governance

Currently lower urgency.

Signals:

- `agentGovernor.ts/.js` duplicates remain outside the currently scanned duplicate
  domains
- governance quota/cost bypasses were already closed

Why not first:

- major boundary pain there was already addressed
- remaining work is smaller than leads

### dataSources

Dependent risk rather than primary risk.

Signals:

- imports into leads and growth
- `googleSearchService.ts` depends on leads source helper

Why not first:

- dataSources is currently being pulled by higher-risk domains
- cleaning it first would likely become indirect leads/growth cleanup

## Candidate Ranking

1. `leads`
2. `growth`
3. `events`
4. `workflows`
5. `ai`
6. `business`
7. `dataSources`
8. `governance`

## Selected Next Domain

Selected next domain: **leads**

## Why leads Wins

`leads` is the strongest next bounded-context candidate because it combines four risk
classes in one reviewable slice:

1. controller -> low-level service import bypass
2. cross-domain orchestration inside `leadEngine.ts`
3. event side-effects emitted from the same engine
4. the largest remaining `.js/.ts` duplicate concentration in the audited domains

That gives the best forward progress per phase without opening a broad rewrite.

## Proposed Next Implementation Slice

Recommended next phase:

`LEADS APPLICATION-SERVICE SEED + ENGINE BOUNDARY AUDIT`

Narrow scope:

- introduce `src/backend/leads/leadsApplicationService.ts`
- rewire `backend-server/controllers/leadsController.ts` to call the application service
- keep `leadEngine.ts` as internal orchestration for now
- audit whether `leadCapture` should stay in growth or move behind an explicit boundary
- do not attempt full lead-source redesign in the same cycle

## Files Likely Affected Next Phase

- `backend-server/controllers/leadsController.ts`
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/leads/engine/leadEngine.ts`
- possibly `src/backend/leads/leadService.ts`
- audit-only context:
  - `src/backend/growth/leadCapture.ts`
  - `src/backend/events/eventPublisher.ts`
  - `src/backend/events/eventTypes.ts`

## Files Explicitly Out Of Scope Next Phase

- `backend-server/controllers/growthController.ts`
- `backend-server/controllers/aiController.ts`
- `backend-server/controllers/workflowsController.ts`
- event bus core files:
  - `src/backend/events/eventBus.ts`
  - `src/backend/events/eventSubscriber.ts`
- billing usage/quota infrastructure
- payment/pricing/invoicing files
- expo runtime and `src/modules/expo/**`

## Why Other Domains Are Deferred

- `growth`: overlaps with leads and is better handled after leads boundary exists
- `events`: too easy to turn into event-bus redesign
- `ai`: boundary gap exists, but lower risk concentration
- `workflows`: cleaner and narrower, but less urgent
- `business`: smaller and less entangled
- `dataSources`: mostly downstream of leads/growth shape
- `governance`: major quota/billing issue already addressed
