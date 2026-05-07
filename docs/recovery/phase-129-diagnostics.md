# Phase 129 Diagnostics

## Purpose

Stabilize the newly added calculator booth feature surface and choose the single next Web3D audit target.

## Stabilization Outcome

Confirmed:

- `BoothCalculatorFeature` remains present in `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- calculator booth surface still derives from shared `ctaActions`
- calculator booth surface still renders as visible content below the CTA strip
- calculator route intent remains `/calculators`
- `demo_room` behavior remains separated in `BoothInteractions.ts`
- `src/App.tsx` still registers `/calculators`
- hub-advertised calculator routes remain registered

## No Regression Found

No evidence was found of:

- calculator UI rewrites
- calculator formula changes
- standalone city placement system introduction
- calculator stand registry introduction
- `worldContract` redesign
- broad layout redesign

## Candidate Decision

Compared targets:

- `AI IN-WORLD STAND REVIEW`
- `2D STAND PLACEMENT REVIEW`
- `CALCULATOR STAND REGISTRY REVIEW`
- `BOOTH / SCREEN ORIENTATION VALIDATION REVIEW`

Selected:

- `AI IN-WORLD STAND REVIEW`

Reason:

- best visible product value
- narrowest next audit seam with an existing product entrypoint (`GlobalChat.tsx`)
- lower redesign risk than 2D placement or orientation validation as the immediate next checkpoint

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
