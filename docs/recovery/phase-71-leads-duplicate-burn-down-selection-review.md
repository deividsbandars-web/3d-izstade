# Phase 71 - Leads Duplicate Burn-Down Selection Review

## Summary

Phase 71 audited all current `leads` `.js/.ts` duplicate warnings and selected one narrow next deletion candidate.

No files were deleted in this phase.

Selected next deletion candidate:
- `src/backend/leads/validation/leadValidationService.js`

## Leads Duplicate Audit Findings

All 10 current duplicate warning pairs were audited:

1. `src/backend/leads/engine/leadEngine.js` / `.ts`
2. `src/backend/leads/leadScoring.js` / `.ts`
3. `src/backend/leads/sources/directoryLeadSource.js` / `.ts`
4. `src/backend/leads/sources/googleMapsLeadSource.js` / `.ts`
5. `src/backend/leads/sources/linkedinLeadSource.js` / `.ts`
6. `src/backend/leads/sources/serpApiHelper.js` / `.ts`
7. `src/backend/leads/events/leadEventService.js` / `.ts`
8. `src/backend/leads/agents/leadAgentSchedulingService.js` / `.ts`
9. `src/backend/leads/sources/leadSourceCollectionService.js` / `.ts`
10. `src/backend/leads/validation/leadValidationService.js` / `.ts`

Observations:
- all 10 duplicates are checked-in source pairs, not build artifacts
- the `.ts` files are the authoritative implementation side of current recovery work
- `.js` specifiers are still used inside source imports, so runtime proof must focus on real callers and entry surfaces before deletion

## Runtime / Import Graph Findings

### 1. `leadEngine.js` / `.ts`

Importers found:
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

Verdict:
- wide import graph
- entry-point-like compatibility surface
- not a safe first deletion target

### 2. `leadScoring.js` / `.ts`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Verdict:
- narrow graph
- helper-only
- still sits in the scoring path that feeds persistence and event payloads

### 3. `directoryLeadSource.js` / `.ts`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Verdict:
- narrow graph
- helper-only
- part of the source provider cluster

### 4. `googleMapsLeadSource.js` / `.ts`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`

Verdict:
- broader cross-domain graph than the other provider files
- not the safest first deletion

### 5. `linkedinLeadSource.js` / `.ts`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Verdict:
- narrow graph
- helper-only
- part of the same provider cluster as directory/googleMaps

### 6. `serpApiHelper.js` / `.ts`

Importers found:
- `src/backend/leads/sources/googleMapsLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.js`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.js`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/linkedinLeadSource.js`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Verdict:
- widest helper graph in the leads duplicate set
- cross-domain dependency surface
- high-risk deletion candidate

### 7. `leadEventService.js` / `.ts`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Verdict:
- narrow graph
- helper-only
- side-effect wrapper around event publishing

### 8. `leadAgentSchedulingService.js` / `.ts`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Verdict:
- narrow graph
- helper-only
- side-effect wrapper around agent scheduling

### 9. `leadSourceCollectionService.js` / `.ts`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Verdict:
- narrow graph
- but it sits above the whole source provider cluster
- broader behavioral blast radius than validation

### 10. `leadValidationService.js` / `.ts`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Verdict:
- narrowest practical graph
- helper-only
- no package-script entry
- no worker path
- no cross-domain callers found
- simplest behavior surface in the duplicate set

## Candidate Ranking

1. `src/backend/leads/validation/leadValidationService.js`
2. `src/backend/leads/leadScoring.js`
3. `src/backend/leads/events/leadEventService.js`
4. `src/backend/leads/agents/leadAgentSchedulingService.js`
5. `src/backend/leads/sources/directoryLeadSource.js`
6. `src/backend/leads/sources/linkedinLeadSource.js`
7. `src/backend/leads/sources/leadSourceCollectionService.js`
8. `src/backend/leads/sources/googleMapsLeadSource.js`
9. `src/backend/leads/engine/leadEngine.js`
10. `src/backend/leads/sources/serpApiHelper.js`

## Selected Next Deletion Candidate

Selected next deletion candidate:
- `src/backend/leads/validation/leadValidationService.js`

Target intent for the next implementation phase:
- keep `src/backend/leads/validation/leadValidationService.ts` as the authoritative implementation
- prove that the checked-in `.js` duplicate can be removed safely

## Selection Rationale

`leadValidationService.js` is the safest first burn-down candidate because:
- it has the narrowest caller graph
- it is helper-only
- it has no direct package-script or worker entry surface
- it has no cross-domain callers
- its behavior is the simplest in the duplicate set

Compared with other low-risk candidates:
- `leadScoring.js` is also narrow, but it sits directly on the score path feeding persistence and event payloads
- `leadEventService.js` and `leadAgentSchedulingService.js` are narrow, but they wrap active side-effects
- source-provider-related pairs are coupled to a broader provider cluster

## Files Likely Affected Next Phase

If the next phase follows this selection, the most likely files are:
- `src/backend/leads/validation/leadValidationService.js`
- `src/backend/leads/validation/leadValidationService.ts`
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`
- `scripts/check-backend-boundaries.mjs`

## Files Explicitly Out Of Scope Next Phase

Out of scope for the next deletion phase:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/events/leadEventService.ts`
- `src/backend/leads/agents/leadAgentSchedulingService.ts`
- `src/backend/leads/sources/**`
- `src/backend/growth/**`
- `src/backend/dataSources/**`
- scoring algorithm changes
- source/provider redesign
- leadEngine redesign

## Boundary Check Notes

No new hard-fail rules were added in this audit phase.

Existing protections remain:
- `leadsController -> leadsApplicationService`
- `leadEngine -> supabaseClient` direct import ban
- `leadEngine -> eventPublisher` direct import ban
- `leadEngine -> agentScheduler` direct import ban
- `leadEngine -> source provider direct import` ban
- local `validateLead(...)` ban in `leadEngine`

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

Leads-specific automated tests were not found.
