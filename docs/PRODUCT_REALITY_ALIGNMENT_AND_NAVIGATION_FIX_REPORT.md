# Product Reality Alignment and Navigation Fix Report

Date: `2026-06-20`

## Summary

The active staging build was realigned around the actual product surfaces:

- public expo / city navigation
- booth profiles and booth actions
- modular-home discovery from the city shell
- modular-home preset studio and quote review paths
- booth admin / management surfaces where available

The visible fallback story was changed from Unreal / Pixel Streaming language to booth-profile language. The route shell now exposes modular homes directly from the expo experience, and `/expo/booth/:id/stream` now redirects to the booth profile route instead of showing a streamer fallback.

The staging alias was refreshed to the cleaned bundle during this round, so `https://staging.30sek24.com` now serves the same product-realistic frontend as local preview.

## What Was Removed From Visible UI

Removed or replaced from active staging-facing UI:

- `NO_ACTIVE_STREAMER`
- `PREMIUM UNREAL DEGRADED`
- `Premium Unreal`
- `Pixel Streaming` as a user-facing product claim
- `streamer` / `session` fallback copy shown to users
- `live room` framing
- `premium booth` fallback framing

Replacement language now used in visible flows:

- `Booth preview`
- `Booth profile`
- `Open booth`
- `Manage booth`
- `Booth studio`
- `Contact sponsor`
- `Return to expo`
- `This booth does not yet have a configured interactive room.`

## Route Map

| Route | Reachable from nav? | Route loads? | Useful product surface? | Missing CTA or broken state | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| `/expo-3d` | yes | yes | yes | Public city shell now shows modular homes entry and booth/profile copy | Keep staging on the refreshed bundle |
| `/expo/booth/:id` | yes | yes | partial | Booth profile is honest, but there is no live interactive room claim and no streaming CTA | Keep as profile/preview page and link to sponsor contact / admin actions |
| `/expo/booth/:id/stream` | no | yes, redirects | no | Legacy route only redirects to booth profile | Keep redirect or remove visible references entirely |
| `/expo/admin` | yes | yes | yes | Auth / permission dependent; no public claim of a live booth room | Keep as booth management surface and link from booth profile/admin context |
| `/modular-homes/studio` | yes | yes | yes | Limited preset customization only, not full detail-level editing | Keep copy honest about presets and scoped customization |
| `/modular-homes/quotes` | yes, from studio | yes | yes | Protected admin route is healthy after the service-role grant fix | Keep quote review protected and admin-only |
| `/expo/sponsor-packages` | yes | yes | yes | Public marketing copy still uses package tier names, but not streaming claims | Keep the product story focused on booth profile, sponsor packages, and quote/contact paths |
| `/expo/sponsor-leads` | yes | yes | yes | Sponsor inbox is separate from the booth profile flow | Keep as a sponsor follow-up surface, not a live room claim |

## Modular Home Reachability

Modular homes are now reachable from:

- `/expo-3d` lobby button: `OPEN MODULAR HOMES`
- `/expo-3d` world HUD: `Modular homes`
- sales demo overlay: `Open Modular Homes`
- direct entry route: `/modular-homes/studio`

The studio route keeps the existing `?homeDemo=1` behavior and routes into the same preset-based modular-home experience. The public copy now says this is a limited preset studio, not a full detail editor.

## Booth Actions That Are Actually Available

The booth profile route now exposes understandable actions:

- `Open booth profile`
- `Contact sponsor` or `Contact team` when a booking/contact URL is present
- `Manage booth`
- `View sponsor packages`
- `Return to expo`

The profile route also surfaces the honest missing-state copy:

- `This booth does not yet have a configured interactive room.`

## Booth Studio Reachability

Booth studio / booth management is reachable from the admin surface:

- `/expo/admin`
- `CompanyAdmin` preview and managed-booth paths already linked from the admin page

The public booth profile now links to `Manage booth`, but this is still permission dependent. There is no claim of a live booth room.

## What Remains Missing

- Live booth room / live streamer experience
- Pixel Streaming as a public product promise
- Unreal as a user-facing product promise
- Full detail-level modular-home configuration
- Staging deployment refresh for the updated local bundle
- Non-committed storage-state for the CompanyAdmin diagnose-only browser helper

## Do Not Claim

- no Unreal
- no Pixel Streaming
- no full detail-level home configurator
- no live booth room unless actually implemented
- no premium streaming fallback
- no live streamer/session state as a user-visible product feature

## Safe Product Story

- expo city with sponsor / booth profiles
- modular-home preset studio
- quote / contact path where available
- admin booth / media management where available

## Validation

Passed locally and on live staging:

- `npm.cmd run build`
- `npm.cmd run lint`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- local browser smoke against `http://127.0.0.1:4174/expo-3d`
- live staging browser smoke against `https://staging.30sek24.com/expo-3d`
- browser route checks for `/expo/booth/sponsor-concierge`, `/modular-homes/studio`, `/expo/admin`, and `/expo/booth/sponsor-concierge/stream`
- staging deploy and promote to `staging.30sek24.com`

Observed issues:

- the existing browser smoke helper still expects the older sales-step count and older package labels, so it reports false failures after the modular-homes CTA was added
- `scripts/check-modular-home-quote-staging.mjs` now passes after the staging service-role grant fix
- the CompanyAdmin diagnose-only browser helper still requires a non-committed storage-state file and could not be run in this shell

## Changed Files

- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/BoothStreamRoom.tsx`
- `src/modules/expo/components/ExpoLobby.tsx`
- `src/modules/expo/PixelStreamingViewer.tsx`
- `src/modules/expo/lib/sponsorBoothPresentation.ts`
- `src/modules/expo/state/expoRuntime.ts`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/app/ExpoRuntimeShell.tsx`
- `src/modules/expo/runtime/app/ExpoWorldHud.tsx`
- `src/modules/expo/runtime/salesDemo/SalesDemoGuideOverlay.tsx`
- `src/modules/expo/runtime/modularHome/RoomPanoramaWalkthroughPanel.tsx`
- `src/modules/expo/runtime/boothProduct/boothProductConfig.ts`
- `src/modules/expo/runtime/boothProduct/sponsorConciergeLeadCapture.ts`
- `src/modules/expo/runtime/booths/BoothTextureMaterials.tsx`
- `src/pages/Home.tsx`
- `src/pages/expo/CompanyAdmin.tsx`
- `src/pages/expo/SponsorPackages.tsx`
- `src/modules/expo/__tests__/sponsorConciergeLeadCapture.test.ts`
- `docs/CURRENT_TASK.md`
- `CHANGELOG.md`
- `VALIDATION.md`
- `FILES_CHANGED.txt`
