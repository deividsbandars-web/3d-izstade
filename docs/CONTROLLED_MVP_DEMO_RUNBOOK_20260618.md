# Controlled MVP Demo Runbook 2026-06-18

## Purpose

Use this runbook for a guided MVP demo of the current platform state.

This runbook is for:

- controlled sponsor walkthroughs
- guided admin/operator review
- lightweight public Expo 3D demonstration
- modular home quote/admin follow-through demonstration

This runbook is not a broad launch checklist.

## Demo Prerequisites

Confirm all of these before starting:

- Doppler config is selected for the intended target environment
- backend smoke is green
- `/api/expo/scene` is green
- a single target environment is chosen before the demo starts:
  - staging
  - production
- tester/admin accounts are available for protected routes
- the operator knows which booth/company records are safe to open during the demo

## Recommended Target Choice

Prefer staging if the audience does not need the production domain.

Prefer production only when:

- the latest read smoke is green
- admin paths are expected to be shown live
- the operator is comfortable aborting admin mutation paths if a protected route misbehaves

## Pre-Demo Smoke Checks

Run these checks immediately before the demo in the chosen target environment:

- backend health:
  - `/health`
- public scene contract:
  - `/api/expo/scene`
- public Expo 3D route:
  - `/expo-3d`
- sponsor/admin route:
  - `/expo/admin`
- sponsor packages:
  - `/expo/sponsor-packages`
- sponsor leads:
  - `/expo/sponsor-leads`
- modular home studio:
  - `/modular-homes/studio`
- modular home admin review:
  - `/modular-homes/quotes`

Expected minimum baseline from the recent smoke reports:

- `/health -> 200`
- `/api/expo/scene -> 200`
- `authPolicy=public-readonly`
- `sectors=3`
- `companies=3`
- `booths=3`
- `/expo-3d -> 200`

## Suggested Demo Order

Use this order unless the audience asked for a narrower walkthrough:

1. confirm target environment and smoke state
2. show sponsor packages and sponsor/admin workflow
3. show a booth/admin surface with media and readiness context
4. show the public Expo 3D scene
5. open a booth room if safe
6. show the modular home studio
7. show the modular home quote/admin follow-through surface

## Sponsor Demo Script

### Sponsor Packages

Open:

- `/expo/sponsor-packages`

Explain:

- sponsor packages already exist in the current product
- package selection is part of the current sponsor-facing offer
- this demo does not claim full payment or checkout verification

### Sponsor/Admin Surface

Open:

- `/expo/admin`

Show:

- publish/review status labels
- current booth/company editing surface
- media review references
- sponsor readiness panel

Explain:

- the workflow is controlled and review-based
- status labels are sponsor-facing:
  - `Draft`
  - `Submitted`
  - `Approved`
  - `Published`
  - `Archived`
- media references are reviewed before public publish
- the current MVP favors controlled review over unrestricted self-service publishing

### Media Review Talking Points

Point out:

- logo reference
- poster reference
- hero media reference
- CTA/link fields where available
- readiness guidance around missing media or CTA data

Explain:

- sponsors can prepare references and commercial content direction now
- reviewed media is preferred over arbitrary public uploads
- the current MVP does not promise a finished self-service upload/storage system

### Publish/Review Talking Points

Explain:

- draft content can be submitted for review
- admin/operator review remains part of the MVP release process
- approved content can be published to the public scene
- archived content should no longer be treated as public-scene ready

Do not claim:

- full self-service sponsor publishing
- automated moderation workflow
- final payment/checkout readiness

## Public Expo 3D Demo Script

Open:

- `/expo-3d`

Verify:

- sponsor boulevard loads
- core scene navigation works
- public booth content appears compatible with the current scene contract

Explain:

- this is the canonical browser-based public MVP path
- `/api/expo/scene` is the current public scene contract
- the city/expo shell is intentionally lightweight
- this is not an Unreal or Pixel Streaming baseline
- this is not a GLB-first product direction

If safe, open a booth room:

- `/expo/booth/:id`

Explain:

- booth rooms remain browser-based booth instances
- Web Booth Studio direction is browser-first
- premium or operator streaming infrastructure may still exist in the repo, but it is not the baseline demo path

## Modular Home Demo Script

### Studio

Open:

- `/modular-homes/studio`

Show:

- Home Design Instance shell
- `City Preview`
- `Exterior Design`
- `Floorplan`
- `Interior Rooms`
- `Quote`

Explain:

- city preview is lightweight and presentation-oriented
- detailed home work happens in this separate browser-based studio flow
- the MVP path is plan/reference/panorama/manual-review based
- the MVP path does not rely on GLB upload or imported heavy 3D models

### Quote Flow

Show:

- quote section
- customer details entry
- estimate/pricing display
- manual review positioning

Explain:

- quote pricing logic already exists and is preserved
- customer requests flow into a review/follow-up process
- this demo should position the workflow as guided quote preparation, not instant automated fulfillment

### Admin Follow-Through

Open:

- `/modular-homes/quotes`

Show:

- submitted quote rows
- status visibility
- consultant assignment
- follow-up flag
- internal note
- summary cards
- quote follow-up panel

Explain:

- admin/operator follow-through is visible
- this supports a controlled review workflow after customer submission
- this is not yet a full CRM or automation pipeline

## What Not To Promise

Do not promise any of these in the demo:

- full sponsor self-service upload workflow
- verified payment or checkout flow
- CRM/email automation unless separately verified
- GLB upload as the intended MVP path
- Unreal or Pixel Streaming as the baseline product
- unrestricted public sponsor publishing without manual review
- production-grade media storage/review pipeline beyond the current lightweight reference workflow

## Go / No-Go Checklist

Proceed with the controlled demo only if:

- smoke checks pass for the chosen target
- `/api/expo/scene` is healthy
- `/expo-3d` loads
- protected admin routes load for the operator account
- the operator has safe booth/company and quote examples ready

Do not present this as broad paid-launch ready until:

- sponsor media workflow is verified more deeply
- payment/checkout is verified
- sponsor/admin manual QA is complete
- modular home quote/admin follow-through is verified on real safe test data

## Rollback / Abort Guidance

If `/api/expo/scene` fails:

- stop the live product demo
- do not continue with Expo 3D claims
- switch to docs/screenshots only if needed

If `/expo-3d` fails:

- do not attempt to improvise a scene walkthrough
- switch to screenshots/docs only
- continue only with non-scene admin walkthroughs if they are healthy

If `/expo/admin` or `/modular-homes/quotes` fails:

- do not demo admin mutation paths
- keep the demo to public routes and documentation
- note that protected workflow verification is blocked

If booth or quote example data looks unsafe or unexpected:

- stop before mutating anything
- use read-only pages only
- avoid changing statuses during the demo

## Operator Notes

Keep the demo language aligned to the current platform reality:

- controlled demo review: yes
- browser-based Web3D MVP: yes
- manual review and operator support: yes
- broad sponsor self-service launch: not yet
- Unreal/Pixel Streaming baseline: no
- GLB-first modular home workflow: no

## Demo Outcome Standard

The demo is successful if the audience can clearly understand:

- the sponsor package and booth workflow
- the browser-based Web Booth Studio direction
- the public Expo 3D sponsor boulevard path
- the modular home studio and quote/admin follow-through path
- the difference between current MVP capability and later hardening work
