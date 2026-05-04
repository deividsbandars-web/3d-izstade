## Phase 133 Diagnostics

Selected decision:
- screen orientation diagnostic next

Screen layout/orientation evidence:
- `src/modules/expo/lib/sponsorScreenLayout.ts`
  - facade, medium, and ground screens carry explicit `position`, `rotation`, `size`, `placementTier`
  - rotations are mostly hardcoded or derived from side-of-city heuristics
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
  - screen surfaces are enriched with render intent and preserved `rotation`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
  - sockets inherit surface sections/render intent but do not validate yaw against zone intent
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
  - runtime renders surfaces with `position` and `rotation` as-is

Booth frontality evidence:
- `src/shared/expo/lib/boulevardLayout.ts`
  - curated slot bank authors booth yaw with `rotationY`
  - left/right booth families consistently use `Math.PI / 2` vs `-Math.PI / 2`
  - placement validation currently checks lane envelope and blocked pockets, not facing correctness
- `src/shared/expo/layoutEngine.ts`
  - carries node `rotation` into `ExpoBoothPlacement`
- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
  - applies `placement.rotation` directly
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
  - feature panels inherit booth transform; no separate frontality check exists

Existing validation seam inventory:
- `src/modules/expo/runtime/data/sceneDataSource.ts`
  - dev-only logging of booth placement rejection diagnostics
- `src/modules/expo/lib/districtLandmarkPlan.ts`
  - validates corridor intrusion and landmark-to-booth spacing
- `src/modules/expo/runtime/planning/zones/shared.ts`
  - defines planning `viewerFacing` metadata only
- `backend-server/routes/__tests__/expoScene.test.ts`
  - contract shape only
- `backend-server/routes/__tests__/expoScene.controller.test.ts`
  - controller shaping only

Candidate Phase 134 slices:
1. Screen orientation diagnostic helper only
   - likely files:
     - `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
     - one small pure helper/test near planning screens
   - risk: low/medium
   - value: high
   - seam: one

2. Booth frontality diagnostic helper only
   - likely files:
     - `src/shared/expo/lib/boulevardLayout.ts`
     - one small pure helper/test near shared expo layout
   - risk: low
   - value: medium
   - seam: one

3. Combined orientation validator
   - likely files:
     - shared layout + planning screen helpers + tests
   - risk: medium
   - value: high
   - seam: broader than needed

Selected next target rationale:
- Screen orientation is the smallest missing safety check with the best visible quality payoff.
- Booth yaw is already authored more deterministically than screen yaw.

