# Unreal / Pixel Streaming Active MVP Removal Report

Date: `2026-06-20`

## Summary

The active MVP frontend no longer routes users through an Unreal / Pixel Streaming shell.

The public expo experience is now centered on:

- expo city navigation
- booth profiles
- sponsor/contact actions
- modular-home discovery
- modular-home preset studio
- admin / booth management surfaces where available

The cleaned bundle was deployed and promoted to `https://staging.30sek24.com` during this task. The live staging browser now shows the refreshed frontend.

The dead Pixel Streaming frontend packages were removed from the active package manifests, and `src/modules/expo/PixelStreamingViewer.tsx` is deleted from the working tree.

## Removed From Active MVP

Removed or hard-disabled from the active runtime path:

- `ExpoMode = 'menu' | 'walk' | 'fly' | 'unreal'`
- `ExpoRuntimeShell` rendering `PixelStreamingViewer`
- `PixelStreamingViewer.tsx` as an active route component
- user-facing streamer / signaling / session / degraded fallback copy in the public expo shell
- the Unreal / Pixel Streaming mode switch in the visible MVP
- the fake live-room framing on booth entry paths

Also updated public language to remove the old premium streaming story:

- booth cards now read as booth profiles
- booth actions now read as open / manage / contact / return to expo
- modular homes are presented as limited preset customization, not a full detail-level builder

## What Remains

The following remain only as legacy/internal implementation details or tests, not as active user-facing MVP promises:

- legacy Pixel Streaming hooks and services under `src/modules/expo/hooks` and `src/modules/expo/services`
- backend streaming support code under `src/backend/expo/streaming`
- admin preview / managed-booth helper language inside CompanyAdmin

Those paths are not part of the public MVP promise and should stay unadvertised unless the product direction changes.

## Route Reality

The current browser-visible route reality is:

- `/expo-3d` opens the public city / expo shell with modular-home entry points
- `/expo/booth/:id` opens a clean booth profile page
- `/expo/booth/:id/stream` redirects to the booth profile page
- `/expo/admin` exposes the booth management surface where authenticated access exists
- `/modular-homes/studio` opens the modular-home preset studio
- `/modular-homes/quotes` remains present and the staging quote-admin smoke passes

## Validation

Passed:

- `npm.cmd run build`
- `npm.cmd run lint`
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs`
- local browser smoke against `http://127.0.0.1:4174`
- live staging browser smoke against `https://staging.30sek24.com`
- browser route inspection for booth, modular-home, admin, and legacy stream redirect pages
- `npm.cmd run deploy:staging:preview`
- `npm.cmd run promote:staging -- https://app-staging-56h7t3lti-esaukans-6934s-projects.vercel.app`

Still failing:

- none for the modular-home quote/admin follow-through path

Scene contract remained stable:

- `GET /api/expo/scene` returned `200`
- `/api/expo/scene` continued to omit `expo_review_media`
- no-token protected route probes remained `401`
- `GET /api/expo/scene` still reports `public-readonly` and no `expo_review_media`

## Do Not Claim

- no Unreal
- no Pixel Streaming
- no live booth room
- no full detail-level home configurator
- no premium streaming fallback

## Safe Product Story

- expo city with sponsor / booth profiles
- modular-home preset studio
- quote / contact path where available
- admin booth / media management where available
