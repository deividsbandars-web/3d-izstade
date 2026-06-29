# GALA Opening, Interior, Floor, And Motion Performance Audit

Date: `2026-06-26`

Rejected evidence: `C:\qa\visual-evidence\20260626-033206-gala-interior-performance-geometry-remediation-local`

This audit describes the pre-remediation source state for the product-owner rejection. It is not an acceptance record and does not set `productVisualAccepted=true`.

## A. Exterior Horizontal Board Marks

1. The unwanted horizontal marks are created by `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`.
   - Lines `51-52` define `scarfFaceOffset`.
   - Lines `78-87` generate `scarfJointInstances`.
   - Lines `155-169` render `gala-construction-${wall.id}-short-horizontal-board-scarf-joint-instanced`.
2. They are separate instanced box meshes, not texture marks.
3. They are not required by `docs/GALA_WALL_SKIN_SYSTEM_SPEC.md`; the current product-owner instruction explicitly forbids them.
4. Previous QA allowed them to pass because `scripts/qa-gala-visual-design-intent-audit.mjs` treated facade relief as positive evidence and did not fail on `scarf-joint` mesh names.

Inventory before remediation:

- `gala-construction-south-exterior-wall-short-horizontal-board-scarf-joint-instanced`: `10` instances.
- `gala-construction-north-exterior-wall-short-horizontal-board-scarf-joint-instanced`: `10` instances.
- `gala-construction-west-exterior-wall-short-horizontal-board-scarf-joint-instanced`: `5` instances.
- `gala-construction-east-exterior-wall-short-horizontal-board-scarf-joint-instanced`: `5` instances.

## B. Window And Door Opening Clipping

1. Wall-skin clipping around openings is owned by `GalaCladdingAssembly.tsx`, but it currently does not subtract opening aperture volumes from exterior boards or reveal backing.
   - Lines `56-66` generate boards across the full wall axis without consulting `wall.openings`.
   - Lines `67-77` convert each full-height board into instances.
   - Lines `110-124` render a full-wall reveal backing panel behind every wall.
2. Door/window aperture dimensions are owned by:
   - `src/modules/expo/runtime/modularHome/GalaHouseDimensions.ts` lines `43-109` for exterior scheduled openings.
   - `src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts` lines `103-129` for conversion into construction openings.
   - `GalaConstructionModel.ts` lines `136-154` for interior door openings.
3. Window glass material is owned by:
   - `src/modules/expo/runtime/modularHome/GalaHouseConfig.ts` through `resolveGalaOpeningVisual`.
   - `GalaOpeningAssembly.tsx` lines `94`, `214-222`.
4. Door open state, swing, and portal clearance are owned by:
   - `src/modules/expo/runtime/modularHome/GalaDoorState.ts`
   - `GalaOpeningAssembly.tsx` lines `39-55`, `82-87`, `117-119`, and `197-209`.
5. Boards are visible through window frames and doorway portals because cladding board/reveal generation happens as full-wall skin after wall-core cells are opening-aware; the core is cut, but cladding is not.
6. Cladding is generated after wall cells but before opening assemblies in `GalaWallAssembly.tsx` lines `276-298`. Opening trim covers some edges but does not mask the board/reveal meshes occupying aperture rectangles.
7. Opening masks currently apply to:
   - Wall core cells: yes, `GalaWallAssembly.tsx` lines `43-87`.
   - Exterior board meshes: no, `GalaCladdingAssembly.tsx` lines `56-77`.
   - Reveal/groove backing: no, `GalaCladdingAssembly.tsx` lines `110-124`.
   - Trim/casing: trim is explicit in `GalaOpeningAssembly.tsx` lines `127-154`, but it does not subtract cladding.
   - Interior boards: partially, because they consume wall cells from `GalaWallAssembly.tsx`; exterior wall interior faces are opening-aware.
8. Affected exterior opening IDs:
   - `W-KITCHEN`
   - `D-ENTRY`
   - `W-BATH`
   - `D-TERRACE`
   - `W-BED`
   - `W-WEST-A`
   - `W-WEST-B`
9. The responsible files are `GalaCladdingAssembly.tsx`, `GalaWallAssembly.tsx`, `GalaOpeningAssembly.tsx`, and `GalaConstructionModel.ts`.

Glass before remediation is opaque:

- `gala-construction-*-sealed-dark-glass-panel-not-void` uses material opacity `1` and `transparent=false`.

## C. Interior Wall-Skin Parity

1. Interior board material is owned by `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`.
   - Lines `66-68` blend exterior facade and interior panel colors into a separate interior palette.
   - Lines `83-92` expose that separate interior palette.
2. Interior board dimensions are owned by `GalaWallSkinModel.ts` lines `24-32`.
3. Exterior board dimensions are owned by `GalaWallSkinModel.ts` lines `8-16`.
4. Interior currently consumes the same dimensional module (`0.18m` board and `0.014m` gap) but still uses a separate lighter/different color logic.
5. Interior boards do not match exterior language because the interior palette is blended toward `interior.wallPanelColor` instead of using the exterior approved timber tones.
6. Interior material/spacing can be visually overridden by:
   - `GalaWallSkinModel.ts` lines `66-92`.
   - `GalaFloorCeilingAssembly.tsx` lines `126-132` and `231-251`, which draw perimeter baseboard and crown bands using `interior.panelRevealColor`.
7. Horizontal interior bands are generated by `GalaFloorCeilingAssembly.tsx`.
   - Baseboard instances: lines `126-129` and `231-241`.
   - Crown trim instances: lines `130-132` and `243-253`.
   - Ceiling seams: lines `118-125` and `203-227`.
8. Baseboard and top trim may remain only as documented structural trim; they must not read as a separate horizontal wall stripe system.
9. Responsible files are `GalaWallSkinModel.ts`, `GalaWallAssembly.tsx`, and `GalaFloorCeilingAssembly.tsx`.

## D. Floor, Ground, And Blue Void Contamination

1. `world-ground:global-base` is rendered by `src/modules/expo/runtime/world/WorldGroundPlane.tsx` lines `66-83`.
2. `world-ground-detail:*`, arrival, sponsor, and transition ground anchors are rendered by `WorldGroundPlane.tsx` lines `84-214`.
3. Ground detail objects are defined in `src/modules/expo/runtime/world/WorldGroundLayout.ts` lines `77-115`.
4. `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx` lines `90-98` mounts `WorldGroundPlane` even when `homeStudioEnabled=true`.
5. The overlapping/detail contributors include city/arrival ribbons and sponsor ribbons at `WorldGroundLayout.ts` lines `78-92`, plus transition marker planes at lines `93-115`.
6. The house floor is owned by `GalaFloorCeilingAssembly.tsx` lines `144-158` as `gala-construction-single-finished-floor-no-overlays`.
7. Ground/detail objects are not house interior floors but are still present in homeStudio inventory and can be sampled as floor-like transparent planes.
8. Z-fighting or transparent overlap risk exists because world ground/detail planes sit close to the house finished floor and foundation stack, including `GROUND_DETAIL_Y=-0.145`, `GROUND_ACCENT_Y=-0.139`, and `GROUND_SURFACE_MARKER_Y=0.034` in `WorldGroundLayout.ts` lines `28-30`.
9. `homeStudio=1` should disable or mask world-ground detail and anchors inside the product house bounds.
10. Floor color changes while moving backwards because the real walk path sees the city ground/detail stack under and around the house rather than a product-isolated home floor stack.
11. Responsible files are `ExpoWorldSceneLayers.tsx`, `WorldGroundPlane.tsx`, `WorldGroundLayout.ts`, and `GalaFloorCeilingAssembly.tsx`.

## E. Motion Performance

Pre-fix stationary measurements from `scripts/qa-gala-performance-budget-audit.mjs`:

| Route | Median FPS | P95 frame time | Draw calls | Triangles | Mesh count | Material count | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| exterior static QA | `120.48` | `29.2ms` | `212` | `2636` | `1274` | `71` | FAIL |
| interior static QA | `120.48` | `25.0ms` | `167` | `1946` | `1274` | `71` | PASS |

Pre-fix real homeStudio motion measurements used `homeStudio=1`, `galaConstructionAudit=1`, keyboard forward/backward motion, and left/right rotation. They did not use `qa3d=1`.

| Route | Mode | Median FPS | P95 frame time | Max frame time | Stutters >50ms | Draw calls | Triangles | Mesh count | Material count |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| exterior | stationary | `120.48` | `25.1ms` | `50.0ms` | `0` | `212` | `2636` | `1274` | `71` |
| exterior | motion | `119.05` | `25.1ms` | `58.4ms` | `3` | `105` | `1109` | `1274` | `72` |
| interior | stationary | `119.05` | `29.1ms` | `45.8ms` | `0` | `167` | `1946` | `1274` | `71` |
| interior | motion | `119.05` | `33.3ms` | `66.7ms` | `5` | `114` | `1393` | `1274` | `71` |

Motion performance budget is not met before remediation because interior motion p95 is above `28ms` and movement has `5` spikes over `50ms`.

Likely hotspots:

- Remaining wall-skin board instance count is high (`763` instance-counted wall-skin boards).
- Opening assemblies contribute `161` instance-counted opening elements.
- World ground/detail transparent planes are still mounted in homeStudio and add unnecessary transparent layers and floor ambiguity.
- The movement loop in `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx` lines `590-820` does real collision/raycast work during walk motion; it should not be made heavier by unnecessary ground/detail collision or transparent layers.

## Recommended Remediation Path

1. Remove `scarfJointInstances` and the `short-horizontal-board-scarf-joint-instanced` render path from `GalaCladdingAssembly.tsx`.
2. Add aperture subtraction in `GalaCladdingAssembly.tsx` so exterior boards and reveal strips are split around every `wall.openings` rectangle.
3. Replace the full-wall reveal backing panel with clipped vertical reveal strips so no backing panel exists inside a window or door aperture.
4. Make window glass transparent/readable in `GalaOpeningAssembly.tsx` and add explicit userData proving transparent glass.
5. Keep open door portal clear by relying on clipped cladding and open door leaf only.
6. Make interior board palette use the exact exterior board palette from `GalaWallSkinModel.ts`; no unapproved lighter interior variant.
7. Keep only documented baseboard/top trim and make them visually compatible with the board tone, not a separate horizontal stripe system.
8. Pass `homeStudioMode` into `WorldGroundPlane` and suppress world-ground detail/arrival/sponsor/transition overlays in homeStudio; keep only a low exterior base surface that cannot contaminate the product floor.
9. Add opening clip, floor/ground isolation, and motion performance QA so these defects fail automatically.
