1. Summary

Phase 141 ir `PASS`.

Šī bija stabilizācijas un selection fāze jaunajam 2D info stand panelim booth feature stackā. Galvenais rezultāts:
- `BoothInfoStandFeature` ir stabils
- tas joprojām reuse-o esošo `demo_room` action
- AI, calculator un CTA strip behavior nav regressējuši

Izvēlētais nākamais target:
- `SPONSOR SCREEN INTERACTIVE STAND REVIEW`

Artifacts:
- [phase-141-2d-stand-first-visible-surface-stabilization-and-next-web3d-target-selection.md](/C:/3d/docs/recovery/phase-141-2d-stand-first-visible-surface-stabilization-and-next-web3d-target-selection.md)
- [phase-141-diagnostics.md](/C:/3d/docs/recovery/phase-141-diagnostics.md)
- [project-analysis-bundle-phase-141.zip](/C:/3d/diagnostics/project-analysis-bundle-phase-141.zip)

2. 2D Info Stand Stabilization Audit

Pārbaudīti:
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- [GlobalChat.tsx](/C:/3d/src/components/chat/GlobalChat.tsx)
- [globalChatEvents.ts](/C:/3d/src/components/chat/globalChatEvents.ts)

Apstiprināts:
- `BoothInfoStandFeature` eksistē kā atsevišķs redzams booth feature panelis
- tas ir vizuāli atšķirīgs no AI un calculator paneļiem
- `BoothInfoBand` izvēlas `demo_room` action kā `infoStandAction`
- panelis neievieš jaunu `SponsorCtaKind`
- panelis neievieš jaunu route
- panelis neievieš sponsor screen runtime interactivity
- panelis neievieš standalone 2D placement sistēmu
- panelis neievieš `worldContract` izmaiņas

3. AI/Calculator/Demo Regression Check

Apstiprināts:
- AI panelis joprojām izmanto `ai_chat` action
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts) joprojām uz `local/global_chat` izsauc [dispatchOpenGlobalChat](/C:/3d/src/components/chat/globalChatEvents.ts)
- [GlobalChat.tsx](/C:/3d/src/components/chat/GlobalChat.tsx) joprojām klausās `warpala:open-global-chat` eventu un focus-o input
- calculator panelis joprojām izmanto `calculators` action un ved uz `/calculators`
- `demo_room` joprojām izmanto esošo showroom navigāciju caur `presentation.demoRoomPath`
- CTA strip joprojām ir piesaistīts tiem pašiem actioniem, ar `demo_room` kā primāro navigation CTA

4. Booth Feature Stack Risk Check

Šobrīd booth feature stack satur:
- CTA strip
- AI feature panel
- calculator feature panel
- 2D info stand panel

Secinājums:
- stack kļuva dziļāks, bet joprojām paliek vienā lokālā seam
- nav atrasta pazīme, ka tas būtu izspiedis AI vai calculator behavior ārpus esošā modeļa
- risks paliek vairāk vizuāls nekā arhitektūras

Nav atrasts:
- child panel override uz booth facing
- jauns interaction contract
- cross-domain coupling

5. Backend Baseline Check

Baseline paliek:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

6. Candidate Web3D Target Comparison

`2D stand registry review`
- Risk: `medium`
- Value: `medium/high`
- Labs nākamais abstraction audit, bet dod mazāk tiešu city-level value

`Sponsor screen interactive stand review`
- Risk: `medium/high`
- Value: `high`
- Nākamais reālais city-wide 2D stand seam pēc booth feature proof
- Pareizi kā audit-first target, nevis tūlītēja implementation

`Overlap/bounds diagnostic review`
- Risk: `medium`
- Value: `high`
- Labs safety target, bet mazāk tiešas redzamas produkta atdeves šobrīd

`Screen/booth diagnostic integration review`
- Risk: `low/medium`
- Value: `high`
- Labs quality-hardening target, bet mazāk redzams nekā sponsor screen stand paplašinājums

7. Selected Decision

- `SPONSOR SCREEN INTERACTIVE STAND REVIEW`

8. Selection Rationale

Tas ir pareizais nākamais solis, jo:
- booth feature seam ir pierādīts un stabils
- nākamā redzamā Web3D vērtība ir city-level 2D stand presence ārpus pašiem booth feature paneļiem
- sponsor screen seam jau ir stiprs display/placement slānis
- bet tam vēl trūkst interaction proof, tāpēc nākamais solis ir audit-first review, nevis uzreiz implementation

9. Files Likely Affected Next Phase

Visticamāk auditējami:
- [WorldCityScreenSurfaces.tsx](/C:/3d/src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx)
- [sponsorScreenLayout.ts](/C:/3d/src/modules/expo/lib/sponsorScreenLayout.ts)
- [buildCanonicalWorldPlan.ts](/C:/3d/src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts)
- [ExpoWorldSceneLayers.tsx](/C:/3d/src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx)
- [worldContract.ts](/C:/3d/src/shared/expo/worldContract.ts) tikai kā read-only context

10. Files Explicitly Out Of Scope Next Phase

Ārpus scope:
- booth feature stack implementation changes
- calculator internals
- AI backend/chat backend
- backend duplicate cleanup
- broad city redesign
- object movement bez proof

11. Validation Results

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

12. Remaining Risks

Joprojām nav covered:
- sponsor screen click/action contract
- city-level stand metadata outside booth seam
- overlap/bounds diagnostics for broader 2D stand growth
- screen/booth diagnostics integration as active gate

13. Next-Cycle Recommendation

Nākamā fāze:
- `SPONSOR SCREEN INTERACTIVE STAND REVIEW`

Pareizais scopes:
- auditēt, vai sponsor screen surfaces var kļūt par drošu interaktīvu 2D stand seam
- noteikt, vai vajag action metadata, route bridge vai screen-level click host
- neiet uz implementation, kamēr nav pierādīts mazākais drošais interaction slice
