# GALA Interior, Performance, and Geometry Audit

Rejected evidence:

- `C:\qa\visual-evidence\20260626-025519-gala-final-wall-skin-product-owner-review-local`
- Prior remediation evidence: `C:\qa\visual-evidence\20260626-022919-gala-wall-skin-architecture-remediation-local`

This audit was created before implementing the blocker remediation. It is not an acceptance record. `productVisualAccepted=false`, `stagingDeployAllowed=false`, and `finalLocalAcceptanceRecommended=false` remain.

## A. Interior Wall-Skin Audit

1. Interior wall material owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts:53-80` resolves interior colors.
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:141-156` consumes `resolveGalaWallSkin`.
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:191-219` renders interior wall faces.

2. Interior board/panel dimension owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts:18-24` owns interior panel spacing and groove dimensions.
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:108-160` uses those values to generate interior panel grooves.

3. Exterior board dimension owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts:7-17` owns exterior board width, gap, depth, and reveal values.
   - `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:33-154` consumes those values for exterior boards.

4. Whether interior currently consumes `GalaWallSkinModel.ts` or has separate constants:
   - It consumes `GalaWallSkinModel.ts`, but uses a separate interior variant: `panelSpacingM=0.54` at `GalaWallSkinModel.ts:24`.
   - Exterior board module is `0.18m + 0.014m = 0.194m`, so the interior panel rhythm is not the same board language.

5. Why interior boards do not match exterior board language:
   - Interior walls are rendered as large flat finished faces plus sparse groove strips at `0.54m` spacing.
   - Exterior walls are rendered as narrow `0.18m` timber board faces with `0.014m` reveals.
   - The interior therefore reads as a different panel system rather than the same timber-board wall-skin.

6. Files that can override interior material/spacing after wall-skin config is loaded:
   - `GalaWallAssembly.tsx:141-156` is the active consumer and can override by choosing which interior fields are used.
   - `GalaFloorCeilingAssembly.tsx:87-237` consumes the same model for floor/ceiling/trim colors.
   - `GalaRoomAssembly.tsx:90-149` renders furniture/fixtures and several local hardcoded fixture/furniture accent colors, but it does not own wall-skin panel spacing.

7. Floor/ceiling/trim coherence:
   - `GalaFloorCeilingAssembly.tsx:87-237` consumes `resolveGalaWallSkin`, so floor/ceiling/trim colors are coherent with the wall-skin model.
   - The blocker is wall-board rhythm/scale, not floor/ceiling color ownership.

## B. Render Lag / Performance Audit

Measurements were captured locally against `http://127.0.0.1:5173` using Playwright and a WebGL draw-call/frame-time probe before remediation.

| Route | Median FPS | P95 Frame Time | Median Draw Calls | Median Triangles | Mesh Count | Material Count |
|---|---:|---:|---:|---:|---:|---:|
| exterior studio | 60.24 | 41.70 ms | 814 | 9,860 | 847 | 71 |
| interior studio | 79.37 | 54.10 ms | 555 | 6,602 | 847 | 71 |
| start outside | 79.37 | 41.70 ms | 814 | 9,860 | 847 | 71 |
| start inside | 60.24 | 41.70 ms | 814 | 9,860 | 847 | 71 |

The median FPS is acceptable in headless local measurement, but p95 frame-time exceeds the requested `28ms` budget on all measured routes. The product-owner lag report is therefore plausible and must be addressed.

### Mesh Count by Major System

Pre-fix scene inventory:

- wall-skin boards: `206`
- reveals/grooves: `185`
- trim: `158`
- roof: `5`
- furniture/fixtures: `89`
- openings: `62`
- walls/floors/ceilings: `77`
- other: `65`
- total visible mesh inventory: `847`

### Performance Root Cause Classification

- Too many individual board meshes: YES. `GalaCladdingAssembly.tsx:117-154` emits one mesh per exterior board plus scarf joints.
- Too many individual groove/seam meshes: YES. `GalaWallAssembly.tsx:224-241` emits individual interior grooves; floor/ceiling assemblies also emit repeated seam meshes.
- No instancing/merging: YES. `GalaConstructionPrimitives.tsx:36-66` creates one mesh, one geometry, and one material for every repeated box.
- Material count: MEDIUM. The scene has `71` material signatures; repeated identical board/trim meshes still instantiate separate materials.
- Shadows: MEDIUM. `GalaConstructionPrimitives.tsx:36-66` defaults `castShadow=true` and `receiveShadow=true` for most static construction boxes.
- Transparent materials: LOW/MEDIUM. Bathroom glass and cutaway features are limited, but still present.
- React re-render loop: NOT PROVEN. No evidence of a per-frame React state loop was found in the audited construction assemblies.
- Physics/collision loop: NOT PROVEN as primary cost in this evidence.
- DOM overlays: NOT PRIMARY. DOM overlay QA passed and the blocker is render lag, not a blocking overlay.
- Texture/font loading: NOT PRIMARY for this local evidence; sponsor black-canvas guard remains separate.
- Debug/QA mode: POSSIBLE CONTRIBUTOR. `qa3d=1` exposes scene traversal and screenshot tooling. Performance budget QA must measure in the same evidence mode but not rely on screenshot readability.
- Scene traversal/QA hook: NOT PRIMARY during normal render, but inventory collection is expensive and should be limited to QA actions.

Largest cost owner files:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx:36-66`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx:33-154`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:108-160` and `GalaWallAssembly.tsx:224-241`
- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx:87-237`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx:167-275`

## C. Furniture / Fixture Geometry Audit

1. Furniture placement owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:241-289`.

2. Furniture dimensions owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:251-289`.

3. Bathroom fixture placement/dimensions owner:
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:280-289`.
   - `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx:134-149` adds several derived fixture/detail positions.

4. Authoritative wall/opening/floor collision geometry:
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts:157-237` defines wall segments.
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:38-82` builds opening-aware wall cells.
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx:172-183` renders wall core collision/visual volumes.

5. Furniture/fixtures intersecting walls in pre-fix runtime probe:
   - `gala-construction-kitchen-upper-cabinet-with-readable-gap`
   - `gala-construction-bedroom-bedside-cabinet-at-headboard-side`
   - `gala-construction-bathroom-shower-riser-and-head-pipe`
   - `gala-construction-bathroom-round-shower-head-cue`
   - `gala-construction-bathroom-vanity-drawer-front-and-handle`
   - `gala-construction-bathroom-vanity-drawer-handle`
   - `gala-construction-bathroom-sink-basin-readable`
   - `gala-construction-bathroom-sink-faucet-cue`
   - `gala-construction-bathroom-wc-dark-bowl-inset-cue`
   - `gala-construction-bathroom-wc-seat-inset`
   - `gala-construction-bathroom-wc-flush-button-cue`

6. Objects visible through walls:
   - Through-wall visibility is a consequence risk of the same wall-core intersections. Runtime bounding-box detection found the objects above inside authoritative wall volumes.

7. Cause of intersections:
   - Placement anchors are too close to wall core volumes or use hardcoded derived offsets.
   - `GalaConstructionModel.ts:261-289` places several items close to south/east walls.
   - `GalaRoomAssembly.tsx:117`, `GalaRoomAssembly.tsx:139-143`, and `GalaRoomAssembly.tsx:145-149` add derived positions that do not apply a clearance rule.
   - Wall thickness is `0.14m` at `GalaConstructionModel.ts:61`, but furniture anchors do not apply a consistent `0.03m` minimum clearance.

8. Exact responsible files:
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
   - `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
   - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`

## Recommended Remediation Path

1. Move interior board rhythm to the same exterior board module or a documented interior variant inside `GalaWallSkinModel.ts`.
2. Replace the old sparse interior groove-panel look with interior timber board faces/gaps generated from the wall-skin model.
3. Reduce repeated mesh/draw-call cost by instancing repeated wall-skin boards and grooves where practical.
4. Add performance budget QA that records FPS, p95 frame time, draw calls, triangles, mesh count, and material count.
5. Add furniture clearance QA based on runtime bounding boxes against authoritative wall core volumes.
6. Adjust furniture/fixture anchors and derived positions; do not move walls or cameras.
