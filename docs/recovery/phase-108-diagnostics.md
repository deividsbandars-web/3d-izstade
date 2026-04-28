# Phase 108 Diagnostics

## Scope

Phase:
- `SERPAPI HELPER TYPESCRIPT SHIM RETIREMENT REVIEW`

Intent:
- determine whether the remaining TypeScript shim is still required as a compatibility surface

## Reference Classification

Active source import/call:
- none

Shim self-definition:
- `src/backend/leads/sources/serpApiHelper.ts`

Boundary checker:
- `scripts/check-backend-boundaries.mjs`

Docs / diagnostics:
- `docs/recovery/**`
- `diagnostics/**`

Tests:
- none direct

Package script / worker / dynamic import:
- none direct

## Shim Contents

Current shim delegates only:
- `search(...) -> src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...) -> src/backend/leads/sources/leadEmailGuessingService.ts`

No hidden runtime behavior found.

## Canonical Boundary Confirmation

Search boundary:
- `src/backend/dataSources/serpApiSearchService.ts`

Email guessing boundary:
- `src/backend/leads/sources/leadEmailGuessingService.ts`

Canonical search callers:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`
- `src/backend/leads/sources/googleMapsLeadSource.ts`

## Checker Notes

`scripts/check-backend-boundaries.mjs` still references the shim path for audit/enforcement purposes.
This is not a runtime dependency.

## Command Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM` only:
- `npm.cmd run build`

Passed outside sandbox:
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Boundary Summary

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Decision

- selected decision: `retire shim next`
- likely next target: `src/backend/leads/sources/serpApiHelper.ts`
