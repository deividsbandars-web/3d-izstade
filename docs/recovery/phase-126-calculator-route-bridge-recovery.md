# Phase 126 - Calculator Route Bridge Recovery

## Summary

Phase 126 aligned the calculator hub route cards with actual application route registrations.

Result:

- calculator cards advertised in `CalculatorsHub.tsx` now point to registered routes in `App.tsx`
- the recovery stayed route-only
- no calculator UI or formula logic was changed
- Web3D calculator CTA from Phase 125 still points to `/calculators`

## Route Bridge Audit

Advertised calculator paths in `src/modules/calculators/CalculatorsHub.tsx`:

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

Routes already present before this phase:

- `/calculators`
- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`

Missing but backed by existing components:

- `/timber-house-calculator`
- `/windows-calculator`
- `/visuals-calculator`
- `/digital-art-calculator`
- `/autoservice-calculator`
- `/cleaning-calculator`
- `/quick-fix-calculator`
- `/plumbing-calculator`

Confirmed existing components for those routes:

- `TimberHouseCalc.tsx`
- `WindowsCalc.tsx`
- `VisualsCalc.tsx`
- `DigitalArtCalc.tsx`
- `AutoserviceCalc.tsx`
- `CleaningCalc.tsx`
- `QuickFixCalc.tsx`
- `PlumbingCalc.tsx`

## Implementation Change

Changed only `src/App.tsx`.

Added lazy imports and route registrations for existing calculator components:

- `TimberHouseCalculator`
- `WindowsCalculator`
- `VisualsCalculator`
- `DigitalArtCalculator`
- `AutoserviceCalculator`
- `CleaningCalculator`
- `QuickFixCalculator`
- `PlumbingCalculator`

No changes were made to:

- calculator component internals
- calculator formulas
- calculator layouts
- expo booth CTA logic

## Calculator Routes Now Reachable

Reachable through `/calculators` hub after this phase:

- `RoofCalc`
- `HeatingCalc`
- `FoundationCalc`
- `InteriorCalc`
- `TimberHouseCalc`
- `WindowsCalc`
- `VisualsCalc`
- `DigitalArtCalc`
- `AutoserviceCalc`
- `CleaningCalc`
- `QuickFixCalc`
- `PlumbingCalc`

## Calculator Routes Deferred With Blockers

No advertised hub path required defer in this phase.

Not added because they are not advertised by `CalculatorsHub.tsx` and were outside this route bridge scope:

- `HousingCalc.tsx`
- `DesignerCalc.tsx`
- `LogisticsCalc.tsx`

These are not blockers for the current hub route alignment task.

## Files Changed

Changed source:

- `src/App.tsx`

Added phase artifacts:

- `docs/recovery/phase-126-calculator-route-bridge-recovery.md`
- `docs/recovery/phase-126-diagnostics.md`
- `diagnostics/project-analysis-bundle-phase-126.zip`

## Files Explicitly Not Changed

Not changed:

- `src/modules/calculators/CalculatorsHub.tsx`
- `src/modules/calculators/**`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/shared/expo/worldContract.ts`

## Validation Results

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

Backend baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Remaining Calculator Gaps

Still unresolved after this phase:

- calculators are still route-level surfaces, not physical in-scene stands
- there is still no calculator world node metadata
- there is still no in-scene calculator stand registry
- non-hub calculator components like `HousingCalc`, `DesignerCalc`, and `LogisticsCalc` still have no route story, but that was outside this phase scope

## Next-Cycle Recommendation

Next phase:

- `CALCULATOR IN-SCENE STAND REGISTRY REVIEW`

Reason:

- city CTA access now works
- hub route alignment now works for advertised calculator cards
- the next product-value seam is planning how physical calculator surfaces or stands should exist inside the Web3D city
