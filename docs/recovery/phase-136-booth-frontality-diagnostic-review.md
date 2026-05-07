## 1. Summary

Phase 136 ir PASS.

Šī bija audit/selection fāze par authored booth yaw/frontage intent un iespējamo mazo diagnostic seam bez object movement. Lēmums:

- booth frontality diagnostic next

## 2. Booth placement/yaw audit

Galvenie faili:

- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts`
- `src/modules/expo/runtime/planning/zones/shared.ts`

Findings:

- Booth position un yaw tiek piešķirti `boulevardLayout.ts`.
- Curated company slot bank glabā explicit `rotationY` katram slotam.
- Left/right authored ģimenes konsekventi izmanto `Math.PI / 2` un `-Math.PI / 2`.
- `discovery center` ģimenē tas pats left/right sign pattern paliek spēkā.
- `layoutEngine.ts` pārnes node `rotation` uz `ExpoBoothPlacement.rotation` bez pārrēķina.
- `nodeType` (`hero_left`, `hero_right`, `standard_left`, `standard_right`, `endcap`) eksistē un dod stabilu authored seam diagnosticam.
- Frontality intent nav atsevišķs lauks; tas ir inferēts no `rotationY` un `nodeType`/lane conventions.

Secinājums:

- booth yaw ir authored, nevis runtime-generated
- frontality intent ir pietiekami stabils diagnosticam, bet nav explicit validated field

## 3. Runtime transform audit

Galvenie faili:

- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/OpenBoothPavilion.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`

Findings:

- `DistrictBooth.tsx` uzliek `rotation={placement.rotation}` ārējai booth grupai.
- `BoothVisualAssembly.tsx` un visi feature children dzīvo šajā pašā local transformā.
- `OpenBoothPavilion` buildo booth shell lokālās koordinātēs un neoverride-o ārējo yaw.
- `BoothAiFeature` un `BoothCalculatorFeature` dzīvo `BoothInfoBand` iekšā un droši manto booth local facing.
- Netika atrasts child surface, kas patvaļīgi pārraksta booth yaw vai radītu acīmredzamu inheritance risk.

Secinājums:

- calculator un AI feature surfaces droši manto booth-facing orientation
- frontality risk seam ir booth placement data, nevis feature panel children

## 4. Existing validation audit

Atrasts:

- `sceneDataSource.ts` ziņo tikai curated slot rejection diagnostics
- `boulevardLayout.ts` satur placement rejection par:
  - `slot-missing`
  - `inside-stadium-reserve`
  - `inside-blocked-geometry-pocket`
  - `outside-approved-lane-envelope`
- `walkRegion.ts` un `worldCityGeometry.ts` izmanto booth yaw frontage reserve aprēķiniem
- `worldContract.ts` glabā district `frontageIntensity`, bet ne booth-facing truth

Nav atrasts:

- booth frontality validator
- missing/non-finite booth rotation validator
- left/right yaw conflict diagnostic
- feature-surface inheritance diagnostic helper

Secinājums:

- frontality šobrīd ir authored convention + runtime consumers
- validator seam trūkst pilnībā

## 5. Diagnostic seam feasibility

Feasible pure seam:

- input: planned `ExpoBoothPlacement[]`
- output: diagnostic records only
- no mutations

Droši konservatīvie checks:

- missing rotation
- non-finite yaw
- missing `nodeType`
- obvious left/right yaw sign conflict
- optional warning, ja booth type implied frontage nav pietiekami reasoned node metadata dēļ

Iemesli, kāpēc seam ir stabils:

- `rotation` jau ir final planned data
- `nodeType` un authored slot bank conventions ir skaidras
- feature-surface inheritance runtime ir vienkāršs group transform

Secinājums:

- pure helper ir realizējams bez `worldContract` izmaiņām

## 6. Test seam audit

Labākie seam varianti:

- mazs fixture-only tests blakus `screenOrientationDiagnostics` patternam zem `src/modules/expo/__tests__`
- helper source blakus `src/shared/expo/lib` vai `src/modules/expo/runtime/planning/**`

Pragmatiskais labākais variants:

- helper pie booth/shared layout seam
- fixture test pie `src/modules/expo/__tests__`

Iemesls:

- nav jāintegrē route/controller testos
- nav jālaiž pilns world render
- pattern jau ir pārbaudīts ar screen diagnostic slice

## 7. Risk classification

Low risk:

- missing diagnostic only
- fixture-level frontality helper/test

Medium risk:

- authored yaw convention ir skaidra, bet frontality intent nav explicit field

High risk:

- broad booth + screen combined validator vienā slice
- object movement vai authored yaw “fix” bez proof

Kopējais šī seam risks:

- low/medium

## 8. Candidate implementation slices

### A. booth frontality diagnostic helper only

- Likely files:
  - `src/shared/expo/lib/boulevardLayout.ts`
  - viens mazs helper pie `src/shared/expo/lib/**` vai `src/modules/expo/runtime/planning/**`
  - viens mazs tests
- Risk:
  - low
- Validation value:
  - high
- Seam:
  - one
- Layout redesign:
  - none

### B. booth placement metadata assertion test

- Likely files:
  - esošs expo/layout test fails vai jauns fixture test
- Risk:
  - low
- Validation value:
  - medium
- Seam:
  - one
- Trūkums:
  - mazāk elastīgs par helper

### C. combined booth + feature surface inheritance diagnostic

- Likely files:
  - booth runtime + helper + tests
- Risk:
  - medium
- Validation value:
  - medium/high
- Trūkums:
  - platāks nekā vajag pirmajam slice

## 9. Selected decision

- booth frontality diagnostic next

## 10. Selection rationale

Šis ir pareizais nākamais solis, jo:

- booth yaw intent jau ir authored un konsekvents
- runtime inheritance calculator/AI paneliem izskatās droša
- trūkst tieši neliels validator seam, nevis layout redesign
- screen diagnostic pattern jau parādīja, ka šāds conservative helper slices darbojas labi

Netika izvēlēts:

- feature-surface inheritance diagnostic next
  - jo inheritance risk nav galvenais vājais punkts
- orientation fix review
  - jo nav konkrēta booth bad-yaw proof
- 2D stand placement review
  - jo tas ir platāks vizuālā darba pavediens

## 11. Files likely affected next phase

Visticamāk skaramie faili:

- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/layoutEngine.ts`
- viens jauns mazs helper fails pie `src/shared/expo/lib/**` vai `src/modules/expo/runtime/planning/**`
- viens jauns vai paplašināts tests pie `src/modules/expo/__tests__`

## 12. Files explicitly out of scope next phase

- `src/modules/expo/runtime/booths/DistrictBooth.tsx`
- `src/modules/expo/runtime/booths/BoothVisualAssembly.tsx`
- `src/modules/expo/runtime/booths/BoothFeatureContent.tsx`
- `src/modules/expo/runtime/planning/screens/**`
- `src/shared/expo/worldContract.ts`
- booth repositioning
- booth yaw fixes
- screen orientation fixes
- AI work
- calculator work
- backend duplicate cleanup

## 13. Validation results

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Baseline paliek:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

## 14. Remaining risks

Joprojām nav covered:

- explicit booth frontality diagnostics
- center-spine/tower/rear orientation beyond screen slice
- booth-facing proof pret user-flow semantics
- overlap/bounds diagnostics, kas iet tālāk par curated slot rejection

Papildu tehniskais risks:

- booth frontality intent dzīvo kā convention (`nodeType` + yaw sign), nevis dedicated field

## 15. Next-cycle recommendation

Nākamā fāze:

- `BOOTH FRONTALITY DIAGNOSTIC FIRST SLICE`

Pareizais scopes:

- ieviest mazu pure helper/test seam priekš `ExpoBoothPlacement[]`
- pārbaudīt missing/non-finite yaw
- pārbaudīt obvious left/right yaw sign conflict
- nepakustināt nevienu booth objectu un nefixot layout šajā slice
