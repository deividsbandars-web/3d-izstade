# Phase 145 - Sponsor Screen Click Host Review

Status: PASS

## Goal

Auditēt mazāko drošo pointer/raycast click host seam sponsor screen surfaces, lai nākamajā fāzē varētu ieviest vienu šauru interaktīvu sponsor screen route action bez broad runtime redesign.

## Runtime Host Findings

Pārbaudītie runtime slāņi:

- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`
- `src/modules/expo/runtime/world/WorldCitySkeleton.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneRoot.tsx`

Secinājumi:

- `WorldCityScreenSurfaces` ir display-only surface shell.
- Tas renderē `group` ar primitīviem, bet tam nav `companyId`, `ctaLabel` vai route contract.
- `WorldCityScreenAssignments` renderē socket-level sponsor content un nes tieši vajadzīgo action seed metadata:
  - `assignment.id`
  - `assignment.companyId`
  - `assignment.label`
  - `assignment.subtitle`
  - `assignment.tier`
  - `socket.position`
  - `socket.rotation`

Tāpēc pirmais drošais click host kandidāts ir assignment layer, nevis bare surface layer.

## Navigation Seam Findings

Esošais navigation precedents jau eksistē:

- `useNavigate` tiek lietots `Expo3D.tsx`
- booth interaktivitāte lieto `navigate` caur `BoothInteractions.ts`
- sponsor room route matcher pieņem `/expo/booth/:id` tokenus pret:
  - company id
  - company slug
  - booth id
  - booth slug

Tas nozīmē, ka sponsor screen click slice var reuse-ot jau esošo route semantiku, nevis būvēt jaunu action sistēmu.

## Pointer / Camera Findings

Runtime player layer izmanto:

- `OrbitControls` fly režīmā
- `PointerLockControls` walk režīmā

Praktiskais secinājums:

- click target būs jākonstruē konservatīvi
- `stopPropagation()` visticamāk būs vajadzīgs
- clickable jābūt tikai screeniem, kuriem resolver atgriež `kind: 'route'`
- no-action screens jāpaliek inertiem

Hover/cursor affordance nav jābūt pirmajā audit slice, bet implementation slice tas būs jāņem vērā.

## Real Data Support

One-off canonical world scan:

- `screenSurfaces`: `22`
- `screenSockets`: `22`
- `screenAssignments`: `22`
- `assignmentsWithCompanyId`: `22`
- `assignmentsWithoutCompanyId`: `0`

Secinājums:

- assignment layer ir pilna `companyId` coverage
- tas ir labāks click contract host nekā surface layer

## Selected Next Target

- `ONE INTERACTIVE SPONSOR SCREEN ROUTE ACTION FIRST SLICE`

## Why This Target

Click host seam ir pietiekami skaidrs:

- host = assignment layer group
- action contract = existing resolver
- route = `/expo/booth/${companyId}`

Tāpēc nav vajadzīgs starpposma “wrapper-only” slice. Mazākais nākamais implementation var būt viens interaktīvs sponsor screen route action slice ar stingri route-action-only gating.

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
