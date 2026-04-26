## Phase 16 Diagnostics

### Commands run

Inside sandbox:

- `npx.cmd tsc -b`
- `npm.cmd --prefix backend-server run build`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Results

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
- same previously proven environment restriction around `vite` / `tsx` child-process spawning

Passed outside sandbox on the same machine:

- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Changed files

- `backend-server/controllers/expoDataController.ts`
- `src/backend/expo/city/cityMapService.ts`
- `src/backend/expo/data/expoBoothStore.ts`
- `src/backend/expo/expoService.ts`
- `src/backend/expo/sceneBuilder.ts`
- `src/backend/expo/scenes/expoSceneService.ts`
- `src/shared/expo/sceneContract.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/types/scene.ts`
- `docs/recovery/phase-16-backend-expo-contract-extraction.md`
- `docs/recovery/phase-16-diagnostics.md`

### Remaining risks

- `src/shared/expo/layoutEngine.ts` and `src/shared/expo/worldContract.ts` still depend on pure helper modules under `src/modules/expo/lib/**` and `src/modules/expo/walk-region.js`.
- Compatibility wrappers under `src/modules/expo/**` still exist and can attract future imports if not kept disciplined.
- Browser/runtime review was not part of this phase because the change is boundary-focused, not visual.

### Explicit incomplete items

- no frontend visual changes
- no planning redesign
- no operator changes
- no Supabase migration changes
- no broad backend cleanup outside expo boundary

### Remaining coupling assumptions

Remaining shared-to-frontend coupling:

- `src/shared/expo/layoutEngine.ts` -> `src/modules/expo/lib/boulevardLayout.js`
- `src/shared/expo/layoutEngine.ts` -> `src/modules/expo/lib/districtTheme.js`
- `src/shared/expo/worldContract.ts` -> `src/modules/expo/walk-region.js`
- `src/shared/expo/worldContract.ts` -> `src/modules/expo/lib/boulevardLayout.js`

This is now helper-level coupling, not backend authority coupling into frontend runtime/render/planning implementation.

### Remaining backend boundary debt

- backend still consumes shared builders that were extracted from frontend compatibility surfaces
- those builders are now canonical shared authority, but some lower-level shaping helpers have not yet been moved under `src/shared/expo/**`
