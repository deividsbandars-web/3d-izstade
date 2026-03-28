# Web3D Expo Asset Budget

This document defines the critical sponsor-release asset budget checked in CI.

Critical release-path assets:

- `public/models/realistic_city.glb`
- `public/models/modern_evening_street_4k.exr`
- `public/textures/pergola_walkway_4k.exr`
- `public/models/simple_grass_chunks.glb`
- `public/models/construction_assets.glb`

Rules:

- critical release-path assets must exist
- critical release-path assets must be non-zero bytes
- each critical asset must stay within its per-file hard budget
- CI generates `diagnostics/reports/expo-release-asset-budget.json`

Legacy/non-release advisory assets may still be reported, but they do not fail CI unless promoted into the release path.
