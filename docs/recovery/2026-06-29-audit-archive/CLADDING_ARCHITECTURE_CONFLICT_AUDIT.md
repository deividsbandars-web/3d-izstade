# GALA Cladding Architecture Conflict Audit

## Scope

This audit responds to the product-owner rejection of:

- `C:\qa\visual-evidence\20260626-010110-gala-visual-design-intent-remediation-local`

The rejected facade is closer than the earlier rainbow/zebra state, but the vertical gaps/reveals are too wide and too visually dominant. The facade reads as a dark striped grid rather than narrow-gap vertical timber board cladding.

No source fix was implemented before this ownership and conflict trace.

## Active Render Path

The active GALA render path is:

1. `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx:3065` resolves the GALA visual config.
2. `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx:3211` mounts `GalaHouseShell` for the GALA product branch.
3. `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx:48-52` mounts `GalaConstructionRenderer`.
4. `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:320-334` mounts wall, gable, trim, roof adapter, terrace, and room assemblies.
5. `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:233` mounts `GalaCladdingAssembly` for each wall.

## Audit Questions

### 1. Which file owns facade board geometry?

Active wall facade board geometry is owned by:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:65-203`

Active gable board geometry is separately owned by:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:170-280`

This is not a material override, but it is split active geometry ownership: wall cladding and gable cladding are separate implementations.

### 2. Which file owns board width?

Before remediation, board width is defined in:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:54-70`
  - `boardPanelWidthM: 0.34`

It is consumed by:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:71`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:190,248`

### 3. Which file owns board gap/reveal width?

Before remediation, board gap/reveal spacing is defined in:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:54-70`
  - `boardGapM: 0.026`

It is consumed by:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:72,84-87`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:190`

The configured gap is 2.6 cm, which exceeds the requested max of 2.5 cm and the target range of 1-2 cm.

### 4. Which file owns groove/shadow reveal material?

The facade seam/reveal color token is owned by:

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts:131-156`

It is applied by:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:106-117`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:160-176`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:212-231`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:259-275`

The active full dark cladding backing and extra raised edge-shadow meshes make the reveal visually much stronger than the numeric gap alone.

### 5. Which file owns facade base wood material?

The facade base wood color token is owned by:

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts:131-156`

It is applied by:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:144-159`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:240-258`

### 6. Which file owns trim material?

Primary GALA facade trim color is owned by:

- `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts:131-156`

It is applied by:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:41-93`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:245-255`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx:83-86`

`GalaOpeningAssembly.tsx:86` also has a hardcoded exterior opening reveal color. This is not board cladding, but it can create dark trim/reveal bars around openings.

### 7. Which file applies per-board material/color?

Wall boards:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:144-159`

Gable boards:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:240-258`

The previous index-based color alternation was removed in the prior design-intent remediation. Current board color is coherent, but gap/reveal geometry and dark supporting meshes still dominate.

### 8. Which file can override cladding material after config is loaded?

No active file was found that overrides `visual.wallColor` after config resolution for wall boards or gable boards.

Material applications after config resolution are active in:

- `GalaCladdingAssembly.tsx` for wall boards and wall backing/reveals.
- `GalaConstructionRenderer.tsx` for gable boards and gable backing/reveals.
- `GalaOpeningAssembly.tsx` for opening casing/reveals.
- `GalaWallAssembly.tsx` for top eaves trim.

These are separate applications of config tokens, not post-load overrides. The architectural risk is split active ownership, not a hidden material replacement.

### 9. Are there multiple active cladding systems mounted at once?

Yes, for GALA:

- wall cladding: `GalaCladdingAssembly`
- gable cladding: `GableBoardCladding` inside `GalaConstructionRenderer`

The legacy module-based cladding path in `ModularHomeModel.tsx` remains in the file, but it is not mounted for the active GALA branch because `ModularHomeModel.tsx:3211` mounts `GalaHouseShell` instead of the legacy module-block branch.

### 10. Are there legacy facade/cladding/trim files still active?

Legacy files still exist:

- `src/modules/expo/runtime/modularHome/GalaOpenings.tsx`
- module-based cladding and trim code inside `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx`
- configurator visual token files under `modularHomeConfigurator.ts`

They were not found mounted in the active GALA branch. They remain a repository risk if routing/product branching changes, but they are not the current too-wide gap cause.

### 11. Are any material tokens duplicated between `GalaHouseConfig.ts` and construction assemblies?

Active facade wood/seam/trim color tokens are not duplicated numerically in construction assemblies. Construction assemblies consume `resolveGalaFacadeVisual`.

One hardcoded adjacent exterior wall-core color exists:

- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:145`

This core sits behind cladding and is not the board material owner.

Opening reveal color is hardcoded:

- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx:86`

This can affect opening trim/reveal appearance, but it is not the cladding board gap owner.

### 12. Does `GalaConstructionRenderer` override values from `GalaCladdingAssembly`?

It does not override `GalaCladdingAssembly`. It implements a separate gable cladding system that independently consumes `GALA_CONSTRUCTION_LEVELS.boardPanelWidthM`, `GALA_CONSTRUCTION_LEVELS.boardGapM`, `facadeVisual.wallColor`, and `facadeVisual.seamColor`.

The conflict risk is that wall and gable cladding can diverge unless both consume one cladding dimension owner.

### 13. Does `GalaHouseShell` or `GalaRoof` inject facade/trim visuals outside the documented cladding owner?

`GalaHouseShell` does not inject facade/cladding material. It only passes `visualConfig` into `GalaConstructionRenderer`:

- `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx:48-52`

`GalaRoof` owns roof material and roof seams only. It does not inject facade cladding or trim material. It is mounted inside `GalaConstructionRenderer` as a documented roof adapter:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:301-310`

### 14. Are debug/QA/variant modes changing materials in `homeStudio=1`?

No active `homeStudio=1` or `qa3d=1` material override path was found for GALA facade materials. QA modes affect route/camera/test readiness and mesh traversal, not facade material tokens.

The prior homeStudio sponsor-booth guard remains unrelated to facade materials.

### 15. Exact files and line ranges responsible for the current too-wide gaps

Primary numeric gap and board width:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:54-70`
  - `boardGapM: 0.026`
  - `boardPanelWidthM: 0.34`

Wall cladding gap application:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:70-87`
  - reads `boardPanelWidthM` and `boardGapM`
  - places each board at `axis + gap * 0.5`
  - leaves the configured gap visible between boards

Wall dark reveal dominance:

- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:106-117`
  - full dark recessed backing panel behind the entire facade
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:160-176`
  - extra vertical `subtle-raised-board-edge-shadow` meshes inside board faces, not actual board seams

Gable gap application and dark reveal dominance:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:189-199`
  - gable board module uses the same current width/gap constants
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:212-231`
  - gable wall core uses seam material behind boards
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:259-275`
  - extra vertical gable edge-shadow meshes inside board faces

## Root Cause

The too-wide gap defect comes from a combined geometry and material/relief issue:

1. The active gap constant is `0.026m`, exceeding the requested max `0.025m` and above the target `0.01-0.02m`.
2. Board width is `0.34m`, outside the requested `0.16-0.22m` target, so the rhythm does not match the requested board scale.
3. A full dark backing panel makes every uncovered gap read as a dark strip.
4. Extra dark vertical raised edge-shadow meshes are decorative lines inside board faces, not actual seams.
5. Gable cladding duplicates the wall cladding logic separately, so both must consume a single cladding dimension owner.

## Recommended Remediation Path

1. Add one active cladding dimension owner for board width, gap/reveal width, cladding depth, and allowed ratio.
2. Set board width to `0.18m`.
3. Set gap/reveal width to `0.014m`.
4. Make wall cladding and gable cladding consume the same cladding dimension owner.
5. Remove extra vertical dark edge-shadow meshes that are not actual board seams.
6. Keep the dark backing only as a thin reveal surface visible through the real gap.
7. Keep facade material tokens in `GalaHouseConfig.ts`; do not duplicate color constants in construction assemblies.
8. Add dimension-aware QA that fails when readable screenshots still violate cladding proportions.

This remediation remains local and does not imply product acceptance.

## Post-Remediation Owner Confirmation

The targeted fix implemented the recommended path:

- Single active cladding dimension owner:
  - `src/modules/expo/runtime/modularHome/construction/GalaCladdingSpec.ts`
- Final board width:
  - `0.18m`
- Final gap/reveal width:
  - `0.014m`
- Final board-to-gap ratio:
  - `12.86`

Active consumers now share the same dimension owner:

- Wall cladding:
  - `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
- Gable cladding:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
- Construction model metadata:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`

The extra vertical dark edge-shadow meshes were removed from active wall and gable cladding. The remaining reveal backing is only a thin shadow surface visible through actual board gaps.

No active file was found overriding the corrected facade board material or board geometry after config load. `GalaHouseConfig.ts` remains the owner of facade wood, seam, and trim color tokens; `GalaCladdingSpec.ts` owns board dimensions.

The architecture is not claimed globally clean because `singleSourceRendererProven=false` remains true for the wider GALA construction renderer. This audit only confirms that active cladding width/gap/depth constants now have one owner and that no active material override conflict was found for the corrected facade.
