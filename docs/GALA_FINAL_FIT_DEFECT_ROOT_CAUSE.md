# GALA Final-Fit Defect Root-Cause Audit

Date: `2026-06-25`

This audit was created before applying the defect-root-cause cleanup fixes. The previous local final-fit pass was rejected by manual review from `localhost:5173/modular-homes/studio?view=exterior&homeStudio=1`.

## Executive Summary

The remaining defects are not owned by one mesh. They come from competing procedural systems:

- The floor system is mostly single-surface, but raised rugs/drains and the exterior foundation/deck/floor stack are close enough in color/height to read as moving overlays from a human walk view.
- Interior door frames are generated locally in `GalaInterior.tsx`, while ceiling trim is generated separately in `GalaCeiling.tsx`. They do not share one perimeter/opening model, so visible slits remain at bathroom/bedroom headers and jambs.
- Ceiling trim is a set of hardcoded fragments. It is not generated from wall segments/openings, so continuity breaks are expected.
- Exterior cladding grooves are generated as tiny surface boxes in `GalaOpenings.tsx` and gable groove boxes in `GalaHouseShell.tsx`. These sit on top of the wall surface and visually read as drawn/stuck-on lines rather than construction grooves.
- The interior wall assembly is split across exterior walls/openings, interior partitions, opening casing, ceiling trim, and baseboards. There is no single wall-thickness assembly that owns wall face, reveal, base, crown, and opening trim together.
- Bedroom and bathroom fixtures are owned by `GalaInteriorFurniture.tsx` and their collision footprints by `GalaFloorplan.ts`. The current bed is near the south wall, but the pillow/headboard relationship is still not unambiguous. The bathroom WC is near the east wall, but the cistern/plinth relationship still reads too centered from some angles.

## A. Floor System

| Defect | Source Owner | Mesh/Object Names | Material | Dimensions / Position | Root Cause |
| --- | --- | --- | --- | --- | --- |
| Main finished floor | `GalaInterior.tsx` / `FloorAndCirculation` | `gala-single-finished-floor-surface-no-z-fighting` | `visual.floorColor`, opaque, roughness `0.9` | box `[10.2, 0.08, 5.0]`, position `[0, -0.04, 0]`, top at `Y=0` | Correct primary owner. The issue is not a second main floor in this component. |
| Living rug overlay | `GalaInteriorFurniture.tsx` / `GalaLivingFurniture` | `gala-living-rug-raised-above-finished-floor-no-z-fighting` | `visual.rugColor` | box `[2.45, 0.018, 1.36]`, position `[planXToLocalX(2.4), 0.032, 0.14]`, bottom `Y=0.023` | Raised and not coplanar, but can still read as a colored floor patch because it is large and very flat. |
| Bathroom drain/mat cue | `GalaInteriorFurniture.tsx` / `GalaBathroomFurniture` | `gala-bathroom-compact-floor-drain-cue-not-blue-floor-patch` | `#6b7280` | box `[0.16, 0.018, 0.16]`, position `[planXToLocalX(5.82), 0.034, -1.9]` | Raised and small; not likely the large color-following defect. |
| Thresholds | `GalaInterior.tsx` / `DoorFrame`; `GalaOpenings.tsx` / `OpeningFrame` | `gala-*-clear-threshold`, `gala-*-threshold-entry-slab`, `gala-*-interior-threshold-seals-frame` | `#8f5f35` or door accent | interior thresholds around `Y=0.025`, exterior scheduled thresholds at opening sill | Multiple threshold systems exist but are localized at doors. Potential local z-fighting where interior and exterior threshold pieces overlap at entry/terrace. |
| Foundation/deck stack | `GalaHouseShell.tsx` | `gala-low-grey-foundation-slab-below-finished-floor`, `gala-terrace-low-timber-deck-2400x2100` | foundation grey / timber deck | foundation center `Y=-0.16`, deck center `Y=0.12` | Not interior floor, but close-by exterior surfaces can appear through door/open shell views. |

Conclusion: the main floor is owned by one mesh, but colored flat overlays and threshold/deck/foundation surfaces need deterministic offsets and clearer material separation. Any remaining blue/color-following defect is likely a flat accent/overlay or transparent/cutaway surface, not the main floor mesh.

## B. Door / Header / Ceiling System

| Defect | Source Owner | Mesh/Object Names | Material | Dimensions / Position | Root Cause |
| --- | --- | --- | --- | --- | --- |
| Interior door jambs | `GalaInterior.tsx` / `DoorFrame` | `gala-bedroomDoor-door-jamb`, `gala-bathroomDoor-door-jamb` | `#3f3024` | orientation-specific boxes around `frameHeight=2.1` | Jambs are separate boxes with narrow width/depth; wall/casing overlap is insufficient from some angles. |
| Interior door casing | `GalaInterior.tsx` / `DoorFrame` | `gala-*-wide-door-casing-seals-opening-edge` | `#72543a` | vertical casing height `2.26`, header casing height `0.18` | Casing is local to the doorway; it does not coordinate with partition wall and ceiling trim generation. |
| Door transom panels | `GalaInterior.tsx` / `DoorFrame` | `gala-*-solid-transom-panel-seals-door-to-ceiling-void` | `visual.partitionColor` | from `headerBottomY=2.18` to `clearCeilingHeightM=2.6275` | Correct intent, but separate from ceiling cap fragments; can leave horizontal/vertical slits at edges. |
| Ceiling plane | `GalaCeiling.tsx` | `gala-continuous-flat-ceiling-plane-closes-roof-voids` | `visual.wallPanelColor` | box `[10.06, 0.055, 4.86]`, position `Y=2.655` | Plane is inset by `0.07m` on all sides; edge gaps require trim to hide them. |
| Perimeter crown trim | `GalaCeiling.tsx` | `gala-south/north/west/east-ceiling-crown-trim-seals-wall-joint` | `visual.wallSeamColor` | hardcoded four edge runs | Perimeter is mostly covered, but hardcoded trim does not account for interior partition intersections/openings. |
| Partition ceiling caps | `GalaCeiling.tsx` | `gala-bathroom-west-partition-ceiling-cap`, `gala-bedroom-partition-*`, `gala-bathroom-door-header-continuous-ceiling-trim`, `gala-bedroom-door-header-continuous-ceiling-trim` | `visual.wallSeamColor` | hardcoded fragments | The trim system is fragment-based, not segment/perimeter-based. Breaks and floating short trims are expected. |

Conclusion: door/header defects are caused by split ownership. `GalaInterior.tsx` owns doorway frames/transoms; `GalaCeiling.tsx` owns discontinuous trim fragments. They need one deterministic trim/run model for bedroom and bathroom wall segments and door openings.

## C. Facade Cladding

| Defect | Source Owner | Mesh/Object Names | Material | Dimensions / Position | Root Cause |
| --- | --- | --- | --- | --- | --- |
| Wall panels | `GalaOpenings.tsx` / `WallPanel` | `gala-*-wood-cladding-wall-panel` | `facadeVisual.wallColor`, opacity depends on cutaway | wall cells split around scheduled openings | Correct segmented wall owner. |
| Facade grooves | `GalaOpenings.tsx` / `FacadeCladdingGrooves` | `gala-*-opening-clipped-thin-vertical-cladding-groove-not-batten` | `facadeVisual.seamColor`, opacity up to `0.66`, transparent only in cutaway | vertical boxes width `<=0.018`, depth `0.005`, face offset `(wallThickness/2)+0.004` | Grooves are positive boxes placed on top of wall face. Even thin boxes read as drawn/stuck-on lines, not recessed board gaps. |
| Gable grooves | `GalaHouseShell.tsx` / `GableEnd` | `gala-*-gable-thin-vertical-cladding-groove-to-eaves` | `facadeVisual.seamColor`, opacity `0.62` | boxes `[0.012, height, 0.018]`, position at `grooveX` | Separate system from wall grooves; spacing and visual depth differ from wall grooves. |
| Exterior trims | `GalaHouseShell.tsx` / `ExteriorTrim`; `FoundationAndPlinth` | corner trim, top fascia, side top wall eaves trim, bottom wall trims | `facadeVisual.trimColor` / `GALA_MATERIALS.trim` | hardcoded runs | Top/bottom/corner trim exists but is not coupled to groove generation. |

Conclusion: facade grooves still look low quality because they are protruding/drawn surface strips. The fix should make them read as construction shadow channels by pairing each groove with a narrow dark recess and subtle board edge highlights or by slightly reducing wall-panel discontinuity, not by adding larger strips.

## D. Bedroom Furniture

| Defect | Source Owner | Mesh/Object Names | Material | Dimensions / Position | Root Cause |
| --- | --- | --- | --- | --- | --- |
| Bed frame/mattress | `GalaInteriorFurniture.tsx` | `gala-bedroom-bed-frame-against-south-wall-clear-path-from-door`, `gala-bedroom-mattress-readable-against-south-wall` | `#5f4631`, `visual.bedBaseColor` | frame `[1.72, 0.22, 1.18]`, center `[planXToLocalX(8.68), 0.16, -1.72]`; mattress center `Y=0.38` | Bed is near south wall but the pillows are offset toward east, while the headboard is a south-wall strip. Manual review reads headboard/pillow side as not clearly against wall. |
| Pillows/headboard | `GalaInteriorFurniture.tsx` | `gala-bedroom-pillow-pair-*`, `gala-bedroom-low-headboard-on-south-wall` | pillow material / `#6f4b2c` | pillows at `[planXToLocalX(9.38), 0.68, -2.04/-1.42]`, headboard at `z=-2.36` | Pillow/headboard axes conflict: pillows imply head on east side; headboard implies south side. |
| Wardrobe | `GalaInteriorFurniture.tsx` and `GalaFloorplan.ts` footprint | `gala-bedroom-wardrobe-against-east-wall-clear-of-bed-and-window` | `visual.wardrobeColor` | `[0.34, 1.72, 1.18]`, center `[planXToLocalX(9.95), 0.98, 1.12]` | Logical wall placement, but it may read as disconnected from bedside/headboard side. |
| Bedside table | `GalaInteriorFurniture.tsx` | `gala-bedroom-bedside-table-top` | `visual.tableColor` | center `[planXToLocalX(7.72), 0.34, -1.12]` | Current nightstand is near foot/side, not clearly at headboard/pillow side. |

Conclusion: bedroom defect is real layout semantics, not a rendering bug. Bed/pillows/headboard/nightstand must share one orientation: pillows and headboard against the same wall, nightstand at that headboard side, optional TV/screen opposite.

## E. Bathroom Fixtures

| Defect | Source Owner | Mesh/Object Names | Material | Dimensions / Position | Root Cause |
| --- | --- | --- | --- | --- | --- |
| Shower panel | `GalaInteriorFurniture.tsx` | `gala-bathroom-shower-wall-panel-integrated-with-south-wall`, `gala-bathroom-shower-glass-panel-cue` | `visual.bathroomAccentColor`, `#dbeafe` | wall panel center `[planXToLocalX(5.42), 0.92, -2.18]`, glass center `[planXToLocalX(5.72), 0.82, -1.47]` | Panel is intended as integrated shower/wet-room panel, but it can still read as random if not connected to floor/wall trims. |
| Vanity/sink | `GalaInteriorFurniture.tsx` | `gala-bathroom-vanity-cabinet`, `gala-bathroom-sink-basin-readable`, `gala-bathroom-faucet-cue` | light cabinet/sink colors | centered near south wall at `z=-2.1` | Wall-aligned and not primary defect. |
| WC | `GalaInteriorFurniture.tsx`; footprint in `GalaFloorplan.ts` | `gala-bathroom-wc-low-plinth-against-east-wall`, rounded bowl, cistern, inset, flush button | `#e2e8f0`, `#f8fafc`, `#475569` | plinth/bowl center `[planXToLocalX(6.86), ..., -1.18]`, cistern center `[planXToLocalX(7.08), 0.72, -1.18]` | WC is closer to east wall but still visually centered because the bowl/plinth center is too far from the wall and cistern is narrow. |

Conclusion: bathroom defect is fixture anchoring and wall relationship. WC should be visibly tight to one wall, with cistern on that wall, and shower panel should connect to south/wet wall with trim/base context.

## Required Fix Direction After This Audit

1. Floor: remove/avoid any broad colored floor overlays and make accent objects small, raised, and clearly non-floor. Keep main finished floor as the only large floor mesh.
2. Door/ceiling: replace fragment-only door/ceiling trim with deterministic door surround and partition cap pieces that overlap enough to cover jamb/header slits.
3. Facade: change grooves from protruding/drawn lines into narrow construction shadow channels with consistent rhythm and paired subtle board-edge highlights.
4. Interior wall assembly: make exterior cladding outside only, flat interior wall treatment inside, and opening reveals/casing/base/crown trim visibly connected.
5. Bedroom: align pillows/headboard/nightstand on one wall and add/justify TV opposite.
6. Bathroom: move WC/cistern visibly against wall and integrate or remove the shower panel.

`productVisualAccepted=false` remains unchanged.

## Post-Fix Local Result

Evidence was generated at `C:\qa\visual-evidence\20260625-164126-gala-defect-root-cause-final-cleanup-local`.

Confirmed local changes after this audit:

- Floor overlay root cause was addressed by keeping one main finished floor and reducing the broad flat living rug/floor accent into a smaller raised mat.
- Bedroom and bathroom door gap ownership was addressed by widening two-sided door casing/header overlap in `GalaInterior.tsx`.
- Ceiling trim discontinuity was addressed with deterministic continuous trim runs in `GalaCeiling.tsx`.
- Facade groove ownership was addressed by replacing single protruding/drawn strips with recessed construction shadow channels and subtle board-edge highlights in `GalaOpenings.tsx` and `GalaHouseShell.tsx`.
- Bedroom bed/headboard/pillow/nightstand alignment was corrected, with a TV/screen added opposite the bed.
- Bathroom WC was moved tighter to the wall, and the white shower/wet-room panel was integrated against the wall.

Regression status:

- Opening/door regression passed: closed doors block, open doors pass, windows remain sealed, and facade seams do not cross openings.
- Secondary 8-shot passed: `ok=true`, `overallQaVerdict=human-review-ready`, `8/8` technical screenshots, and `8/8` readable.
- Real-user physics minimum passed for wall collision and door traversal: `wallCollisionPass=true`, `doorTraversalPass=true`, `canWalkThroughWalls=false`.
- Full real-user physics harness did not pass because `walkSpeedPass=false`. Movement speed was not changed in this task because the task explicitly forbids additional movement tuning.

No camera, FOV, route, backend/auth/quote, QA semantic, or staging deploy changes were made. `productVisualAccepted=false`.

## Superseded by Construction Renderer Reset

Manual review after `20260625-164126-gala-defect-root-cause-final-cleanup-local` still rejected the patch-loop direction. The defects remained visible enough that further small trims, offsets, and isolated primitive edits were no longer treated as a viable path.

The follow-up local pass `20260625-181252-gala-construction-renderer-reset-local` replaces the active fragmented GALA shell assembly with a single construction renderer. That pass:

- creates a single construction model for dimensions, walls, openings, rooms, floor, ceiling, cladding, and trim rules;
- routes active `GalaHouseShell` rendering through construction assemblies rather than the old fragmented shell/interior/opening composition;
- adds runtime mesh inventory via actual Three.js scene traversal instead of hardcoded expected mesh lists;
- preserves openable door, sealed window, real-user physics, and secondary 8-shot regressions;
- does not deploy to staging;
- keeps `productVisualAccepted=false`.
