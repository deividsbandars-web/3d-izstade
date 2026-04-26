# Phase 63 - Lead Engine Event Publishing Isolation

## Summary

This phase moved `LEAD_CREATED` publishing out of `src/backend/leads/engine/leadEngine.ts` and into a leads-local event boundary:

- `src/backend/leads/events/leadEventService.ts`

`leadEngine` still owns:
- source collection
- validation
- scoring
- persistence call through `leadService`
- agent scheduling

Only the event publishing authority moved.

## Before

After Phase 62, `leadEngine.ts` still imported:
- `src/backend/events/eventPublisher.ts`
- `src/backend/events/eventTypes.ts`

and published:

```ts
await eventPublisher.publish(PlatformEvent.LEAD_CREATED, { leadId: data.id, score, industry });
```

That meant the engine still directly owned event bus interaction.

## Event Publishing Audit

Observed flow before this phase:

1. collect leads
2. validate leads
3. score lead
4. persist through `leadService.persistCollectedLead(...)`
5. only after successful persistence:
   - push persisted row into `storedLeads`
   - publish `PlatformEvent.LEAD_CREATED`

Published payload shape:

```ts
{
  leadId: data.id,
  score,
  industry
}
```

Important constraint:
- publishing depends on persistence success
- payload uses persisted `leadId`

That made the publishing step safe to move behind a leads-local helper without changing timing or payload shape.

## Boundary Decision

This phase introduced:
- `src/backend/leads/events/leadEventService.ts`

Responsibility:
- expose a leads-local `publishLeadCreated(...)` helper
- keep the event payload shape unchanged
- hide direct `eventPublisher` usage from `leadEngine`

## Implementation

### `leadEventService.ts`

Added:
- `publishLeadCreated(leadId, score, industry)`

Internally it still uses:
- `eventPublisher.publish(...)`
- `PlatformEvent.LEAD_CREATED`

So there is no event bus redesign in this phase.

### `leadEngine.ts`

Changed:
- removed direct `eventPublisher` import
- removed direct `PlatformEvent` import
- added `leadEventService` import
- replaced direct publish call with `leadEventService.publishLeadCreated(...)`

Not changed:
- source collection
- validation
- scoring
- persistence timing
- agent scheduling

## Runtime Parity Note

The repo still contains a checked-in `leadEngine.js` duplicate. Since call sites still resolve the `.js` path, the same event-boundary shift was mirrored there to keep runtime parity.

This is not duplicate burn-down.

## Boundary Check

`scripts/check-backend-boundaries.mjs` now includes a dedicated `leadEngine` boundary check that hard-fails if:

- `leadEngine.ts` imports `src/lib/supabaseClient.ts/.js` directly
- `leadEngine.ts` imports `src/backend/events/eventPublisher.ts/.js` directly

This preserves:
- the Phase 62 persistence rule
- the Phase 60 `leadsController -> leadsApplicationService` rule

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

Leads/events-specific automated tests were not found in the repo.

## Deferred

Still deferred:
- event bus redesign
- source collection split
- scoring redesign
- agent scheduling isolation
- growth cleanup
- duplicate burn-down

## Next Recommended Slice

Next phase should stay narrow:
- `LEAD ENGINE AGENT SCHEDULING ISOLATION REVIEW`

Reason:
- persistence is already isolated
- event publishing is now isolated
- scheduling is the next obvious external side-effect still living inside the engine flow
