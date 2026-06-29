# GALA Owner Rejection Structural And Motion Plan

## Objective

Plan the next remediation from the owner rejection message on 2026-06-28.

This supersedes treating the previous green QA run as sufficient. The owner is rejecting the current local result because several problems are visible in real walkable use:

- the whole interior floor must sit above the foundation/base, not visually under or level with foundation/base trim;
- the terrace door, threshold, lower base trim, and interior floor must align as one continuous level system;
- the bathroom/living wall and bathroom door opening are wrong: the wall/return must move so the open corner is closed and the door frame is no longer embedded into the wall;
- the bed is still visibly too small and must be lengthened;
- doors/windows and inner frames flicker or change color while walking, so a movement test is mandatory before declaring the fix done.

No staging deploy, acceptance record, backend change, route rewrite, Unreal work, Pixel Streaming work, or sponsor boulevard behavior change is allowed from this plan.

## Non-Negotiable Acceptance Rule

The implementer must not report this as complete from static screenshots only.

The final evidence must include real-user motion captures around doors and windows. The owner specifically says the flicker is only visible while walking, so validation must include movement across the problematic openings.

## Root Cause Map

### 1. Floor level is not a single structural source of truth

Owners:

- `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`
- `src/modules/expo/runtime/app/Expo3D.tsx`

Current symptoms:

- The construction floor top is effectively at `0`.
- The local plank surface is only slightly above it.
- Foundation/base trim and terrace deck/edge pieces use separate hardcoded Y values.
- Thresholds use another hardcoded Y formula.
- Camera/player height is based on the old floor level.

Fix direction:

- Introduce one canonical GALA finished-floor-top level above the foundation/base system.
- Raise the entire interior floor stack, not only the visible plank plane.
- Align furniture, doors, thresholds, closed-door collision slabs, camera eye height, and GALA movement height to the raised floor.
- Align the terrace deck top and terrace door threshold to the raised interior floor so the terrace/floor/threshold read as one clean transition.
- Keep the foundation visually below the floor; do not let foundation/base trim overlap the interior floor plane.

Acceptance:

- Interior finished floor is visibly above the foundation/base.
- Terrace deck, terrace door threshold, lower trim, and interior floor do not form mismatched steps or overlapping bands.
- Player/camera still walks at human eye height relative to the raised floor.

### 2. Bathroom/living wall and bathroom door opening are geometrically wrong

Owners:

- `src/modules/expo/runtime/modularHome/GalaHouseDimensions.ts`
- `src/modules/expo/runtime/modularHome/GalaFloorplan.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`

Current symptoms:

- The owner sees an open corner/space in the bathroom/living wall area.
- The wall needs to be pulled to the right so the corner lines up.
- The bathroom door frame must not sit inside or collide with the wall.
- Door collision/opening data and visible wall data may not agree.

Fix direction:

- Treat this as a floorplan/model correction, not a casing-only visual patch.
- Re-evaluate the bathroom/living partition and bathroom north partition from plan coordinates.
- Move the relevant wall segment/right return so the corner closes and the door opening has a real wall return on both sides.
- Update `GALA_INTERIOR_DOORS`, `GALA_OPENING_GAPS`, `GALA_CLOSED_DOOR_COLLISION_SEGMENTS`, interaction zones, construction openings, and QA expected bounds together.
- Verify the wall core, finished wall face, jamb liner, casing, door leaf, and collision segment all share the same opening envelope.

Acceptance:

- The bathroom/living wall has no open floating corner.
- Bathroom door frame is not embedded in wall geometry.
- Closed bathroom door blocks; open bathroom door passes.
- Visual wall aperture and collision aperture match.

### 3. Bed is still too short

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts`
- `src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx`
- `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`
- `scripts/qa-gala-furniture-clearance-audit.mjs`

Current symptoms:

- Bed still reads like a small/compressed model in owner screenshots.
- Current active construction layout uses a bed frame around `1.98m x 1.22m`, so it is wide enough but short in the head-to-foot direction.

Fix direction:

- Lengthen the bed in the head-to-foot direction, not just widen it.
- Target a believable bed envelope, approximately `1.8-2.0m` long by `1.6-1.8m` wide unless room clearance proves a smaller value is necessary.
- Adjust frame, mattress, blanket, pillows, headboard, bedside cabinet, and clearance proxies together.
- Keep the bed anchored to the wall and keep door/walk path clearance.

Acceptance:

- Bed reads as a real adult bed from multiple sides.
- Mattress/blanket/pillows/headboard remain aligned.
- Wardrobe, door, and circulation clearance still pass.

### 4. Door/window flicker while walking is not solved by static QA

Owners:

- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx`
- `src/modules/expo/runtime/world/scene/useGalaShowroomMovement.ts`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx`
- `scripts/qa-gala-real-user-walk-physics.mjs`
- new or extended motion visual QA script

Likely causes:

- Coplanar or near-coplanar glass, casing, reveal liner, wall face, cladding, or threshold surfaces.
- Transparent glass sorting/depth behavior changing as the camera moves.
- PBR/triplanar shader projection and instanced surfaces producing shimmer on narrow frame strips.
- Static screenshots can miss this because the defect appears during movement.

Fix direction:

- Audit every door/window opening for overlapping planes and very small face offsets.
- Ensure trim, reveal, glass, door slab, wall core, finished wall face, cladding board, and shadow gap geometry have deliberate non-coplanar offsets.
- Use geometry separation first. Only use `renderOrder`, `polygonOffset`, or transparency depth settings when geometry separation is insufficient and documented.
- For glass, use one stable panel per opening face unless a second pane is intentionally offset enough to avoid z-fighting.
- Add or extend a real-user motion capture script that walks/pans around:
  - `D-ENTRY`
  - `D-TERRACE`
  - `D-BATHROOM`
  - `D-BEDROOM`
  - `W-KITCHEN`
  - `W-BATH`
  - `W-BED`
  - west facade windows

Acceptance:

- Motion screenshot sequence shows no visible frame/glass color flipping, shimmer, or z-fighting at doors/windows.
- Material/state inventory remains stable before, during, and after movement.
- The implementer provides motion evidence, not only still images.

## Required Implementation Order

1. Freeze current rejected evidence and write down exact camera routes from owner screenshots.
2. Raise the canonical floor level and align foundation/base/terrace/threshold/player height.
3. Fix bathroom/living wall and bathroom door geometry at floorplan/model level.
4. Lengthen the bed and update clearance proxies.
5. Fix door/window flicker by removing coplanar/near-coplanar opening surfaces.
6. Add motion validation around every problematic opening.
7. Run static and motion QA, then write final evidence paths in `docs/CURRENT_TASK.md`.

## Implementer Prompt

Use this prompt in the implementer terminal:

```text
You are implementing the GALA owner-rejection structural and motion remediation in C:\3d.

Read PROJECT_CONTEXT_LOCK.md, docs/CURRENT_TASK.md, docs/GALA_GEOMETRY_TEXTURE_REMEDIATION_PLAN.md, and docs/GALA_OWNER_REJECTION_STRUCTURAL_MOTION_PLAN.md first.

Work only in the canonical root Vite SPA and the active GALA modular-home construction renderer. Do not touch apps/frontend, Unreal, Pixel Streaming, backend, auth, quote/payment flow, sponsor boulevard behavior, deployment, or staging.

Context:
The previous implementation passed local QA, but the product owner rejected the result. Static screenshots are not enough. The final result is not done unless real-user motion evidence proves the door/window flicker is gone.

Mandatory fixes:

1. Raise the interior floor above the foundation/base.
- Introduce or use one canonical finished-floor-top level for GALA.
- Raise the full structural floor stack, visible plank surface, furniture Y positions, thresholds, closed door slabs, player/camera floor reference, and GALA movement eye height together.
- Align terrace deck top, terrace door threshold, lower base/foundation trim, and interior floor so the transition is coherent.
- Do not leave only the visible plank plane raised while physics/furniture/thresholds remain at old Y.

2. Fix the bathroom/living wall and bathroom door opening.
- Treat this as a floorplan/model geometry correction, not a visual casing patch.
- Inspect and correct GalaHouseDimensions.ts, GalaFloorplan.ts, GalaConstructionModel.ts, GalaWallAssembly.tsx, and GalaOpeningAssembly.tsx as needed.
- Move the relevant bathroom/living partition/right return so the open corner closes and the wall lines up.
- Ensure the bathroom door frame is not embedded into wall geometry.
- Update visual openings, wall cells, closed-door collision segments, opening gaps, interaction zones, and QA expectations together.
- Closed bathroom door must block; open bathroom door must pass.

3. Lengthen the bedroom bed.
- Increase the bed in the head-to-foot direction so it reads as a real adult bed from several angles.
- Update bed frame, mattress, blanket, pillows, headboard, bedside cabinet, and any clearance proxy/bounds together.
- Keep wardrobe, door, and circulation clearance valid.

4. Fix door/window flicker during movement.
- Audit all GALA opening surfaces for coplanar or near-coplanar glass, casing, reveal, wall, cladding, threshold, and door slab geometry.
- Separate overlapping surfaces with deliberate offsets. Prefer geometry separation over render hacks.
- Stabilize transparent glass sorting/depth behavior if needed.
- Do not claim this is done from static screenshots.

Required motion validation:
- Add or extend a Playwright script under scripts/ that performs real-user movement/panning around D-ENTRY, D-TERRACE, D-BATHROOM, D-BEDROOM, W-KITCHEN, W-BATH, W-BED, and west windows.
- Capture before/during/after movement frames under artifacts/gala-owner-rejection-motion-openings.
- Produce a JSON report listing route, opening id, movement path, camera positions, frame count, and whether flicker/z-fighting/color flipping was detected or requires human review.
- The script must run without qa3d camera presets as the only evidence. It may use QA hooks for inventory/reporting, but must exercise real-user movement.

Required static validation:
- npm.cmd run lint
- npm.cmd run build
- npm.cmd run check:expo-boundaries
- npm.cmd run check:all
- node scripts/qa-gala-furniture-clearance-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-furniture-clearance
- node scripts/qa-gala-floor-ground-isolation-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-floor-level
- node scripts/qa-gala-opening-clip-audit.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-opening-clip
- node scripts/qa-gala-real-user-walk-physics.mjs --base-url=<local-preview-url> --out-dir=artifacts/gala-owner-rejection-real-user-walk
- the new/extended motion opening flicker script against the same local preview

Required screenshots:
- floor/foundation/terrace threshold alignment
- bathroom/living wall and bathroom door frame from both sides
- bedroom bed from multiple sides showing the length
- every door/window motion sequence around the flickering frames

Update docs/CURRENT_TASK.md at the end with:
- touched files
- exact floor top / foundation / terrace / threshold levels
- exact bathroom wall and door envelope values
- exact bed envelope values
- motion evidence paths
- all validation results
- productVisualAccepted=false unless owner explicitly accepts
- stagingDeployAllowed=false unless owner explicitly requests deploy
```
