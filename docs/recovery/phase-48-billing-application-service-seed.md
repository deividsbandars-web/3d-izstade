# Phase 48: Billing Application-Service Seed

## Summary

This phase introduced a minimal caller-facing billing boundary:

- `src/backend/billing/billingApplicationService.ts`

and rewired:

- `backend-server/controllers/billingController.ts`

so the controller no longer imports low-level billing plan/payment/credit services directly.

## Billing Controller Before This Phase

Before the change, `billingController.ts` imported:

- `src/backend/billing/plans/planService.ts`
- `src/backend/billing/payments/paymentService.ts`
- `src/backend/billing/credits/creditService.ts`

The controller handled both:

- request param/body extraction
- low-level billing service orchestration

That meant there was still no real caller-facing billing boundary.

## Low-Level Billing Services Isolated Behind The Boundary

The new `billingApplicationService.ts` now coordinates the existing low-level services:

- `planService`
- `paymentService`
- `creditService`

No billing business logic redesign was done in this phase. The goal was only to move controller-facing orchestration behind a dedicated boundary.

## Billing Application-Service Contract

The new boundary exposes the current controller-facing use-cases:

- `getPlanLimits(planId)`
- `getUserPlan(userId)`
- `upgradePlan(userId, newPlan)`
- `getCreditBalance(userId)`
- `buyCredits(userId, packageId)`
- `createCheckoutSession(userId, productId, kind)`

This is intentionally narrow. It mirrors the existing billing API surface rather than introducing a broader billing redesign.

## Controller Responsibility After Rewiring

`billingController.ts` now does only:

- request param/body extraction
- simple required-field validation
- `billingApplicationService` invocation
- HTTP response/status mapping

It no longer imports low-level billing services directly.

## API Compatibility Notes

The billing endpoints in `backend-server/routes/api.ts` were left unchanged.

Response behavior was preserved:

- plan limits still return the raw limits object
- user plan still returns `result.data`
- credit balance still returns `{ credits: ... }`
- buy credits still returns `{ credits, packageId, creditedAmount }`
- checkout session still returns the low-level payment session payload

No billing-specific automated tests were found in the repo, so API compatibility was preserved by keeping response shapes aligned with the existing controller behavior.

## Remaining Billing Coupling Warnings

This phase intentionally did **not** refactor these coupling points:

- `backend-server/events/revenueSubscribers.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`
- `src/backend/platform/usageService.ts`

They remain warning-level signals because they are real billing/monetization boundary risks, but they were out of scope for this phase.

## Boundary Check Changes

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `backend-server/controllers/billingController.ts` imports low-level billing implementation under:
  - `src/backend/billing/plans/**`
  - `src/backend/billing/payments/**`
  - `src/backend/billing/credits/**`

`billingController.ts` is now allowed to import only:

- `src/backend/billing/billingApplicationService.ts`

The broader billing coupling concerns remain warnings, not hard-fail rules, because the larger billing boundary has not been implemented yet.

## Why Usage / Quota / Events / Governance / AI Were Not Touched

Those areas are the next billing-boundary problems, but they are not part of the controller rewiring slice.

Touching them in this phase would have expanded scope into:

- usage/quota redesign
- event-side-effect isolation
- governance billing proxy cleanup
- AI usage billing abstraction

That would have turned a safe seed phase into a broad backend rewrite.

## Validation

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox EPERM only:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

The same commands passed outside sandbox.

## Next Suggested Step

The next logical phase is:

- billing usage/quota boundary cleanup

That should target:

- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`

without reopening controller rewiring work.
