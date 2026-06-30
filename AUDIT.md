# Web3D Expo City Audit

## Architecture Summary

- Framework: React 19 with Vite, TypeScript, and React Router.
- Rendering: Three.js through `@react-three/fiber` and `@react-three/drei`.
- Main route: `/expo-3d` in `src/App.tsx`.
- Scene entry: `src/modules/expo/Expo3D.tsx` -> `runtime/app/Expo3D.tsx` -> `ExpoRuntimeShell` -> `ExpoSceneShell` -> `ExpoWorldScene`.
- Canvas: `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`.
- Scene assembly: `ExpoWorldSceneLayers.tsx`, `WorldCitySkeleton.tsx`, `ExpoRearCampus.tsx`, booth runtime components, screen runtime components.
- World planning: canonical plan in `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`, but some geometry still comes from `runtime/planning/legacy/worldCityGeometry.ts`.
- State: mostly React hooks/context/reducers; Supabase is used for presence/data/analytics. No Redux/Zustand found in the Expo runtime path.
- Data: scene data loads from `/api/expo/scene`, then falls back to Supabase/dev/review-safe scenes.
- Build: Vite, manual vendor chunks, PWA via `vite-plugin-pwa`.

## Relevant Files

- Routing/app: `src/App.tsx`, `src/main.tsx`, `src/config/runtimeEnv.ts`.
- Expo runtime: `src/modules/expo/runtime/app/Expo3D.tsx`, `ExpoRuntimeShell.tsx`, `ExpoSceneShell.tsx`.
- Canvas/scene: `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`, `ExpoWorldSceneRoot.tsx`, `ExpoWorldSceneLayers.tsx`, `useExpoWorldSceneRuntime.ts`.
- City assembly: `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`, `WorldGroundPlane.tsx`, `WorldCityMasses.tsx`, `WorldCityPerimeter.tsx`, `WorldCityMegaLandmarks.tsx`, `ExpoRearCampus.tsx`.
- Cameras/operator: `src/modules/expo/runtime/operator/model/reviewOperatorSession.ts`, `src/modules/expo/runtime/operator/state/useExpoOperatorState.ts`.
- Screens: `src/modules/expo/runtime/planning/screens/*`, `WorldCityScreenSurfaces.tsx`, `WorldCityScreenSockets.tsx`, `WorldCityScreenAssignments.tsx`.
- Booths/sponsors: `src/modules/expo/runtime/booths/*`, `src/modules/expo/lib/sponsorBoothPresentation.ts`, `src/shared/expo/lib/boothLocalFootprint.ts`, `src/pages/expo/BoothRoom.tsx`, `src/pages/expo/CompanyAdmin.tsx`.
- Assets/textures: `src/modules/expo/loaders/modelLoader.ts`, `src/modules/expo/lib/expoTexturePipeline.ts`, `src/modules/expo/runtime/booths/BoothTextureMaterials.tsx`, `public/models`, `public/textures`.
- Physics/inspection: `src/modules/expo/runtime/world/inspection/worldObjectRegistry.ts`, `runtime/world/physics/*`.
- Existing audit tools: `scripts/build-expo-city-review-atlas.mjs`, `scripts/audit-expo-world-registry.mjs`, `scripts/audit-expo-visual-clean.mjs`, `scripts/full_city_clean_pass.ps1`.

## Current Performance Risks

- Whole-city rendering still happens by section/layer toggles, not true distance/zone streaming.
- Repeated city masses/screens/booth parts are mostly individual meshes, not instanced in the Expo runtime path.
- Large assets exist in `public/models` and `public/textures`; several legacy GLBs and 4K/EXR files are too heavy for mobile if accidentally loaded.
- Generated billboard textures use canvas textures up to 2048px; this needs tier-aware caps.
- Raycasting/inspection can intersect broad scene children; it must stay operator/debug-only for release.
- Canvas has DPR caps and `AdaptiveDpr`, but there is no full performance overlay showing draw calls, triangles, textures, DPR, and FPS.
- PWA auto-update/cache can make staging look stale unless build stamps and cache behavior are visible.
- Legacy geometry source is still a root maintainability risk for city/stadium ownership, seams, and placement confidence.

## Recommended Implementation Order

1. Add a performance overlay behind `?perf=1`: FPS, DPR, draw calls, triangles, geometries, textures, visible zones, active screens, booth count.
2. Convert quality presets into a runtime quality context: low/medium/high/auto, device-aware defaults, URL override, local dev override.
3. Apply mobile mode rules from the quality context: DPR cap, no heavy environment, no shadows, screen texture cap, reduced transparent effects.
4. Add real zone-based visibility around the player/operator zone: city/rear-campus/booth/screen visibility groups, not only manual section toggles.
5. Add a registry trust gate: every renderable critical object must have id, layer, position, size, source file/function, safe edit seam, and camera coverage.
6. Refactor repeated masses/screens/props into pooled/instanced renderers where geometry/material is shared.
7. Continue floor/ground polish after the ownership model is single-source: one base ground, explicit detail overlays only when intentional.
8. Rebuild booth templates config-first: sponsor content separate from booth architecture, tier templates measurable by draw calls and screen area.
9. Build Demo Arena as a separate planned zone, not mixed into city geometry.
10. Build Expo Passport after zone/object events are stable, so missions use reliable visit/screen/booth events.

## Next Prompt

`Implement step 1: add a lightweight Web3D performance overlay behind ?perf=1 for /expo-3d. Show FPS, DPR, draw calls, triangles, geometries, textures, quality tier, active section toggles, visible booth count, and WebGL availability. Keep it disabled by default, do not change city visuals, and run build/tests.`
