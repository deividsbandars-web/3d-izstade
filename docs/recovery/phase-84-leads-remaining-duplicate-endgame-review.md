# Phase 84: Leads Remaining Duplicate Endgame Review

Status: PASS

## Summary

This phase performed a deep audit of the final two remaining leads duplicate risks:

- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/serpApiHelper.js`

No files were deleted in this phase.

Decision:

- `C) no-safe-deletion`

Both remaining files require a preparation phase before any further duplicate burn-down is defensible.

## `leadEngine.js` Audit Findings

Direct importers:

- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

Observed transitive usage:

- caller-facing leads generation through `leadsApplicationService.generateLeads(...)`
- agent tool usage through `leadToolAdapters.findLeads(...)`
- agent execution path through `LeadAgent.executeTask(...)`

Additional findings:

- no direct package script entry
- no backend-server package script entry
- no worker entry targeting `leadEngine.js`
- no direct dynamic import path targeting `leadEngine.js`

Assessment:

- `leadEngine.js` is still a live compatibility/runtime surface
- it is not a narrow helper-only file
- deleting it now would require coordinated migration of multiple callers

Risk:

- `high`

## `serpApiHelper.js` Audit Findings

Direct importers:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Observed transitive usage:

- leads source providers
- growth niche discovery
- dataSources Google search
- agents data-source tool adapters

Additional findings:

- no direct package script entry
- no backend-server package script entry
- no worker entry targeting `serpApiHelper.js`
- no direct dynamic import path targeting `serpApiHelper.js`

Assessment:

- `serpApiHelper.js` is a shared cross-domain helper
- it spans leads, growth, dataSources, and agents
- deleting it now would be riskier than any prior duplicate burn-down slice in the leads sequence

Risk:

- `very high`

## Candidate Comparison

`leadEngine.js`
- type: compatibility surface
- risk: `high`
- blocker: active runtime entry usage from leads + agents callers

`serpApiHelper.js`
- type: shared cross-domain helper
- risk: `very high`
- blocker: broad multi-domain caller graph

Relative comparison:

- `leadEngine.js` is narrower than `serpApiHelper.js`
- but it is still not deletion-safe without a migration phase
- `serpApiHelper.js` is clearly the worst candidate of the two

## Decision

Decision:

- `no-safe-deletion`

No remaining file should be deleted directly in the current state.

## Selection Rationale

This is the correct endgame decision because:

- `leadEngine.js` still carries active compatibility/runtime responsibility
- `serpApiHelper.js` is still a shared cross-domain dependency hub
- neither file matches the proof profile of the earlier low-risk helper/provider deletions

Deleting either one now would force an implicit redesign rather than a narrow duplicate burn-down.

## Recommended Next Phase

Recommended next phase:

- `LEAD ENGINE ENTRY MIGRATION REVIEW`

Why this first:

- it is narrower than a shared SerpAPI boundary redesign
- it targets the lower-risk of the two remaining duplicate seams
- it can establish whether `leadEngine.js` callers can be migrated to a cleaner TS/runtime boundary before deletion is reconsidered
