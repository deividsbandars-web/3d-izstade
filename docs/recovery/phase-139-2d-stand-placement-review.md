1. Summary

Phase 139 ir `PASS`.

Šī bija audit/selection fāze par 2D stendu/paneļu ievietošanu Web3D pilsētā. Galvenais secinājums:
- drošākais pirmais host seam jau eksistē kā `booth feature surface`
- sponsor screen seam ir stiprs display/placement seam, bet šobrīd nav pierādīts kā interaktīvs stand seam

Izvēlētais nākamais target:
- `2D STAND FIRST VISIBLE SURFACE NEXT`

2. 2D Surface Inventory

`In-world 3D surface`
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
  - renderē `CityScreenSurface[]` ar explicit `position`, `rotation`, `size`
  - surface tips ir billboard/screen-like, nevis route-level UI
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
  - jau satur in-world 2D-like feature paneļus:
    - `BoothAiFeature`
    - `BoothCalculatorFeature`

`Route-level UI`
- [BoothRoom.tsx](/C:/3d/src/pages/expo/BoothRoom.tsx)
  - pilna sponsor hall route surface
  - satur vairākas `planeGeometry` screen sienas, bet tās nav city-level stand placement
- [BoothStreamRoom.tsx](/C:/3d/src/pages/expo/BoothStreamRoom.tsx)
  - premium streaming route surface
  - nav city-level stand placement seam

`Screen-only display surface`
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
  - definē `facade`, `medium_billboard`, `ground_pylon`
  - spēcīgs city display placement seam

`Booth feature surface`
- [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
  - vizuāli un interaktīvi booth-local paneļi

`Not relevant`
- dažādi `planeGeometry` grīdas, pjedestāli un show-wall elementi route telpās
- fallback `Html` slāņi, kas nav city stand sistēma

3. Existing In-World Host Seam Audit

`Booth feature surface`
- Supports position/rotation/size:
  - jā, caur booth local transform un authored panel geometry
- Supports click/action binding:
  - jā, caur [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- Visible in city:
  - jā
- Viewer-facing metadata:
  - netieši, caur booth authored yaw/frontality
- Needs `worldContract` changes:
  - nē
- Broad redesign risk:
  - zems

`Sponsor screen layout + WorldCityScreenSurfaces`
- Supports position/rotation/size:
  - jā
- Supports click/action binding:
  - nav pierādīts
- Visible in city:
  - jā
- Viewer-facing metadata:
  - daļēji, caur zone planning metadata un existing screen orientation diagnostics
- Needs `worldContract` changes:
  - nē, pirmajam display slice
- Broad redesign risk:
  - zems/vidējs
- Galvenais trūkums:
  - seam ir display-first, nevis interaction-first

`Route overlay from object click`
- Supports position/rotation/size:
  - nē, pats par sevi nav in-world host
- Supports click/action binding:
  - tikai tad, ja jau ir city object seam
- Visible in city:
  - nē
- Needs `worldContract` changes:
  - potenciāli nē, bet prasa host object
- Broad redesign risk:
  - vidējs

4. Placement Metadata Audit

`Sponsor screens`
- position source:
  - [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- rotation source:
  - authored `rotation`
- size source:
  - authored `size`
- zone/section metadata:
  - caur canonical world plan `sections`
- kind:
  - `facade`, `medium_billboard`, `ground_pylon`
- action/link metadata:
  - `ctaLabel`, `companyId`, content fields
- viewer-facing intent:
  - netieši no zone metadata + authored yaw
- placement tier/class:
  - `placementTier`

`Booth feature panels`
- position source:
  - local offsets [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- rotation source:
  - inherited no booth transform
- size source:
  - local panel geometry
- zone/section metadata:
  - netieši caur booth placement
- kind:
  - feature panel
- action/link metadata:
  - jā, caur `SponsorCta`
- viewer-facing intent:
  - jā, inherited no booth frontality
- placement tier/class:
  - nē, booth feature seam līmenī nav atsevišķa placement tier

`BoothRoom / BoothStreamRoom`
- ir route-level surfaces ar explicit geometry
- nav city-level placement metadata seam

5. Visibility/Orientation Risk Audit

`Booth feature seam`
- faces user flow:
  - labs proof, jo manto booth authored yaw
- wall-facing risk:
  - zems, ja booth frontality paliek korekta
- overlap/occlusion risk:
  - zems/vidējs, jo panelis dzīvo jau esošā booth UI kompozīcijā
- out-of-bounds risk:
  - zems
- interaction reachability:
  - augsts proof, jo click handler jau eksistē

`Sponsor screen seam`
- faces user flow:
  - daļējs proof, ne pilns
- wall-facing risk:
  - daļēji mazināts ar orientation groundwork, bet nav stand-specific proof
- overlap/occlusion risk:
  - vidējs
- out-of-bounds risk:
  - daļēji mazināts caur planning/filtering, bet nav 2D stand diagnostic
- interaction reachability:
  - zems proof

`Route-level rooms`
- nav city-level reachability proof kā standiem

6. Interaction/Action Audit

`Booth feature seam`
- action mode:
  - `navigate`
  - `local`
  - `external`
- proven examples:
  - calculator route
  - AI custom-event trigger
  - demo/showroom route
- secinājums:
  - pilnībā der pirmajam interaktīvam 2D stand slice

`Sponsor screen seam`
- action mode:
  - nav runtime click seam proof
- content metadata:
  - ir
- secinājums:
  - vēl nav labs pirmais interaktīvais stand seam

`BoothRoom / BoothStreamRoom`
- darbojas kā target routes pēc action
- nav paši city stand hosti

7. Validation Seam Audit

Esošie helperi, kas palīdz netieši:
- [screenOrientationDiagnostics.ts](/C:/3d/src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts)
- [boothFrontalityDiagnostics.ts](/C:/3d/src/shared/expo/lib/boothFrontalityDiagnostics.ts)
- [sceneDataSource.ts](/C:/3d/src/modules/expo/runtime/data/sceneDataSource.ts) dev diagnostics

Kas trūkst 2D standiem:
- duplicate stand ID diagnostic
- missing position/rotation/size diagnostic
- missing action binding diagnostic
- stand overlap/bounds diagnostic
- stand wrong-facing diagnostic
- missing content/asset diagnostic

Secinājums:
- placement diagnostics nāks vēlāk
- pirmajam visible slice nav jāstartē ar jaunu diagnostic gate, ja izmanto booth feature seam

8. Candidate Implementation Slices

`A. 2D stand registry first slice`
- Files likely affected:
  - jauns neliels metadata fails pie `src/modules/expo/**`
- Risk:
  - `medium`
- User-visible value:
  - `medium`
- One seam:
  - jā
- Avoids broad redesign:
  - jā
- Requires `worldContract` changes:
  - nē
- Piezīme:
  - pats par sevi nedod redzamu city rezultātu

`B. one visible 2D stand via existing booth feature seam`
- Files likely affected:
  - [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
  - iespējams [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)
  - iespējams [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- Risk:
  - `low`
- User-visible value:
  - `high`
- One seam:
  - jā
- Avoids broad redesign:
  - jā
- Requires `worldContract` changes:
  - nē

`C. one visible 2D stand via sponsor screen/surface seam`
- Files likely affected:
  - [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
  - [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
  - iespējams screen assignment/runtime code
- Risk:
  - `medium`
- User-visible value:
  - `high`
- One seam:
  - robežās
- Avoids broad redesign:
  - pārsvarā jā
- Requires `worldContract` changes:
  - visticamāk nē
- Galvenais mīnuss:
  - interaction seam nav pierādīts

9. Selected Decision

- `2D stand first visible surface next`

10. Selection Rationale

Tas ir pareizais nākamais solis, jo:
- booth feature seam jau ir reāls in-world 2D host
- seam jau ir interaktīvs
- seam jau ir viewer-facing caur booth frontality
- nav vajadzīgs `worldContract` redesign
- nav vajadzīgs sponsor screen runtime pārveidot par klikšķināmu stand sistēmu

Netika izvēlēts sponsor screen interactive slice, jo tas šobrīd ir display-first. Netika izvēlēts registry-only slice, jo tas dod mazāku redzamu produkta ieguvumu.

11. Files Likely Affected Next Phase

Visticamāk skaramie faili:
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [BoothVisualAssembly.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothVisualAssembly.tsx)
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)

Iespējams vēl:
- viens mazs metadata helper fails pie `src/modules/expo/**` vai `src/modules/calculators/**`, ja vajag nosaukumu/route aprakstu vienam stendam

12. Files Explicitly Out Of Scope Next Phase

Ārpus scope:
- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts) kā implementation target
- screen/booth repositioning
- AI stand changes
- calculator internals
- backend duplicate cleanup
- broad city redesign

13. Validation Results

Passed in sandbox:
- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Backend baseline paliek:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

14. Remaining Risks

Joprojām nav covered:
- standalone 2D stand placement metadata
- sponsor screen interactive stand proof
- 2D stand overlap/bounds diagnostic
- 2D stand duplicate ID/content diagnostics
- city-level stand registry story ārpus booth seam

15. Next-Cycle Recommendation

Nākamā fāze:
- `2D STAND FIRST VISIBLE SURFACE SLICE`

Pareizais scopes:
- izmantot esošo booth feature hostu
- pievienot vienu skaidru 2D stand/panel surface ar route/local action
- neiet uz sponsor screen interactivity vai standalone city placement sistēmu, kamēr mazākais seam nav pierādīts
