# Phase 161 - Canonical Screen Surface Invalid Position Review

Status: PASS

## Goal

Precizi izolēt, kur canonical fallback screen surfaces iegūst non-finite `position[2]` / `NaN` Z vērtības, bez implementation un bez object movement.

## Result

Exact source seam ir atrasts. Phase 160 invalid-position signāls nebija authored layout vai canonical runtime plan bug. Tas bija one-off diagnostic scan invocation bug:

- scan mēģināja izsaukt `buildCanonicalWorldPlan(...)` ar `districtStride: world.districtStride`
- `ExpoWorldContract` nesatur `districtStride`
- rezultātā `districtStride === undefined`
- `buildMediaWallSurfaces(...)` rēķina `baseZ = -214 - (districtIndex * districtStride)`
- `districtIndex * undefined => NaN`
- tālāk `CityScreenSurface.position[2] => NaN`

Runtime path paliek korekts:

- [WorldCitySkeleton.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCitySkeleton.tsx) definē `const districtStride = 548`
- tas pats skaitlis tiek padots uz `buildCanonicalWorldPlan(...)`
- ar šo runtime-correct input canonical screen surfaces ir finite

## Reproduction

Read-only scan ar nepareizo invocation:

- source scene: `buildProductionSafeFallbackScene()`
- world contract: `buildExpoWorldContract(scene)`
- canonical plan: `buildCanonicalWorldPlan({ ..., districtStride: world.districtStride })`

Observed:

- `surfaceCount: 24`
- `invalidSurfaceCount: 24`
- `socketCount: 24`
- `invalidSocketCount: 24`
- `assignmentCount: 24`
- `boundsDiagnostics: 24`
- first invalid surface id: `screen-marquee-left-0`
- first invalid socket id: `screen-marquee-left-0-socket`

Read-only scan ar runtime-correct invocation:

- canonical plan: `buildCanonicalWorldPlan({ ..., districtStride: 548 })`

Observed:

- `surfaceCount: 22`
- `invalidSurfaceCount: 0`
- `socketCount: 22`
- `invalidSocketCount: 0`
- `assignmentCount: 22`
- `boundsDiagnostics: 0`

## Source Chain

One invalid id tika izsekots atpakaļ:

1. Final invalid surface:
   - `screen-marquee-left-0`
2. Built in:
   - [buildScreenSurfacePlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
3. Delegates to:
   - `buildMediaWallSurfaces(districtPrograms.length, districtStride)`
   - [worldCityGeometry.ts](/C:/3d/src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts)
4. `baseZ` formula:
   - `-214 - (districtIndex * districtStride)`
5. First non-finite seam:
   - `districtStride === undefined`
   - therefore `baseZ === NaN`
6. Downstream impact:
   - surface `position[2]`
   - socket `position[2]`
   - assignment references invalid socket

Authored screen layout data nebija sākotnējais vaininieks.

## Phase 155 vs Phase 160 Mismatch

Mismatch ir izskaidrots pilnībā.

Phase 155:

- izmantoja runtime-correct district stride ceļu
- tāpēc `diagnostics count: 0`

Phase 160:

- scan invocation izmantoja `world.districtStride`
- `ExpoWorldContract` tāda lauka nav
- tāpēc diagnostic scan pats ievadīja `undefined`
- tas izraisīja `NaN` Z koordinātas un `diagnoseScreenSurfaceBounds(...).length === 24`

Tātad:

- tas nav upstream source regression
- tas nav authored layout regression
- tas nav `screenSurfaceBoundsDiagnostics` logic bug
- tas ir diagnostic scan input bug

## Helper Sanity

[screenSurfaceBoundsDiagnostics.ts](/C:/3d/src/modules/expo/runtime/planning/screens/screenSurfaceBoundsDiagnostics.ts) ir pareizs attiecībā uz šo incidentu:

- sagaida `position: [x, y, z]`
- sagaida `size` tuple ar finite numerics
- izmanto X/Z bounds loģiku
- `NaN` korekti tiek traktēts kā non-finite

Svarīga piezīme:

- JSON serializācijā `NaN` parādās kā `null`
- tāpēc scan logā `position[2]` tika izdrukāts kā `null`, kaut raw vērtība bija non-finite `NaN`

## Source Layout Audit

Pārbaudītie faili:

- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [buildScreenSurfacePlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts)
- [buildScreenSocketPlan.ts](/C:/3d/src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts)

Findings:

- authored/generated screen positions ir paredzētas kā `[x, y, z]`
- nav atrasts `[x, z]` tuple mismatch authored layerī
- nav atrasts source helper, kas pats ģenerētu `undefined` vai `NaN` Z pie finite `districtStride`

## Canonical Plan Audit

[buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts) pats par sevi neievada `NaN`.

Findings:

- tas vienkārši sagaida derīgu `inputs.districtStride`
- tas neizlabo `undefined` district stride
- tas netransformē finite Z par `NaN`
- invaliditāte ienāk no nepareiza input seam

## Runtime Impact

Read-only runtime audit:

- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

Findings:

- runtime render layer nefiltrē non-finite positions
- ja non-finite surfaces nonāktu runtime path, tās tiktu renderētas ar nederīgu geometry state
- bet pašreizējais runtime path izmanto `districtStride = 548`, tāpēc šis konkrētais incidents nerada aktīvu runtime regression

## Selected Follow-up

Next target:

- `SCREEN SURFACE DIAGNOSTIC SCAN CORRECTION`

Pamatojums:

- exact source jau ir izolēts
- mazākais nākamais solis ir salabot diagnostic invocation seam
- nav pamata aiztikt authored layout, canonical transforms vai runtime rendering

