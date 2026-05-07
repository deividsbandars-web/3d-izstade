1. Summary

Phase 142 ir `PASS`.

Šī bija audit/selection fāze par sponsor screen surfaces kā potenciālu interaktīvu city-level 2D stand seam. Galvenais secinājums:
- sponsor screen pipeline jau ir stiprs display/placement slānis
- runtime click host šobrīd neeksistē
- mazākais drošais nākamais seam ir action resolver no jau esošā `companyId`, nevis uzreiz pointer/click implementation

Izvēlētais nākamais target:
- `SPONSOR SCREEN INTERACTION RESOLVER FIRST SLICE`

Artifacts:
- [phase-142-sponsor-screen-interactive-stand-review.md](/C:/3d/docs/recovery/phase-142-sponsor-screen-interactive-stand-review.md)
- [phase-142-diagnostics.md](/C:/3d/docs/recovery/phase-142-diagnostics.md)
- [project-analysis-bundle-phase-142.zip](/C:/3d/diagnostics/project-analysis-bundle-phase-142.zip)

2. Sponsor Screen Pipeline Audit

Authored layout source:
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)

Final world-plan path:
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [WorldCitySkeleton.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCitySkeleton.tsx)

Runtime render paths:
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx)

Findings:
- sponsor screens tiek authored kā `SponsorScreenNode`
- runtime “surface shell” un runtime “assignment content” ir atsevišķi slāņi
- `WorldCityScreenSurfaces` renderē display shells
- `WorldCityScreenAssignments` renderē content primitives uz socketiem
- interactive contract netiek pievienots nevienā no šiem runtime slāņiem

3. Sponsor Screen Metadata Audit

`SponsorScreenNode` metadata [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts):
- `id`
- `companyId`
- `title`
- `subtitle`
- `ctaLabel`
- `position`
- `rotation`
- `size`
- `kind`
- `placementTier`
- `sectorName`

`CityScreenSurface` runtime shape:
- `id`
- `position`
- `rotation`
- `size`
- `role`
- `type`
- `sections`
- `renderIntent`

`CityScreenAssignment` runtime shape:
- `id`
- `companyId`
- `label`
- `subtitle`
- `imageUrl`
- `tier`
- `socketId`
- `sections`
- `renderIntent`

Svarīgais secinājums:
- `companyId` un content payload nonāk `screenAssignments`
- `ctaLabel` un explicit action target runtime types neparādās
- runtime jau ir pietiekami daudz metadata resolver seam izveidei, bet ne tiešam click-action mapping bez papildu slāņa

4. Interaction Host Audit

`WorldCityScreenSurfaces`
- renderē tikai `<group>` + display primitives
- nav `onClick`
- nav pointer affordance
- nav action resolution

`WorldCityScreenAssignments`
- renderē content group socket pozīcijā
- arī nav `onClick`
- nav pointer affordance
- nav action resolution

Conflict risks:
- click target būs jāizsver pret camera/navigation input
- šobrīd nav pierādīts, ka sponsor screen groups jau ir paredzēti interaktīvai raycast uzvedībai

Reusability:
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts) satur noderīgu action semantiku
- bet tas ir booth-oriented, ne screen-oriented
- screen runtime, visticamāk, vajadzēs mazu atsevišķu resolver/helper seam

5. Action Model Audit

Variantu salīdzinājums:

`Reuse SponsorCta model directly`
- plus: esoša semantika
- mīnuss: screen runtime šobrīd nesaņem `SponsorCta[]`

`Screen-specific action metadata`
- plus: tiešāka screen ownership
- mīnuss: risks ieviest jaunu paralēlu action sistēmu

`Resolve route from companyId`
- plus: izmanto esošu `companyId`
- plus: var reuse esošo booth/showroom story
- plus: minimālākais interaction contract
- mīnuss: vajag mazu lookup helper

`External / GlobalChat / Calculators direct on screens`
- iespējams vēlāk
- pārāk plats pirmajam slice

Secinājums:
- mazākais drošais modelis ir `companyId -> existing route action` resolver

6. Placement/Orientation Safety Audit

Esošais proof:
- screen orientation groundwork eksistē caur [screenOrientationDiagnostics.ts](/C:/3d/src/modules/expo/runtime/planning/screens/screenOrientationDiagnostics.ts)
- sponsor screen authored metadata ir laba
- world plan jau filtrē daļu rezervju/section visibility

Trūkst:
- click-target specificity proof
- overlap/bounds proof interaktīvām surface zonām
- pointer affordance proof konkrētam subsetam

Secinājums:
- pirmais interactive slice jāierobežo uz vienu šauru subsetu vai vienu resolver seam
- orientation diagnostic integration nav obligāti jāievieš pirms resolver seam, ja resolver vēl neko nepadara klikšķināmu

7. Candidate Implementation Slices

`A. sponsor screen click action metadata first slice`
- Files likely affected:
  - [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
  - planning/runtime screen types
- Risk:
  - `medium`
- User-visible value:
  - `medium`
- One seam:
  - jā
- Requires worldContract changes:
  - nē
- Mīnuss:
  - risks sākt ar metadata paplašināšanu pirms action contract ir pierādīts

`B. one interactive sponsor screen route action first slice`
- Files likely affected:
  - runtime screen render file
  - jauns mazs resolver helper
- Risk:
  - `medium/high`
- User-visible value:
  - `high`
- One seam:
  - robežās
- Requires worldContract changes:
  - nē
- Mīnuss:
  - pointer/click un resolver vienā fāzē ir jau divi riski

`C. sponsor screen interaction resolver first slice`
- Files likely affected:
  - jauns mazs helper pie expo runtime/lib seam
  - iespējams tests
- Risk:
  - `low/medium`
- User-visible value:
  - `indirect now, high later`
- One seam:
  - jā
- Requires worldContract changes:
  - nē
- Pluss:
  - pierāda interaction contract bez pointer wiring un bez layout redesign

8. Selected Decision

- `sponsor screen interaction resolver next`

9. Selection Rationale

Tas ir pareizais nākamais solis, jo:
- sponsor screen seam šobrīd ir action-poor, nevis placement-poor
- `companyId` jau eksistē runtime assignment metadata
- pointer handlers bez resolver contract būtu pāragra UI wiring
- resolver-first slice ļauj disciplinēti pierādīt, uz kurieni screens drīkst vest, pirms tie kļūst klikšķināmi

10. Files Likely Affected Next Phase

Visticamāk skaramie faili:
- [WorldCityScreenAssignments.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx) kā read/write candidate nākamajai fāzei
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts) kā read-only context
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- iespējams jauns mazs helper pie `src/modules/expo/runtime/**` vai `src/modules/expo/lib/**`

11. Files Explicitly Out Of Scope Next Phase

Ārpus scope:
- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts) redesign
- broad city layout redesign
- booth feature stack changes
- calculator changes
- AI backend/chat changes
- backend duplicate cleanup

12. Validation Results

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

13. Remaining Risks

Joprojām nav covered:
- actual pointer/click host on sponsor screens
- overlap/bounds diagnostics for interactive screen surfaces
- explicit `ctaLabel` / action metadata propagation to runtime types
- decision whether interactivity should live on surface shells vai assignment content groups

14. Next-Cycle Recommendation

Nākamā fāze:
- `SPONSOR SCREEN INTERACTION RESOLVER FIRST SLICE`

Pareizais scopes:
- ieviest mazu helper/test seam, kas no runtime screen metadata nosaka drošu existing route/local target
- neieviest pointer handlers vēl tajā pašā slice, ja vien resolver proof to nepadara triviālu
