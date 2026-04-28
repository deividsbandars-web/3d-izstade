# Phase 94: Growth nicheDiscovery SerpAPI Caller Migration Review

Status: PASS

## Summary

- Audited `src/backend/growth/nicheDiscovery.ts` against the canonical SerpAPI search boundary
- Did not migrate any callers in this phase
- Selected next migration slice: `src/backend/growth/nicheDiscovery.ts`

## nicheDiscovery Usage Audit

Audited files:

- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Current usage:

- imports `serpApiHelper` from `src/backend/leads/sources/serpApiHelper.js`
- uses only `serpApiHelper.search(...)`
- does **not** use `guessEmail(...)`

Observed request contract:

- `engine: 'google'`
- `q: \`top emerging trends in ${baseIndustry} 2026\``
- `num: 5`

Observed response usage:

- reads `searchData.data?.organic_results`
- maps each result to:
  - `title + " - " + snippet`
- joins them with `\n`
- falls back to:
  - `'No clear trend data found.'`

This search context is then embedded into the LLM prompt.

Result/error behavior:

- search helper-level failures do not throw directly here
- missing or empty `organic_results` falls through to `'No clear trend data found.'`
- later failures come from `llmService.generateText(...)`, JSON extraction, or parse errors
- top-level method still returns:
  - success: `{ data: niches, error: null }`
  - failure: `{ data: null, error: String(error) }`

Conclusion:

- migration to `src/backend/dataSources/serpApiSearchService.ts` would be 1:1 at the SerpAPI search boundary
- no leads-specific behavior is relied on
- no `guessEmail(...)` dependency exists

## Migration Option Comparison

### A. Migrate `nicheDiscovery.ts` next

Selected.

Assessment:

- risk: low
- reviewability: high
- boundary impact: good, because it removes a growth -> leads shim dependency
- scope control: single caller, single file

### B. Defer

Rejected.

Reason:

- no unclear behavior blocker was found
- the import swap is mechanically equivalent because `serpApiHelper.search(...)` already delegates to `serpApiSearchService.search(...)`

### C. Open leads providers instead

Rejected.

Reason:

- leads providers still use `guessEmail(...)`
- that is a different seam and a higher-complexity class

## Selected Decision

Decision:

- `growth nicheDiscovery migration next`

Selected file:

- `src/backend/growth/nicheDiscovery.ts`

## Scope Guard

Not changed in this phase:

- no caller migration executed
- no deletion
- no leads provider migration
- no `guessEmail(...)` extraction
- no growth redesign
- no multi-domain migration
