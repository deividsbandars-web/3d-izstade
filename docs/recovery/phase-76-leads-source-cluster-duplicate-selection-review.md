# Phase 76 - Leads Source Cluster Duplicate Selection Review

## Summary

Phase 76 was an audit-only selection review of the remaining `leads` duplicate warnings.

No files were deleted in this phase.

Selected next deletion candidate:
- `src/backend/leads/sources/directoryLeadSource.js`

## Remaining Duplicate Audit Findings

The 6 remaining duplicate warning files were audited:

1. `src/backend/leads/engine/leadEngine.js`
2. `src/backend/leads/sources/directoryLeadSource.js`
3. `src/backend/leads/sources/googleMapsLeadSource.js`
4. `src/backend/leads/sources/leadSourceCollectionService.js`
5. `src/backend/leads/sources/linkedinLeadSource.js`
6. `src/backend/leads/sources/serpApiHelper.js`

Observations:
- all remaining duplicates are checked-in source files, not build artifacts
- the risk is no longer uniform; the remaining surface splits into:
  - broad engine compatibility
  - provider-local duplicates
  - collector-level duplicate
  - cross-domain helper duplicate

## Import / Runtime Graph Findings

### 1. `leadEngine.js`

Importers found:
- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

Runtime notes:
- broad compatibility surface
- participates in non-leads callers
- not a safe next burn-down candidate

### 2. `directoryLeadSource.js`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Runtime notes:
- provider-local only
- no cross-domain callers found
- no package script, worker, or dynamic import path found
- narrowest remaining source-cluster candidate

### 3. `googleMapsLeadSource.js`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`

Runtime notes:
- provider-local plus one cross-domain revenue prospecting caller
- riskier than directory/linkedin

### 4. `leadSourceCollectionService.js`

Importers found:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Runtime notes:
- sits above the whole provider cluster
- narrower than `leadEngine.js`, but broader behavioral role than a single provider file

### 5. `linkedinLeadSource.js`

Importers found:
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`

Runtime notes:
- provider-local only
- no cross-domain callers found
- no package script, worker, or dynamic import path found
- same risk class as `directoryLeadSource.js`

### 6. `serpApiHelper.js`

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

Runtime notes:
- clear cross-domain helper
- widest remaining helper graph
- high-risk deletion candidate

### Package / worker / dynamic-import notes

Across the remaining 6 files:
- `package.json` contains no direct script entry to these duplicate files
- `backend-server/package.json` contains no direct script entry to these duplicate files
- no worker entry directly targets these duplicate files
- no dynamic import path directly targets these duplicate files

## Candidate Ranking

1. `src/backend/leads/sources/directoryLeadSource.js`
2. `src/backend/leads/sources/linkedinLeadSource.js`
3. `src/backend/leads/sources/leadSourceCollectionService.js`
4. `src/backend/leads/sources/googleMapsLeadSource.js`
5. `src/backend/leads/engine/leadEngine.js`
6. `src/backend/leads/sources/serpApiHelper.js`

## Selected Next Deletion Candidate

Selected next deletion candidate:
- `src/backend/leads/sources/directoryLeadSource.js`

## Selection Rationale

`directoryLeadSource.js` is the safest next burn-down target because:
- it is provider-local only
- its callers are limited to the collector service pair
- it has no cross-domain callers
- it has no package-script, worker, or dynamic-import entry surface

Why not the nearby alternatives:
- `linkedinLeadSource.js` is in the same low-risk class, but selecting one provider first keeps the next deletion slice maximally narrow
- `leadSourceCollectionService.js` has a broader orchestration role than a single provider
- `googleMapsLeadSource.js` already has a cross-domain revenue prospecting caller
- `leadEngine.js` remains a broad compatibility surface
- `serpApiHelper.js` remains the highest-risk cross-domain helper

## Files Likely Affected Next Phase

If the next phase follows this selection, likely files are:
- `src/backend/leads/sources/directoryLeadSource.js`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/leadSourceCollectionService.ts`
- `src/backend/leads/sources/leadSourceCollectionService.js`
- `scripts/check-backend-boundaries.mjs`

## Files Explicitly Out Of Scope Next Phase

Out of scope for the next deletion phase:
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/googleMapsLeadSource.js`
- `src/backend/leads/sources/linkedinLeadSource.js`
- `src/backend/leads/sources/leadSourceCollectionService.js`
- `src/backend/leads/sources/serpApiHelper.js`
- `src/backend/revenue/prospecting/prospectingAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- source provider redesign
- scraping redesign
- leadEngine redesign

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

Leads/source-specific automated tests were not found.
