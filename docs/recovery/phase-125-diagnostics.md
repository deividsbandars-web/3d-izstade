# Phase 125 Diagnostics

## Purpose

Capture the narrow implementation evidence for exposing calculators from booth/city CTA surfaces without rewriting calculator UIs.

## Source Changes

Primary source changes:

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

## Implementation Notes

### CTA Model

Added:

- `SponsorCtaKind = 'calculators'`
- `CALCULATORS_ROUTE = '/calculators'`

`buildSponsorCtas(...)` now includes a calculator CTA before the demo room CTA.

### Intent Resolution

`resolveSponsorCtaIntent(...)` now resolves:

- `calculators` -> `{ type: 'navigate', target: '/calculators' }`

### Booth Action Handling

`handleBoothAction(...)` now distinguishes:

- `demo_room` navigation -> showroom/open room flow
- `calculators` navigation -> direct `navigate('/calculators')`

This avoids incorrectly routing calculator actions through demo-room logic.

### CTA Strip Layout

`SponsorCtaStrip(...)` now adapts spacing and button width based on action count.

Reason:

- calculator CTA can raise booth actions from 3 to 4
- fixed old spacing would push controls outside the strip

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

## Remaining Follow-Up

Most likely next narrow seam:

- calculator route bridge recovery

Reason:

- city access is now present
- several calculator paths advertised by `CalculatorsHub.tsx` still do not exist in `App.tsx`
