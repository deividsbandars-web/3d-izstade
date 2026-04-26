## Phase 17 Diagnostics

### Commands run

Import graph proof:

- `rg -n "modules/expo" src/shared/expo`
- `rg -n "modules/expo" backend-server src/backend/expo`

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

Import graph proof:

- `rg -n "modules/expo" src/shared/expo` -> no matches
- `rg -n "modules/expo" backend-server src/backend/expo` -> no matches

Passed in sandbox:

- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`

Sandbox-restricted:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Failure mode:

- `spawn EPERM`
- same previously proven child-process sandbox restriction around `vite` / `tsx`

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Changed files

- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/lib/districtTheme.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`
- `src/shared/expo/walkRegion.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/districtTheme.ts`
- `src/modules/expo/walk-region.ts`
- `docs/recovery/phase-17-shared-expo-helper-self-containment.md`
- `docs/recovery/phase-17-diagnostics.md`

### Remaining risks

- Compatibility wrappers under `src/modules/expo/**` still exist and can still become accidental import targets if new code ignores the shared root.
- Shared helper files were extracted by preserving behavior, so the phase is structurally significant but intentionally low-risk in behavior.
- Browser/runtime visual review was not part of this phase because the target was import authority, not scene visuals.

### Explicit incomplete items

- no visual redesign
- no planning redesign
- no operator changes
- no backend broad cleanup outside expo shared boundary
- no Supabase migrations
- no renderer rewrites

### Remaining coupling assumptions

- frontend still uses compatibility wrappers under `src/modules/expo/**`
- shared expo domain remains coupled only to:
  - its own `src/shared/expo/**` files
  - generic repo utilities outside the frontend expo runtime tree

### Remaining central boundary debt

- the main remaining debt is social/process debt, not import-graph debt:
  - developers can still import compatibility wrappers instead of shared files
- if stricter enforcement is needed later, lint/path rules would be the next step
