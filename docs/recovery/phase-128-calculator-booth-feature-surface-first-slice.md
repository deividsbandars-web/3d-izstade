# Phase 128 - Calculator Booth Feature Surface First Slice

## Summary

Phase 128 added one visible in-world calculator feature surface inside the existing booth feature UI.

Result:

- calculators are now visible not only as CTA strip actions
- booth UI now shows a dedicated calculator feature panel
- opening behavior stays route-based
- calculator UI and formulas remain untouched

## Implementation Change

Changed runtime seam:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added:

- a dedicated `BoothCalculatorFeature` panel component
- panel rendering inside the existing `BoothInfoBand`
- a `calculators` CTA kind and shared `/calculators` route intent
- panel click handling that reuses the existing `calculators` CTA action
- test coverage updates for calculator CTA ordering and intent resolution

The panel:

- appears under the existing booth CTA strip
- shows a visible calculator identity block
- includes a headline and support copy
- includes a direct action button using the existing calculator CTA label

No new world node or stand placement system was introduced.

## Existing Booth Feature Seam Used

The implementation stayed entirely inside the already active booth feature seam:

- `DistrictBooth.tsx` remains the booth runtime host
- `BoothVisualAssembly.tsx` remains the in-world booth UI assembler
- `BoothFeatureContent.tsx` remains the feature surface renderer
- `BoothInteractions.ts` remains the action executor
- `sponsorBoothPresentation.ts` remains the CTA metadata source

Important reuse:

- the calculator panel does not hardcode a second action system
- it reuses the already validated `calculators` CTA intent

## Calculator Surface Behavior

Behavior after this phase:

- booth still shows the CTA strip
- booth now also shows a visible calculator panel as part of feature content
- clicking the panel action opens the same route-backed calculator access flow
- calculator route target remains `/calculators`

The phase intentionally did not:

- open specific per-calculator routes from the booth surface
- embed any calculator form inside the 3D scene
- create a standalone free-standing calculator object

## Visual / Product Value Added

Before this phase:

- calculators were reachable from booth UI, but only via CTA strip action

After this phase:

- calculator access now has visible in-world booth feature presence
- the booth feels like it contains an estimation / pricing capability
- calculator presence is more legible as a product surface, not just a hidden action

This is the first physical-feeling calculator surface in the Web3D booth seam without changing the broader city structure.

## Files Changed

Changed source:

- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`

Added phase artifacts:

- `docs/recovery/phase-128-calculator-booth-feature-surface-first-slice.md`
- `docs/recovery/phase-128-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-128.zip`

## Files Explicitly Not Changed

Not changed:

- `src/modules/calculators/**`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/shared/expo/worldContract.ts`
- broad world planning/layout files

## Out-Of-Scope Confirmation

This phase did not do:

- calculator UI rewrite
- calculator formula changes
- adding new calculator components
- standalone free-standing calculator placement
- in-scene calculator stand registry
- AI stand implementation
- booth/screen orientation pass
- multi-layer city redesign
- backend duplicate cleanup

## Validation Results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox `spawn EPERM`, then rerun outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Remaining Calculator Gaps

Still not done:

- no dedicated calculator stand registry
- no standalone physical calculator object placement
- no calculator world node metadata
- no per-calculator district mapping
- no special wayfinding for calculator-specific destinations

## Next-Cycle Recommendation

Next phase:

- `CALCULATOR BOOTH FEATURE SURFACE STABILIZATION AND NEXT WEB3D TARGET SELECTION`

Reason:

- first visible in-world calculator surface now exists
- next step should confirm stability and then choose whether the next Web3D value seam is:
  - calculator stand registry review
  - AI in-world stand review
  - 2D stand placement review
