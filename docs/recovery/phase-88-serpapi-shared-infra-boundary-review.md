# Phase 88: SerpAPI Shared Infra Boundary Review

Status: PASS

## Summary

- Audited the current SerpAPI helper contract under `src/backend/leads/sources/**`
- Confirmed the helper is used across leads, growth, dataSources, and agents
- Did not delete or move any files in this phase
- Selected canonical boundary: `src/backend/dataSources/**`

## SerpAPI Helper Contract Audit

Current files:

- `src/backend/leads/sources/serpApiHelper.ts`
- `src/backend/leads/sources/serpApiHelper.js`

Exported API:

- `serpApiHelper.search(params)`
- `serpApiHelper.guessEmail(domain?, _companyName?)`

Contract details:

- `search(params)`
  - input: arbitrary SerpAPI query params object
  - output: `{ data, error }`
  - error behavior:
    - returns `{ data: null, error: 'SERPAPI_KEY is missing' }` when no key is available
    - returns `{ data: null, error: String(error) }` on fetch/HTTP/runtime failure
    - never throws after entering the helper body; failure is normalized to the result object
- `guessEmail(domain?, _companyName?)`
  - input: optional domain-like string
  - output: `string`
  - behavior:
    - returns empty string for missing/unusable input
    - strips protocol and `www.`
    - returns `info@<domain>`

Environment/API key dependency:

- prefers `process.env.SERPAPI_KEY`
- falls back to `import.meta.env.VITE_SERPAPI_KEY`

Conclusion:

- helper is stateless
- helper is effectively a backend search/data-source infrastructure wrapper plus a small email heuristic helper

## Caller Usage Audit

Leads callers:

- `src/backend/leads/sources/googleMapsLeadSource.ts`
  - uses `search(...)`
  - uses `guessEmail(...)`
  - no leads-specific hidden contract beyond SerpAPI response mapping
- `src/backend/leads/sources/directoryLeadSource.ts`
  - uses `search(...)`
  - uses `guessEmail(...)`
- `src/backend/leads/sources/linkedinLeadSource.ts`
  - uses `search(...)`
  - uses `search(...)` only

Growth caller:

- `src/backend/growth/nicheDiscovery.ts`
  - uses `search(...)`
  - consumes generic organic search results as trend context
  - not leads-specific

dataSources caller:

- `src/backend/dataSources/googleSearchService.ts`
  - uses `search(...)`
  - wraps generic Google search into a data-source service
  - clearly data-source/search infrastructure usage

Agents caller:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
  - uses `search(...)`
  - exposes generic web search results to agent tools
  - not leads-specific

Conclusion:

- callers do not rely on leads-specific orchestration
- usage is generic search/data-source infrastructure usage, with `guessEmail(...)` used only by two leads providers

## Canonical Home Option Comparison

### A. Keep under `leads/sources`

Rejected.

Reason:

- helper is no longer leads-local
- current caller graph crosses multiple backend domains

### B. Canonicalize under `src/backend/dataSources`

Selected.

Reason:

- `search(...)` is a shared backend data-source concern
- callers outside leads already use it as generic search infrastructure
- this is the narrowest canonical home that matches actual responsibility without escalating to broad shared-runtime redesign

### C. Canonicalize under `src/backend/shared` or `src/shared`

Rejected for now.

Reason:

- helper still depends on backend-side environment access and backend logging conventions
- moving directly to a broader shared layer would be a wider architectural step than needed

## Selected Canonical Boundary

Selected canonical home:

- `src/backend/dataSources`

Recommended target shape for a later implementation phase:

- create `src/backend/dataSources/serpApiSearchService.ts`
- keep `src/backend/leads/sources/serpApiHelper.ts` temporarily as a compatibility shim
- migrate callers in narrow slices

## Scope Guard

Not changed in this phase:

- no file deletion
- no caller rewiring
- no multi-domain refactor
- no SerpAPI redesign
