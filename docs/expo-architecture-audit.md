# Expo Architecture Audit v1

## Goal

Stabilize the Web3D expo codebase so future fixes land in the correct runtime layer and become visible immediately.

This audit is specifically about the `/expo-3d` experience, not the Unreal project and not the other expo pages such as marketplace, gallery, projector, or furniture showroom.

## Core Diagnosis

The main problem is not one visual bug. The main problem is architecture.

The current expo module mixes:

- live Web3D runtime
- legacy world-generation code
- support utilities
- fallback data logic
- pixel streaming integration
- unrelated expo feature pages

Because of that, it has been easy to patch the wrong layer, patch dead code, or patch only one of several overlapping runtime layers.

## Why Changes Were Often Invisible

1. The live runtime path is much smaller than the whole `src/modules/expo` tree.
2. `ExpoWorldScene.tsx` contains too many responsibilities in one file.
3. A single visual symptom was often created by multiple live layers at once.
4. Legacy and support files sit too close to live runtime files.
5. Repo structure does not clearly separate:
   - world rendering
   - booth rendering
   - data loading
   - planning/layout
   - legacy/experimental code

## Live Runtime Path

The active `/expo-3d` runtime currently flows through:

- `src/App.tsx`
- `src/modules/expo/Expo3D.tsx`
- `src/modules/expo/components/ExpoWorldHud.tsx`
- `src/modules/expo/components/ExpoWorldScene.tsx`

Required data/planning/runtime files for that path:

- `src/modules/expo/lib/sceneDataSource.ts`
- `src/modules/expo/lib/sceneFallbacks.ts`
- `src/modules/expo/lib/sceneContract.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/walk-region.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/sceneWorld-support.ts`
- `src/modules/expo/state/expoRuntime.ts`

## Live Runtime Layers Inside ExpoWorldScene

The current mounted scene layers are:

- `ExpoDistrictPromenade`
- `CleanExpoCitySkeleton`
- `ExpoRearCampus`
- `CuratedSkylineRing`
- booth renderers
- player / collision / debug / verification plumbing

If a fix is outside this chain, there is a high risk the change will not be visible in `/expo-3d`.

## File Classification

### Live Core

These files are core runtime and should remain active:

- `src/modules/expo/Expo3D.tsx`
- `src/modules/expo/components/ExpoWorldScene.tsx`
- `src/modules/expo/components/ExpoWorldHud.tsx`
- `src/modules/expo/lib/sceneDataSource.ts`
- `src/modules/expo/lib/sceneFallbacks.ts`
- `src/modules/expo/lib/sceneContract.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/walk-region.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/state/expoRuntime.ts`

### Live Support

These are still active or directly adjacent to the live runtime, but should be isolated:

- `src/modules/expo/components/CuratedSkylineRing.tsx`
- `src/modules/expo/components/BoothArchitectureKit.tsx`
- `src/modules/expo/components/ExpoEvidenceProbe.tsx`
- `src/modules/expo/sceneWorld-support.ts`
- `src/modules/expo/lib/backdropSanitization.ts`
- `src/modules/expo/lib/skylinePlacement.ts`

### Live but High-Risk

These are likely to cause legacy behavior, old asset dependency, or visual regressions:

- `src/modules/expo/lib/boulevardArtPass.ts`
- `src/modules/expo/lib/expoCuratedPropPlacement.ts`
- `src/modules/expo/lib/expoGroundMaterialManifest.ts`
- `src/modules/expo/lib/expoTexturePipeline.ts`
- `src/modules/expo/lib/sponsorScreenLayout.ts`

These should not be deleted blindly, but they should be isolated from the core runtime until they are reintroduced intentionally.

### Separate Feature Pages

These belong to the expo umbrella, but they are not part of the core `/expo-3d` runtime:

- `src/modules/expo/Marketplace.tsx`
- `src/modules/expo/DigitalGallery.tsx`
- `src/modules/expo/ProjectorRoom.tsx`
- `src/modules/expo/CityMap.tsx`
- `src/modules/expo/FurnitureShowroom.tsx`
- `src/modules/expo/UrgentServices.tsx`
- `src/modules/expo/EventsHub.tsx`
- `src/modules/expo/AdsNetwork.tsx`
- `src/modules/expo/SectorPage.tsx`

These should remain, but they should not be mixed into `/expo-3d` debugging or refactoring work.

### Legacy Facade / Review Target

- `src/modules/expo/sceneWorld.ts`

This file looks like a support facade rather than a true runtime entry. It should be reviewed later and either moved under `legacy/` or reduced to a deliberate compatibility layer.

## Target Architecture

The expo module should be reorganized into explicit runtime boundaries.

### 1. runtime/app

Owns app-level entry and UI control:

- `Expo3D.tsx`
- `ExpoWorldHud.tsx`

Responsibilities:

- mode switching
- local verification
- focus routing
- runtime layer toggles
- mobile input overlay

### 2. runtime/world

Owns world rendering only:

- `WorldScene.tsx`
- `WorldPromenade.tsx`
- `WorldCitySkeleton.tsx`
- `WorldStadiumDistrict.tsx`
- `WorldSkyline.tsx`
- `WorldPlayer.tsx`

Responsibilities:

- geometry
- movement
- collision
- scene composition

### 3. runtime/booths

Owns booth rendering and tier identity:

- `BoothNodeRenderer.tsx`
- `BoothShellStandard.tsx`
- `BoothShellPremium.tsx`
- `BoothShellElite.tsx`
- `BoothShellHero.tsx`

Responsibilities:

- booth shell geometry
- tier silhouette differences
- rear display / marquee / medallion / showcase staging

### 4. runtime/data

Owns scene loading and normalization:

- `sceneDataSource.ts`
- `sceneFallbacks.ts`
- `sceneContract.ts`

Responsibilities:

- local seeded data
- backend contract loading
- Supabase fallback
- normalization

### 5. runtime/layout

Owns non-render planning:

- `world-contract.ts`
- `layout-engine.ts`
- `walk-region.ts`
- `boulevardLayout.ts`

Responsibilities:

- booth placement
- district nodes
- walk regions
- start views

### 6. legacy

Owns deprecated and non-runtime artifacts that are kept temporarily:

- old world generation helpers
- old screen placement systems
- old art pass utilities

These should not remain mixed with active runtime files.

## Refactor Plan v1

### Phase 1: Boundary Pass

Create the new directory boundaries without changing behavior more than necessary.

Deliverables:

- `runtime/app`
- `runtime/world`
- `runtime/booths`
- `runtime/data`
- `runtime/layout`
- `legacy`

Strategy:

- move live files first
- keep thin compatibility wrappers in old paths during transition

### Phase 2: World Split Pass

Break `ExpoWorldScene.tsx` into multiple focused modules.

Minimum targets:

- promenade
- city skeleton
- stadium district
- skyline
- player/collision

Goal:

- no single file should own the whole world anymore

### Phase 3: Booth Split Pass

Split booth rendering by tier.

Goal:

- `standard`, `premium`, `elite`, and `hero` should be structurally separate render paths, not one giant conditional shell

### Phase 4: Risk Isolation Pass

Pull high-risk legacy systems out of the live chain.

Targets:

- `boulevardArtPass`
- `expoCuratedPropPlacement`
- `expoGroundMaterialManifest`
- `expoTexturePipeline`
- `sponsorScreenLayout`

Goal:

- stop old systems from quietly affecting live runtime

### Phase 5: Legacy Purge Pass

After the runtime is stable and separated, remove or archive dead files.

Goal:

- no more “parasite modules” affecting the live world unexpectedly

## Validation Protocol

Every future fix should follow this sequence:

1. Identify the live runtime layer causing the issue.
2. Edit only that layer.
3. Run:

```powershell
npx.cmd tsc -b
```

4. Verify locally on:

```text
http://127.0.0.1:5173/expo-3d
```

5. Only after local approval, deploy to VPS.

## Practical Rule

If a file is not in the live runtime path or clearly supporting it, do not edit it during a `/expo-3d` fix unless its live usage is explicitly confirmed first.
