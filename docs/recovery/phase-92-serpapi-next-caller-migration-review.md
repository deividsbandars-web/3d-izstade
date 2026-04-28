# Phase 92: SerpAPI Next Caller Migration Review

Status: PASS

## Summary

- Audited both remaining non-leads SerpAPI shim callers:
  - `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
  - `src/backend/growth/nicheDiscovery.ts`
- Did not migrate any callers in this phase
- Selected next migration slice: `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

## Agents Caller Audit

Audited files:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Current usage:

- imports `serpApiHelper` from `src/backend/leads/sources/serpApiHelper.js`
- uses only `serpApiHelper.search(...)`
- does **not** use `guessEmail(...)`

Observed contract:

- input:
  - `searchWeb(query: string)`
  - calls `search({ q: query, engine: 'google' })`
- output:
  - `result.data?.organic_results?.slice(0, 5) || 'No results found.'`
- no leads-specific response shaping is used beyond reading generic `organic_results`

Boundary impact:

- migration would stay inside the existing agents tool adapter boundary allowlist
- `scripts/check-backend-boundaries.mjs` already allows `dataSourceToolAdapters.ts` to import `src/backend/dataSources/**`
- migration would reduce one direct dependency from agents tooling into the leads compatibility shim

Conclusion:

- migration to `src/backend/dataSources/serpApiSearchService.ts` would be 1:1
- this is a narrow single-caller scope with low behavior ambiguity

## Growth Caller Audit

Audited files:

- `src/backend/growth/nicheDiscovery.ts`
- `src/backend/dataSources/serpApiSearchService.ts`
- `src/backend/leads/sources/serpApiHelper.ts`

Current usage:

- imports `serpApiHelper` from `src/backend/leads/sources/serpApiHelper.js`
- uses only `serpApiHelper.search(...)`
- does **not** use `guessEmail(...)`

Observed contract:

- input:
  - `search({ engine: 'google', q: \`top emerging trends in ${baseIndustry} 2026\`, num: 5 })`
- output usage:
  - maps `searchData.data?.organic_results` into a newline-joined context string
  - then feeds that string into `llmService.generateText(...)`
- no leads-specific behavior is used

Boundary impact:

- migration would reduce one growth -> leads dependency
- but this caller sits on the growth + LLM seam and changes are less mechanically reviewable than the agents adapter case
- behavior is still likely 1:1, but downstream effect is less direct because search output feeds prompt construction

Conclusion:

- migration to `src/backend/dataSources/serpApiSearchService.ts` would also be 1:1 at the import boundary
- but the effective blast radius is slightly larger because it feeds LLM-driven business output

## Candidate Comparison

### A. Migrate `dataSourceToolAdapters.ts` next

Selected.

Assessment:

- risk: low
- reviewability: high
- boundary impact: strong, because it removes an agents -> leads shim dependency
- scope control: single file, no multi-domain churn

### B. Migrate `nicheDiscovery.ts` next

Not selected.

Assessment:

- risk: low-to-medium
- reviewability: medium
- boundary impact: also useful, but sits on a growth + LLM seam
- scope control: still single caller, but less deterministic than the agents adapter path

### C. Defer both

Rejected.

Reason:

- no unclear behavior blocker was found
- at least one safe single-caller migration is ready now

## Selected Decision

Decision:

- `agents caller migration next`

Selected file:

- `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

## Scope Guard

Not changed in this phase:

- no caller migration executed
- no deletion
- no leads provider migration
- no growth migration
- no agents redesign
- no `guessEmail(...)` extraction
- no multi-domain migration
