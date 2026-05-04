## Phase 136 Diagnostics

Environment:

- cwd: `C:\3d`
- shell: `powershell`
- date: `2026-04-28`
- timezone: `Europe/Riga`

Audit evidence summary:

- Booth yaw originates in `src/shared/expo/lib/boulevardLayout.ts` curated slot bank.
- `ExpoBoothPlacement.rotation` is passed through by `src/shared/expo/layoutEngine.ts`.
- `DistrictBooth.tsx` applies `placement.rotation` to the outer booth group.
- `BoothVisualAssembly.tsx` children, including AI and calculator feature panels, live inside the same local transform.
- Existing placement diagnostics only cover slot/bounds rejection, not frontality correctness.
- Existing frontage-related runtime helpers exist in `walkRegion.ts` and `worldCityGeometry.ts`, proving booth yaw is already consumed by spatial logic.

Key findings:

1. Authored yaw is explicit:
   - slot bank stores `rotationY`
   - left/right families consistently use `Math.PI / 2` and `-Math.PI / 2`

2. Frontality intent is implicit:
   - inferred from `nodeType` and yaw sign
   - not stored as dedicated `frontFacing` metadata

3. Runtime inheritance is safe:
   - calculator and AI feature panels inherit booth group rotation
   - no risky child-level yaw override was found

4. Validator seam is missing:
   - no booth frontality helper
   - no missing/non-finite booth yaw check
   - no left/right yaw conflict diagnostic

Recommended next implementation slice:

- `BOOTH FRONTALITY DIAGNOSTIC FIRST SLICE`

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
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox
- `npx.cmd tsx backend-server/routes/__tests__/expoScene.controller.test.ts`
  - sandbox `spawn EPERM`, PASS outside sandbox

Current backend baseline:

- domain duplicate warnings: `0`
- leads duplicate warnings: `0`
- billing boundary warnings: `0`
- violations: `0`
