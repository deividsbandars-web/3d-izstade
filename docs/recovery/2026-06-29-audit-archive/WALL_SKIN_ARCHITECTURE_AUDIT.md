# GALA Wall-Skin Architecture Audit

Evidence source rejected by product owner: `C:\qa\visual-evidence\20260626-013622-gala-cladding-gap-and-ownership-remediation-local`

This audit was completed before the wall-skin architecture remediation. It is not an acceptance record, and `productVisualAccepted` remains `false`.

## Root Cause Summary

The rejected facade was partially bare because visible wall ownership was split:

- `GalaWallAssembly.tsx` rendered opening-aware base wall cells as broad product-visible faces.
- `GalaCladdingAssembly.tsx` added board cladding as a separate layer instead of being the single visible exterior wall skin.
- Gable cladding was generated separately in `GalaConstructionRenderer.tsx`.
- Interior panel materials and spacing were owned separately from exterior cladding materials, so the inside and outside did not read as one cabin material system.

The result was technically readable, but architecturally inconsistent: some wall regions displayed the timber-board system while other regions read as flat backing surfaces.

## Required Audit Answers

1. Base exterior wall faces were rendered by `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:140-183`.
2. Exterior cladding boards were rendered by `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:33-154`.
3. Exterior grooves/reveals were rendered by `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:82-98`; gable backing/reveals were in `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:217-237`.
4. Trim/corner/eave interruptions were rendered by `GalaWallAssembly.tsx:258-268`, `GalaOpeningAssembly.tsx:75-168`, and `GalaConstructionRenderer.tsx:33-105`.
5. Wall segment selection came from `GALA_CONSTRUCTION_WALLS` in `GalaConstructionModel.ts:157-237`, mounted by `GalaConstructionRenderer.tsx:327-333`, with exterior eligibility now centralized in `GalaWallSkinModel.ts:89-91`.
6. Plain/bare wall sections came from `GalaWallAssembly.tsx:167-183`, where core cells remained visible when the cladding layer did not visually dominate the surface.
7. The left/large facade section read as plain because wall core/backing and board material were previously visually merged; QA counted board meshes, but the visible pixels still allowed a broad base-wall read in the straight-on view.
8. Before remediation, cladding was applied per construction wall segment with separate opening-aware wall cells, not as one coherent wall-skin material system.
9. No exterior wall segment bypasses `GalaCladdingAssembly` after remediation. Gable cladding remains an adapter in `GalaConstructionRenderer.tsx:167-275`, but it consumes `GalaWallSkinModel`.
10. `GalaWallAssembly`, `GalaCladdingAssembly`, `GalaConstructionRenderer`, and `GalaHouseConfig` previously influenced wall materials through separate paths. After remediation, construction wall-skin dimensions and material tokens resolve through `GalaWallSkinModel.ts:7-97`.
11. `GalaRoof` remains the roof owner. `GalaConstructionRenderer.tsx:33-105` still renders base/corner trim, and `GalaConstructionRenderer.tsx:167-275` renders gable cladding as documented wall-skin adapters.
12. Debug, QA, and `homeStudio=1` modes do not override wall-skin material values. The sponsor booth remains disabled in homeStudio mode as a black-canvas guard from prior remediation.
13. Interior wall panel strips are rendered by `GalaWallAssembly.tsx:108-160` and `GalaWallAssembly.tsx:224-241`.
14. Interior wall color is owned by `GalaWallSkinModel.ts:53-86` and consumed by `GalaWallAssembly.tsx:140-146` and `GalaWallAssembly.tsx:187-219`.
15. Interior panel spacing/scale is owned by `GalaWallSkinModel.ts:18-24` and consumed by `GalaWallAssembly.tsx:149-156`.
16. Interior wall panel scale/color differed from exterior timber logic because the prior implementation resolved interior and exterior finish paths separately.
17. Interior finish should consume a documented interior variant under the shared wall-skin model. This is now implemented in `GalaWallSkinModel.ts:18-24` and `GalaWallSkinModel.ts:73-80`.
18. Duplicate wall material/board constants were neutralized by moving active wall-skin dimensions and materials to `GalaWallSkinModel.ts`; `GalaConstructionModel.ts:298-307` now exposes cladding values as an adapter from `GALA_WALL_SKIN_DIMENSIONS`.

## Remediation Applied

- Created `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts` as the single wall-skin owner.
- Removed the active `GalaCladdingSpec.ts` path.
- Moved active exterior board width, gap/reveal width, board depth, reveal backing depth, and controlled timber palette into `GalaWallSkinModel.ts`.
- Moved active interior panel spacing, groove width/depth, floor plank spacing, and compatible wall/floor/ceiling material tokens into `GalaWallSkinModel.ts`.
- Made `GalaCladdingAssembly.tsx` render continuous exterior board coverage for all visible exterior walls, with openings acting as interruptions/masks rather than reasons to leave full bays plain.
- Made `GalaWallAssembly.tsx`, `GalaOpeningAssembly.tsx`, `GalaFloorCeilingAssembly.tsx`, and gable/trim adapters consume the same wall-skin model.
- Added controlled, deterministic, low-contrast timber board tone variation through `GalaWallSkinModel.ts:93-99` so narrow boards remain visually readable without random or zebra striping.

## Post-Remediation Confirmation

Final QA evidence folder: `C:\qa\visual-evidence\20260626-022919-gala-wall-skin-architecture-remediation-local`

- Wall-skin coverage QA: `pass=true`.
- `exteriorAllVisibleWallsClad=true`.
- `largePlainExteriorWallPresent=false`.
- `exteriorBoardModuleConsistent=true`.
- `interiorPanelModuleConsistent=true`.
- `interiorExteriorMaterialSystemCoherent=true`.
- `wallSkinConstantsSingleOwner=true`.
- `materialOverrideConflictPresent=false`.
- Board width: `0.18m`.
- Reveal/gap width: `0.014m`.
- Board-to-gap ratio: `12.86`.
- Controlled board colors: `#c5925c`, `#c89863`.
- `productVisualAccepted=false`.
- `singleSourceRendererProven=false` remains by scope; this remediation proves scoped wall-skin ownership, not full renderer unification.
