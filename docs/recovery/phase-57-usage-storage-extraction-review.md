# Phase 57 - Usage Storage Extraction Review

## Goal

Review whether `src/backend/platform/usageService.ts` should remain as a lower-level
platform helper or be internalized into the billing namespace.

This phase stayed intentionally narrow:

- no usage model redesign
- no billing product redesign
- no pricing/payment/invoicing changes
- no platform redesign

## Audited Files

- `src/backend/platform/usageService.ts`
- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingUsageService.js`
- `src/backend/billing/usage/billingQuotaService.ts`
- `src/backend/billing/billingApplicationService.ts`
- `scripts/check-backend-boundaries.mjs`

## Import Graph Findings

Direct usageService callers before this phase:

- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingUsageService.js`

No other direct callers were found in:

- `src/backend/**`
- `backend-server/**`

This means `usageService.ts` was not acting as a platform-wide caller-facing service.
It was effectively a billing-only lower-level implementation living in the wrong
namespace.

## Content Review

`usageService.ts` contained only billing-relevant usage storage/helper behavior:

- `logUsage(...)`
- daily usage counter increment
- `checkLimits(...)`

It did not contain a broader platform capability surface.

That made internalization safe:

- same behavior
- same result shapes
- no algorithm rewrite
- authority moved into the correct bounded context

## Decision

Chosen variant: **B - move/internalize to billing**.

Reason:

- usage implementation was only used by billing-local helpers
- no non-billing callers remained
- keeping it under `src/backend/platform/**` was no longer semantically correct
- a thin wrapper was not needed, because there were no remaining callers to protect

## Implementation

Added:

- `src/backend/billing/usage/billingUsageStorage.ts`
- `src/backend/billing/usage/billingUsageStorage.js`

Moved implementation authority there:

- usage logging
- daily counter increment
- daily limit checks

Rewired:

- `src/backend/billing/usage/billingUsageService.ts`
- `src/backend/billing/usage/billingUsageService.js`

They now delegate to `billingUsageStorage` instead of `platform/usageService`.

Deleted:

- `src/backend/platform/usageService.ts`

No runtime-facing payload or return shapes were changed.

## Boundary Result

After this phase:

- canonical billing-facing usage entry remains:
  - `src/backend/billing/usage/billingUsageService.ts`
- lower-level usage storage/helper implementation now also lives in billing:
  - `src/backend/billing/usage/billingUsageStorage.ts`

This removes the last known billing warning from the platform namespace.

## Boundary Check Effect

`scripts/check-backend-boundaries.mjs` did not need a large redesign in this phase.

The important effect is:

- the old `usageService` warning disappears because the legacy platform helper no longer
  exists
- hard-fail rules against direct caller-facing imports of the old platform path remain
  useful as regression protection

## Why No Compatibility Wrapper Was Kept

A compatibility wrapper under `src/backend/platform/usageService.ts` was unnecessary
because:

- there were no remaining callers
- build/check/test proof passed after deletion
- keeping the wrapper would preserve a misleading platform namespace dependency for no
  gain

## Deferred Work

- no usage model redesign
- no billing product redesign
- no pricing/payment/invoicing work
- no broader billing infrastructure split beyond this helper extraction

## Recommended Next Phase

Billing warning-level legacy helper cleanup is now materially complete.

The next reasonable step is not another helper move, but a higher-level review such as:

- billing infrastructure convergence review
- or a different bounded-context recovery target outside billing
