# GALA Phase 3 Visual and Performance Report

## Scope

Product-owner approval to start Tasks 3.1-3.5 was recorded on 2026-06-27. This report covers the local implementation only. No staging deploy was performed, and final visual acceptance remains pending review of the resulting frames.

## Visual Changes

- Wall-skin materials now use `MeshPhysicalMaterial` with material-specific roughness, metalness, clearcoat, clearcoat roughness, and environment intensity owned by `GalaWallSkinModel.ts`.
- The home studio uses a local 512x256 RGBE environment map at `public/textures/gala/gala-studio-512.hdr`.
- The source HDR occupies 529,457 bytes on disk. Runtime QA reports a 512x256 HalfFloat environment allocation estimated at 1,048,576 bytes and four renderer textures in both exterior and interior routes.
- Geometry, camera presets, route behavior, and UI composition were not changed.

## Renderer Profile

Production preview measurements were collected with corrected WebGL instrumentation that includes instanced draw calls.

| Route | Median FPS | P95 frame | Draw calls | Triangles | Logical mesh instances | Material signatures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Exterior stationary | 238.1 | 4.3 ms | 274 | 15,112 | 1,245 | 60 |
| Interior stationary | 238.1 | 4.3 ms | 208 | 14,104 | 1,245 | 60 |
| Exterior motion | 238.1 | 4.3 ms | 24 | 5,415 | 1,245 | 61 |
| Interior motion | 238.1 | 4.3 ms | 123 | 12,279 | 1,245 | 60 |

Motion maximum frame times were 25.0 ms exterior and 33.3 ms interior, with zero frames over 50 ms. The performance budget passed.

The wall-skin audit reports 807 board instances, including 250 exterior and 557 interior boards. It found no wall-skin consumer bypassing the centralized model. Draw calls and triangle counts did not increase from the same geometry; material signatures increased from 56 to 60 because the wall skin now has distinct PBR profiles.

## Chunk Profile

- `modular-home`: 121.92 kB gzip
- `Expo3D`: 161.76 kB gzip
- `three-core`: 187.82 kB gzip
- `react-three-vendor`: 335.18 kB gzip

No generated JavaScript chunk exceeds 500 kB gzip. Vite still emits its default warning for chunks over 500 kB uncompressed.

## Frame Allocations

The Expo city movement loop no longer calls `Vector3.clone()` or constructs temporary vectors for movement direction, collision probes, slide candidates, or mantle direction. Empty elevator and vertical-access collections also bypass per-frame array construction.

A controlled 32-second Chrome DevTools trace compared the current build with an otherwise identical build using the previous `ExpoWorldPlayerLayer.tsx`. Both runs recorded 70 minor and 5 major GC events. The allocation sites were removed, but the browser trace did not show a measurable reduction in GC event count; GC duration varied within run noise. This validation is therefore recorded as no GC regression, not as a measured GC reduction.

## Evidence

Local evidence is under `artifacts/phase3-gala-pbr/` and is intentionally ignored by Git:

- `before/` and `after/`: visual acceptance screenshots
- `final-performance/`: corrected stationary renderer profile
- `final-motion/`: corrected movement profile
- `design-intent/` and `wall-skin/`: visual/system audits
- `straight-before/` and `straight-after/`: controlled DevTools traces

## Validation

- `npm.cmd run build`: PASS
- `npm.cmd run lint`: PASS
- `npm.cmd run check:all`: PASS
- Visual acceptance route/readability QA: PASS
- Wall-skin coverage QA: PASS
- Visual design-intent QA: PASS
- Static and motion performance budgets: PASS
- Product-owner final review of Phase 3 output: PENDING

## Remaining QA Note

The legacy construction-renderer result still emits `floorColorStableNearAndFar=false` and `noBlueFloorOverlay=false` without a failing exit code. The focused design-intent audit reports `blueVoidOrGroundInsideInterior=false` and passes. Phase 3 did not alter floor geometry; this contradictory legacy signal should be reconciled before using that script as a release gate.
