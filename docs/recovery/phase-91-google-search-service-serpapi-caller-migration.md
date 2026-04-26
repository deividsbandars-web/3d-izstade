# Phase 91: Google Search Service SerpAPI Caller Migration

Status: PASS

## Summary

- Migrated `src/backend/dataSources/googleSearchService.ts` from the leads compatibility shim to the canonical dataSources SerpAPI boundary
- Kept behavior and result shape unchanged
- Did not migrate any other callers
- Did not delete `src/backend/leads/sources/serpApiHelper.js`

## googleSearchService Behavior Audit

Audited files:

- `src/backend/dataSources/googleSearchService.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Preserved behavior:

- request params:
  - `engine: "google"`
  - `q: query`
  - `num: limit`
- response mapping:
  - `organic_results -> { title, url, snippet }`
- error handling:
  - throws on helper-level `{ error }` or missing `data`
  - catches locally and returns `{ data: null, error: String(error) }`
- result shape:
  - success: `{ data: SearchResult[], error: null }`
  - failure: `{ data: null, error: string }`

No query behavior or limit behavior was changed.

## Import Migration Details

Updated:

- `src/backend/dataSources/googleSearchService.ts`

Before:

- imported `src/backend/leads/sources/serpApiHelper.ts` via `.js` specifier

After:

- imports `src/backend/dataSources/serpApiSearchService.ts`

Changed call site:

- `serpApiHelper.search(...)`
- to `serpApiSearchService.search(...)`

No other callers were migrated.

## Boundary Check Details

Updated:

- `scripts/check-backend-boundaries.mjs`

Added narrow enforcement:

- `src/backend/dataSources/googleSearchService.ts` must not import the leads compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No broader caller migration rule was introduced.
