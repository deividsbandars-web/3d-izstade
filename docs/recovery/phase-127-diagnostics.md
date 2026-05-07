# Phase 127 Diagnostics

## Purpose

Capture the proof for selecting the next calculator in-scene presence seam after route access recovery.

## Current Access Proof

Confirmed:

- calculator CTA still resolves to `/calculators`
- all calculator paths advertised by `CalculatorsHub.tsx` are now routed in `App.tsx`
- no calculator UI rewrite has happened

## Seam Findings

### Booth Feature Surface

Evidence:

- `DistrictBooth.tsx` is active in runtime
- `BoothVisualAssembly.tsx` renders physical booth feature UI
- `BoothFeatureContent.tsx` already renders clickable CTA surfaces
- `BoothInteractions.ts` already routes CTA actions

Assessment:

- best active host seam for first physical calculator presence

### Sponsor Screen System

Evidence:

- `WorldCityScreenSurfaces.tsx`, `WorldCityScreenSockets.tsx`, and `WorldCityScreenAssignments.tsx` render visual content
- no route click behavior was found there
- sponsor screen planning is media-oriented

Assessment:

- not the best first calculator interaction seam

### Wayfinding

Evidence:

- `WorldWayfinding.tsx` renders district and booth markers
- no click/navigation handling was found

Assessment:

- useful later, but not enough for first calculator stand/surface

### World Contract

Evidence:

- `worldContract.ts` contains no calculator node metadata

Assessment:

- broadening this now would be too early for the next narrow slice

## Decision

Selected next target:

- `CALCULATOR BOOTH FEATURE SURFACE FIRST SLICE`

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
