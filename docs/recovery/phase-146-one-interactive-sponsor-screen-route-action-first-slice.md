# Phase 146 - One Interactive Sponsor Screen Route Action First Slice

Status: PASS

## Goal

Ieviest pirmo šauro sponsor screen interactivity slice: assignment-layer sponsor screens kļūst klikšķināmi tikai tad, ja resolver atgriež route action.

## Implementation

Main implementation:

- `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`

Pievienots:

- `useNavigate`
- `resolveSponsorScreenInteraction(...)` izsaukums per assignment
- `onClick` tikai route-action gadījumā
- `event.stopPropagation()` klikšķa handlerī

## Behavior

Assignment-level candidate tiek būvēts no:

- `assignment.id`
- `assignment.companyId`
- `assignment.label`
- `assignment.subtitle`

Resolver rezultāts:

- `kind: 'route'` -> screen ir clickable un navigē uz resolver route
- `kind: 'none'` -> screen paliek inert

Šajā fāzē pirmais interaktīvais screen behavior ir:

- sponsor screen click -> `/expo/booth/${companyId}`

## Safety

Saglabāts:

- nav broad hover/pointer system
- nav raycast redesign
- nav `worldContract` izmaiņu
- nav `App.tsx` route additions
- nav screen position/rotation/layout izmaiņu

## Unchanged

Netika mainīti:

- `src/modules/expo/lib/sponsorScreenInteractionResolver.ts`
- `src/modules/expo/runtime/world/WorldCityScreenSurfaces.tsx`
- `src/modules/expo/lib/sponsorScreenLayout.ts`
- `src/shared/expo/worldContract.ts`
- booth feature stack
- calculator internals
- AI/chat backend

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

Sponsor screens tagad ir route-interactive assignment layer līmenī, bet tikai tad, ja resolver pierāda drošu route action. Tas dod pirmo city-level sponsor screen interactivity slice bez sponsor screen runtime pārbūves.
