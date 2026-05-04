# Phase 124 - Calculator In-Scene Surface Recovery Review

## Summary

Phase 124 was an audit-only phase focused on how existing calculators could become visible and usable from the Web3D city without rewriting the calculators themselves.

Main conclusion:

- calculators already exist and build correctly
- many calculator surfaces are still route-only
- the largest visible gap is not import failure
- the dominant failure seams are:
  - missing route bridge for many calculator pages
  - missing city/world action binding for calculator access from Web3D scene

Selected next target:

- `CALCULATOR CITY ACTION BINDING`

## Calculator Inventory

Discovered calculator module files under `src/modules/calculators/**`:

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
- `index.ts`

Route registrations confirmed in `src/App.tsx`:

- `/calculators` -> `CalculatorsHub`
- `/roof-cost-calculator` -> `RoofCalc`
- `/heating-cost-calculator` -> `HeatingCalc`
- `/foundation-cost-calculator` -> `FoundationCalc`
- `/renovation-cost-calculator` -> `InteriorCalc`

Calculator hub advertises a larger set of calculator paths than the app actually registers. Confirmed card paths in `CalculatorsHub.tsx` include:

- `/timber-house-calculator`
- `/windows-calculator`
- `/visuals-calculator`
- `/digital-art-calculator`
- `/autoservice-calculator`
- `/cleaning-calculator`
- `/quick-fix-calculator`
- `/plumbing-calculator`

This creates a route bridge mismatch:

- calculator components exist
- calculator cards exist
- many calculator routes are not registered in `App.tsx`

Component behavior profile:

- `RoofCalc.tsx` and `HeatingCalc.tsx` are stateful full-page surfaces
- calculators use normal page layouts, forms, results blocks, and local state
- no proof was found that they are already designed as small in-scene panels
- no calculator-specific loading boundary was found
- some calculators include empty-state style rendering before results

## Expo / City Entrypoint Audit

Inspected:

- `src/modules/expo/Marketplace.tsx`
- `src/components/chat/GlobalChat.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/shared/expo/worldContract.ts`

Findings:

- calculators are currently linked from page/UI surfaces, not from explicit world objects
- `Marketplace.tsx` links users to `/calculators`
- `GlobalChat.tsx` routes users to a `CALCULATORS` section or route guidance
- no city object was found that opens a calculator directly
- `BoothInteractions.ts` does not support calculator-specific actions
- `worldContract.ts` does not define calculator node metadata or calculator surface metadata

Current state is therefore:

- calculators are reachable as routes
- calculators are not proven as city/world surfaces
- calculators are not bound to booth action intents

## In-Scene Surface Seam Audit

Inspected and searched through:

- `screenSurfaces`
- `screenSockets`
- `screenAssignments`
- `sponsorScreenLayout`
- `placementClass`
- `surface`
- `panel`
- `billboard`
- `action`
- `interact`
- `open`

Relevant files included:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/shared/expo/layoutEngine.ts`
- `src/modules/expo/runtime/world/WorldWayfinding.tsx`

Findings:

- screen planning already exists as a mature seam
- booth CTA rendering already exists
- sponsor CTA intent model is limited to:
  - `website`
  - `booking`
  - `demo_room`
- no calculator CTA kind exists
- no calculator world placement registry exists
- no calculator-specific screen assignment model was found
- no calculator point-of-interest markers were found in wayfinding

Best existing seam for a narrow next slice:

- booth/city action binding

Reason:

- it reuses existing booth CTA/interact plumbing
- it can expose calculator access from city without rewriting calculators
- it is narrower than inventing a full in-scene calculator stand registry first

## Render Failure Classification

User-visible issue "many calculators do not appear" classifies into two main buckets.

### 1. Missing Route Bridge

Evidence:

- `CalculatorsHub.tsx` advertises more calculator pages than `App.tsx` registers
- components exist in `src/modules/calculators/**`
- build output includes calculator chunks

This means a large part of the failure is:

- route exists in UI card list
- matching app route does not exist

### 2. Missing Scene Binding

Evidence:

- no calculator node in world contract
- no calculator action intent in booth interactions
- no calculator screen or stand registry found
- no calculator-specific in-world entrypoint found

This means calculators are currently:

- route-level surfaces
- not in-scene city/world surfaces

Less likely failure classes:

- import/build failure
- lazy-load failure
- asset failure
- camera/layer visibility as primary root cause

## Candidate Implementation Slices

### Candidate 1: Calculator City Action Binding

Likely files:

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- possibly selected expo/marketplace config files

Risk:

- low to medium

User-visible value:

- calculators become reachable from actual Web3D city interaction surfaces

Seam quality:

- one existing interaction seam
- avoids broad redesign

### Candidate 2: Calculator Route Bridge Recovery

Likely files:

- `src/App.tsx`
- `src/modules/calculators/CalculatorsHub.tsx`
- possibly `src/modules/calculators/index.ts`

Risk:

- low

User-visible value:

- more calculator links stop failing

Seam quality:

- very narrow
- but not enough by itself to make calculators in-scene

### Candidate 3: Calculator In-Scene Stand Registry

Likely files:

- `src/shared/expo/worldContract.ts`
- world planning files
- scene layer files
- booth/screen placement files

Risk:

- medium to high

User-visible value:

- strongest scene-native result

Seam quality:

- broader than needed for first recovery slice

## Selected Decision

- `calculator city action binding next`

## Selection Rationale

This is the smallest slice that directly serves the Web3D city goal.

Why it wins over the other candidates:

- it makes calculators reachable from in-world interaction points
- it reuses existing booth interaction infrastructure
- it does not require a calculator rewrite
- it avoids opening a broader scene registry redesign too early

Why route bridge recovery alone was not selected:

- it fixes discoverability and broken route availability
- but it still leaves calculators outside the city/world interaction model

Why stand registry was not selected yet:

- it is a larger architectural step
- there is not yet proof that a dedicated calculator object registry is needed before validating action binding

## Files Likely Affected Next Phase

- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/Marketplace.tsx`
- `src/components/chat/GlobalChat.tsx`
- possibly `src/App.tsx` as a secondary route-bridge follow-up if action binding reveals missing route targets

## Files Explicitly Out Of Scope Next Phase

- calculator UI rewrites under `src/modules/calculators/**`
- broad Web3D layout redesign
- AI stand implementation
- booth/screen orientation rewrite
- backend duplicate cleanup
- broad validation suite rewrite

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

Current baseline remains:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## Next-Cycle Recommendation

Next phase:

- `CALCULATOR CITY ACTION BINDING`

Phase 125 should stay narrow:

- prove the smallest booth/city interaction seam that can open calculators from Web3D city
- do not rewrite calculators
- do not redesign the whole scene
- treat route-bridge recovery as a secondary follow-up unless action binding immediately depends on missing routes
