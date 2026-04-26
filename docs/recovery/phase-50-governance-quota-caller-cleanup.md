# Phase 50: Governance Quota Caller Cleanup

## Summary

This phase removed the main governance-side bypass around the billing usage/quota boundary.

The key change was:

- `src/backend/governance/agentGovernor.ts`

no longer imports `costMonitor` directly.

It now uses:

- `src/backend/billing/billingApplicationService.ts`

as the caller-facing quota entry point.

## Before This Phase

`agentGovernor.ts` imported:

- `src/backend/governance/costMonitor.ts`

and treated it as the direct budget/quota gate before agent execution.

That meant governance still bypassed the billing usage/quota boundary introduced in Phase 49.

## After This Phase

`agentGovernor.ts` now calls:

- `billingApplicationService.enforceQuota(...)`

instead of:

- `costMonitor.verifyBudget(...)`

This preserves the behavior pattern:

- budget check still happens before task execution
- governance still receives `{ allowed, reason }`
- the orchestration entry point is now billing, not governance

## What Stayed The Same

This phase intentionally did **not** redesign:

- `costMonitor.ts`
- `usageService.ts`
- billing pricing/payment logic
- event-side billing behavior

`costMonitor.ts` still exists and is still used by `billingApplicationService` as an internal helper.

## New Boundary Rule

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `src/backend/governance/**` imports `costMonitor.ts` or `costMonitor.js` directly

The intended caller-facing path is:

- governance -> `billingApplicationService.enforceQuota(...)`

The allowed internal path remains:

- billing -> `costMonitor`

## Remaining Legacy Coupling

The following issues remain intentionally out of scope:

- `costMonitor.ts` still imports `usageService.ts`
- `usageService.ts` still lives under platform
- `revenueSubscribers.ts` still performs billing-adjacent side-effects

These are still warning-level issues, not hard-fail targets, because this phase was limited to removing governance as a caller-facing quota entry point.

## Validation

Passed in sandbox:

- `npm.cmd run check:backend-boundaries`
- `npm.cmd run check:expo-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox EPERM only:

- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

The same commands passed outside sandbox.

## Tests

No billing/governance/usage-specific automated tests were found.

## Next Suggested Step

The next logical phase is:

- costMonitor internalization cleanup

That should evaluate whether:

- `costMonitor` moves under `src/backend/billing/**`
- or its logic is split between a billing usage helper and a billing credit/quota helper

without reopening pricing/payment/invoicing scope.
