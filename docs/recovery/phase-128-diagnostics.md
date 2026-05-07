# Phase 128 Diagnostics

## Purpose

Capture the first visible in-world calculator surface implementation using the existing booth feature seam.

## Source Change

Changed source file:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

## Implementation Notes

### New Visible Surface

Added a new feature panel component:

- `BoothCalculatorFeature`

Panel behavior:

- renders only when a valid `calculators` CTA action is present
- visually sits under the existing booth CTA strip
- exposes a clear estimation/calculator identity block
- uses the existing CTA action object and existing booth action handler

### Reused Action Model

No new route contract was introduced.

Reused:

- `SponsorCta.kind === 'calculators'`
- existing route target `/calculators`
- existing `onAction(action)` path from booth UI
- existing booth action dispatcher in `BoothInteractions.ts`

### No Broader Scene Changes

Not introduced:

- new world nodes
- new layout planning
- screen assignment interaction
- standalone stand registry

## Validation Outcome

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

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

- `CALCULATOR BOOTH FEATURE SURFACE STABILIZATION AND NEXT WEB3D TARGET SELECTION`
