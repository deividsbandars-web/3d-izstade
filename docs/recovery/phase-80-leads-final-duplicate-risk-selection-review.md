# Phase 80: Leads Final Duplicate Risk Selection Review

Status: PASS

## Summary

This phase performed a deep audit of the final three remaining leads duplicate risks:

- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/googleMapsLeadSource.js`
- `src/backend/leads/sources/serpApiHelper.js`

No files were deleted in this phase.

Decision:

- no safe deletion candidate is justified at this time
- a preparation/refactor phase is required before further duplicate burn-down

## Remaining Duplicate Audit Findings

The three remaining files are not in the same risk class:

- `leadEngine.js` is a compatibility surface
- `googleMapsLeadSource.js` is a cross-domain provider
- `serpApiHelper.js` is a shared cross-domain helper

Unlike earlier helper-only deletions, these remaining files sit on active domain seams or broad shared runtime surfaces.

## Import/Runtime Graph Findings

### `leadEngine.js`

Direct importers:

- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

Transitive callers:

- HTTP/controller-facing leads generation through `leadsApplicationService`
- agent tool adapter calls through `leadToolAdapters`
- agent execution flow through `LeadAgent.executeTask(...)`

Observed role:

- compatibility/runtime surface for multiple execution paths
- not helper-only

Risk:

- `high`

### `googleMapsLeadSource.js`

Direct importers:

- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`

Transitive callers:

- leads collection flow through `leadSourceCollectionService -> leadEngine -> leadsApplicationService`
- revenue prospecting flow through `prospectingAdapters`

Observed role:

- cross-domain provider shared by leads and revenue prospecting

Risk:

- `high`

### `serpApiHelper.js`

Direct importers:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Transitive callers:

- leads source providers
- growth niche discovery
- data source search service
- agent data-source tools

Observed role:

- shared cross-domain helper spanning leads, growth, dataSources, and agents

Risk:

- `very high`

## Candidate Comparison

### `leadEngine.js`

- classification: compatibility surface
- deletion safety: not proven
- reason: multiple callers across leads and agents runtime paths

### `googleMapsLeadSource.js`

- classification: cross-domain provider
- deletion safety: not proven
- reason: shared by leads source collection and revenue prospecting

### `serpApiHelper.js`

- classification: shared cross-domain helper
- deletion safety: not proven
- reason: broadest caller graph and highest blast radius

## Decision

Decision:

- `B) no-safe-deletion`

No remaining file should be deleted directly in the current state without a preparation phase.

## Selection Rationale

This decision is required because:

- `leadEngine.js` still acts as a live compatibility/runtime entry surface
- `googleMapsLeadSource.js` is already coupled to revenue prospecting
- `serpApiHelper.js` is the broadest shared helper across multiple backend domains

Deleting any of these three now would no longer meet the proof standard used in the earlier low-risk helper burn-down phases.

## Recommended Next Phase

Recommended next phase:

- `LEADS GOOGLE MAPS PROVIDER DECOUPLING REVIEW`

Goal of that preparation phase:

- determine how to isolate the revenue prospecting dependency from the leads-local Google Maps provider path
- decide whether Google Maps should remain a shared adapter or whether a narrower leads-local / revenue-local seam is needed before duplicate deletion

This is a safer next step than touching `leadEngine.js` or `serpApiHelper.js` directly.
