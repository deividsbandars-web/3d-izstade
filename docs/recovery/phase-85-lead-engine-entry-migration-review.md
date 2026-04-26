# Phase 85: Lead Engine Entry Migration Review

Status: PASS

## Summary

This phase audited how `leadEngine` is imported and executed so that:

- `src/backend/leads/engine/leadEngine.js`

can be evaluated for later removal without accidental runtime breakage.

No files were deleted in this phase.

Decision:

- `C. Keep as-is`

The current `.js` import specifier form is already the correct ESM/bundler-mode import shape for the TypeScript callers. A caller migration to `.ts` paths or a compatibility barrel would add churn without solving a real boundary problem.

## `leadEngine` Entry Caller Audit

### `src/backend/leads/leadsApplicationService.ts`

Current import:

- `./engine/leadEngine.js`

Usage:

- `generateLeads(...) -> leadEngine.processAndStoreLeads(...)`

Assessment:

- caller-facing leads application boundary
- not a compatibility hack; this is a normal ESM-style `.js` specifier from a TypeScript file
- no evidence that this caller needs a different import shape

### `src/backend/agents/tools/adapters/leadToolAdapters.ts`

Current import:

- `../../../leads/engine/leadEngine.js`

Usage:

- `findLeads(...) -> leadEngine.processAndStoreLeads(...)`

Assessment:

- agents-side adapter caller
- also a normal bundler-mode TS import using `.js` specifier
- no extra compatibility layer appears necessary here

### `src/agents/leadAgent.ts`

Current import:

- `../backend/leads/engine/leadEngine.js`

Usage:

- `LeadAgent.executeTask(...) -> leadEngine.processAndStoreLeads(...)`

Assessment:

- runtime-sensitive agent execution path
- still a TypeScript source caller using the same ESM import convention
- this is the most runtime-sensitive caller, but not evidence that a new barrel or `.ts`-path migration is needed

## Module Resolution Findings

Relevant compiler settings confirm why the current imports look this way:

- root app config uses `moduleResolution: "bundler"`
- root app config allows TS extension imports but does not require them
- backend-server config also uses `moduleResolution: "bundler"`

This means:

- `.js` specifiers inside `.ts` source are an intended ESM-compatible pattern in this repo
- a migration from `.js` imports to `.ts` imports would not be a boundary improvement by itself
- a compatibility barrel would likely be redundant

## Migration Option Comparison

### A. Caller import migration

Pros:

- would create visible code movement

Cons:

- moving callers from `.js` to `.ts` paths is not technically justified by current compiler/runtime setup
- adds churn without reducing coupling

### B. Compatibility barrel

Pros:

- could provide a nominal stable entry file

Cons:

- introduces another layer without solving the actual duplicate/runtime question
- current callers already have a stable entry path

### C. Keep as-is

Pros:

- aligns with current ESM/bundler configuration
- avoids artificial import churn
- keeps focus on proof-based deletion decisions rather than cosmetic refactors

Cons:

- does not itself remove the final `leadEngine.js` duplicate risk

## Selected Decision

Selected decision:

- `C. Keep as-is`

## Selection Rationale

The key point is that the current `*.ts` callers importing `leadEngine.js` are already using the repo’s normal ESM-style import convention.

So:

- a caller import migration is not the right preparation slice
- a compatibility barrel would be redundant
- the next decision on `leadEngine.js` should be based on deletion proof, not import-style churn

## Recommended Next Step

Recommended next phase:

- `LEAD ENGINE DUPLICATE BURN-DOWN REVIEW`

That next audit should focus directly on whether `leadEngine.js` can be removed with proof, rather than first introducing unnecessary import indirection.
