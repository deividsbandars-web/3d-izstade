# Phase 104 - SerpAPI Helper Final Duplicate Burn-Down Review

## Summary

Phase 104 audited the final remaining leads duplicate target:

- `src/backend/leads/sources/serpApiHelper.js`

This was an audit/selection phase only. No deletion was performed.

Key finding:
- the current worktree still has one active source caller importing the compatibility shim:
  - `src/backend/leads/sources/googleMapsLeadSource.ts`

Because of that active source import, deletion is not selected in this phase.

## Reference Audit

### Active source references

`src/backend/leads/sources/googleMapsLeadSource.ts`
- imports `serpApiHelper` from `./serpApiHelper.js`
- calls `serpApiHelper.search(...)`

`src/backend/leads/sources/serpApiHelper.ts`
- exports `serpApiHelper`
- delegates `search(...)` to `src/backend/dataSources/serpApiSearchService.ts`
- delegates `guessEmail(...)` to `src/backend/leads/sources/leadEmailGuessingService.ts`

### Canonical search callers already migrated

These active callers already use `src/backend/dataSources/serpApiSearchService.ts` directly:
- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/leads/sources/linkedinLeadSource.ts`
- `src/backend/leads/sources/directoryLeadSource.ts`

### Non-runtime references

Additional references to `serpApiHelper` exist in:
- `docs/recovery/**`
- `diagnostics/**`
- `scripts/check-backend-boundaries.mjs`

These are audit/docs/boundary references, not runtime call paths.

## Runtime/Build Dependency Audit

Root `package.json`
- no direct script target for `src/backend/leads/sources/serpApiHelper.js`

`backend-server/package.json`
- no direct script target for `src/backend/leads/sources/serpApiHelper.js`

Worker/dynamic import audit
- no worker entry targeting `serpApiHelper.js`
- no dynamic import targeting `serpApiHelper.js`

Important runtime finding:
- despite lack of script entry, there is still an active source import from `googleMapsLeadSource.ts`
- that means the duplicate target is not yet isolated from active source usage in the current tree

## `serpApiHelper.ts` Shim Status

Current shim status:
- `search(...)` is a pure compatibility delegator to `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` is a pure compatibility delegator to `src/backend/leads/sources/leadEmailGuessingService.ts`

This means the TypeScript shim is now thin and mechanically understandable.

## `serpApiHelper.js` Duplicate Status

Current classification:
- checked-in duplicate JS artifact
- not directly targeted by scripts, workers, or dynamic imports
- but still colocated with an active source import seam that has not yet been migrated

Therefore:
- it is not selected as deletion-ready in this phase

## Deletion Risk Assessment

Risk level:
- `defer`

Why:
- the current worktree does not yet satisfy the prerequisite stated in the recovery sequence that all real search callers are off the compatibility shim
- `googleMapsLeadSource.ts` is still an active source caller of `serpApiHelper.search(...)`
- deleting the checked-in JS duplicate before resolving that last source seam would weaken the proof standard used in earlier burn-down phases

## Decision

Selected decision:
- `defer with exact blocker`

Exact blocker:
- `src/backend/leads/sources/googleMapsLeadSource.ts` still imports `./serpApiHelper.js`

## Validation

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only restriction:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

## Current State

- domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

## Next Recommendation

The next phase should be:
- `GOOGLE MAPS LEAD SOURCE SERPAPI SEARCH MIGRATION`

Only after that migration lands should the repo run a new:
- `SERPAPI HELPER FINAL DUPLICATE BURN-DOWN REVIEW`
