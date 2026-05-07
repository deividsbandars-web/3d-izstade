# Phase 126 Diagnostics

## Purpose

Capture the route bridge alignment between calculator hub cards and actual app routes.

## Audit Proof

Advertised hub routes from `CalculatorsHub.tsx`:

- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`
- `/timber-house-calculator`
- `/windows-calculator`
- `/visuals-calculator`
- `/digital-art-calculator`
- `/autoservice-calculator`
- `/cleaning-calculator`
- `/quick-fix-calculator`
- `/plumbing-calculator`

Pre-existing registered calculator routes in `App.tsx`:

- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`

Missing routes added in this phase:

- `/timber-house-calculator`
- `/windows-calculator`
- `/visuals-calculator`
- `/digital-art-calculator`
- `/autoservice-calculator`
- `/cleaning-calculator`
- `/quick-fix-calculator`
- `/plumbing-calculator`

## Implementation Scope

Only source file changed for route bridge:

- `src/App.tsx`

Reason this was safe:

- all new targets already had existing default-export calculator components
- no route target required inventing a new UI or alias
- no calculator internals needed modification

## Validation Outcome

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Baseline

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Follow-Up

Recommended next target:

- `CALCULATOR IN-SCENE STAND REGISTRY REVIEW`
