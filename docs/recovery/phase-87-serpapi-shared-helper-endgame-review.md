# Phase 87: SerpAPI Shared Helper Endgame Review

Status: PASS

## Summary

- Audited the last remaining leads duplicate risk: `src/backend/leads/sources/serpApiHelper.js`
- Confirmed `src/backend/leads/sources/serpApiHelper.ts` is the authoritative implementation
- Did not delete any files in this phase
- Decision: `needs-preparation`

## serpApiHelper Caller Graph Audit

Direct callers of `src/backend/leads/sources/serpApiHelper.js` / `.ts`:

- leads
  - `src/backend/leads/sources/googleMapsLeadSource.ts`
  - `src/backend/leads/sources/directoryLeadSource.ts`
  - `src/backend/leads/sources/linkedinLeadSource.ts`
- growth
  - `src/backend/growth/nicheDiscovery.ts`
- dataSources
  - `src/backend/dataSources/googleSearchService.ts`
- agents
  - `src/backend/agents/tools/adapters/dataSourceToolAdapters.ts`

Observed usage by caller:

- `googleMapsLeadSource.ts`
  - uses `serpApiHelper.search(...)`
  - uses `serpApiHelper.guessEmail(...)`
  - relies on SerpAPI Google Maps response shape and helper email heuristic
- `directoryLeadSource.ts`
  - uses `serpApiHelper.search(...)`
  - uses `serpApiHelper.guessEmail(...)`
  - relies on Google organic results shape
- `linkedinLeadSource.ts`
  - uses `serpApiHelper.search(...)`
  - relies on Google organic results shape
- `nicheDiscovery.ts`
  - uses `serpApiHelper.search(...)`
  - consumes search results as trend context for LLM analysis
- `googleSearchService.ts`
  - uses `serpApiHelper.search(...)`
  - maps generic organic results into `{ title, url, snippet }`
- `dataSourceToolAdapters.ts`
  - uses `serpApiHelper.search(...)`
  - exposes top organic results to agents tool adapters

No direct worker entry or dynamic import path targeting `serpApiHelper.js` was found.

## Usage Classification

`serpApiHelper` responsibilities:

- pure data fetch helper
  - `search(params)` wraps SerpAPI HTTP access and error handling
- transformation helper
  - `guessEmail(domain)` derives a basic `info@domain` heuristic
- shared infra helper
  - shared by leads, growth, dataSources, and agents

Conclusion:

- `serpApiHelper` is **not** leads-local anymore
- it behaves as shared infrastructure, even though it currently lives under `src/backend/leads/sources/**`

## Runtime Risk Analysis

Audit findings:

- root `package.json` has no script entry targeting `serpApiHelper.js`
- `backend-server/package.json` has no script entry targeting `serpApiHelper.js`
- no worker path targets `serpApiHelper.js`
- no dynamic import targets `serpApiHelper.js`

Important nuance:

- absence of script/worker/dynamic-import entry does **not** make direct deletion safe
- the real risk is the multi-domain caller graph and the fact that the helper still acts as a shared runtime dependency

## Option Comparison

### A. Direct deletion

Not acceptable in the current state.

Why:

- helper is still directly imported across four domains
- deleting the checked-in `.js` source without a preparation seam would be weaker proof than previous low-risk burn-down phases

### B. Staged migration

Recommended.

Narrow next seam:

- introduce a shared SerpAPI boundary review before any deletion
- goal is to define a canonical shared home and caller seam for the helper

### C. No-safe-deletion

Also true at the current moment, but less actionable than a preparation decision.

This phase chooses `needs-preparation` rather than a terminal stop, because the shared-helper seam is concrete enough to review next.

## Decision

Decision: `B) needs-preparation`

Next seam to review:

- `SERPAPI SHARED INFRA BOUNDARY REVIEW`

## Scope Guard

Not changed in this phase:

- no file deletion
- no SerpAPI redesign
- no multi-domain refactor
- no growth/dataSources/agents cleanup
