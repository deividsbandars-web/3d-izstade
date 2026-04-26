# Phase 54: Billing Event Handler Application-Service Alignment

## Summary

This phase made event-driven billing orchestration more explicit by introducing:

- `src/backend/billing/events/billingEventService.ts`

and slimming:

- `src/backend/billing/events/billingEventHandlers.ts`

so the handler is now a thin event adapter instead of the main orchestration layer.

## What billingEventHandlers Did Before

Before this phase, `billingEventHandlers.ts` still directly coordinated:

- prospect lookup
- user upsert
- subscription/plan activation state
- credit amount calculation
- credit grants

That was already better than keeping the logic inside `revenueSubscribers.ts`, but the handler itself was still becoming the orchestration blob.

## New Event-Driven Billing Orchestration Boundary

The new service boundary is:

- `src/backend/billing/events/billingEventService.ts`

It now owns the payment-received orchestration:

- read prospect
- create/link active user
- compute credits
- apply credit grant

The event handler no longer owns that sequence as its primary responsibility.

## What Stays In billingEventHandlers

`billingEventHandlers.ts` now keeps only:

- event payload intake
- simple guard for missing `prospectId`
- event-facing logging
- delegation to `billingEventService.applyPaymentReceivedFromRevenue(...)`

That is the intended shape for this phase.

## revenueSubscribers Boundary

`backend-server/events/revenueSubscribers.ts` remains unchanged in role:

- subscribe to `PlatformEvent.PAYMENT_RECEIVED`
- delegate to `billingEventHandlers`

It still does **not** import low-level billing services directly.

## Boundary Check Enforcement

`scripts/check-backend-boundaries.mjs` now enforces:

- `revenueSubscribers.ts` may only import `billingEventHandlers.ts` from billing
- `billingEventHandlers.ts` must stay a thin adapter
- if it imports billing internals directly, it may only import:
  - `billingEventService.ts`
  - logging

This prevents the handler from growing back into a low-level billing grab-bag.

## Deferred Work

This phase intentionally did **not**:

- redesign the event bus
- redesign payment/pricing/invoicing
- migrate usage storage
- redesign billing product behavior
- merge all event flows into `billingApplicationService.ts`

## Validation

Passed:

- `npm.cmd run check:backend-boundaries`
- `npm.cmd run check:expo-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Tests

No billing/events-specific automated tests were found.

## Next Suggested Step

The next logical phase is:

- billing event/application-service convergence review

That should answer whether:

- `billingEventService.ts` remains a dedicated event-driven boundary
- or whether selected event-driven billing use-cases should be absorbed into a broader billing application-service contract

without reopening payment/pricing/invoicing scope.
