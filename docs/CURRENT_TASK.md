# Current Task

## 2026-06-29 GALA L-Shaped Door Handle Pass

- Active objective: change the GALA door handle geometry in `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx` from a straight protruding grip into an L-shaped lever that stays inside the exterior collision envelope.
- Implementation status:
  - Shortened `DOOR_HANDLE_GRIP_REACH` from `0.11m` to `0.065m`.
  - Added `DOOR_HANDLE_RETURN_HEIGHT_M = 0.04` for the downward lever return tip.
  - Added a third door hardware part per face named `door-handle-lever-return-tip`, positioned at the grip end and 40mm downward from the handle axis.
  - Kept the existing plate/grip JSX mapper and metalness/roughness values, and preserved jamb/casing/glass/threshold geometry.
  - Mirrored the existing open-door orientation logic so return tips stay aligned when the door leaf is open.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA if product-owner confirmation of L-handle shape and collision clearance is required.

## 2026-06-29 GALA Foundation Base Trim PBR Texture Pass

- Active objective: add trim PBR texture maps to the four foundation base trim boards in `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`.
- Implementation status:
  - Added `useGalaConstructionPbrTextures('trim')` inside `FoundationAndBaseTrim`.
  - Spread the trim PBR texture props onto the four mapped continuous base trim `GalaConstructionBox` instances.
  - Left the low concrete foundation slab as a plain grey material with no PBR texture props.
  - Did not touch the bathroom partition offset in `GalaConstructionModel.ts` or the exterior wall collision depth in `GalaFloorplan.ts`.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA if product-owner confirmation of base trim texture alignment is required.

## 2026-06-29 GALA Door And Window Hardware Geometry Rewrite

- Active objective: rewrite door handle and window pull geometry in `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx` so hardware sits on slab/glass faces instead of wall/casing faces.
- Implementation status:
  - Replaced the old backplate/lever constants with the new compact handle and window pull constants.
  - Door plate centers now use `DOOR_LEAF_DEPTH * 0.5` plus plate half-depth, placing them on the actual door slab face.
  - Door grip bars now extend from the plate using `DOOR_HANDLE_GRIP_REACH` while preserving the existing handle render `metalness={0.45}` and `roughness={0.54}`.
  - Open-door hardware is anchored to the existing `openLeafPosition` path and uses the rotated open-leaf face axis.
  - Window pulls now sit at the interior glass face using `-(GLASS_DEPTH * 0.5)`, `WINDOW_PULL_SECTION`, and height `sillY + opening.heightM * 0.38`.
  - Preserved the existing hardware JSX render blocks, jamb/casing/glass geometry, and glass `renderOrder`/`depthWrite` settings.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA if product-owner confirmation of hardware contact on slabs/glass is required.

## 2026-06-29 GALA Bathroom Partition Offset Fix

- Active objective: move the bathroom west/north partition references `0.105m` to the right so the partition no longer intrudes into the terrace door opening.
- Implementation status:
  - Added `bathroomPartitionLocalX = planXToLocalX(GALA_HOUSE_DIMENSIONS.bathroomStartXM) + 0.105` in `GalaConstructionModel.ts`.
  - Updated construction `bathroom-west-partition-wall.xM` and `bathroom-north-partition-wall.axisStartM` to use `bathroomPartitionLocalX`.
  - Added `bathroomPartitionPlanX = GALA_HOUSE_DIMENSIONS.bathroomStartXM + 0.105` in `GalaFloorplan.ts`.
  - Updated only the bathroom west partition collision bounds and bathroom north wall left-of-door `xMin` to use `bathroomPartitionPlanX`.
  - Preserved `GALA_HOUSE_DIMENSIONS.bathroomStartXM`, room bounds, furniture positions, the bathroom-bedroom shared partition segment, and the bathroom north wall right end.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
  - `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual/movement QA around the terrace and bathroom partition if product-owner confirmation is required.

## 2026-06-29 GALA Door Handle And Window Pull Pass

- Active objective: add door handles and interior window pulls in `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`.
- Implementation status:
  - Added dark matte escutcheon backplates and lighter lever bars on both faces of every door.
  - Closed door hardware uses the requested latch axis, `sillY + 0.92m` handle height, and `+/-faceOffset` face placement with lever offset `0.048m` beyond the face.
  - Open door hardware now anchors to the existing `openLeafPosition` path so it moves with the open slab instead of staying in the closed doorway.
  - Added an interior-only window pull bar centered on each window glass at `sillY + opening.heightM * 0.35`.
  - Preserved existing door click handlers, jamb/casing/threshold geometry, and window glass `renderOrder`/`depthWrite` settings.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA if product-owner confirmation of door/window hardware placement is required.

## 2026-06-29 GALA Corner Board PBR Texture Pass

- Active objective: add exterior PBR texture maps to `CornerBoards` in `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`.
- Implementation status:
  - Added `useGalaConstructionPbrTextures('exterior')` inside `CornerBoards`.
  - Spread the exterior PBR texture props onto the four full-height corner board `GalaConstructionBox` instances.
  - Left `FoundationAndBaseTrim`, `ResidentialTerrace`, and `GableBoardCladding` untouched for this prompt.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA if product-owner confirmation of corner board material continuity is required.

## 2026-06-29 GALA Residential Terrace Trim And Gap Fix

- Active objective: fix `ResidentialTerrace` deck-to-cladding gap and missing side/back trim in `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`.
- Implementation status:
  - Shifted `deckZ` `0.10m` toward the house wall so the deck reaches the visual cladding zone.
  - Added left and right terrace side edge trim boards using the existing terrace dark trim color and edge trim dimensions.
  - Added a back edge connector strip at `assembledWallEnvelopeWidthM * 0.5 + 0.005`, with deck thickness plus `20mm` height and `0.08m` depth.
  - Preserved `terraceCenterX`, step positioning, `deckY`, and deck PBR texture use.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA on the north terrace if product-owner confirmation is required.

## 2026-06-28 GALA Exterior Wall Collision Thickness Fix

- Active objective: fix player-camera clipping into exterior cladding boards in `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`.
- Implementation status:
  - Added `exteriorWallCollisionHalfDepth = wallThickness * 0.5 + 0.04`, resolving to `0.11m`.
  - Applied that half-depth to the six exterior wall collision segments: both south entry-door returns, both north terrace-door returns, west exterior wall, and east exterior wall.
  - Left all interior partition collision segments on the existing `wallThickness * 0.5` depth.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser movement QA around exterior cladding if product-owner visual confirmation is required.

## 2026-06-28 GALA Opening Z-Fighting Fix

- Active objective: fix door/window frame edge Z-fighting in `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`.
- Implementation status:
  - Added `JAMB_WALL_CELL_OVERLAP = 0.003`.
  - Increased `CASING_FACE_CLEARANCE` from `0.018` to `0.026`.
  - Shifted left/right jamb liner axes 3mm into the opening and shifted header/window-sill liner positions 3mm away from the abutting wall cell boundary.
  - Preserved jamb liner, header/sill liner, casing, door/glass panel, and threshold sizes/positions outside the requested offset changes.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: review movement screenshots or browser motion QA if product-owner visual confirmation is required.

## 2026-06-28 GALA Geometry Texture Remediation Implementation

- Active objective: implement `docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md` on the canonical root Vite SPA modular-home studio route.
- Implementation status:
  - 2026-06-28 owner rejected the previous green-QA result and clarified the remaining blockers: raise the full interior floor above foundation/base, align terrace/threshold/base trim, fix bathroom/living wall and bathroom door frame geometry, lengthen the bed, and prove door/window flicker is gone with real movement evidence.
  - Added `docs/GALA_OWNER_REJECTION_STRUCTURAL_MOTION_PLAN.md` with the required repair sequence and an implementer prompt for the next terminal.
  - Added opening PBR kinds for `door` and `trim`; door leaves, jamb liners, header/sill liners, casing, and thresholds now use shared diffuse/normal/ARM maps and carry material QA flags.
  - Split finished interior wall material from structural wall core material; wall cores no longer receive the exterior-like ribbed wall texture, while finished interior faces use a calmer low-normal `interiorWall` PBR profile.
  - Added a local-UV finished floor surface above the existing structural floor slab so floor planks have stable direction/repeat without transparent overlays.
  - Added non-rendering GLTF furniture clearance proxy meshes for sofa/table wrappers and moved the living coffee table farther from the sofa through `GALA_FURNITURE_LAYOUT`.
  - Added a GALA home-studio camera profile: desktop FOV `50`, touch FOV `56`; sponsor boulevard/default expo FOV remains `60`/`66`.
  - Retuned GALA start look targets at eye height and exposed camera FOV/pitch/roll in QA/debug state.
  - Restored a narrow `window.__WARPALA_GALA_DOOR_API__` QA facade over the zustand door store without restoring the old `window.__WARPALA_GALA_DOOR_STATES__` sync path.
  - Reconciled GALA visual/furniture/construction QA for current accepted targets: removed stale requirements for interior board relief, floor seams, ceiling seams, removed upper cabinets, and old trim; added checks for opening PBR maps, GLTF proxy bounds, local floor PBR, and camera FOV composition.
- Evidence paths:
  - `artifacts/gala-camera-fov-composition`
  - `artifacts/gala-geometry-texture-furniture-clearance`
  - `artifacts/gala-wall-floor-coherence-floor-ground`
  - `artifacts/gala-wall-floor-coherence-openings`
  - `artifacts/gala-geometry-texture-construction-renderer`
  - `artifacts/gala-geometry-texture-final-design-intent`
- Validation:
  - `node --check scripts/qa-gala-camera-fov-composition.mjs` passed.
  - `node --check scripts/qa-gala-furniture-clearance-audit.mjs` passed.
  - `node --check scripts/qa-gala-construction-renderer.mjs` passed.
  - `node --check scripts/qa-gala-visual-design-intent-audit.mjs` passed.
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run check:all` passed.
  - Browser QA against local Vite preview `http://127.0.0.1:4185` passed for camera/FOV composition, furniture clearance, floor-ground isolation, opening clip, construction renderer, and visual design intent.
- Product/release status:
  - `productVisualAccepted=false`; local QA evidence is ready for product-owner review, but no acceptance record was created.
  - `stagingDeployAllowed=false`; no staging deploy was performed.
  - No backend, auth, quote, payment, public route, Unreal, Pixel Streaming, or deployment changes were made in this turn.
- Latest touched files from this implementation:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
  - `src/modules/expo/runtime/modularHome/GalaHouseState.ts`
  - `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
  - `src/modules/expo/runtime/app/Expo3D.tsx`
  - `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`
  - `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx`
  - `scripts/qa-gala-camera-fov-composition.mjs`
  - `scripts/qa-gala-furniture-clearance-audit.mjs`
  - `scripts/qa-gala-construction-renderer.mjs`
  - `scripts/qa-gala-visual-design-intent-audit.mjs`
  - `docs/CURRENT_TASK.md`
- Next step: product owner should review the new local evidence directories above; only after explicit approval should any acceptance record or staging deploy be considered.

- Last updated: `2026-06-28`
- Active objective: Phase 3 GALA visual and performance advancement.
- Latest status:
  - 2026-06-28 architect/planner screenshot review completed for the latest GALA geometry/material rejection loop.
  - Added `docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md` with root causes, staged fix plan, and implementer prompts for opening PBR textures, interior wall/floor coherence, furniture module fit, camera/FOV composition, and QA reconciliation.
  - 2026-06-28 architect/planner follow-up revised the remediation plan to include home-studio camera/FOV composition work so owner screenshots do not read as overly stretched, fish-eye, or tilted downward.
  - The revised plan identifies the active camera owners as `ExpoWorldCanvasShell.tsx`, `Expo3D.tsx`, `ExpoWorldPlayerLayer.tsx`, `useGalaShowroomMovement.ts`, and QA-only `Expo3DQAHook.tsx`; it requires GALA-scoped FOV/start-view adjustments without changing sponsor boulevard camera behavior.
  - Identified likely current roots: interior wall material is shared too broadly with exterior-like triplanar plank PBR; finished floor uses a generic triplanar construction-box path rather than a floor-local finish; door/window frames and door slabs still fall back to flat color; GLTF furniture modules need auditable construction bounds; visual QA assertions are partly stale against the current product target.
  - No renderer code, backend, route, camera/FOV/lookAt, quote, auth, or staging deployment changes were made in this planning turn.
  - Replaced flat interior wall/core and floor-slab colors with the supplied 1K diffuse, OpenGL normal, and packed ARM texture sets.
  - Added world-space triplanar sampling for construction boxes and instanced boxes so differently scaled wall cells and floor geometry retain a consistent physical texture scale.
  - Configured the packed ARM texture as the shared AO, roughness, and metalness map, preserving R/G/B channel semantics in the custom shader.
  - Product owner explicitly approved starting Phase 3 Tasks 3.1-3.5; `gate3ImplementationApproved=true`.
  - Upgraded construction wall-skin rendering to centralized `MeshPhysicalMaterial` PBR profiles.
  - Added a local 512x256 RGBE environment map for home-studio reflections and ambient response.
  - Verified wall-skin instancing and corrected QA WebGL instrumentation to include instanced draw calls and triangles.
  - Added a dedicated `modular-home` chunk and split Three.js core from React Three extras; no JavaScript chunk exceeds 500 kB gzip.
  - Removed per-frame movement vectors/clones and empty elevator/vertical-access array work from the Expo city movement branch.
  - Added `docs/GALA_PHASE3_VISUAL_PERFORMANCE_REPORT.md` with screenshots, renderer, texture, chunk, motion, and DevTools trace results.
  - Added `GalaHouseState.ts` zustand facade for Gala visual config, door state, and floorplan layout.
  - Replaced Gala door `window.__WARPALA_GALA_DOOR_STATES__` / custom DOM event synchronization with zustand store selectors/subscriptions.
  - Migrated `ModularHomeModel.tsx` to consume the Gala visual resolver through `GalaHouseState`.
  - Verified `ModularHomeDemoOverlay.tsx` subcomponent extraction was already present and under target size.
  - Extracted modular home catalogue data from `modularHomeProducts.ts` into `modularHomeProducts.json` while preserving the TypeScript API surface.
  - Extracted Modular Home quote validation into `backend-server/schemas/quoteValidation.ts` and re-exported the existing controller API.
  - Switched backend tsconfigs to Node16 module resolution, added required `.js` extensions in backend/shared TS import paths, and adjusted full backend build output/start path.
- Latest validation:
  - 2026-06-27 visual remediation follow-up after product-owner screenshot rejection:
    - Removed active interior physical vertical board relief instances from `GalaWallAssembly.tsx`; flat interior wall faces keep PBR/triplanar wall material while the exterior cladding path remains active.
    - Removed active interior baseboard/crown/ceiling seam trim and terrace recessed board-gap strips.
    - Removed active living rug overlay, kitchen backsplash/upper cabinet blocks, bedroom TV, and the old painted-cabinet GLTF wardrobe from the construction-room renderer path.
    - Replaced the active bedroom wardrobe with a simple built-in wardrobe module and neutralized the red fabric diffuse on bed fabric boxes.
    - Moved kitchen base/counter objects away from the door/window conflict, moved bathroom mirror to a side wall, and adjusted shower panels away from the bathroom window.
    - Enlarged active floor/deck plank texture scale by setting floor/deck `triplanarScale` to `0.08`.
    - Reduced active wall PBR normal strength to avoid the interior walls reading as deep corrugated strips.
    - Removed bottom casing/sill liner geometry from door openings; exterior scheduled-door threshold rendering remains gated separately.
  - 2026-06-27 remediation visual evidence:
    - `artifacts/gala-remediation-final-wall-clean-visual-construction/after/manual-repro/ceiling-door-void-fixed.png`
    - `artifacts/gala-remediation-final-wall-clean-visual-construction/after/manual-repro/floor-stable.png`
    - `artifacts/gala-remediation-final-wall-clean-visual-construction/after/manual-repro/bedroom-layout-improved.png`
    - `artifacts/gala-remediation-final-focused-views/exterior-side-angle.png`
    - `artifacts/gala-remediation-final-focused-views/exterior-elevated-cutaway.png`
    - `artifacts/gala-remediation-final-start-inside-after-threshold-wall/start-inside-after-click.png`
  - 2026-06-27 runtime scene inventory confirmed zero active matches for the rejected elements:
    - `terrace-recessed-board-gap`
    - `room-perimeter-baseboard`
    - `continuous-crown`
    - `ceiling-panel-longitudinal`
    - `ceiling-panel-cross`
    - `kitchen-backsplash`
    - `kitchen-upper-cabinet`
    - `living-rug-raised`
    - `bedroom-wardrobe-against-east-wall-high-quality-gltf`
    - `painted_wooden_cabinet`
    - `interior-vertical-timber-board-panel`
  - 2026-06-27 validation after follow-up remediation: `npm.cmd run lint` passed, `npm.cmd run build` passed, `npm.cmd run check:expo-boundaries` passed, and `npm.cmd run check:all` passed.
  - 2026-06-27 follow-up visual cleanup from product-owner screenshots at 23:04:
    - Exterior scheduled door open leaves now swing outward from the wall normal and use a shorter leaf span so the terrace/entry passage is not visually squeezed by the door slab.
    - Window glass panels are centered in the wall aperture, slightly larger, and use opacity `0.66` to cover narrow reveal-edge shimmer while staying below the existing transparency QA cap.
    - Exterior cladding reveal/shadow strips no longer receive the high-frequency PBR plank texture, reducing motion shimmer around window frames.
    - Bathroom interior door opening was moved/narrowed from plan X `6.00-7.12m` to `5.95-6.85m`, leaving a real side wall/rim before the bedroom partition instead of clipping the jamb into the next wall.
    - Bedroom bed, mattress, blanket, pillows, and headboard were widened; the bedside cabinet was reduced and moved out of the mattress envelope.
  - 2026-06-27 follow-up evidence:
    - `artifacts/gala-door-window-bed-motion-fixes-final/bedroom-bed-width-clearance.png`
    - `artifacts/gala-door-window-bed-motion-fixes-final/bathroom-door-frame-clearance.png`
    - `artifacts/gala-door-window-bed-motion-fixes-final/kitchen-window-glass-still.png`
    - `artifacts/gala-door-window-bed-motion-fixes-final/motion-window-01.png` through `motion-window-08.png`
    - `artifacts/gala-window-motion-final-check/window-motion-1.png` through `window-motion-4.png`
    - `artifacts/gala-window-motion-final-check/runtime-report.json`
  - 2026-06-27 validation after the follow-up cleanup: `npm.cmd run lint` passed, `npm.cmd run check:all` passed, and `npm.cmd run build` passed.
  - PBR texture browser QA passed with no shader console errors or asset HTTP errors; 274 construction meshes were present.
  - Renderer texture count is 10: the prior four textures plus six shared wall/floor PBR maps, with no per-wall texture clones.
  - PBR performance audit passed at 238.1 median FPS and 4.3 ms p95 for both exterior and interior routes.
  - Phase 3 production build profile: exterior 274 draw calls / 15,112 triangles; interior 208 / 14,104.
  - Motion p95 was 4.3 ms with zero stutters over 50 ms; static and motion budgets passed.
  - Runtime environment texture estimate is 1,048,576 bytes with four renderer textures.
  - Controlled 32-second DevTools traces recorded identical GC event counts before/after; allocation sites were removed, but measurable GC reduction was not proven.
  - Legacy construction-renderer QA still reports two contradictory floor-color flags while the focused design-intent audit passes; this remains a QA-script reconciliation item.
  - `npm.cmd run build` passed.
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:all` passed.
  - `npx.cmd tsc --noEmit --pretty false -p tsconfig.json` in `backend-server` passed.
  - `npx.cmd tsc --noEmit --pretty false -p tsconfig.docker.json` in `backend-server` passed.
  - `npm.cmd run build` in `backend-server` passed outside sandbox because the sandbox blocks writes to `backend-server/dist`.
  - `npm.cmd run build:docker` in `backend-server` passed outside sandbox.
  - `npm.cmd run lint` in `backend-server` passed.
  - `npm.cmd start` in `backend-server` reached a listening server with required local env values; without env it correctly fails on missing `SUPABASE_URL`.
  - Browser smoke against local Vite preview passed for `/modular-homes/studio?view=interior&homeStudio=1`: overlay tabs switched, quote form mounted, canvas rendered, `E` key path ran, and the old Gala door window global was absent.
- Latest touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
  - `public/models/gala/wood_plank_wall_1k/textures/*`
  - `public/models/gala/wood_floor_1k/textures/*`
  - `src/modules/expo/runtime/modularHome/GalaHouseState.ts`
  - `src/modules/expo/runtime/modularHome/GalaDoorState.ts`
  - `src/modules/expo/runtime/modularHome/GalaInterior.tsx`
  - `src/modules/expo/runtime/modularHome/GalaOpenings.tsx`
  - `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
  - `src/modules/expo/runtime/modularHome/modularHomeProducts.ts`
  - `src/modules/expo/runtime/modularHome/modularHomeProducts.json`
  - `backend-server/controllers/modularHomeQuoteController.ts`
  - `backend-server/schemas/quoteValidation.ts`
  - `backend-server/tsconfig.json`
  - `backend-server/tsconfig.docker.json`
  - `backend-server/package.json`
  - `package.json`
  - `package-lock.json`
  - Backend-shared root TS files touched mechanically for Node16 `.js` import extensions under `src/agents`, `src/backend`, `src/core`, `src/lib`, and `src/services`.
  - `docs/CURRENT_TASK.md`
- Session note: the Windows/WSL agent-environment audit, legacy module cleanup, Gala movement extraction, and GALA remediation state below are historical context from previous tasks and are not the active objective for this turn.
- Audit status:
  - Sensitive Codex auth material remains under `C:\Users\esauk\.codex\auth.json`; treat it as secret state, not working data.
  - Codex repo-specific trust state for `C:\3d` has been removed.
  - Codex custom prefix overrides were cleared from `C:\Users\esauk\.codex\rules\default.rules`.
  - Gemini trust/projects entries for `C:\3d` have been removed.
  - VS Code Codex-in-WSL override has been disabled.
  - Root `AGENTS.md` was simplified and the duplicate `handoff/.context-lite-stage/AGENTS.md` was removed so the repo has one canonical agent-instruction file.
  - Repo-specific root trust state was removed from Codex and Gemini config.
  - Root `zip`/`png` artifacts and `tmp*` directories were moved under `artifacts/root-archive/2026-06-26`.
  - `.gitignore` was tightened to ignore `artifacts/root-archive/` and legacy `server` build/dependency outputs.
  - Live alternate work roots were found at `C:\3d_phase161_pr` and `C:\3d-lfs-clean`.
  - No repo-local `.vscode` folder or Copilot instruction file was found in `C:\3d`.
  - Removed local trace folders: `C:\Users\esauk\.copilot`, `C:\Users\esauk\.claude\debug`, `C:\Users\esauk\.gemini\history`, `C:\Users\esauk\.gemini\tmp`.
  - Removed Codex runtime caches and scratch folders, but active Codex runtime files keep getting recreated while Codex is running: `cap_sid`, `history.jsonl`, `models_cache.json`, `goals_1.sqlite*`, `logs_2.sqlite*`, `state_5.sqlite*`, `.sandbox*`, `sandbox*.log`.
  - `C:\3d_phase161_pr` is empty; `C:\3d-lfs-clean` is still a full alternate project tree outside the canonical repo root.
  - Cleaned additional user-profile traces and caches under `C:\Users\esauk`: removed `AppData\Local\npm-cache`, VS Code `chatSessions` and `chatEditingSessions` under `AppData\Roaming\Code\User\workspaceStorage`, `globalStorage\emptyWindowChatSessions`, `.supabase\traces`, `.aider\caches`, `.cache`, empty `.claude`, empty `.templateengine`, and stray `package.json.bak`.
  - Removed obsolete VS Code OpenAI extension folders `openai.chatgpt-26.5616.81150-win32-x64` and `openai.chatgpt-26.5623.30605-win32-x64`; `openai.chatgpt-26.5623.31443-win32-x64` is still present and likely locked by an active VS Code/Codex process.
  - Cleared most of `AppData\Local\Temp`; a small locked remainder is still present for active applications such as Adobe, Docker Desktop, and Logitech G Hub.
  - Removed `C:\Users\esauk\vscode-remote-wsl\stable\unknown`, which had accumulated a large dump of repeated `vscode-server-stable-linux-x64.tar.gz_*` files.
  - Removed `C:\temp\edge-codex`, which was a full temporary Edge profile containing browsing/session state including `30sek` and `vercel` traces.
- Rejected evidence:
  - `C:\qa\visual-evidence\20260626-033206-gala-interior-performance-geometry-remediation-local`
- New local remediation evidence:
  - `C:\qa\visual-evidence\20260626-050056-gala-opening-interior-floor-performance-remediation-local`

## Status

No staging deploy was performed.
No backend, auth, quote, payment, public route, camera, FOV, or lookAt changes were made.
No acceptance record was created.
`productVisualAccepted=false`.
`stagingDeployAllowed=false`.
`finalLocalAcceptanceRecommended=false`.
`openingClippingRejectedByProductOwner=true`.
`interiorWallSkinRejectedByProductOwner=true`.
`floorGroundContaminationRejectedByProductOwner=true`.
`renderPerformanceRejectedByProductOwner=true`.
`singleSourceRendererProven=false`.

## Completed Audit

- Created blocker audit:
  - `OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md`
- Created owner trace:
  - `OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json`
- Updated wall-skin system spec:
  - `docs/GALA_WALL_SKIN_SYSTEM_SPEC.md`
- Created opening clip spec:
  - `docs/GALA_OPENING_CLIP_SPEC.md`
- Created floor/ground isolation spec:
  - `docs/GALA_FLOOR_GROUND_ISOLATION_SPEC.md`
- Updated performance budget:
  - `docs/GALA_PERFORMANCE_BUDGET.md`

## Completed Remediation

- Removed exterior horizontal scarf-joint board marks.
- Clipped exterior boards and reveal backing out of window/door aperture volumes.
- Made window glass transparent/readable.
- Kept open door portal visually clear.
- Matched interior boards to the exterior wall-skin module and timber tone:
  - board width: `0.18m`
  - reveal/gap width: `0.014m`
- Removed unwanted interior horizontal banding effect by making documented trim use the timber board color.
- Disabled homeStudio world-ground detail/sponsor/arrival/transition overlays inside the house footprint and lowered the remaining global ground.
- Cached GALA door collision segments, bypassed legacy expo-city raycast/elevator physics in homeStudio walking, moved keyboard motion state to refs, gated construction-audit scene traversal during movement, disabled homeStudio presence networking, and throttled homeStudio movement reporting.
- Added/updated QA:
  - `scripts/qa-gala-opening-clip-audit.mjs`
  - `scripts/qa-gala-floor-ground-isolation-audit.mjs`
  - `scripts/qa-gala-motion-performance-audit.mjs`
  - `scripts/qa-gala-furniture-clearance-audit.mjs`
  - existing wall-skin/design-intent/construction renderer guards.

## Evidence Result

- Opening clip QA passed.
- Floor/ground isolation QA passed.
- Motion performance QA passed against local preview bundle:
  - exterior motion p95 `4.3ms`, max `24.9ms`, stutters `0`
  - interior motion p95 `4.3ms`, max `20.9ms`, stutters `0`
- Static performance budget QA passed.
- Furniture clearance QA passed:
  - `wallIntersectionsDetected=false`
  - `throughWallVisibilityDetected=false`
- Wall-skin coverage QA passed.
- Cladding dimension QA passed.
- Visual design-intent QA passed.
- Visual acceptance QA passed.
- View readability diagnostic passed.
- DOM overlay QA passed.
- Renderer ownership scoped QA passed.
- Construction renderer QA passed.
- Manual remediation review:
  - PASS: 10
  - WARN: 0
  - FAIL: 0
  - NOT TESTED: 0

## Validation

- `npm.cmd run build` passed outside the sandbox after a sandbox path-only Vite emit failure.
  - Existing Vite large chunk warning remains.
- `npm.cmd run lint` passed.
- All required `node --check` commands passed.
- Browser QA was run against local Vite preview at `http://127.0.0.1:4273`.
- Local route smoke returned HTTP 200 for exterior studio, interior studio, start outside, start inside, and quote review.

## Touched Files

- `OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md`
- `OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json`
- `docs/GALA_WALL_SKIN_SYSTEM_SPEC.md`
- `docs/GALA_OPENING_CLIP_SPEC.md`
- `docs/GALA_FLOOR_GROUND_ISOLATION_SPEC.md`
- `docs/GALA_PERFORMANCE_BUDGET.md`
- `docs/CURRENT_TASK.md`
- `scripts/qa-gala-opening-clip-audit.mjs`
- `scripts/qa-gala-floor-ground-isolation-audit.mjs`
- `scripts/qa-gala-motion-performance-audit.mjs`
- `scripts/qa-gala-furniture-clearance-audit.mjs`
- `scripts/qa-gala-wall-skin-coverage-audit.mjs`
- `scripts/qa-gala-visual-design-intent-audit.mjs`
- `scripts/qa-gala-construction-renderer.mjs`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`
- `src/modules/expo/runtime/world/WorldGroundPlane.tsx`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `AGENTS.md`
- `.gitignore`

## Remaining Blockers

- Agent environment cleanup is not fully final while Codex is still running, because live runtime SQLite/log files under `C:\Users\esauk\.codex` are recreated immediately.
- Alternate project tree `C:\3d-lfs-clean` still exists outside `C:\3d`.
- One obsolete VS Code OpenAI extension folder and a small set of Temp files remain locked by active processes.
- Product-owner review of `C:\qa\visual-evidence\20260626-050056-gala-opening-interior-floor-performance-remediation-local` is still required before any local visual acceptance can be recorded.
- No acceptance record has been created.
- No staging deploy is allowed until explicitly requested.
- `architectureAuditPassed=false`.
- `singleSourceRendererProven=false`; this remediation proves scoped wall/opening/floor/performance behavior, not full renderer unification.

## Next Step

Close active Codex/VS Code Codex processes, remove the regenerated live `.codex` runtime files plus the locked obsolete extension/temp leftovers, then decide whether `C:\3d-lfs-clean` should be archived or deleted so `C:\3d` stays the only canonical working tree.

## 2026-06-26 Repository Architecture Audit Handoff

- Objective completed this turn: inspected the canonical root Vite SPA, `backend-server`, expo runtime, modular-home GALA renderer path, build/boundary tooling, and current task/audit docs to prepare an architect-planner prompt for Claude Opus 4.6.
- Key finding: root Vite SPA and `backend-server` still validate, but the worktree is heavily dirty across release frontend, backend, Supabase temp state, deployment/signaling, and optional Unreal paths. Stabilization and change ownership should precede new modular-home feature work.
- Key finding: GALA modular-home rendering is ownership-contracted, not single-source. `GalaConstructionModel.ts` is an adapter, while physics/collision, DOM overlays, route state, door runtime, and roof rendering remain separate documented owners.
- Key finding: modular-home implementation has oversized mixed-responsibility files, including `ModularHomeModel.tsx`, `ModularHomeDemoOverlay.tsx`, and `modularHomeProducts.ts`; refactoring should extract seams without changing runtime behavior first.
- Key finding: backend `tsconfig.json` intentionally compiles parts of root `src/**` into `backend-server/dist`; this should be audited as a release-packaging boundary and compared against `tsconfig.docker.json`.
- Validation run this turn:
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run check:backend-boundaries` passed.
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed for the root frontend; expected large chunk warning remains for `Expo3D` and `three-vendor`.
  - `npm.cmd run build` in `backend-server` failed inside the sandbox with `EPERM` writes to `backend-server/dist`, then passed outside the sandbox.
- Touched files this turn:
  - `docs/CURRENT_TASK.md`
- Next recommended step: give Claude Opus 4.6 the planner prompt from this audit and require a staged plan that first freezes canonical runtime/change ownership, then audits modular-home renderer unification, then proposes minimal implementation packs with explicit validation gates.

## 2026-06-27 GALA GLTF Furniture Upgrade

- Replaced the living-room sofa and coffee-table block compositions with the supplied 1K GLTF assets.
- Replaced the bedroom wardrobe block composition with the supplied painted cabinet GLTF.
- Added reusable Drei `useGLTF` and `Clone` wrappers in `GalaInteriorFurniture.tsx`; cached scenes are not manually cloned or mutated, and cloned meshes cast and receive shadows.
- Connected the wrappers to the active `GalaRoomAssembly` renderer while preserving room, furniture-clearance, and semantic group metadata.
- Scaled the models against the existing `GALA_FURNITURE_LAYOUT` envelopes and removed the replaced active placeholder meshes.
- Validation passed: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run check:expo-boundaries`, and `qa-gala-furniture-clearance-audit.mjs` against `http://127.0.0.1:4174`.
- Runtime scene inventory confirmed the sofa, coffee-table, and cabinet GLTF mesh names are present and the replaced placeholder mesh names are absent.

## 2026-06-27 GALA AO Lighting Upgrade

- Added home-studio scoped `@react-three/postprocessing` integration in `ExpoWorldSceneLayers.tsx` using `EffectComposer` and `N8AO`.
- Configured this installed postprocessing version with `enableNormalPass={false}` for N8AO.
- Preserved anti-aliasing on the postprocess path with `multisampling={4}` for WebGL2 and `SMAA` fallback for WebGL1.
- Kept AO disabled for low-quality and runtime-capture paths, and did not enable the composer in the sponsor boulevard path.
- Passed WebGL mode from `ExpoWorldCanvasShell.tsx` into scene layers so the composer can select the correct AA path.
- Enabled quality-gated cast shadows on the home-studio directional light and added shadow camera bounds, bias, and normal bias to reduce panel acne in high-quality mode.
- Validation passed: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run check:expo-boundaries`.
- Browser runtime smoke passed against local preview for `/modular-homes/studio?view=interior&homeStudio=1&qa3d=1&quality=high`: status 200, no console/page/request errors, canvas rendered, modular home visible, GLTF furniture present.
- Furniture clearance QA passed after the AO change against local preview.
- Visual design-intent QA loaded both exterior and interior routes and captured screenshots, but still failed the pre-existing interior palette/furniture intent assertions (`interiorUsesSameWoodTone=false`, `furnitureFixtureIntentAcceptable=false`); this was not a route load or postprocessing runtime failure.
- Touched files:
  - `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
  - `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
  - `docs/CURRENT_TASK.md`

## 2026-06-27 GALA Full PBR Texture Pass

- Extended the existing `useGalaConstructionPbrTextures` triplanar material path across the active GALA construction renderer instead of using `texture.repeat`.
- Kept the physical material scale at `triplanarScale: 0.5`, so each 1K texture represents a 2m x 2m world-space tile.
- Adjusted only the floor and terrace deck triplanar scales to `0.35` so plank boards read larger; roof and ground remain at `0.5`.
- Fixed the interior wall texture set to use `wood_plank_wall_1k`, because `brown_planks_03_1k` does not include an ARM map.
- Applied PBR map sets to:
  - interior wall/core/floor paths already using the primitive material path
  - exterior cladding and gable board instances with `weathered_plank_siding_1k`
  - roof planes with `box_profile_metal_sheet_1k`
  - home-studio outside ground with `forest_ground_05_1k`
  - terrace deck and steps with `wood_floor_deck_1k`
- Added `rotation` support to `GalaConstructionBox` so sloped roof planes can use the existing triplanar shader.
- Removed the remaining dead floor seam calculations after the visible floor seam overlays had already been removed.
- Validation passed: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run check:expo-boundaries`, and `npm.cmd run check:all`.
- Browser texture smoke passed against local preview for exterior and interior GALA studio routes: all expected wall/floor/facade/roof/ground/deck texture URLs returned 200, no console/page/request errors, and PBR-tagged roof/ground/terrace objects were present.
- Touched files:
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/GalaRoof.tsx`
  - `src/modules/expo/runtime/world/WorldGroundPlane.tsx`
  - `docs/CURRENT_TASK.md`

## 2026-06-27 GALA Furniture Pivot and Bed PBR Pass

- Reworked `GalaInteriorFurniture.tsx` GLTF furniture wrappers to clone the cached `useGLTF` scenes safely, traverse the clone, and set `castShadow` / `receiveShadow` on every mesh without mutating the global Drei cache.
- Added the requested bottom-pivot correction wrapper for GLTF furniture by offsetting the primitive group by `-originalBoxSizeY / 2`.
- Updated active `GalaRoomAssembly.tsx` living sofa and coffee-table placement to pass center-based positions and original placeholder envelopes so the pivot offset no longer sinks the models into the floor.
- Rotated the bedroom wardrobe/cabinet to face into the room and applied the same center/pivot placement in both the active construction renderer and reusable interior furniture path.
- Added rounded bed helpers using Drei `RoundedBox`, fabric PBR maps from `quatrefoil_jacquard_fabric_1k`, and maple PBR maps from `white_maple_veneer_1k`.
- Replaced the active construction mattress and pillows with rounded fabric PBR boxes and the headboard with a rounded maple PBR box while preserving clearance/guidance userData and local bounds metadata.
- Checked `GalaOpeningAssembly.tsx`; exterior doors there are primitive `GalaConstructionBox` slabs, not GLTF models, so no GLTF pivot fix was needed in that file.
- Validation passed: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run check:expo-boundaries`.
- Furniture clearance QA passed against local preview at `http://127.0.0.1:4178`; evidence written to `artifacts/gala-furniture-pivot-bed-pbr-clearance`.
- Browser asset smoke passed against local preview at `http://127.0.0.1:4180`: sofa, coffee-table, cabinet, fabric, and maple assets loaded with no page/console/request errors.
- Touched files:
  - `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
  - `docs/CURRENT_TASK.md`

## 2026-06-27 GALA Window Conflict and AO Normal Pass Fix

- Removed the bedroom TV mesh from the reusable bedroom furniture path and the active construction room assembly so it no longer blocks the north bedroom window.
- Removed the unused `bedroom-tv-north-wall` anchor and `bedroomTv` layout entry from `GalaConstructionModel.ts`.
- Moved and resized the bathroom shower back panel and side glass panel in the shared construction layout so they sit on the solid south-wall section and no longer overlap the `W-BATH` window cutout.
- Mirrored the shower panel placement fix in `GalaInteriorFurniture.tsx`; there is no separate `GalaBathroomFurniture.tsx` file in the current tree.
- Updated the home-studio AO composers in `ExpoWorldSceneLayers.tsx` to enable the installed package's normal pass API (`enableNormalPass`) and retuned N8AO radius/intensity for tighter furniture contact and corner darkening.
- Validation passed: `npm.cmd run build`, `npm.cmd run lint`, `npm.cmd run check:expo-boundaries`.
- Furniture clearance QA passed against local preview at `http://127.0.0.1:4181`; evidence written to `artifacts/gala-window-conflict-ao-clearance`.
- Focused browser smoke passed against local preview at `http://127.0.0.1:4183`: bedroom TV mesh absent, shower panel meshes present, no page/console/request errors.
- Touched files:
  - `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
  - `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
  - `docs/CURRENT_TASK.md`

## 2026-06-28 GALA Owner Rejection Structural And Motion Remediation

- Implemented the owner-rejection remediation locally in the canonical root Vite SPA GALA construction renderer only.
- No backend, auth, quote/payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy behavior was changed.
- `productVisualAccepted=false`.
- `stagingDeployAllowed=false`.

### Exact Structural Values

- Canonical GALA finished floor:
  - `finishedFloorTopY=0.18m`
  - `finishedFloorThicknessM=0.08m`
  - `floorBottomY=0.10m`
  - structural floor center `0.14m`
  - visible local plank surface `0.184m`
- Foundation/base/terrace/threshold alignment:
  - foundation slab top `-0.10m`, slab height `0.16m`, slab center `-0.18m`
  - lower exterior base trim top `0.15m`, trim height `0.15m`, trim center `0.075m`
  - terrace deck top `0.18m`, deck thickness `0.15m`, deck center `0.105m`
  - exterior door threshold top `0.186m`, threshold height `0.035m`, threshold center `0.1685m`
  - GALA camera/player eye height `1.83m` plan Y, `9.882` world Y at preview scale `5.4`
- Bathroom/living wall and bathroom door envelope:
  - bathroom west partition remains at plan X `5.15m`
  - bathroom north partition remains at plan Z `0m`, from plan X `5.15m` to `7.20m`
  - bathroom door visual/opening/gap envelope is now one source: plan X `5.95-6.85m`, plan Z `-0.08-0.72m`
  - left bathroom north wall return `0.80m`; right return `0.35m`
  - closed bathroom door collision slab: plan X `5.95-6.85m`, plan Z `-0.0868-0.0868m`
- Bedroom bed envelope:
  - active bed frame center `[3.55, 0.34, -1.45]`, size `[1.96, 0.22, 1.86]`
  - plan footprint approx X `7.67-9.63m`, Z `-2.38--0.52m`
  - mattress center `[3.55, 0.57, -1.45]`, size `[1.82, 0.22, 1.74]`
  - blanket center `[3.55, 0.75, -0.92]`, size `[1.42, 0.09, 0.66]`
  - pillows center Z `-2.14m`, headboard center `[3.55, 0.85, -2.405]`, bedside cabinet center `[2.36, 0.45, -2.03]`
- Opening flicker geometry stabilization:
  - wall/opening sill heights now resolve from `finishedFloorTopY + opening.sillM`
  - casing center offsets moved out to `+/-0.106m` from wall center, separated from finished wall/cladding faces
  - transparent glass uses stable `depthWrite=false` and `renderOrder=4`

### Evidence Paths

- Furniture/bed/bath clearance:
  - `artifacts/gala-owner-rejection-furniture-clearance/qa-gala-furniture-clearance-result.json`
  - `artifacts/gala-owner-rejection-furniture-clearance/furniture-clearance-after.png`
  - `artifacts/gala-owner-rejection-furniture-clearance/bathroom-fixture-clearance-after.png`
- Floor/ground/floor-color stability:
  - `artifacts/gala-owner-rejection-floor-level/qa-gala-floor-ground-isolation-result.json`
  - `artifacts/gala-owner-rejection-floor-level/floor-after-stable-near.png`
  - `artifacts/gala-owner-rejection-floor-level/floor-after-stable-backward-motion.png`
- Opening clip/static exterior aperture evidence:
  - `artifacts/gala-owner-rejection-opening-clip/qa-gala-opening-clip-result.json`
  - `artifacts/gala-owner-rejection-opening-clip/exterior-after-clean-vertical-boards.png`
  - `artifacts/gala-owner-rejection-opening-clip/exterior-open-door-after-clear-portal.png`
- Real-user walk physics:
  - `artifacts/gala-owner-rejection-real-user-walk/qa-real-user-walk-result.json`
  - closed/open entry, bedroom, and bathroom door before/after frames under `artifacts/gala-owner-rejection-real-user-walk/after/manual-repro/`
- Required motion opening flicker evidence:
  - `artifacts/gala-owner-rejection-motion-openings/qa-gala-opening-motion-flicker-result.json`
  - six-frame movement sequences under:
    - `artifacts/gala-owner-rejection-motion-openings/D-ENTRY/`
    - `artifacts/gala-owner-rejection-motion-openings/D-TERRACE/`
    - `artifacts/gala-owner-rejection-motion-openings/D-BATHROOM/`
    - `artifacts/gala-owner-rejection-motion-openings/D-BEDROOM/`
    - `artifacts/gala-owner-rejection-motion-openings/W-KITCHEN/`
    - `artifacts/gala-owner-rejection-motion-openings/W-BATH/`
    - `artifacts/gala-owner-rejection-motion-openings/W-BED/`
    - `artifacts/gala-owner-rejection-motion-openings/W-WEST-A/`
    - `artifacts/gala-owner-rejection-motion-openings/W-WEST-B/`

### Validation Results

- `node --check scripts/qa-gala-opening-motion-flicker-audit.mjs` passed.
- `node --check scripts/qa-gala-real-user-walk-physics.mjs` passed.
- `npm.cmd run lint` passed.
- `npm.cmd run build` passed; existing Vite large chunk warning remains.
- `npm.cmd run check:expo-boundaries` passed.
- `npm.cmd run check:all` passed.
- `node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-furniture-clearance` passed:
  - `wallIntersectionsDetected=false`
  - `throughWallVisibilityDetected=false`
  - `pass=true`
- `node scripts/qa-gala-floor-ground-isolation-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-floor-level` passed:
  - `blueVoidOrGroundVisibleInside=false`
  - `floorColorStableDuringBackwardMovement=true`
  - `pass=true`
- `node scripts/qa-gala-opening-clip-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-opening-clip` passed:
  - `boardsVisibleThroughWindowFrames=false`
  - `boardsInsideDoorPortal=false`
  - `pass=true`
- `node scripts/qa-gala-real-user-walk-physics.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-real-user-walk` passed:
  - `qa3d=false`
  - `realUserMode=true`
  - `walkSpeedPass=true`
  - `wallCollisionPass=true`
  - `doorTraversalPass=true`
  - `bathroomDoorClosedBlocks=true`
  - `bathroomDoorOpenPasses=true`
  - `pass=true`
- `node scripts/qa-gala-opening-motion-flicker-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-motion-openings` passed:
  - route count `9`
  - each route captured `6` movement frames
  - `movementExercised=true` for every listed opening
  - `materialStateStable=true` for every listed opening
  - `automatedFlickerDetected=false` for every listed opening
  - `requiresHumanReview=true` remains recorded because visual flicker/z-fighting is ultimately verified by reviewing the motion frame sequences

### Touched Files

- `docs/CURRENT_TASK.md`
- `scripts/qa-gala-opening-motion-flicker-audit.mjs`
- `scripts/qa-gala-real-user-walk-physics.mjs`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`

## 2026-06-29 Modular Home Studio Lead-Gen UX Phase 0

- Active objective: make `/modular-homes/studio?homeStudio=1` more consumer-facing and lead-gen oriented without touching 3D, renderer, material, camera, movement, backend, auth, quote-submit, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy systems.
- Implementation status:
  - Reduced the visible `ModularHomeDemoOverlay` tabs to `Design`, `Cena / Estimate`, and `Pieprasīt piedāvājumu / Quote`.
  - Kept the former Overview, BOM, Projects, and Upload panels behind a `Pro skats` advanced toggle.
  - Added a fixed live price banner mounted by `ModularHomeDemoOverlay`, showing base price from `estimate.basePrice`, live total from `estimate.totalPrice`, and a `Saņemt cenu` CTA that switches to the quote tab.
  - Split configurator options into six primary groups: facade, roof, terrace, floor finish, interior wall finish, and furniture package.
  - Moved all remaining configurator groups into a collapsed `Vairāk opciju` section.
  - Hid visible constraint, production severity, production readiness, and review-warning text from the visitor view while preserving existing QA/data attributes as hidden metadata.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx`
  - `src/modules/expo/runtime/modularHome/ConfiguratorOptionsPanel.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.
- Next step: run browser visual QA for the studio overlay if product-owner confirmation of the lead-gen flow is required.

## 2026-06-29 Modular Home Studio PBR Option Variants

- Active objective: make `/modular-homes/studio?homeStudio=1` facade, floor, interior-wall, trim, frame, and roof-edge options produce visible material changes without changing camera, movement, construction geometry, collision, or door runtime.
- Asset audit and mapping:
  - `naturalTimber` facade -> `weathered_plank_siding_1k`.
  - `darkThermoWood` facade -> `black_painted_planks_1k`.
  - `lightPainted` facade -> `white_planks_clean_1k`.
  - `plywood` floor -> `plank_flooring_04_1k`.
  - `oakLaminate` floor -> `wooden_floor_02_1k`.
  - `polishedConcrete` floor -> `wood_floor_1k` plus grey tint fallback because no complete concrete PBR set exists.
  - `plywood/plain` interior walls -> `wood_plank_wall_1k`.
  - `warmPanel/ribbed` interior walls -> `white_maple_veneer_1k`.
  - `paintedWhite/paintReadyBoard` interior walls -> `white_planks_clean_1k`.
  - Complete PBR sets were only used where diffuse, normal, and ARM maps exist. Incomplete candidates such as `brown_planks_03_1k`, `plank_flooring_1k`, and `weathered_planks_1k` were not mapped as variants.
- Implementation status:
  - Generalized `useGalaConstructionPbrTextures(kind, variant?)` so exterior, floor, and interior-wall materials can resolve reusable texture variants while preserving WeakMap texture caching and repeat/triplanar handling.
  - Extended `GalaHouseVisualConfig`, `resolveGalaHouseVisualConfigFromModularHomeConfig`, and `resolveGalaWallSkin` to carry exterior, floor, and interior-wall texture variant ids.
  - Passed selected variants through cladding, wall, floor/ceiling, corner board, and gable board material call sites.
  - Wired facade, floor finish, wall panel/interior wall finish, window frame color, trim color, and roof edge color into visible material output.
- Evidence:
  - `artifacts/gala-pbr-option-variants/exterior-before-default.png`
  - `artifacts/gala-pbr-option-variants/exterior-after-dark-facade-white-trim-bronze-roof-edge.png`
  - `artifacts/gala-pbr-option-variants/interior-before-default.png`
  - `artifacts/gala-pbr-option-variants/interior-after-oak-floor-painted-wall.png`
  - `artifacts/gala-pbr-option-variants/capture-result.json`
  - Screenshot capture recorded `badAssetResponses=[]`, `consoleErrors=[]`, `pageErrors=[]`, and `requestFailures=[]`.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
  - `artifacts/gala-pbr-option-variants/capture-screenshots.mjs`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, or deploy changes were made.

## 2026-06-29 Modular Home Studio Lead-Gen Mechanics Phase 2

- Active objective: add low-friction lead-gen mechanics on top of `/modular-homes/studio?homeStudio=1` without changing backend, endpoint contracts, analytics SDKs, camera, movement, construction geometry, collision, or door runtime.
- Implementation status:
  - Added top-of-Design-panel style presets built as full `ModularHomeConfiguratorState` values from `DEFAULT_MODULAR_HOME_CONFIG` plus the active product default config.
  - Added `Natural`, `Nordic light`, and `Dark premium` preset buttons that update facade, floor, interior wall, trim, frame, terrace, roof, and furniture style selections in one click.
  - Added overlay interaction-count state and a dismissible quote nudge after four option interactions or a visitor-initiated `Start inside` action.
  - Added the nudge CTA text `Patīk? Saņem precīzu cenu →`, which switches to the quote tab, and kept the nudge inside the overlay so it does not block the 3D canvas outside the HUD.
  - Added a primary Design-panel share CTA labeled `Saglabā / kopīgo savu māju` that copies the existing canonical `createModularHomeShareUrl` URL.
  - Kept the existing share-link panel and URL-only/manual fallback behavior.
  - Shortened the quote form so only email and phone are required and immediately visible.
  - Moved name, country/city, land status, target date, budget, and message into a collapsed optional-details section while preserving existing `data-home-quote-field` hooks.
  - Preserved the quote submission payload shape; config, selected options, estimate, consent text, and requester fields still auto-attach to local/backend submit paths.
- Share restore confirmation:
  - Ran a focused `tsx` encode/decode check for a copied share URL and confirmed facade, floor finish, interior wall finish, trim color, window frame color, and `interior` view mode restore from the URL.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/ConfiguratorOptionsPanel.tsx`
  - `src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx`
  - `src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, deploy, camera, movement, geometry, collision, or door-runtime changes were made.

## 2026-06-29 Modular Home Studio Geometry Variants Phase 3

- Active objective: make low-risk `/modular-homes/studio?homeStudio=1` terrace and roof-edge selections visibly change 3D geometry while keeping camera/FOV/lookAt, movement physics, collision segments, and door runtime intact.
- Implementation status:
  - Added resolved visual config fields for `terrace:none`, `terrace:extendedTerrace`, and `roofGutterStyle` so the construction model can receive enumerated terrace and roof profile variants.
  - Added `roof` and `terrace` submodels to `GALA_CONSTRUCTION_MODEL`, with default roof/terrace constants and a typed `GalaConstructionModel` export.
  - Changed `resolveGalaConstructionModelForVisualConfig(config)` to return additive model variants instead of ignoring config.
  - Mapped no terrace to no rendered deck, front deck to the compact deck, extended terrace to a larger deck with steps, and covered terrace to a larger deck with light rail.
  - Added visible box and round gutter geometry, plus flatter roof rise/pitch for the flat-roof visual option.
  - Fed the resolved roof model into `GalaRoof` and the terrace model into `ResidentialTerrace`; gable cladding now follows the selected roof rise.
  - Kept app movement physics, camera/FOV/lookAt, floorplan collision segments, and door interaction/runtime behavior unchanged for this phase.
  - Adjusted bathroom shower riser/head fixture positions to clear the current rendered partition after the clearance QA surfaced a small fixture overlap.
  - Aligned `scripts/qa-gala-real-user-walk-physics.mjs` constants with the current rendered/floorplan bathroom partition and finished-floor eye height so the audit checks the same geometry as runtime.
- Evidence:
  - `artifacts/gala-geometry-variants/visual-variants/terrace-before-default-front-deck.png`
  - `artifacts/gala-geometry-variants/visual-variants/terrace-after-no-terrace.png`
  - `artifacts/gala-geometry-variants/visual-variants/terrace-after-extended-deck.png`
  - `artifacts/gala-geometry-variants/visual-variants/roof-after-flat-box-gutter-bronze.png`
  - `artifacts/gala-geometry-variants/visual-variants/roof-after-flat-round-gutter-light-metal.png`
  - `artifacts/gala-geometry-variants/visual-variants/capture-result.json`
  - Capture evidence recorded `badAssetResponses=[]`, `consoleErrors=[]`, `pageErrors=[]`, and `requestFailures=[]`.
  - Mesh evidence confirms default terrace deck bounds are present, `terrace:none` removes the configurable deck, extended terrace increases deck bounds and step meshes, and box/round gutter options create `box-gutter` and `round-gutter` meshes.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
  - `node artifacts/gala-geometry-variants/capture-geometry-variants.mjs` passed against Vite preview.
  - `node scripts/qa-gala-real-user-walk-physics.mjs --base-url=http://127.0.0.1:4190 --out-dir=artifacts/gala-geometry-variants/real-user-walk` passed with `pass=true`.
  - `node scripts/qa-gala-opening-clip-audit.mjs --base-url=http://127.0.0.1:4190 --out-dir=artifacts/gala-geometry-variants/opening-clip` passed with `pass=true`.
  - `node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=http://127.0.0.1:4190 --out-dir=artifacts/gala-geometry-variants/furniture-clearance` passed with `pass=true`.
  - `node scripts/qa-gala-opening-motion-flicker-audit.mjs --base-url=http://127.0.0.1:4190 --out-dir=artifacts/gala-geometry-variants/opening-motion` passed with `pass=true`; generated frames still carry the script's human-review note for visual flicker review.
- Touched files:
  - `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts`
  - `src/modules/expo/runtime/modularHome/GalaHouseShell.tsx`
  - `src/modules/expo/runtime/modularHome/GalaRoof.tsx`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
  - `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
  - `scripts/qa-gala-real-user-walk-physics.mjs`
  - `artifacts/gala-geometry-variants/capture-geometry-variants.mjs`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, deploy, app camera/FOV/lookAt, app movement-physics, floorplan collision-segment, or door-runtime changes were made in this phase.

## 2026-06-29 Release Roadmap Phase 0 Pack 0.1 Worktree Baseline

- Active objective: establish a clean, attributable baseline on `feat/booth-camera-screen-feed-current` by triaging the dirty tracked worktree into coherent subsystem commits without altering behavior.
- Implementation status:
  - Ran `git status --short` and `git diff --stat` to enumerate tracked changes and untracked debris.
  - Grouped the dirty tree into subsystem commits:
    - `42df4bc feat(gala): stabilize modular home studio runtime`
    - `9b34312 feat(expo): align home studio scene runtime`
    - `3e89abf build(vite): dedupe 3d runtime packages`
    - `7125d9f test(gala): update studio qa audits`
    - `docs(release): record v1 roadmap baseline` for this task-log entry and release-roadmap docs.
  - Included required `public/models/gala` extracted GLTF/bin files and force-added the ignored PBR/GLTF texture maps needed by the committed runtime.
  - Left generated `artifacts/` evidence and ignored source zip archives out of Pack 0.1; root/audit debris quarantine remains Pack 0.2 work.
- Validation:
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:all` passed:
    - `check:expo-boundaries` passed with 0 violations.
    - `check:backend-boundaries` passed with 0 violations.
    - `check:backend-shared-boundaries` passed with 0 violations.
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
- Touched files:
  - `src/modules/expo/runtime/modularHome/**`
  - `src/modules/expo/runtime/world/**`
  - `src/modules/expo/runtime/app/Expo3D.tsx`
  - `public/models/gala/**`
  - `scripts/qa-gala-*.mjs`
  - `vite.config.ts`
  - `docs/CURRENT_TASK.md`
  - `docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md`
  - `docs/GALA_LEADGEN_PLAN.md`
  - `docs/GALA_OWNER_REJECTION_STRUCTURAL_MOTION_PLAN.md`
  - `docs/RELEASE_ROADMAP_V1.md`
  - `docs/RELEASE_ROADMAP_V1_IMPLEMENTER_PROMPTS.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No staging, production deploy, backend auth, quote-submit behavior, payment behavior, or sponsor-boulevard release path changes were made by Pack 0.1.
- Next step:
  - Run Phase 0 Pack 0.2 to quarantine root audit/debug artifacts and tighten ignore rules for generated debris.

## 2026-06-29 Release Roadmap Phase 0 Pack 0.2 Root Artifact Quarantine

- Active objective: quarantine root-level audit/debug debris into `docs/recovery/2026-06-29-audit-archive/` and tighten ignore rules for generated artifacts without product behavior changes.
- Implementation status:
  - Moved the listed root audit/status/trace/remediation files into `docs/recovery/2026-06-29-audit-archive/`.
  - Used `git mv` for tracked root artifacts so their history remains attributable.
  - Moved ignored local root screenshots and temporary logs into the same local archive folder on disk; they remain ignored by the existing global screenshot/log patterns.
  - Added explicit ignore coverage for `artifacts/`, `tmp-*.stderr.log`, `tmp-*.stdout.log`, and root `ss*.png` while keeping `artifacts/root-archive/` ignored.
  - Moved the pre-existing untracked duplicate `public/models/gala/plank_flooring_04_1k.gltf (1)/` extraction into ignored `artifacts/root-archive/2026-06-29-audit-archive/` after confirming no source references.
- Validation:
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
  - `git status --short` showed only the intended `.gitignore` edit and tracked artifact renames after local debris quarantine.
  - Exact filename `rg` check across `src`, `backend-server`, `scripts`, `public`, `supabase`, package/config files returned `NO_SOURCE_REFERENCES`.
  - Root artifact presence check returned `ROOT_ARTIFACTS_MOVED`.
- Touched files:
  - `.gitignore`
  - `docs/recovery/2026-06-29-audit-archive/AUDIT.md`
  - `docs/recovery/2026-06-29-audit-archive/AUDIT_STATUS_AFTER_WALL_SKIN_REMEDIATION.json`
  - `docs/recovery/2026-06-29-audit-archive/CLADDING_ARCHITECTURE_CONFLICT_AUDIT.md`
  - `docs/recovery/2026-06-29-audit-archive/CLADDING_OWNER_TRACE.json`
  - `docs/recovery/2026-06-29-audit-archive/FILES_CHANGED.txt`
  - `docs/recovery/2026-06-29-audit-archive/INTERIOR_PERFORMANCE_GEOMETRY_AUDIT.md`
  - `docs/recovery/2026-06-29-audit-archive/INTERIOR_PERFORMANCE_GEOMETRY_OWNER_TRACE.json`
  - `docs/recovery/2026-06-29-audit-archive/MANUAL_WALL_SKIN_REVIEW.md`
  - `docs/recovery/2026-06-29-audit-archive/OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md`
  - `docs/recovery/2026-06-29-audit-archive/OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json`
  - `docs/recovery/2026-06-29-audit-archive/PROJECT_CONTEXT_LOCK.md`
  - `docs/recovery/2026-06-29-audit-archive/VISUAL_DESIGN_INTENT_REMEDIATION.md`
  - `docs/recovery/2026-06-29-audit-archive/VISUAL_MATERIAL_OWNER_MATRIX.json`
  - `docs/recovery/2026-06-29-audit-archive/VISUAL_REGRESSION_ARCHAEOLOGY.md`
  - `docs/recovery/2026-06-29-audit-archive/WALL_SKIN_ARCHITECTURE_AUDIT.md`
  - `docs/recovery/2026-06-29-audit-archive/WALL_SKIN_OWNER_TRACE.json`
  - `docs/recovery/2026-06-29-audit-archive/diagnostics_output.txt`
  - `docs/recovery/2026-06-29-audit-archive/modular-home-studio-detail-upgrade-final-entries.txt`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No frontend runtime, backend, auth, quote-submit API, payment, sponsor boulevard, Unreal, Pixel Streaming, staging, deploy, camera, movement, geometry, collision, or door-runtime changes were made.
- Next step:
  - Commit Pack 0.2, then run Phase 0 Pack 0.3 only after the Pack 0.2 tree is clean.

## 2026-06-29 Release Roadmap Phase 0 Pack 0.3 Release Baseline Pin

- Active objective: create `release/v1-stabilization`, tag the freeze commit as `v1-baseline`, and record a reproducible release baseline.
- Implementation status:
  - Confirmed the Pack 0.2 working tree was clean on `feat/booth-camera-screen-feed-current`.
  - Created branch `release/v1-stabilization` from freeze commit `f4244e8a3d4f6c27da22bdb5087b682f74cdc190`.
  - Created annotated tag `v1-baseline`; `git rev-parse "v1-baseline^{}"` resolves to `f4244e8a3d4f6c27da22bdb5087b682f74cdc190`.
  - Added `docs/RELEASE_BASELINE.md` with the current commit SHA, build chunk sizes, `check:all` summary, and backend TypeScript gate results.
- Validation:
  - `npm.cmd run build` passed; existing Vite large-chunk warning remains.
  - `npm.cmd run check:all` passed:
    - `check:expo-boundaries` passed with 0 violations.
    - `check:backend-boundaries` passed with 0 violations.
    - `check:backend-shared-boundaries` passed with 0 violations.
  - In `backend-server`, `npx.cmd tsc --noEmit -p tsconfig.json` passed with no compiler output.
  - In `backend-server`, `npx.cmd tsc --noEmit -p tsconfig.docker.json` passed with no compiler output.
  - Branch/tag verification passed: `release/v1-stabilization` exists and `v1-baseline` points at the freeze commit.
- Touched files:
  - `docs/RELEASE_BASELINE.md`
  - `docs/CURRENT_TASK.md`
- Product/release status:
  - `productVisualAccepted=false`.
  - No frontend runtime, backend behavior, auth, quote-submit API, payment, sponsor boulevard camera/FOV/lookAt, Unreal, Pixel Streaming, staging, deploy, or production promotion changes were made.
- Next step:
  - Start Phase 1 Pack 1.1 to reconcile GALA renderer active-vs-legacy ownership on `release/v1-stabilization`.
