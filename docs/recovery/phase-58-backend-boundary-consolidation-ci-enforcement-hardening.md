# Phase 58 - Backend Boundary Consolidation / CI Enforcement Hardening

## Goal

Make `scripts/check-backend-boundaries.mjs` easier to maintain without weakening the
existing boundary enforcement behavior.

This phase does **not** redesign backend domains. It only consolidates the rule script
and documents the current boundary map.

## Audit Findings

The existing script was functionally correct, but had grown incrementally through many
recovery phases.

Main maintainability issues before this phase:

- repeated inline import-walking logic
- allowlists defined inside loops instead of at script scope
- duplicate-risk roots listed ad hoc at the execution site
- rule intent documented mostly through historical diagnostics, not through one canonical
  boundary map document

The current rule surface already included:

- route/controller boundaries
- expo import protection
- distribution/platform/agents/revenue/billing rules
- billing event boundary rules
- billing usage/quota boundary rules
- duplicate risk scanning

## Consolidation Changes

The script remains a single file to avoid unnecessary split risk, but was made more
declarative:

- added `isTestFile(...)` helper
- added `getResolvedRelativeImports(...)` helper
- moved controller application-service allowlist to top-level rule definition
- moved agent tool adapter rules to top-level rule definition
- moved duplicate-risk roots to one top-level list
- added `collectDuplicateWarnings()` helper

This keeps behavior the same while reducing copy-paste rule logic.

## Output / CI Behavior

No hard-fail rule was removed.

No warning was promoted to hard-fail in this phase.

The script still reports:

- route files scanned
- controller/expo/distribution/platform/agents files scanned
- domain duplicate warnings
- agents cross-domain warnings
- billing boundary warnings
- violations
- final PASS/FAIL status

## Boundary Map Documentation

Added:

- `docs/recovery/backend-boundary-map.md`

This document now gives a stable reviewer-facing summary of:

- canonical controller boundaries
- agents/revenue/billing service boundaries
- event-driven billing boundaries
- prospecting restrictions
- duplicate discipline
- how to run the checks in CI/review

## What This Phase Did Not Change

- no domain code was changed
- no boundary policy was relaxed
- no event/payment/pricing logic was changed
- no new compatibility layers were introduced

## Recommended Follow-Up

If the rule surface grows further, the next safe improvement would be:

- extracting only rule-definition tables to a sibling module

not building a custom linter framework.
