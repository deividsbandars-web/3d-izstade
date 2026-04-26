# Phase 73 - Leads Scoring Duplicate Burn-Down

## Summary

Phase 73 removed one leads duplicate file:
- `src/backend/leads/leadScoring.js`

The authoritative implementation remains:
- `src/backend/leads/leadScoring.ts`

No scoring algorithm changes were made.

## Scoring Duplicate Audit Findings

Before deletion, the scoring duplicate surface was:
- `src/backend/leads/leadScoring.ts`
- `src/backend/leads/leadScoring.js`

Real code importers for the `.js` specifier were only:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Additional proof gathered before deletion:
- no package script referenced `leadScoring.js`
- no backend worker entry referenced `leadScoring.js`
- no dynamic import path referenced `leadScoring.js`
- no cross-domain callers referenced `leadScoring.js`

Scoring output remains the same:
- numeric score
- clamped `0..100`
- used only through `leadEngine` for persistence and event payload generation

## Deletion Decision

Deleted:
- `src/backend/leads/leadScoring.js`

Kept:
- `src/backend/leads/leadScoring.ts`

No import rewrites were required.

## Runtime Safety Proof

Post-deletion proof:

1. `check:backend-boundaries` passed and leads duplicate warnings dropped from `9` to `8`.
2. `npx tsc -b` passed.
3. `npm --prefix backend-server run build` passed.
4. Full app build passed outside sandbox after the known `spawn EPERM` sandbox restriction was bypassed.
5. Backend `tsx` route tests passed outside sandbox after the same sandbox restriction was bypassed.

This shows the deleted checked-in `.js` file was not required as a separate runtime implementation for the validated project paths.

## Boundary Check Result

Boundary protections remain intact:
- `leadsController -> leadsApplicationService`
- `leadEngine -> supabaseClient` direct import ban
- `leadEngine -> eventPublisher` direct import ban
- `leadEngine -> agentScheduler` direct import ban
- `leadEngine -> source provider direct import` ban
- local `validateLead(...)` ban in `leadEngine`

Current summary after deletion:
- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `8`
- billing boundary warnings: `0`
- violations: `0`
- status: `PASS`

## Validation Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted with `spawn EPERM`:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Leads/scoring-specific automated tests were not found.

## Deferred

- no scoring algorithm redesign
- no leadEngine redesign
- no source provider cleanup
- no event/scheduling cleanup
