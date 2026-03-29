# Expo Asset Readiness Spec

This document defines the minimum asset intake required to move the Warpala Web3D sponsor expo toward a stable enterprise release.

## 1. Tooling

### Texture compression toolchain

Required:
- KTX2 / BasisU capable encoder
- glTF optimization pipeline for geometry + texture compression

Current repo state:
- `scripts/optimize-gltf.mjs` already references `@gltf-transform/cli`
- KTX2 support is not yet wired as the canonical release pipeline

Expected release outcome:
- release-path textures are compressed and browser-safe
- Expo runtime does not depend on raw multi-80MB PNG source textures

## 2. Unified Expo Props Pack

Required props:
- planters
- benches
- light pylons
- signage stands
- info kiosks

Rules:
- one coherent visual family
- browser-safe polygon/material budget
- reusable instance-friendly geometry where possible
- no novelty or low-trust props in sponsor-facing paths

## 3. Unified Foliage Pack

Required foliage:
- low decorative shrubs
- ornamental grass
- small trees

Rules:
- instance-friendly
- small set of coordinated materials
- suitable for boulevard edge framing, not dense forest simulation

## 4. Unified Skyline / Backdrop Pack

Required:
- one coherent skyline language
- consistent scale, material response, and architectural style

Rules:
- do not mix unrelated random free assets into the sponsor wow path
- skyline assets must remain scenic by default
- skyline assets must not intrude into the playable sponsor route

## 5. Sponsor Content Minimum Per Sponsor

Every sponsor should provide:
- `logo`: SVG preferred, otherwise transparent PNG
- `landscapePoster`: 1920x1080
- `verticalPoster`: 1080x1920
- `videoLoop`: 15-30 second muted loop
- `ctaUrl`
- `tagline`: one sentence
- optional `heroGlbInsert`

## 6. File Requirements

### Logos
- preferred: SVG
- fallback: transparent PNG
- no white baked background unless explicitly intended

### Posters
- landscape: 1920x1080
- vertical: 1080x1920
- sRGB export
- avoid tiny embedded text

### Video loops
- muted
- H.264 MP4 preferred for baseline compatibility
- clean loop or near-loop
- max duration: 30 seconds

### Hero GLB inserts
- optional
- must load cleanly in web runtime
- must pass geometry/material audit before use in release

## 7. Intake Validation

Before an asset is accepted into release:
- correct naming
- correct aspect ratio
- correct transparency behavior
- reasonable filesize
- no broken external references
- no malformed GLB structure
- visually consistent with the sponsor boulevard art direction

## 8. Intake Priority

Recommended implementation order:
1. texture compression toolchain
2. sponsor content intake schema
3. unified props pack
4. unified foliage pack
5. unified skyline pack

## 9. Release Constraint

If an asset pack is not ready:
- do not partially mix it into release
- keep the release path on a safe fallback until the full pack is validated
