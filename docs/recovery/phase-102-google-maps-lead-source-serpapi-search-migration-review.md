# Phase 102 - Google Maps Lead Source SerpAPI Search Migration Review

## Summary

Phase 102 audited the final remaining leads provider search caller:

- `src/backend/leads/sources/googleMapsLeadSource.ts`

The goal was to determine whether migration from the SerpAPI compatibility shim to the canonical search boundary is now a mechanical single-file change.

No code migration or deletion was performed in this phase.

## Google Maps Provider Behavior Audit

File:
- `src/backend/leads/sources/googleMapsLeadSource.ts`

Search input:
- `engine: "google_maps"`
- `q: <query> in <location>`
- `type: "search"`

Output mapping:
- `response.data.local_results || []`
- `results.slice(0, limit)` mapped into:
  - `company_name`
  - `website`
  - `email`
  - `phone`
  - `location`
  - `metadata.rating`
  - `metadata.reviews`
  - `metadata.type`
  - `metadata.serpapi_id`

Error behavior:
- `response.error || !response.data` triggers throw
- catch returns `{ data: null, error: String(error) }`

Email behavior:
- `leadEmailGuessingService.guessEmail(res.website, res.title)` remains the leads-local email path

## Migration Risk Assessment

Findings:
- `serpApiHelper.search(...)` currently delegates directly to `src/backend/dataSources/serpApiSearchService.ts`
- there is no remaining helper-specific search behavior in `serpApiHelper.ts`
- `guessEmail(...)` is already extracted and no longer blocks the search import seam
- `local_results` and `metadata` mapping are fully local to `googleMapsLeadSource.ts`

Conclusion:
- the search import migration is now technically `1:1`
- the provider’s richer payload surface does not introduce a hidden dependency on `serpApiHelper.ts`
- scope remains one file

## Decision

Selected decision:
- `googleMaps migration next`

## Rationale

This is now the correct next step because:
- all other non-leads and lower-risk provider callers have already been migrated
- `guessEmail(...)` has been isolated
- the remaining difference is only the search import seam
- the migration can be reviewed as a narrow, mechanical change without redesigning the provider

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

The next implementation phase should migrate only:
- `src/backend/leads/sources/googleMapsLeadSource.ts`

from:
- `src/backend/leads/sources/serpApiHelper.ts`

to:
- `src/backend/dataSources/serpApiSearchService.ts`
