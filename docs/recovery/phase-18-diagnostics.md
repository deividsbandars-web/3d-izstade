## Phase 18 Diagnostics

### Commands run

Boundary enforcement:

- `npm.cmd run check:expo-boundaries`

Validation inside sandbox:

- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Validation outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Results

Boundary enforcement output:

- shared files scanned: `6`
- backend-server files scanned: `2805`
- `src/backend/expo` files scanned: `10`
- violations: `0`
- status: `PASS`

Passed in sandbox:

- `npm.cmd run check:expo-boundaries`
- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Failure mode:

- `spawn EPERM`
- same previously proven environment restriction around `vite` / `tsx`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Changed files

- `package.json`
- `scripts/check-expo-boundaries.mjs`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/types/scene.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/districtTheme.ts`
- `src/modules/expo/walk-region.ts`
- `docs/recovery/phase-18-expo-domain-import-boundary-enforcement.md`
- `docs/recovery/phase-18-diagnostics.md`

### Remaining risks

- boundary protection is now automated, but only for the explicit trees covered by the script
- if the repo later adds new shared/backend expo roots, the script will need to be extended
- compatibility wrappers still exist, so misuse is blocked by checks only where those trees are covered

### Explicit incomplete items

- no visual redesign
- no planning redesign
- no operator changes
- no backend broad cleanup
- no Supabase migrations
- no renderer rewrites

### Remaining coupling assumptions

- compatibility wrappers remain as frontend-facing surfaces
- enforcement assumes expo domain code stays under the currently checked trees:
  - `src/shared/expo/**`
  - `backend-server/**`
  - `src/backend/expo/**`

### Remaining boundary debt

- there is no lint/plugin-level path enforcement yet inside editors
- the current safeguard is script-based and CI-friendly, not language-server-native
