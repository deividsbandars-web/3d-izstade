# Phase 93: Agents dataSource Tool Adapter SerpAPI Caller Migration

Status: PASS

## Summary

- Migrated `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts` from the leads compatibility shim to the canonical dataSources SerpAPI boundary
- Kept `searchWeb(query)` behavior and result shape unchanged
- Did not migrate any other SerpAPI callers
- Did not delete `src/backend/leads/sources/serpApiHelper.js`

## Agents data-source tool behavior audit

Audited files:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Preserved behavior:

- method:
  - `searchWeb(query: string)`
- helper call semantics:
  - `search({ q: query, engine: 'google' })`
- output:
  - `result.data?.organic_results?.slice(0, 5)`
  - or `'No results found.'`

Preserved result/error behavior:

- no explicit throw path was added
- missing search data still falls through to `'No results found.'`
- website scraping behavior was not touched

## Import migration details

Updated:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Before:

- imported `src/backend/leads/sources/serpApiHelper.ts` via `.js` specifier
- called `serpApiHelper.search(...)`

After:

- imports `src/backend/dataSources/serpApiSearchService.ts`
- calls `serpApiSearchService.search(...)`

No other callers were migrated.

## Boundary check details

Updated:

- `scripts/check-backend-boundaries.mjs`

Added narrow enforcement:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts` must not import the leads compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No broader migration rule was introduced for growth or leads providers.
