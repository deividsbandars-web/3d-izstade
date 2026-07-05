# GALA Geometry And Texture Remediation Plan

## Objective

Plan the next GALA visual remediation pass from the 2026-06-28 owner screenshots without changing runtime behavior in this planning turn.

The target is the canonical root Vite SPA modular-home studio route:

- `/modular-homes/studio?view=exterior&homeStudio=1`
- `/modular-homes/studio?view=interior&homeStudio=1`

Do not move this work into `apps/frontend`, Unreal, Pixel Streaming, or any alternate renderer.

## Evidence Reviewed

Owner screenshots around local `localhost:5173` showed:

- Interior wall faces still read as heavy exterior-like ribbed cladding.
- Finished floor and terrace/deck/threshold materials read as inconsistent blocks instead of a coherent house floor system.
- Door and window casing/reveal/leaf pieces are still mostly flat solid color, with no visible wood texture.
- The living sofa/coffee table and bedroom/furniture modules need a stricter clearance and module fit pass.
- The walkable camera view reads too wide, stretched, and tilted in close interiors.
- Current QA can pass while screenshot-visible issues remain, especially for GLTF furniture bounds and material fidelity on opening trim.

## Root Cause Map

### 1. Wall material is shared too broadly

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`

Root cause:

- `GalaWallAssembly` applies the same `wall` PBR texture set to wall core cells, exterior interior faces, and partition faces.
- The texture set is `wood_plank_wall_1k` with triplanar sampling. Even without physical interior board instances, the material still visually reads as dense vertical exterior cladding.
- Core cells and finished faces are both visible around openings, so material repetition and side projections amplify the ribbed look.

Fix direction:

- Split material intent into at least two PBR kinds:
  - `wallCore` or neutral structural material for hidden/opening edge mass.
  - `interiorWall` for clean finished interior wall faces with reduced normal strength and calmer texture.
- Keep exterior board geometry and exterior PBR only in `GalaCladdingAssembly`.
- Avoid reintroducing interior board relief unless product explicitly approves it.

### 2. Floor is one triplanar box, not a purpose-built finished surface

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`

Root cause:

- The finished floor is a single `GalaConstructionBox` using world-space triplanar mapping.
- Triplanar is useful for arbitrary construction boxes, but for the main floor it projects texture onto top and side faces from world position rather than floor-local UV intent.
- Threshold/deck pieces use separate materials, so the doorway area reads as stacked material islands.

Fix direction:

- Keep one structural floor slab, but render the visible floor as a dedicated top finish surface or a specialized horizontal material helper.
- Give the finished floor local, stable plank direction and repeat scale.
- Keep threshold geometry deliberate and thin; do not let deck or ground material leak into the interior floor read.

### 3. Doors and window frames are not on the PBR texture path

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`

Root cause:

- `GalaOpeningAssembly` uses `trimMaterial` and `revealMaterial`, but those currently provide numeric physical material properties only.
- Door leaves, jamb liners, casing, sill/header liners, and thresholds mostly fall back to flat color.
- Available local assets already include useful texture sets:
  - `public/models/gala/rough_pine_door_1k/textures/*`
  - `public/models/gala/wood_shutter_1k/textures/*`
  - `public/models/gala/white_maple_veneer_1k/textures/*`

Fix direction:

- Add shared PBR texture kinds for `door`, `trim`, and optionally `lightTrim`.
- Apply `door` maps to closed/open door slabs.
- Apply `trim` maps to window and door casing, jamb liners, headers, sills, and thresholds.
- Keep glass opacity/transparency logic unchanged unless a screenshot specifically rejects it.

### 4. Furniture modules need layout and audit ownership tightened

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
- `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`
- `scripts/qa-gala-furniture-clearance-audit.mjs`

Root cause:

- `GALA_FURNITURE_LAYOUT` owns placements, but some rendered GLTF modules apply additional per-component scale and pivot assumptions.
- `FurnitureGltfModel` adds user data at group level, while QA often audits mesh inventory and local bounds. That can miss real visual envelopes for sofa/table/cabinet GLTF objects.
- The living sofa and coffee table visually sit too tight, and the bed/wardrobe/door zones need clearance verified from actual rendered bounds, not only intended layout boxes.

Fix direction:

- Add explicit `constructionLocalBounds`, `constructionLocalPosition`, and `constructionLocalSize` to GLTF furniture groups or add invisible QA proxy boxes that are not rendered.
- Make `GalaRoomAssembly` consume `GALA_FURNITURE_LAYOUT` without hidden scale drift from layout envelopes.
- Move living coffee table farther out of the sofa envelope and recheck bedroom/door walk paths.

### 5. QA expectations are partly stale

Owners:

- `scripts/qa-gala-visual-design-intent-audit.mjs`
- `scripts/qa-gala-construction-renderer.mjs`
- `scripts/qa-gala-furniture-clearance-audit.mjs`

Root cause:

- Some audits still look for older design-intent signals such as interior board instances, floor seams, ceiling seams, or removed trim even though recent remediation intentionally removed those elements.
- QA can report pass for ownership and performance while material texture fidelity remains visually unacceptable.

Fix direction:

- Reconcile QA with the latest accepted target before using it as product-visual acceptance.
- Add checks for:
  - door leaf material has diffuse/normal/roughness or ARM maps.
  - window/door trim and reveal material has texture maps.
  - GLTF furniture clearance subjects have measurable construction bounds.
  - interior wall faces are clean, not exterior-cladding-like.

### 6. Walkable camera FOV and pitch are still tuned like broad expo viewing

Owners:

- `src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx` for QA-only fixed shots

Root cause:

- The live canvas camera currently starts with a broad perspective path: desktop `fov: 60`, touch `fov: 66`.
- Home-studio start views aim from human eye height at close interior targets, so a broad FOV exaggerates nearby walls, door frames, floor planks, and furniture.
- The movement code clamps roll to zero during user turning, but the initial `lookAt` pitch can still produce a visibly tilted/downward composition if the target is too close or too low.
- QA fixed shots use separate values (`50` and `58`) in `Expo3DQAHook`, so changing only QA presets will not fix the real walkable screenshot path.

Fix direction:

- Add a home-studio scoped camera profile rather than changing the sponsor boulevard baseline.
- Target a narrower walkable perspective for GALA, for example desktop `48-52` and touch `54-58`, then verify on mobile that navigation remains usable.
- Normalize GALA start-view pitch: keep human eye height, but raise/look farther through the room so the first frame does not aim sharply down at floors or door thresholds.
- Keep camera roll at zero and add a guard/audit that reports FOV, pitch, and roll for owner screenshots.
- Update QA evidence to capture both real-user walkable view and QA fixed-shot view, and label which one is being judged.

## Staged Implementation Plan

### Stage 0: Freeze current evidence

- Capture the five owner screenshot camera targets as reproducible Playwright shots if possible.
- Save current runtime scene inventory for interior and exterior.
- Record that `productVisualAccepted=false`; no staging deploy.

### Stage 1: Opening PBR texture pass

- Extend `GalaConstructionPbrTextures.ts` with `door`, `trim`, and optionally `lightTrim`.
- Use `rough_pine_door_1k` for door slabs.
- Use `wood_shutter_1k` or `white_maple_veneer_1k` for casing, jamb liners, headers, sills, and thresholds.
- Wire these maps in `GalaOpeningAssembly.tsx`.
- Add user data flags for textured opening parts.

Acceptance:

- Door/window frames visibly use wood texture.
- Door leaves are no longer flat color slabs.
- No new aperture clipping, glass opacity, or door traversal regressions.

### Stage 2: Interior wall and floor coherence pass

- Split `wall` material use between structural core and visible finished interior faces.
- Use a calmer interior wall texture/material profile with low normal strength.
- Keep exterior board geometry outside-only.
- Replace the visible finished floor with a local-orientation top finish surface or a specialized horizontal material path.
- Keep one structural floor stack and no transparent overlays.

Acceptance:

- Interior walls no longer read as exterior ribbed cladding.
- Floor planks are stable, coherent, and not contaminated by deck/ground/threshold materials.
- Window and door reveal edges remain sealed.

### Stage 3: Furniture module fit pass

- Add reliable construction bounds for GLTF furniture.
- Reposition the living coffee table away from sofa overlap.
- Recheck bed, bedside cabinet, wardrobe, kitchen base, vanity, shower, and bathroom door clearance.
- Keep furniture configuration data-driven through `GALA_FURNITURE_LAYOUT`.

Acceptance:

- No furniture/wall intersections.
- No through-wall visibility.
- Sofa/table/bed/wardrobe modules read as intentional furniture, not intersecting blocks.

### Stage 4: Camera/FOV composition pass

- Add a home-studio camera profile for the real walkable route.
- Lower GALA walkable FOV from the generic expo canvas default to a less distorted product-view value.
- Keep sponsor boulevard and non-home-studio routes on their current FOV unless separately approved.
- Adjust `HOME_STUDIO_EXTERIOR_START_VIEW` and `HOME_STUDIO_INTERIOR_START_VIEW` targets only enough to reduce tilted/downward framing.
- Keep player eye height and collision behavior unchanged.
- Add QA/debug reporting for camera FOV, pitch, roll, and route mode.

Acceptance:

- First-frame interior and exterior views no longer look stretched, fish-eye, or sagging downward.
- Vertical door/window frames read vertical instead of leaning from lens distortion.
- Floor planks no longer dominate because of excessive downward pitch.
- Desktop and mobile captures both remain navigable and readable.

### Stage 5: QA reconciliation and evidence

- Update stale assertions in visual-design and construction-renderer audits to match the current visual target.
- Add material-map checks for opening trim and door leaves.
- Run focused screenshots around:
  - kitchen/living sofa and coffee table.
  - bedroom bed and partition door.
  - entry/terrace door threshold.
  - window frame close-up.
  - exterior side cladding and opening trim.
  - real-user camera first frame with reported FOV/pitch/roll.

Required validation:

- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:all`
- `node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-geometry-texture-furniture-clearance`
- `node scripts/qa-gala-construction-renderer.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-geometry-texture-construction-renderer`

## Implementer Prompts

### Prompt 1: Door and window frame texture pass

Use this prompt in the implementer terminal:

```text
You are implementing the GALA opening texture remediation in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, and docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md first. Work only in the canonical root Vite SPA. Do not touch apps/frontend, Unreal, Pixel Streaming, backend, auth, quote flow, camera/FOV/lookAt, or deployment.

Goal: make GALA door leaves plus door/window casing, jamb liners, headers, sills, and thresholds use real PBR textures instead of flat color.

Primary files:
- src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts
- src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx
- src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts if material profile metadata is needed

Use existing local assets:
- public/models/gala/rough_pine_door_1k/textures/rough_pine_door_diff_1k.jpg
- public/models/gala/rough_pine_door_1k/textures/rough_pine_door_nor_gl_1k.jpg
- public/models/gala/rough_pine_door_1k/textures/rough_pine_door_arm_1k.jpg
- public/models/gala/wood_shutter_1k/textures/wood_shutter_diff_1k.jpg
- public/models/gala/wood_shutter_1k/textures/wood_shutter_nor_gl_1k.jpg
- public/models/gala/wood_shutter_1k/textures/wood_shutter_arm_1k.jpg

Constraints:
- Reuse the shared texture loader path; do not clone textures per frame.
- Keep glass opacity and current door state behavior unchanged.
- Keep opening geometry positions unchanged unless a texture change exposes a hard clipping defect.
- Add userData flags proving door leaves and trim are PBR textured.

Validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- Browser smoke on /modular-homes/studio?view=exterior&homeStudio=1 and /modular-homes/studio?view=interior&homeStudio=1
- Capture close-ups of at least one door, one window frame, and one threshold under artifacts/gala-opening-pbr-texture-pass

Update docs/CURRENT_TASK.md with touched files, validation, and any visual blockers.
```

### Prompt 2: Interior wall and floor coherence pass

Use this prompt in the implementer terminal:

```text
You are implementing the GALA wall/floor coherence remediation in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, and docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md first. Work only in the canonical root Vite SPA. Do not change backend, staging, camera/FOV/lookAt, quote flow, or sponsor boulevard behavior.

Goal: fix the screenshot-visible problem where interior walls read as exterior ribbed cladding and the floor/threshold/deck area reads as inconsistent material islands.

Primary files:
- src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx
- src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx
- src/modules/expo/runtime/modularHome/construction/GalaConstructionPbrTextures.ts
- src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx
- src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts

Required changes:
- Split visible interior wall material from structural wall core material.
- Keep exterior board geometry and exterior PBR confined to GalaCladdingAssembly.
- Use a calmer interior wall PBR profile with low normal strength; do not reintroduce interior physical board relief.
- Make the visible finished floor a floor-local surface or material path with stable plank direction/repeat.
- Keep one structural floor stack with no transparent overlays.
- Keep door/window reveals sealed after the material split.

Validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- npm.cmd run check:all
- node scripts/qa-gala-floor-ground-isolation-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-wall-floor-coherence-floor-ground
- node scripts/qa-gala-opening-clip-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-wall-floor-coherence-openings
- Capture screenshots of interior wall close-up, floor near sofa, and entry/terrace threshold under artifacts/gala-wall-floor-coherence

Update docs/CURRENT_TASK.md with touched files, validation, and remaining blockers.
```

### Prompt 3: Furniture module bounds and layout pass

Use this prompt in the implementer terminal:

```text
You are implementing the GALA furniture module fit remediation in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md, and docs/GALA_FURNITURE_CLEARANCE_SPEC.md first. Work only in the canonical root Vite SPA.

Goal: make the rendered furniture modules match their intended layout envelopes and make QA measure the real GLTF visual bounds.

Primary files:
- src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts
- src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx
- src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx
- scripts/qa-gala-furniture-clearance-audit.mjs

Required changes:
- Add constructionLocalBounds/constructionLocalPosition/constructionLocalSize for GLTF furniture groups or invisible QA proxy bounds that do not render.
- Ensure sofa, coffee table, and cabinet GLTF modules are audited as clearance subjects.
- Move the living coffee table out of the sofa envelope and preserve a believable walking gap.
- Recheck bedroom bed, bedside cabinet, wardrobe, kitchen base/counter, vanity, shower panels, and bathroom door clearance.
- Keep placements data-driven through GALA_FURNITURE_LAYOUT; avoid hardcoded one-off object offsets in rendering components unless the offset is model-pivot compensation.

Validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-furniture-module-fit
- Capture living/table and bedroom/wardrobe screenshots under artifacts/gala-furniture-module-fit

Update docs/CURRENT_TASK.md with touched files, validation, and remaining visual blockers.
```

### Prompt 4: Camera/FOV composition pass

Use this prompt in the implementer terminal after Prompts 1-3 are complete if the camera work is being done by the same implementer:

```text
You are implementing the GALA camera/FOV composition remediation in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, and docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md first. Work only in the canonical root Vite SPA. This task is allowed to change GALA home-studio camera/FOV behavior, but must not change sponsor boulevard camera behavior, backend, auth, quote flow, deployment, or staging.

Goal: fix the walkable GALA screenshot composition so the image no longer looks overly stretched, fish-eye, or tilted downward.

Primary files:
- src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx
- src/modules/expo/runtime/app/Expo3D.tsx
- src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx
- src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts
- src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx only for QA reporting/fixed-shot parity

Required changes:
- Add a home-studio scoped camera profile instead of changing the global expo/sponsor boulevard FOV.
- Reduce GALA walkable FOV from the generic `60` desktop / `66` touch path to a product-readable range, initially around desktop `50` and touch `56`, then adjust only with screenshot evidence.
- Keep player eye height, collision, walk speed, and route behavior unchanged.
- Retune HOME_STUDIO_EXTERIOR_START_VIEW and HOME_STUDIO_INTERIOR_START_VIEW lookAt targets so first-frame pitch is calmer and the camera is not aimed mostly at the floor/threshold.
- Keep camera roll at zero during initial framing and movement.
- Expose/report `cameraFov`, pitch, and roll in QA/debug evidence so acceptance can distinguish lens/composition fixes from geometry fixes.

Validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- Browser smoke on /modular-homes/studio?view=exterior&homeStudio=1 and /modular-homes/studio?view=interior&homeStudio=1
- Capture desktop and mobile-size screenshots of the real walkable first frame, living/kitchen close-up, bedroom close-up, and door/window frame close-up under artifacts/gala-camera-fov-composition
- Include a small JSON report with route, viewport, cameraFov, cameraRotation, and whether roll is approximately zero.

Update docs/CURRENT_TASK.md with touched files, validation, evidence paths, and remaining visual blockers.
```

### Prompt 5: QA reconciliation and final evidence pass

Use this prompt in the implementer terminal after Prompts 1-4 are complete:

```text
You are reconciling GALA QA and final local evidence in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, and docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md first. Do not deploy to staging and do not mark productVisualAccepted=true unless the product owner explicitly accepts the captured evidence.

Goal: align the GALA visual QA scripts with the current target and prove the wall/floor/opening/furniture/camera fixes in local evidence.

Primary files:
- scripts/qa-gala-visual-design-intent-audit.mjs
- scripts/qa-gala-construction-renderer.mjs
- scripts/qa-gala-furniture-clearance-audit.mjs
- docs/CURRENT_TASK.md

Required changes:
- Remove stale assertions that require intentionally removed interior board relief, floor seam overlays, ceiling seams, or old trim.
- Add checks that door/window trim and door leaves use texture maps.
- Add checks that GLTF furniture modules have auditable construction bounds.
- Add checks/reporting that real-user home-studio captures include expected GALA FOV, pitch, and near-zero roll.
- Keep productVisualAccepted=false until owner acceptance.

Validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- npm.cmd run check:all
- node scripts/qa-gala-visual-design-intent-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-geometry-texture-final-design-intent
- node scripts/qa-gala-construction-renderer.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-geometry-texture-final-construction
- node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-geometry-texture-final-furniture
- Include the camera/FOV evidence from artifacts/gala-camera-fov-composition in the final manifest

Update docs/CURRENT_TASK.md with final local status, evidence paths, validation results, and explicit remaining product-owner review status.
```
