# Phase 53: Revenue Subscriber Billing Side-Effect Isolation

## Summary

This phase removed direct low-level billing side-effects from:

- `backend-server/events/revenueSubscribers.ts`

and moved them into a billing-local event handler:

- `src/backend/billing/events/billingEventHandlers.ts`

`revenueSubscribers.ts` now remains a subscription/delegation surface instead of directly orchestrating billing state changes.

## Billing Side-Effects Before This Phase

Before the change, `revenueSubscribers.ts` directly:

- loaded prospect data
- upserted the user with billing-adjacent subscription state
- calculated granted credits from payment amount
- called `creditService.addCredits(...)`

It also imported low-level billing services directly:

- `creditService`
- `paymentService` (unused but still a low-level billing import)

That meant the event layer still bypassed the billing namespace boundary.

## New Billing-Local Event Handler

The new billing-local handler is:

- `src/backend/billing/events/billingEventHandlers.ts`

It now owns the payment-received side-effects that were previously embedded in `revenueSubscribers.ts`:

- prospect lookup
- user upsert with starter/selected plan activation state
- credit amount calculation
- credit grant

This keeps the current behavior but relocates the side-effects into the billing namespace.

## revenueSubscribers Rewiring

`revenueSubscribers.ts` now:

- subscribes to `PlatformEvent.PAYMENT_RECEIVED`
- delegates `payload.data` to `billingEventHandlers.handlePaymentReceivedFromRevenue(...)`

It no longer imports:

- `src/backend/billing/payments/**`
- `src/backend/billing/credits/**`
- any other low-level billing implementation directly

This is the intended shape for this phase: event wiring in the subscriber, billing state changes in billing.

## Boundary Check Enforcement

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `backend-server/events/revenueSubscribers.ts` imports low-level billing implementation directly

It may only import:

- `src/backend/billing/events/billingEventHandlers.ts`

This protects the boundary against future regressions without redesigning the whole event system.

## Deferred Work

This phase intentionally did **not**:

- redesign the event bus
- redesign payment/pricing/invoicing
- migrate usage storage
- redesign revenue bounded context
- redesign billing product behavior

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

- billing event handler application-service alignment

That should evaluate whether:

- `billingEventHandlers.ts` should stay as a direct billing side-effect boundary
- or whether those flows should be folded into a broader billing application-service/event-service contract

without reopening payment/pricing/invoicing scope.
