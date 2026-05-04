Phase 141 diagnostics

Stabilization scope:
- confirm `BoothInfoStandFeature` remains a separate visible booth feature panel
- confirm it still uses existing `demo_room` action
- confirm AI, calculator and CTA strip behavior remain unchanged
- confirm no sponsor screen interactivity or `worldContract` change was introduced

Files inspected:
- [BoothFeatureContent.tsx](/C:/3d/src/modules/expo/runtime/booths/BoothFeatureContent.tsx)
- [sponsorBoothPresentation.ts](/C:/3d/src/modules/expo/lib/sponsorBoothPresentation.ts)
- [BoothInteractions.ts](/C:/3d/src/modules/expo/runtime/booths/BoothInteractions.ts)
- [GlobalChat.tsx](/C:/3d/src/components/chat/GlobalChat.tsx)
- [globalChatEvents.ts](/C:/3d/src/components/chat/globalChatEvents.ts)

Findings:
- `BoothInfoStandFeature` exists and is distinct from AI and calculator panels
- `infoStandAction` resolves from existing `demo_room`
- `SponsorCtaKind` is unchanged
- `resolveSponsorCtaIntent()` is unchanged
- `dispatchOpenGlobalChat()` and `GLOBAL_CHAT_OPEN_EVENT` contract are unchanged
- no sponsor screen runtime interactivity was added
- no standalone 2D placement system was added
- no `worldContract` change happened

Validation:
- `npm.cmd run check:expo-boundaries` -> PASS
- `npm.cmd run check:backend-boundaries` -> PASS
- `npx.cmd tsc -b` -> PASS
- `npm.cmd --prefix backend-server run build` -> PASS
- `npm.cmd run build` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts` -> sandbox `spawn EPERM`, PASS outside sandbox

Current baseline:
- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`

Selected next target:
- `SPONSOR SCREEN INTERACTIVE STAND REVIEW`
