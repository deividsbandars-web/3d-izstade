# Expo Texture Pipeline

This document defines the active texture pipeline for the Warpala Web3D sponsor expo.

## Release goal

The runtime must not depend on the raw source PNG pack under `public/textures/expo/**`.

Instead:
- source PNG textures remain the editable intake/source layer
- optimized runtime derivatives are generated under `public/textures/expo-runtime/**`
- the release runtime uses the generated `webp` derivatives only
- source PNG fallback is development-only and requires `VITE_EXPO_ALLOW_SOURCE_TEXTURE_FALLBACK=1`

## Current active pipeline

Build runtime derivatives:

```powershell
npm run build:expo-textures
```

Validate the generated pack:

```powershell
npm run check:expo-texture-pipeline
```

## Output

Generated files:
- `public/textures/expo-runtime/**`
- `public/textures/expo-runtime/asset-manifest.json`

The manifest records:
- source path
- runtime path
- source and runtime dimensions
- source and runtime byte size
- savings ratio

## Compression policy

Current active runtime format:
- `webp`

Current profile rules:
- facade hero screen: downscale to max 4096
- 16:9 placeholders: downscale to max 1920x1080
- 9:16 placeholders: downscale to max 1080x1920
- base-color ground textures: downscale to max 2048
- normal maps: downscale to max 2048 and encode lossless webp
- AO / roughness maps: downscale to max 2048 and encode compressed webp

## KTX2 status

The build script auto-detects `ktx` / `toktx` on `PATH`.

Current repo behavior:
- if no KTX encoder is available, WebP is still generated and used as the release runtime format
- when KTX tooling is installed and the runtime loader is upgraded for KTX2, this pipeline can be extended without changing the source texture pack layout

## Release rule

If a texture is referenced in the sponsor runtime and does not have a generated runtime derivative, that is a release gap.

Raw source PNGs under `public/textures/expo/**` are excluded from Vercel and Docker release contexts and pruned from Vite `dist/` output. Validate this contract with:

```powershell
npm.cmd run check:release-static-payload
```
