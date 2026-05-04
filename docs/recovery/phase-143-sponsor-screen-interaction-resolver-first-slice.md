# Phase 143 - Sponsor Screen Interaction Resolver First Slice

Status: PASS

## Goal

Ieviest mazu sponsor screen interaction resolver/helper seam, kas no esošā sponsor screen runtime metadata atvasina drošu route/action target bez pointer/click host.

## Implementation

Pievienots pure helper:

- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`

Pievienots fixture-only tests:

- `src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`

Resolver:

- pieņem šauru `SponsorScreenInteractionCandidate` shape
- izmanto tikai:
  - `id`
  - `companyId`
  - `ctaLabel`
  - `title`
  - `label`
- neko nemutē
- neko nenavigē
- nepievieno click host

## Action Contract

Resolver atgriež:

- `kind: 'route'` ar:
  - `route`
  - `label`
  - `sourceId`
  - `companyId`
- vai `kind: 'none'` ar:
  - `reason`
  - `sourceId`

Šajā fāzē ieviestais konservatīvais noteikums:

- ja `companyId` ir pieejams, route tiek atvasināts kā `/expo/booth/${companyId}`
- ja `companyId` trūkst, resolver atgriež `kind: 'none'` ar `reason: 'missing-company-id'`

Šis ir drošs, jo esošais sponsor room matcher jau atbalsta route tokenu pret:

- company id
- company slug
- booth id
- booth slug

## Label Resolution

Resolver izmanto šādu label prioritāti:

1. `ctaLabel`
2. `title`
3. `label`
4. `Open Sponsor Booth`

## Tests

Pārbaudīts:

- valid `companyId` -> route action
- `ctaLabel` tiek saglabāts kā label
- `title` fallback strādā
- `label` fallback strādā
- missing `companyId` -> `kind: 'none'`
- resolver ir pure/read-only

## Explicit Non-Goals

Netika darīts:

- `onClick` sponsor screens
- pointer cursor
- hover state
- raycast host
- `WorldCityScreenSurfaces` runtime interactivity
- `worldContract` redesign
- `App.tsx` route additions
- object movement vai screen yaw changes

## Validation

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npm.cmd run check:backend-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-only `spawn EPERM`:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenInteractionResolver.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`

## Outcome

Sponsor screen action contract tagad ir pierādīts atsevišķā helper seam. Nākamais loģiskais solis ir stabilizācija un tad izvēle starp:

- screen click host review
- one interactive sponsor screen route action
- sponsor screen action metadata review
- overlap/bounds diagnostic review
