# Phase 67 - Lead Source Collection Service Seed

## Summary

This phase removed source collection orchestration from `src/backend/leads/engine/leadEngine.ts` and moved it behind a leads-local collector service:

- `src/backend/leads/sources/leadSourceCollectionService.ts`

`leadEngine` still owns:
- validation
- scoring
- persistence call
- lead-created event publishing
- lead assignment scheduling

Only the source collection authority moved.

## Before

`leadEngine.ts` directly imported:
- `googleMapsLeadSource`
- `directoryLeadSource`
- `linkedinLeadSource`

and directly owned:
- provider order
- sequential execution
- 1 second pauses between providers
- result merge/fan-in

## Source Collection Audit

Observed provider order before this phase:

1. Google Maps
2. Directory
3. LinkedIn

Observed delay timing:
- 1 second pause after Google Maps
- 1 second pause after Directory

Observed merge behavior:

```ts
const allLeads = [
  ...(maps.data || []),
  ...(directory.data || []),
  ...(linkedin.data || [])
];
```

Observed result/error shape:
- success: `{ data: allLeads, error: null }`
- failure: `{ data: [], error: String(error) }`

That exact behavior was preserved.

## Boundary Decision

Added:
- `src/backend/leads/sources/leadSourceCollectionService.ts`

Responsibility:
- own provider ordering
- own sequential execution
- own delay/pause logic
- own result merge/fan-in

It does **not**:
- score leads
- persist leads
- publish events
- schedule agents

## Implementation

### `leadSourceCollectionService.ts`

Added:
- `collectLeadsFromSources(industry, location, limitPerSource = 5)`

It keeps the exact same:
- provider order
- 1 second pauses
- merged result shape
- error fallback shape

### `leadEngine.ts`

Changed:
- removed direct source provider imports
- added `leadSourceCollectionService` import
- `collectLeads(...)` now delegates to `leadSourceCollectionService.collectLeadsFromSources(...)`

Not changed:
- validation
- scoring
- persistence payload
- event payload
- scheduling behavior

## Runtime Parity Note

The repo still contains checked-in `.js` runtime mirrors in the leads slice.

To preserve current runtime behavior, the same collection-boundary shift was mirrored in:
- `src/backend/leads/engine/leadEngine.js`
- `src/backend/leads/sources/leadSourceCollectionService.js`

This is not duplicate burn-down.

## Boundary Check

`scripts/check-backend-boundaries.mjs` now hard-fails if:
- `leadEngine.ts` imports `googleMapsLeadSource` directly
- `leadEngine.ts` imports `directoryLeadSource` directly
- `leadEngine.ts` imports `linkedinLeadSource` directly

Expected path:
- `leadEngine.ts -> leadSourceCollectionService.ts -> providers`

Existing protections remain:
- `leadEngine.ts` must not import `supabaseClient` directly
- `leadEngine.ts` must not import `eventPublisher` directly
- `leadEngine.ts` must not import `agentScheduler` directly
- `leadsController.ts -> leadsApplicationService.ts`

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

Leads/source-specific automated tests were not found in the repo.

## Deferred

Still deferred:
- provider internals refactor
- scoring service extraction
- duplicate deletion
- growth/leadCapture cleanup
- event bus changes
- queue/agents changes

## Next Recommended Slice

Next phase should be audit-first:
- `LEAD ENGINE VALIDATION / SCORING SELECTION REVIEW`

Reason:
- source orchestration is now out of `leadEngine`
- the remaining internal responsibilities are narrower
- the next decision is whether validation or scoring gives the best next low-risk slice
