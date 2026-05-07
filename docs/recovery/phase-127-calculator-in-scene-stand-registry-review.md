# Phase 127 - Calculator In-Scene Stand Registry Review

## Summary

Phase 127 was an audit-only phase focused on how calculators should gain visible physical presence inside the Web3D city without rewriting calculator UIs or redesigning the city.

Main conclusion:

- current calculator access works from booth CTA to `/calculators`
- current calculator route bridge works from `CalculatorsHub.tsx` to `App.tsx`
- the best active runtime seam for first physical calculator presence is **booth feature surface**, not screen assignment and not wayfinding
- a full city-level calculator stand registry is not yet the best first implementation seam unless it is paired with one existing active host

Selected next target:

- `CALCULATOR BOOTH FEATURE SURFACE FIRST SLICE`

## Current Calculator Access Confirmation

Confirmed:

- `src/modules/expo/lib/sponsorBoothPresentation.ts` still exposes `calculators` CTA
- `calculators` CTA still resolves to `/calculators`
- `src/modules/expo/runtime/booths/BoothInteractions.ts` still routes calculator CTA through normal route navigation
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx` still renders the booth CTA strip in-world
- `src/modules/calculators/CalculatorsHub.tsx` still advertises 12 calculator cards
- all 12 advertised calculator paths are now registered in `src/App.tsx`

Confirmed no calculator rewrite:

- calculator components remain route-level pages
- formulas and calculator internals were not changed
- city access is route-based, not embedded-surface based

## Existing In-Scene Host Seam Audit

Inspected active runtime seams:

- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/OpenBoothPavilion.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/shared/expo/worldContract.ts`

### Host Seam Findings

`Booth feature surface`

- active in runtime today
- already rendered physically in 3D booths
- already clickable through CTA/action plumbing
- already route-aware
- lowest blast radius

`Sponsor screen assignment`

- active visually
- not route-interactive
- designed around sponsor media assignment
- would require adding a new interaction story on top of a display-oriented system

`Wayfinding`

- active visually
- not clickable
- best for discoverability, not for first usable calculator surface

`Explicit world node metadata`

- not present today for calculators
- would require broadening `worldContract`
- too early for first implementation slice

Conclusion:

- the best current active host seam is booth feature surface

## Calculator Stand Registry Options

Minimal registry shape evaluated:

- `calculatorId`
- `title`
- `route`
- `category`
- `description`
- optional `icon`
- optional `zoneAssignment`
- optional `hostKind`
- optional `placementHint`

Recommended registry principles:

- route-first, not formula-first
- live close to calculator module ownership
- avoid duplicating calculator metadata separately from hub forever

Best likely home:

- a dedicated calculator catalog/registry module adjacent to `src/modules/calculators/**`

Reason:

- calculator routes and titles already belong to calculator domain
- this avoids putting calculator content ownership into `worldContract`
- the same route metadata could later feed:
  - calculator hub
  - booth feature surface labels
  - physical stand assignments
  - wayfinding labels

Important finding:

- a registry by itself does not create visible city value
- first physical presence still needs an active scene host

## Placement And Visibility Risk Audit

Proof currently available:

- booth placements already have position and rotation
- booth UI surfaces already face the user flow by construction
- booth UI already avoids introducing a new free-floating scene object

Proof not yet available for a new standalone calculator stand:

- dedicated position rules
- dedicated rotation rules
- dedicated size rules
- overlap avoidance against booth geometry
- occlusion checks
- wall-facing avoidance
- separate visibility validation

This is why a brand-new free-standing calculator stand is not the best first slice.

Using booth feature surface first avoids:

- new city placement math
- new collision/occlusion uncertainty
- new world node classes

## Action Binding Audit

Current open behavior options evaluated:

- open `/calculators`
- open a specific calculator route
- open route overlay from scene object
- reuse existing booth CTA action

Best first behavior:

- reuse existing calculator CTA route behavior

Reason:

- already validated in Phase 125
- avoids creating another interaction model
- lets the first physical presence stay visual and route-based

## Candidate Implementation Slices

### A. Calculator Stand Registry Only

Likely files:

- new calculator catalog file near `src/modules/calculators/**`
- `CalculatorsHub.tsx`

Risk:

- low

User-visible value:

- low

Assessment:

- useful groundwork
- not enough on its own

### B. Calculator Stand Registry + One Visible District / Booth Assignment

Likely files:

- new calculator registry module
- booth host file or district host file
- maybe one expo planning/config seam

Risk:

- medium

User-visible value:

- high

Assessment:

- good balance
- but broader than needed if the host seam is not already active

### C. Calculator Screen Assignment

Likely files:

- `sponsorScreenLayout.ts`
- screen assignment planning/runtime files

Risk:

- medium to high

User-visible value:

- medium

Assessment:

- screen system is display-first, not action-first
- not the best first calculator host

### D. Calculator Booth Feature Surface First Slice

Likely files:

- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- possibly a small calculator metadata file

Risk:

- low to medium

User-visible value:

- high

Assessment:

- active runtime seam already exists
- gives visible physical calculator presence
- can reuse route-based action opening
- avoids broad world/layout redesign

### E. Calculator Wayfinding Destination

Likely files:

- `WorldWayfinding.tsx`
- maybe a small metadata file

Risk:

- low

User-visible value:

- medium

Assessment:

- helpful secondary affordance
- not enough for first physical calculator surface

## Selected Decision

- `CALCULATOR BOOTH FEATURE SURFACE FIRST SLICE`

## Selection Rationale

This is the smallest implementation that creates visible in-world calculator presence without opening broad scene redesign.

Why this wins:

- uses an active runtime seam
- keeps calculator opening route-based
- avoids introducing a new standalone placement system too early
- avoids using the sponsor screen system for interaction work it was not built for

Why registry-only was not selected:

- too little visible product value for the next phase

Why screen assignment was not selected:

- current screen runtime is display-oriented and non-clickable

Why free-standing stand registry was not selected first:

- placement, rotation, visibility, and collision proofs are not yet strong enough for the first implementation step

## Files Likely Affected Next Phase

- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- possibly one new calculator metadata file near `src/modules/calculators/**`

## Files Explicitly Out Of Scope Next Phase

- calculator component internals under `src/modules/calculators/**`
- `src/shared/expo/worldContract.ts`
- broad expo planning/world layout files
- sponsor screen assignment system
- AI stand work
- booth/screen orientation pass
- backend duplicate cleanup

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

## Remaining Risks

Remaining risks after this audit:

- there is still no dedicated calculator registry shared across city and hub surfaces
- there is still no standalone stand placement validation
- non-hub calculators like `HousingCalc`, `DesignerCalc`, and `LogisticsCalc` are still outside the current public calculator story

## Next-Cycle Recommendation

Next phase:

- `CALCULATOR BOOTH FEATURE SURFACE FIRST SLICE`

Recommended discipline for Phase 128:

- create one visible in-world calculator surface using the existing booth feature seam
- keep opening behavior route-based to `/calculators` or one proven calculator route
- avoid new free-standing city placement logic until that smaller seam is proven
