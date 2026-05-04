## Phase 137 Diagnostics

Environment:

- cwd: `C:\3d`
- shell: `powershell`
- date: `2026-04-28`
- timezone: `Europe/Riga`

Implementation summary:

- Added pure helper:
  - `src/shared/expo/lib/boothFrontalityDiagnostics.ts`
- Added fixture test:
  - `src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`

Helper shape:

- input:
  - `BoothFrontalityPlacement`
    - `id`
    - `nodeType`
    - `rotation`
- output:
  - `BoothFrontalityDiagnostic[]`

Diagnostic codes:

- `missing-rotation`
- `non-finite-rotation`
- `missing-node-type`
- `left-facing-conflict`
- `right-facing-conflict`

Conservative rules:

- left-family node types:
  - `hero_left`
  - `standard_left`
  - should not have clearly negative yaw
- right-family node types:
  - `hero_right`
  - `standard_right`
  - should not have clearly positive yaw
- `endcap` is intentionally ignored

Read-only confirmation:

- helper does not mutate inputs
- no booth placement generation changed
- no runtime booth rendering files changed
- no screen diagnostic logic changed
- no `worldContract` changes happened

Validation command results:

- `npm.cmd run check:expo-boundaries`
  - PASS
- `npm.cmd run check:backend-boundaries`
  - PASS
- `npx.cmd tsc -b`
  - PASS
- `npm.cmd --prefix backend-server run build`
  - PASS
- `npm.cmd run build`
  - sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/screenOrientationDiagnostics.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx src/modules/expo/__tests__/boothFrontalityDiagnostics.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox

Current backend baseline:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
