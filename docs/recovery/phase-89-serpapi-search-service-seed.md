# Phase 89: SerpAPI Search Service Seed

Status: PASS

## Summary

- Added canonical SerpAPI search service at `src/backend/dataSources/serpApiSearchService.ts`
- Kept `src/backend/leads/sources/serpApiHelper.ts` as a compatibility shim for `search(...)`
- Left `guessEmail(...)` untouched in `serpApiHelper.ts`
- Did not delete `src/backend/leads/sources/serpApiHelper.js`
- Did not perform multi-domain caller migration

## SerpAPI Search Contract Audit

Source contract audited from:

- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/serpApiHelper.js`

Preserved behavior:

- input: arbitrary SerpAPI params object
- output: `{ data, error }`
- key lookup:
  - `process.env.SERPAPI_KEY`
  - fallback `import.meta.env.VITE_SERPAPI_KEY`
- error handling:
  - returns `{ data: null, error: 'SERPAPI_KEY is missing' }` when key is absent
  - returns `{ data: null, error: String(error) }` on fetch/HTTP/runtime failure
  - successful path returns `{ data, error: null }`

## Canonical Search Service Details

Added:

- `src/backend/dataSources/serpApiSearchService.ts`

The new canonical service owns the `search(...)` behavior and preserves the previous contract 1:1.

It includes:

- the same key resolution behavior
- the same HTTP request construction to `https://serpapi.com/search?...`
- the same logging and normalized error contract

## Compatibility Shim Details

Updated:

- `src/backend/leads/sources/serpApiHelper.ts`

Current state:

- `search(...)` delegates to `src/backend/dataSources/serpApiSearchService.ts`
- `guessEmail(...)` stays local inside `serpApiHelper.ts`

Not changed:

- `src/backend/leads/sources/serpApiHelper.js` was not deleted
- `guessEmail(...)` logic was not moved or rewritten

## Caller Migration Notes

No multi-domain caller migration was done in this phase.

Specifically:

- `googleSearchService.ts` was not migrated yet
- leads providers were not migrated
- growth and agents callers were not migrated

This phase only seeded the canonical service and compatibility shim.

## Boundary Check Notes

Updated:

- `scripts/check-backend-boundaries.mjs`

Added audit-level note only:

- canonical SerpAPI search home is `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts` should remain a compatibility shim for `search(...)`

No new hard-fail caller rule was introduced.
