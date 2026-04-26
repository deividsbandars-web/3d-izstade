# Phase 62 - Lead Engine Storage / Persistence Boundary

## Summary

This phase removed direct leads persistence from `src/backend/leads/engine/leadEngine.ts` and moved that authority into the leads-local persistence boundary in `src/backend/leads/leadService.ts`.

The `leadEngine` flow still owns:
- source collection
- validation
- scoring
- event publishing
- agent scheduling

Only the `leads` table persistence step moved.

## Before

`leadEngine.ts` imported `supabaseClient` directly and inserted rows into the `leads` table inside `processAndStoreLeads(...)`.

That made the engine both:
- orchestration owner
- persistence owner

The insert result was then used to:
- push the persisted lead into the returned `storedLeads` array
- publish `PlatformEvent.LEAD_CREATED`

## Persistence Flow Audit

Persisted payload shape before the phase:

```ts
{
  source: lead.source || 'LeadEngine (SerpAPI)',
  contact_info: lead,
  status: 'new',
  score,
  contacted: false,
  user_id: userId || null
}
```

Dependencies on persistence success:
- event publishing waits for a successful insert and uses `data.id`
- the returned `storedLeads` array is built from persisted row data

Dependencies not changed in this phase:
- source collection
- validation
- scoring
- event publishing
- agent scheduling

## Boundary Decision

This phase used Variant A:
- expand `src/backend/leads/leadService.ts`

New leads-local persistence entry:
- `leadService.persistCollectedLead(lead, score, userId?)`

Reasoning:
- `leadService.ts` already owns leads-table persistence responsibilities
- this keeps the change narrow and reviewable
- no new persistence namespace was needed yet

## Implementation

### `leadService.ts`

Added:
- `persistCollectedLead(...)`

It preserves the same insert payload and result shape that `leadEngine.ts` used before.

### `leadEngine.ts`

Changed:
- removed direct `supabaseClient` import
- added `leadService` import
- replaced inline `.from('leads').insert(...).select().single()` with `leadService.persistCollectedLead(...)`

Not changed:
- `eventPublisher.publish(PlatformEvent.LEAD_CREATED, ...)`
- `assignLead(...)`
- source calls
- scoring call

## Boundary Check

`scripts/check-backend-boundaries.mjs` now hard-fails if:
- `src/backend/leads/engine/leadEngine.ts` imports `src/lib/supabaseClient.ts` or `.js` directly

Existing protections remain:
- `leadsController.ts` may import from leads only `leadsApplicationService.ts`
- stabilized domain duplicate warnings remain `0`
- billing boundary warnings remain `0`

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

## Deferred

Still deferred:
- event publishing isolation
- agent scheduling isolation
- source collection split
- scoring boundary split
- growth/leadCapture cleanup
- leads duplicate burn-down

## Next Recommended Slice

Next phase should stay narrow:
- `LEAD ENGINE EVENT PUBLISHING ISOLATION`

Reason:
- persistence authority is now outside the engine
- the next obvious side-effect still inside the engine is event publishing after successful persistence
