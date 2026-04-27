# Phase 95: Growth nicheDiscovery SerpAPI Caller Migration

Status: PASS

## Summary

- Migrated `src/backend/growth/nicheDiscovery.ts` from the leads compatibility shim to the canonical dataSources SerpAPI boundary
- Kept search, fallback, prompt, and result behavior unchanged
- Did not migrate any leads providers
- Did not delete `src/backend/leads/sources/serpApiHelper.js`

## nicheDiscovery Behavior Audit

Audited files:

- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Preserved behavior:

- helper call params:
  - `engine: 'google'`
  - `q: \`top emerging trends in ${baseIndustry} 2026\``
  - `num: 5`
- `organic_results` usage:
  - `title + " - " + snippet`
  - joined into `searchContext`
- fallback:
  - `'No clear trend data found.'`
- LLM prompt behavior:
  - unchanged prompt structure
  - unchanged `llmService.generateText(prompt, { temperature: 0.7 })`

Preserved result/error behavior:

- success:
  - `{ data: niches, error: null }`
- failure:
  - `{ data: null, error: String(error) }`

No JSON extraction or parse behavior was changed.

## Import Migration Details

Updated:

- `src/backend/growth/nicheDiscovery.ts`

Before:

- imported `src/backend/leads/sources/serpApiHelper.ts` via `.js` specifier
- called `serpApiHelper.search(...)`

After:

- imports `src/backend/dataSources/serpApiSearchService.ts`
- calls `serpApiSearchService.search(...)`

No other callers were migrated.

## Boundary Check Details

Updated:

- `scripts/check-backend-boundaries.mjs`

Added narrow enforcement:

- `src/backend/growth/nicheDiscovery.ts` must not import the leads compatibility shim directly
- it must use `src/backend/dataSources/serpApiSearchService.ts`

No broader rule was introduced for leads providers.
