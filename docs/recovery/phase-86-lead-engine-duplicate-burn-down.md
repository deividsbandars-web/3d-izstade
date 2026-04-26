# Phase 86: Lead Engine Duplicate Burn-Down

Status: PASS

## Summary

- Deleted `src/backend/leads/engine/leadEngine.js`
- Kept `src/backend/leads/engine/leadEngine.ts` as the authoritative implementation
- Preserved existing `leadEngine` behavior and import style

## leadEngine Duplicate Audit Findings

Before deletion, the duplicate pair was:

- `src/backend/leads/engine/leadEngine.ts`
- `src/backend/leads/engine/leadEngine.js`

Audited direct callers of the `.js` source file:

- `src/backend/leads/leadsApplicationService.ts`
- `src/backend/agents/tools/adapters/leadToolAdapters.ts`
- `src/agents/leadAgent.ts`

Additional audit findings:

- no `package.json` script directly targeted `leadEngine.js`
- no `backend-server/package.json` script directly targeted `leadEngine.js`
- no worker entry path directly targeted `leadEngine.js`
- no dynamic import directly targeted `leadEngine.js`
- `leadEngine.ts` remained the authoritative implementation

## Deletion Decision

Deleted:

- `src/backend/leads/engine/leadEngine.js`

Kept:

- `src/backend/leads/engine/leadEngine.ts`

No import rewrites were required.

## Runtime Safety Proof

Validation after deletion:

- `npm.cmd run check:expo-boundaries` passed
- `npm.cmd run check:backend-boundaries` passed
- `npx.cmd tsc -b` passed
- `npm.cmd --prefix backend-server run build` passed
- `npm.cmd run build` passed outside sandbox after known sandbox `spawn EPERM`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts` passed outside sandbox after known sandbox `spawn EPERM`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts` passed outside sandbox after known sandbox `spawn EPERM`

Boundary summary after deletion:

- stabilized domain duplicate warnings: `0`
- leads duplicate warnings: `1`
- billing boundary warnings: `0`
- violations: `0`

This reduced leads duplicate warnings from `2 -> 1`.

## Scope Guard

Not changed in this phase:

- `leadEngine` behavior
- import style for TS ESM `.js` specifiers
- `serpApiHelper`
- agents, growth, or dataSources boundaries
