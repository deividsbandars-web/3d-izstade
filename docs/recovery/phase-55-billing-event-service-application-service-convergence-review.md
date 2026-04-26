# Phase 55 - Billing Event Service / Application-Service Convergence Review

## Goal

Review whether `src/backend/billing/events/billingEventService.ts` should converge into
`src/backend/billing/billingApplicationService.ts`, or remain a separate event-driven
billing orchestration boundary.

This phase was intentionally narrow:

- no event bus redesign
- no payment provider redesign
- no pricing/invoicing redesign
- no usage storage migration
- no billing product redesign

## Audited Files

- `src/backend/billing/billingApplicationService.ts`
- `src/backend/billing/events/billingEventService.ts`
- `src/backend/billing/events/billingEventHandlers.ts`
- `src/backend/billing/credits/creditService.ts`
- `src/backend/billing/payments/paymentService.ts`
- `src/backend/billing/plans/planService.ts`
- `backend-server/controllers/billingController.ts`
- `backend-server/events/revenueSubscribers.ts`
- `src/backend/events/eventTypes.ts`
- `scripts/check-backend-boundaries.mjs`

## Current Boundary Map

### billingApplicationService

`billingApplicationService.ts` is the caller-facing billing boundary for:

- HTTP/controller flows
- AI usage/quota flows
- governance usage/quota flows
- billing usage summary and quota entry points

It is synchronous/request-oriented and already acts as the public service contract for
non-event billing callers.

### billingEventService

`billingEventService.ts` owns event-driven billing orchestration for
`PAYMENT_RECEIVED`-style flows:

- prospect lookup
- user upsert
- subscription/plan state application
- credit calculation
- credit grants

This is asynchronous event-side orchestration, not a controller/API use-case.

### billingEventHandlers

`billingEventHandlers.ts` is now a thin event adapter:

- accepts revenue event payload
- validates/maps event payload
- logs event handling
- delegates to `billingEventService.ts`

### revenueSubscribers

`backend-server/events/revenueSubscribers.ts` remains only:

- subscription wiring
- delegation to `billingEventHandlers.ts`

It no longer owns billing side-effects directly.

## Boundary Decision

Chosen variant: **A - keep them separate**.

Reasoning:

- `billingApplicationService.ts` and `billingEventService.ts` do not currently represent
  duplicated orchestration for the same caller surface.
- `billingApplicationService.ts` is the correct boundary for synchronous/API-style
  callers.
- `billingEventService.ts` is the correct boundary for event-driven billing state
  transitions.
- Forcing convergence in this phase would mainly move event-specific orchestration into
  `billingApplicationService.ts`, increasing blob risk without resolving a concrete
  ambiguity.

## Why Variant B Was Rejected

Moving payment-received event orchestration into `billingApplicationService.ts` would:

- enlarge the caller-facing billing boundary with event-specific logic
- blur the distinction between request-driven and event-driven orchestration
- create a more mixed responsibility service without reducing any meaningful runtime
  surface

The current split is simpler and easier to defend:

- controllers -> `billingApplicationService.ts`
- subscribers -> `billingEventHandlers.ts` -> `billingEventService.ts`

## Implementation in This Phase

No event flow redesign was performed.

The phase only strengthened the existing separation:

- `billingEventHandlers.ts` is explicitly marked and kept as an event adapter
- `billingEventService.ts` is explicitly marked as the event-driven billing
  orchestration boundary
- boundary checks now enforce this split

## Boundary Rules Enforced

`scripts/check-backend-boundaries.mjs` now protects the selected shape:

- `backend-server/controllers/billingController.ts` may import only
  `src/backend/billing/billingApplicationService.ts` from the billing domain
- `backend-server/events/revenueSubscribers.ts` may import only
  `src/backend/billing/events/billingEventHandlers.ts` from the billing domain
- `src/backend/billing/events/billingEventHandlers.ts` may import only:
  - `src/backend/billing/events/billingEventService.ts`
  - billing logging dependencies

This prevents:

- subscriber -> low-level billing regressions
- handler -> low-level billing grab-bag regressions
- controller -> low-level billing regressions

## Remaining Warnings

These warnings intentionally remain outside this phase:

- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`

They are legacy/helper boundary issues, not event-service convergence issues.

## What Not To Do Next

Do not combine these in one phase:

- event bus redesign
- payment provider redesign
- pricing/invoicing redesign
- usage storage migration

That would turn a boundary clarification phase into a broad rewrite.

## Recommended Next Phases

1. Billing event service / application-service convergence review follow-up only if a
   real shared orchestration use-case appears across both surfaces.
2. Platform usage helper retirement planning around `src/backend/platform/usageService.ts`.
3. Governance compatibility wrapper retirement planning around
   `src/backend/governance/costMonitor.ts`.
