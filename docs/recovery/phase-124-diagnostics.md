# Phase 124 Diagnostics

## Purpose

Document the audit evidence for calculator inventory, route bridge status, and Web3D city binding gaps before any implementation phase.

## Commands Run

Core validation:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Audit discovery:

- calculator file inventory under `src/modules/calculators/**`
- route/path search for calculator names and `/calculators`
- expo/runtime searches for `action`, `surface`, `screenAssignments`, `screenSockets`, `screenSurfaces`, `billboard`, `panel`, `open`, `interact`

## Key Evidence

### Calculator Inventory

Confirmed calculator files:

- `AutoserviceCalc.tsx`
- `CalculatorsHub.tsx`
- `CleaningCalc.tsx`
- `DesignerCalc.tsx`
- `DigitalArtCalc.tsx`
- `FoundationCalc.tsx`
- `HeatingCalc.tsx`
- `HousingCalc.tsx`
- `InteriorCalc.tsx`
- `LogisticsCalc.tsx`
- `PlumbingCalc.tsx`
- `QuickFixCalc.tsx`
- `RoofCalc.tsx`
- `TimberHouseCalc.tsx`
- `VisualsCalc.tsx`
- `WindowsCalc.tsx`

### Route Reality

Confirmed route registrations in `src/App.tsx`:

- `/calculators`
- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`

Confirmed hub-advertised paths in `CalculatorsHub.tsx` that exceed the above route set:

- `/timber-house-calculator`
- `/windows-calculator`
- `/visuals-calculator`
- `/digital-art-calculator`
- `/autoservice-calculator`
- `/cleaning-calculator`
- `/quick-fix-calculator`
- `/plumbing-calculator`

### Web3D Binding Gap

Confirmed:

- `Marketplace.tsx` links to `/calculators`
- `GlobalChat.tsx` points users toward calculators
- `BoothInteractions.ts` does not expose calculator action intents
- `sponsorBoothPresentation.ts` only supports `website`, `booking`, `demo_room`
- `worldContract.ts` contains no calculator scene-node metadata

### Failure Classification

Primary:

- missing route bridge
- missing scene binding

Secondary or unsupported by evidence:

- import/build failure
- lazy-load failure
- asset failure

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

## Decision

Selected next target:

- `CALCULATOR CITY ACTION BINDING`
