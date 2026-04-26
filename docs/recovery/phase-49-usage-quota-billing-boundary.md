# Phase 49: Usage / Quota Billing Boundary

## Summary

This phase introduced a minimal usage/quota billing entry point by expanding:

- `src/backend/billing/billingApplicationService.ts`

and rewiring:

- `src/backend/ai/llmService.ts`
- `src/backend/ai/llmService.js`

so AI no longer imports `platform/usageService.ts` directly.

## Before This Phase

Usage/cost flow was split across four areas:

- `src/backend/platform/usageService.ts`
- `src/backend/governance/costMonitor.ts`
- `src/backend/ai/llmService.ts`
- `src/backend/billing/credits/creditService.ts`

The concrete path was:

- `llmService` called `usageService.checkLimits(...)`
- `llmService` called `usageService.logUsage(...)`
- `costMonitor` separately checked daily limits and credits

That meant AI usage/cost entered the system through platform/governance helpers instead of a billing boundary.

## New Billing Usage/Quota Entry Points

`billingApplicationService.ts` now exposes three minimal use-cases:

- `trackUsage(userId, usagePayload)`
- `enforceQuota(userId, usagePayload)`
- `getUsageSummary(userId)`

This phase did not redesign `usageService`, `costMonitor`, or `creditService`.
It only moved orchestration behind the billing boundary.

## New Usage/Cost Flow

AI path now works like this:

- `llmService` -> `billingApplicationService.enforceQuota(...)`
- `billingApplicationService` -> `costMonitor.verifyBudget(...)`
- `costMonitor` -> `usageService.checkLimits(...)`
- `costMonitor` -> credit/plan check via existing database logic

For logging:

- `llmService` -> `billingApplicationService.trackUsage(...)`
- `billingApplicationService` -> `usageService.logUsage(...)`

So billing is now the caller-facing entry point, while governance/platform remain low-level dependencies.

## What Stayed As Legacy Coupling

This phase intentionally left these in place:

- `costMonitor.ts` still imports `usageService.ts`
- `costMonitor.ts` still acts as low-level budget verifier
- `usageService.ts` still lives under platform
- `creditService.ts` still owns credit balance mutations
- `agentGovernor.ts` still imports `costMonitor.ts`

That is acceptable for this phase because the goal was to remove billing entry-point ambiguity, not redesign the whole quota system.

## Boundary Check Enforcement

`scripts/check-backend-boundaries.mjs` now hard-fails if:

- `src/backend/ai/**` imports:
  - `src/backend/platform/usageService.ts`
  - `src/backend/governance/costMonitor.ts`

AI must go through:

- `src/backend/billing/billingApplicationService.ts`

The check also emits warning-level audit signals when:

- `usageService` is used outside billing
- `costMonitor` is used outside billing

This keeps the existing legacy coupling visible without turning this phase into a broader refactor.

## Why Governance Was Not Fully Rewired

`costMonitor.ts` still has one direct caller:

- `src/backend/governance/agentGovernor.ts`

Changing that in this phase would have expanded scope into governance cleanup.
The narrower and safer cut was to rewire AI first, then leave governance as warning-level legacy coupling.

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

## Tests

No billing/revenue/usage-specific automated tests were found.

## Next Suggested Step

The next logical phase is:

- governance quota/budget caller cleanup

That should target:

- `src/backend/governance/agentGovernor.ts`
- `src/backend/governance/costMonitor.ts`
- possibly a dedicated billing usage/quota helper under `src/backend/billing/**`

without reopening payment/pricing/invoicing scope.
