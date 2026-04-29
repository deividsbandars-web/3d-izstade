# Web3D Master Architecture Audit

Date: 2026-04-29
Scope: `src/modules/expo`, `src/shared/expo`, targeted chat/runtime glue, selected route context
Audience: product owner, architecture reviewer, ChatGPT/Codex analysis handoff

## 1. Executive Summary

The Web3D exhibition is no longer a loose 3D scene. It is now a layered system with a fairly clear separation between:

- scene data ingestion
- world contract assembly
- canonical city planning
- runtime rendering
- runtime interaction
- operator/debug inspection
- booth feature actions
- screen diagnostics

The strongest improvements from the recent phases are:

- sponsor screens became a real interaction surface instead of passive decor
- click, cursor affordance, and hover highlight are now gated narrowly and safely
- diagnostics now exist for screen orientation, screen bounds, screen overlap, and booth frontality
- there is already a usable operator/inspection seam for near-target review and focus navigation

The main remaining weakness is not visual quality anymore. It is inspection depth and source-of-truth traceability:

- there is still no complete machine-readable "every world object -> source owner -> change path" registry
- there is still no booth-local footprint seam suitable for cross-family geometry diagnostics
- there is still no agent-grade location review mode that explains every object with exact ownership and fix path

That means the project is commercially more credible than before, but it still needs a stronger inspection and review system to reduce wasted manual review and wrong-direction fixes.

## 2. Architecture From A To Z

### 2.1 Data Ingestion

Primary files:

- [useExpoSceneData.ts](/C:/3d/src/modules/expo/hooks/useExpoSceneData.ts)
- [sceneDataSource.ts](/C:/3d/src/modules/expo/runtime/data/sceneDataSource.ts)
- [sceneFallbacks.ts](/C:/3d/src/modules/expo/runtime/data/sceneFallbacks.ts)
- [sceneContract.ts](/C:/3d/src/modules/expo/runtime/data/sceneContract.ts)
- [types/scene.ts](/C:/3d/src/modules/expo/types/scene.ts)

Responsibility:

- fetch runtime expo scene data
- normalize backend/Supabase/fallback data into one frontend scene shape
- provide a production-safe fallback scene when live data is unavailable

Why it matters:

- every booth, screen, district, and route starts here
- if this layer is wrong, the 3D world is wrong before rendering begins

### 2.2 World Contract

Primary files:

- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts)
- [layoutEngine.ts](/C:/3d/src/shared/expo/layoutEngine.ts)
- [boulevardLayout.ts](/C:/3d/src/shared/expo/lib/boulevardLayout.ts)
- [walkRegion.ts](/C:/3d/src/shared/expo/walkRegion.ts)

Responsibility:

- convert normalized scene data into a world-ready contract
- produce:
  - `boothPlacements`
  - `districtPrograms`
  - `sectorMarkers`
  - `plan`
  - `playBounds`
  - `routeContract`
  - `visualProfile`

Why it matters:

- this is the handoff seam between business data and 3D runtime
- if someone asks "where do booths come from?", this is the answer

Important constraint:

- `ExpoBoothPlacement.layoutFootprint` is currently global boulevard footprint, not booth-local footprint
- this is why booth-local geometry diagnostics are still blocked

### 2.3 Canonical World Planning

Primary files:

- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- [buildScreenSurfacePlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [buildScreenSocketPlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts)
- [buildScreenAssignmentPlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts)
- [runtime planning types](/C:/3d/src/modules/expo/runtime/planning/types/index.ts)
- zone planners under [runtime/planning/zones](/C:/3d/src/modules/expo/runtime/planning/zones)

Responsibility:

- build the canonical city geometry and content plan
- split the city into planning zones
- derive:
  - planes
  - masses
  - towers
  - screen surfaces
  - screen sockets
  - screen assignments

This is the most important "change the city" layer.

If you want to:

- move a city mass
- change district geometry rhythm
- change screen surface generation
- change screen socket ownership
- change assignment density

you usually start here, not in the render components.

### 2.4 Runtime World Rendering

Primary files:

- [Expo3D.tsx](/C:/3d/src/modules/expo/runtime/app/Expo3D.tsx)
- [ExpoSceneShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoSceneShell.tsx)
- [ExpoWorldSceneRoot.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx)
- [ExpoWorldSceneLayers.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx)
- [ExpoWorldPlayerLayer.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx)
- [WorldCitySkeleton.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCitySkeleton.tsx)

Responsibility:

- orchestrate the 3D scene
- wire world contract into runtime layers
- apply mode, controls, section toggles, layer toggles, and player position

This is the scene composition layer.

It should answer:

- what is visible
- what is enabled
- what is loaded
- what mode the user is in

### 2.5 Screen System

Primary files:

- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenSockets.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSockets.tsx)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [sponsorScreenInteractionResolver.ts](/C:/3d/src/modules/expo/lib/sponsorScreenInteractionResolver.ts)

Responsibility split:

- `WorldCityScreenSurfaces.tsx`: display-only shell geometry
- `WorldCityScreenSockets.tsx`: display-only mount/frame geometry
- `WorldCityScreenAssignments.tsx`: content and interactivity layer
- `sponsorScreenInteractionResolver.ts`: route decision seam

This separation is one of the strongest architectural improvements in the Web3D stack.

Current interaction behavior:

- route click only when resolver returns `kind: 'route'`
- pointer cursor only on route-action assignments
- subtle hover highlight only on route-action assignments
- no-action screens remain inert

### 2.6 Booth Runtime

Primary files:

- [DistrictBooth.tsx](/C:/3d/src/modules/expo/runtime/booths/DistrictBooth.tsx)
- [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- [BoothArchitectureKit.tsx](/C:/3d/src/modules/expo/components/BoothArchitectureKit.tsx)
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)

Responsibility split:

- `sponsorBoothPresentation.ts`: booth content/action contract
- `DistrictBooth.tsx`: booth instance wiring and high-level interaction
- `BoothVisualAssembly.tsx`: composition of shell + feature content
- `BoothFeatureContent.tsx`: visible CTA surfaces
- `BoothInteractions.ts`: action dispatch
- `BoothArchitectureKit.tsx`: booth metrics and structural geometry

This is where calculators, AI chat, and 2D showroom actions are surfaced inside booths.

### 2.7 2D Stand / Calculator / AI Action Surfaces

Primary files:

- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- [globalChatEvents.ts](/C:/3d/src/components/chat/globalChatEvents.ts)
- [App.tsx](/C:/3d/src/App.tsx)

Current action model:

- `demo_room` -> booth/showroom route
- `calculators` -> `/calculators`
- `ai_chat` -> local event opening GlobalChat
- `website` / `booking` -> external URLs

This part is already commercially important because it turns a 3D booth into an actual business funnel, not just a visual prop.

### 2.8 Operator / Inspection / Debug

Primary files:

- [worldInspectionState.tsx](/C:/3d/src/modules/expo/runtime/world/inspection/worldInspectionState.tsx)
- [worldInspectionContract.tsx](/C:/3d/src/modules/expo/runtime/world/inspection/worldInspectionContract.tsx)
- [useExpoOperatorLayer.tsx](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx)
- [reviewOperatorSession.ts](/C:/3d/src/modules/expo/runtime/operator/model/reviewOperatorSession.ts)
- [ExpoOperatorOverlay.tsx](/C:/3d/src/modules/expo/runtime/operator/overlay/ExpoOperatorOverlay.tsx)
- [ExpoOperatorInspectionSummary.tsx](/C:/3d/src/modules/expo/runtime/operator/inspection/ExpoOperatorInspectionSummary.tsx)
- [ExpoWorldDebugLayer.tsx](/C:/3d/src/modules/expo/runtime/world/debug/ExpoWorldDebugLayer.tsx)

What already exists:

- operator mode via `?operator=1`
- predefined review zones
- center-screen raycast inspection
- click stack inspection
- target basket highlighting
- nearby object summary
- layer and section toggles

Why this matters:

- the foundation for a Codex/agent review mode already exists
- the project does not need a debug system from zero
- it needs richer metadata and exportability

## 3. Source-Of-Truth Matrix

### Change booth placement

Start in:

- [boulevardLayout.ts](/C:/3d/src/shared/expo/lib/boulevardLayout.ts)
- [layoutEngine.ts](/C:/3d/src/shared/expo/layoutEngine.ts)

Do not start in:

- booth render components

### Change booth geometry or dimensions

Start in:

- [BoothArchitectureKit.tsx](/C:/3d/src/modules/expo/components/BoothArchitectureKit.tsx)
- [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)

### Change booth CTA behavior

Start in:

- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)

### Change sponsor screen visual shell

Start in:

- [buildScreenSurfacePlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)

### Change sponsor screen content or click behavior

Start in:

- [buildScreenAssignmentPlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)
- [sponsorScreenInteractionResolver.ts](/C:/3d/src/modules/expo/lib/sponsorScreenInteractionResolver.ts)

### Change world geometry rhythm or block placement

Start in:

- [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
- zone planners
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)

### Change routing from 3D world to app pages

Start in:

- [App.tsx](/C:/3d/src/App.tsx)
- action resolver / CTA resolver files

## 4. What Recent Work Improved

### Product-level visible improvements

- sponsor screens became clickable only when they should be
- clickable screens now advertise themselves with cursor and subtle hover feedback
- booths expose calculators, AI, and 2D showroom actions more explicitly

### Architecture improvements

- route decision logic moved into a pure resolver
- screen shell, socket, and assignment layers are separated
- diagnostics exist at planning level, not only at runtime symptom level
- operator mode exists as a review/control surface

### Quality and safety improvements

- screen orientation checks
- booth frontality checks
- screen bounds checks
- screen-screen overlap checks
- exact isolation of the recent `districtStride` diagnostic-scan bug

## 5. Current Weak Spots

### Weak spot 1: no full machine-readable world ownership registry

Today the IDs exist, but there is no exported registry saying:

- object id
- object layer
- source file
- source planner
- interaction owner
- diagnostic owners
- safe edit seam

This is the biggest blocker to true "agent-grade" world review.

### Weak spot 2: cross-family geometry reasoning is incomplete

Covered:

- screen bounds
- screen overlap
- booth frontality

Not yet covered:

- booth-local footprint seam
- screen-to-booth proximity
- generic 2D surface bounds registry

### Weak spot 3: runtime inspection is human-friendly, not yet agent-friendly

Operator mode is already useful for human review, but not enough for automated Codex review because it lacks:

- structured export
- per-node source ownership
- per-node diagnostics snapshot
- per-location camera scripts

## 6. What A Premium Commercial Version Needs Next

The correct next upgrades are not "more random visuals". They are:

1. a world object registry
2. an agent-review location mode
3. stronger planning diagnostics
4. booth-local geometry seams for proximity logic
5. deterministic review prompts and output schemas

That is how the project becomes faster to improve and harder to break.

