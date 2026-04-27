# Phase 108 - SerpAPI Helper TypeScript Shim Retirement Review

## Summary

Phase 108 audited whether:

- `src/backend/leads/sources/serpApiHelper.ts`

is still needed as a compatibility shim.

Decision:
- `retire shim next`

No shim deletion was performed in this review phase.

## Reference Audit

Reference classification after the final duplicate burn-down:

Active source import/call:
- none found

Shim self-definition:
- `src/backend/leads/sources/serpApiHelper.ts`

Boundary checker rule:
- `scripts/check-backend-boundaries.mjs`

Docs / recovery references:
- `docs/recovery/**`

Diagnostics references:
- `diagnostics/**`

Tests:
- none targeting the shim directly

Package scripts:
- none targeting the shim directly

Dynamic imports:
- none found

Worker entries:
- none found

## Active Source / Runtime Dependency Audit

No active source import was found targeting:
- `src/backend/leads/sources/serpApiHelper.ts`
through:
- `./serpApiHelper.js`

No package/build/runtime dependency was found from:
- `package.json`
- `backend-server/package.json`
- worker entrypoints
- route/controller imports
- test files
- scripts

to the shim as an active runtime boundary.

## Boundary Checker Audit

`scripts/check-backend-boundaries.mjs` still contains:
- `leadsSerpApiHelperTs`
- `leadsSerpApiHelperJs`

Current purpose:
- enforcement/audit-only
- verifies callers do not depend on the legacy shim path
- emits an audit warning if the shim no longer delegates search to the canonical service

It does not act as a runtime dependency.

## Shim Behavior Audit

`src/backend/leads/sources/serpApiHelper.ts` contains only:
- `search(...)` delegating to `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` delegating to `src/backend/leads/sources/leadEmailGuessingService.ts`

Confirmed:
- no additional runtime behavior
- no hidden side effects
- no state
- no logging
- no branching beyond direct delegation

## Search / Email Boundary Confirmation

Canonical search callers remain on:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

All of the above use:
- `src/backend/dataSources/serpApiSearchService.ts`

Email guessing remains on:
- `src/backend/leads/sources/leadEmailGuessingService.ts`

No active caller uses:
- `serpApiHelper.search(...)`
- `serpApiHelper.guessEmail(...)`

## Retirement Risk Assessment

Retirement risk:
- `low`

Reason:
- no active source/runtime/build/test dependency on the shim
- shim contents are pure delegation only
- canonical boundaries already exist and are in use

## Boundary Check Notes

Checker references are audit-only, but the checker currently still names:
- `src/backend/leads/sources/serpApiHelper.ts`

If the shim is retired in the next phase, a minimal checker cleanup may be required.
No broad checker rewrite is needed.

## Validation

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only restriction:
- `npm.cmd run build`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Current State

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Next Recommendation

The next phase should be:
- `SERPAPI HELPER TYPESCRIPT SHIM RETIREMENT`

That phase should:
- delete `src/backend/leads/sources/serpApiHelper.ts`
- perform only minimal boundary-checker cleanup if the checker still expects the shim file to exist
- leave canonical search and email boundaries unchanged
