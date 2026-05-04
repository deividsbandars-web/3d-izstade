# Phase 122: Recovery Wave Closure And Web3D Exhibition Pivot

## Summary

Phase 122 closed the backend cleanup wave and selected the next product-focused audit target:

- `WEB3D SCENE AND INTERACTIVE SURFACE AUDIT`

This phase did not perform backend implementation, deletion, or Web3D redesign. It confirmed the cleanup wave remains stable and shifted the next work wave toward visible Web3D exhibition value.

## Backend Wave Closure Status

Confirmed absent from source tree:

- `src/backend/marketplace/agents/agentRegistry.js`
- `src/backend/marketplace/installService.js`
- `src/backend/dataSources/websiteScraper.js`
- `src/backend/leads/sources/serpApiHelper.js`
- `src/backend/leads/sources/serpApiHelper.ts`

Confirmed canonical files exist:

- `src/backend/marketplace/agents/agentRegistry.ts`
- `src/backend/marketplace/installService.ts`
- `src/backend/dataSources/websiteScraper.ts`
- `src/backend/dataSources/serpApiSearchService.ts`

Backend baseline remains:

- `domain duplicate warnings: 0`
- `leads duplicate warnings: 0`
- `billing boundary warnings: 0`
- `violations: 0`

## Regression Check

Regression-only review remained stable across:

- agents cleanup
- revenue cleanup
- billing cleanup
- leads cleanup
- SerpAPI helper retirement
- websiteScraper duplicate burn-down
- marketplace installService duplicate burn-down
- marketplace agentRegistry duplicate burn-down

No critical backend drift signal was found. That is the reason Phase 122 does not select another backend duplicate target.

## Web3D Source Discovery

Primary frontend Web3D scene entrypoints:

- `src/App.tsx`
- `src/modules/expo/Expo3D.tsx`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/world/ExpoWorldScene.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`

Primary scene data and fallback flow:

- `src/modules/expo/runtime/data/sceneDataSource.ts`
- `src/modules/expo/runtime/data/sceneFallbacks.ts`
- `src/modules/expo/runtime/data/sceneContract.ts`
- `src/modules/expo/types/scene.ts`
- `src/backend/expo/scenes/expoSceneService.ts`
- `backend-server/controllers/expoController.ts`

Primary world planning and layout files:

- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`
- `src/modules/expo/runtime/planning/zones/arrival/index.ts`
- `src/modules/expo/runtime/planning/zones/center-spine/index.ts`
- `src/modules/expo/runtime/planning/zones/left-district/index.ts`
- `src/modules/expo/runtime/planning/zones/right-district/index.ts`
- `src/modules/expo/runtime/planning/zones/tower-cluster/index.ts`
- `src/modules/expo/runtime/planning/zones/rear-campus/index.ts`

Primary expo backend support services:

- `src/backend/expo/sceneBuilder.ts`
- `src/backend/expo/boothGenerator.ts`
- `src/backend/expo/booths/boothService.ts`
- `src/backend/expo/city/cityMapService.ts`
- `src/backend/expo/review/expoReviewService.ts`
- `src/backend/expo/streaming/pixelStreamingBrokerService.ts`

## Scene / Booth / Screen Inventory

Booth runtime layer:

- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/OpenBoothPavilion.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/booths/BoothPresentationBinding.ts`
- `src/modules/expo/runtime/booths/BoothTierShells.tsx`
- `src/modules/expo/runtime/booths/BoothColliderGroup.tsx`
- `src/modules/expo/runtime/booths/BoothInteractions.ts`

Screen planning and assignment layer:

- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts`
- `src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenSockets.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`

Important signals:

- World planning already distinguishes `screenSurfaces`, `screenSockets`, and `screenAssignments`.
- Zone rules already include `allowedScreenFamilies`, `densityCaps`, `placementClasses`, and `viewerFacing`.
- The scene has more than one spatial layer:
  - arrival
  - left district
  - center spine
  - right district
  - tower cluster
  - rear campus

Current product risk is not "no 3D scene exists". The risk is whether the authored scene surfaces actually produce correct booth frontality, screen orientation, and usable player-facing interaction routes.

## 2D Stand Inventory

Confirmed 2D or 2D-like presentation surfaces inside 3D flow:

- `src/pages/expo/BoothRoom.tsx`
  - dedicated sponsor booth room with screen surfaces and lead form
- `src/pages/expo/BoothStreamRoom.tsx`
  - streaming room surface for premium booths
- `src/modules/expo/lib/sponsorScreenLayout.ts`
  - 2D screen nodes with explicit `position`, `rotation`, `size`, `kind`, `placementTier`

Gap found:

- no clear dedicated `2D stand registry` file was identified for city-placed stand surfaces separate from sponsor screens
- no proof yet that all booth facades and stand-like panels are validated against player approach direction
- no proof yet that 2D stand surfaces are checked for collision, overlap, or wall-sticking beyond current placement heuristics

## Calculator Inventory And Render-Risk Notes

Known calculator routes exist in `src/App.tsx`:

- `/calculators`
- `/roof-cost-calculator`
- `/heating-cost-calculator`
- `/foundation-cost-calculator`
- `/renovation-cost-calculator`

Known calculator modules:

- `src/modules/calculators/RoofCalc`
- `src/modules/calculators/HeatingCalc`
- `src/modules/calculators/FoundationCalc`
- `src/modules/calculators/InteriorCalc`
- `src/modules/calculators/CalculatorsHub`

Known expo-adjacent references:

- `src/modules/expo/Marketplace.tsx` links to `/calculators`
- `src/components/chat/GlobalChat.tsx` tells users to go to `CALCULATORS`

Render-risk finding:

- no direct evidence was found that calculators are mounted as in-scene interactive surfaces inside the Web3D city
- current evidence points to route-level calculators, not city-bound calculator booths
- likely failure classes for "calculators do not appear" are:
  - no scene registry binding
  - no booth/screen assignment for calculator surfaces
  - route exists but no world object links into it
  - interaction exists in UI copy only, not in 3D surface placement

Fallback state:

- route-level calculators exist
- no clear in-scene calculator fallback or placeholder surface was identified in the world runtime audit

## Interactive AI Stand Inventory

Confirmed AI-related surfaces:

- `src/components/chat/GlobalChat.tsx`
- `backend-server/controllers/aiController.ts`
- `src/pages/AiPlatformPrototype.tsx`

Confirmed expo interaction surfaces:

- `src/modules/expo/runtime/booths/BoothInteractions.ts`
- `src/pages/expo/BoothRoom.tsx`
- `backend-server/controllers/expoLeadController.ts`
- pixel streaming entry:
  - `src/modules/expo/services/pixelStreamingConfig.ts`
  - `src/modules/expo/hooks/usePixelStreamingStatus.ts`
  - `src/pages/expo/BoothStreamRoom.tsx`

Gap found:

- no explicit `ai stand` component or config was found in `src/modules/expo/runtime/**`
- no proof yet that AI chat/support is attached to a physical booth or city anchor
- current AI/chat surface looks global UI-driven, not city-object-driven
- no dedicated loading/error/empty fallback for an in-world AI stand was identified because the stand itself is not yet clearly present

## Current Web3D Risk Map

Low-risk confirmed foundations:

- there is a real 3D scene runtime
- there is a real world planning layer
- there are booth, screen, and streaming support systems
- expo scene tests already validate backend scene contract basics

Medium-risk product gaps:

- booth frontality and screen facing are not yet proven end-to-end
- 2D stand placement in the city is not yet clearly inventoried as a first-class surface set
- calculator access appears route-level, not clearly city-bound
- AI support exists, but not clearly as a visible in-city booth

High-value unanswered questions for Phase 123:

- which runtime files actually place visible booths, screens, and interaction hotspots
- where calculator surfaces should exist and why they do not appear there now
- whether scene validation currently checks orientation, collision, and visibility
- whether AI interaction is attached to any physical city node

## Selected Decision

Selected next phase target:

- `WEB3D SCENE AND INTERACTIVE SURFACE AUDIT`

## Selection Rationale

This is the correct pivot because:

- backend cleanup wave is already stable
- there is no critical backend duplicate drift requiring continuation
- the next visible product value is in the Web3D city experience
- current gaps are proof and inventory gaps, not yet redesign candidates
- Phase 123 should audit scene composition and interaction surfaces before any layout rebuild

## Files Likely Affected Next Phase

Likely audit targets for Phase 123:

- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/app/ExpoSceneShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/booths/**`
- `src/modules/expo/runtime/planning/screens/**`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`
- `src/components/chat/GlobalChat.tsx`
- `backend-server/controllers/expoController.ts`
- `backend-server/routes/__tests__/expoScene.test.ts`
- `backend-server/routes/__tests__/expoScene.controller.test.ts`

## Files Explicitly Out Of Scope Next Phase

Still out of scope unless Phase 123 proof forces it:

- backend duplicate cleanup continuation
- events infra cleanup
- AI/governance duplicate cleanup
- logger cleanup
- broad Web3D layout redesign
- calculator implementation rewrite
- AI stand implementation
- broad boundary checker rewrite

## Next-Cycle Recommendation

Phase 123 should be:

- `WEB3D SCENE AND INTERACTIVE SURFACE AUDIT`

Phase 123 scope should include:

- scene file inventory
- booth / screen / 2D stand inventory
- calculator render failure audit
- AI stand audit
- interaction / connect surface audit
- scene validation gap audit

Phase 123 should not redesign the city before proof is complete.
