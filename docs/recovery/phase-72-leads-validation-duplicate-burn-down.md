# Phase 72 - Leads Validation Duplicate Burn-Down

## Summary

Phase 72 removed one leads duplicate file:
- `src/backend/leads/validation/leadValidationService.js`

The authoritative implementation remains:
- `src/backend/leads/validation/leadValidationService.ts`

This phase stayed intentionally narrow:
- no scoring cleanup
- no event cleanup
- no scheduling cleanup
- no source provider cleanup
- no leadEngine redesign

## Validation Duplicate Audit Findings

Before deletion, the validation duplicate surface looked like this:
- `src/backend/leads/validation/leadValidationService.ts`
- `src/backend/leads/validation/leadValidationService.js`

Real code importers found for the `.js` specifier:
- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Additional runtime-proof checks:
- no package script directly referenced `leadValidationService.js`
- no backend worker entry referenced `leadValidationService.js`
- no dynamic import path referenced `leadValidationService.js`
- no cross-domain callers referenced `leadValidationService.js`

## Deletion Decision

Deleted:
- `src/backend/leads/validation/leadValidationService.js`

Kept:
- `src/backend/leads/validation/leadValidationService.ts`

No import rewriting was required.

## Runtime Safety Proof

Safety proof after deletion:

1. `check:backend-boundaries` passed and leads duplicate warnings dropped from `10` to `9`.
2. `npx tsc -b` passed, proving TypeScript compilation still resolves the validation boundary correctly.
3. `npm --prefix backend-server run build` passed.
4. Full app build passed outside sandbox after the known `spawn EPERM` sandbox restriction was bypassed.
5. Backend `tsx` route tests also passed outside sandbox after the same sandbox restriction was bypassed.

This confirms the removed checked-in `.js` file was not required as a separate runtime implementation for the validated project paths.

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
- leads duplicate warnings: `9`
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

Leads-specific automated tests were not found.

## Deferred

- no scoring cleanup
- no event/scheduling cleanup
- no source provider cleanup
- no broader duplicate burn-down
