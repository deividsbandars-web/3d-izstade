## Phase 10 Diagnostics

### Commands Run

Frontend / root:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`

Backend:

- `npm.cmd --prefix backend-server run build`
- from `backend-server`:
  - `npx.cmd tsx routes/__tests__/expoScene.test.ts`
  - `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

### Results

Passed:

- `npx.cmd tsc -b`
- `npm.cmd run build`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorScreenLayout.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/districtLandmarkPlan.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/useExpoSceneData.contract.test.ts`
- `npm.cmd --prefix backend-server run build`
- `npx.cmd tsx routes/__tests__/expoScene.test.ts`
- `npx.cmd tsx routes/__tests__/expoScene.controller.test.ts`

Sandbox note:

- sandbox still throws `spawn EPERM` for `tsx` / Vite
- the same commands pass outside sandbox on this machine
- this remains an execution restriction, not a repo failure

### Changed File List

Runtime app:

- [Expo3D.tsx](/C:/3d/src/modules/expo/runtime/app/Expo3D.tsx)
- [ExpoRuntimeShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoRuntimeShell.tsx)
- [ExpoSceneShell.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoSceneShell.tsx)
- [useExpoRuntimeSession.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeSession.ts)
- [useExpoRuntimeErrorBridge.ts](/C:/3d/src/modules/expo/runtime/app/useExpoRuntimeErrorBridge.ts)

Operator:

- [useExpoOperatorLayer.tsx](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorLayer.tsx)
- [runtime/operator/index.ts](/C:/3d/src/modules/expo/runtime/operator/index.ts)

Docs:

- [phase-10-app-and-scene-orchestration-reduction.md](/C:/3d/docs/recovery/phase-10-app-and-scene-orchestration-reduction.md)
- [phase-10-diagnostics.md](/C:/3d/docs/recovery/phase-10-diagnostics.md)

### Remaining Risks

- `Expo3D.tsx` still owns data + presence + zone-system composition
- `useExpoOperatorLayer.tsx` is now the main operator composition owner and is still fairly large
- `ExpoSceneShell.tsx` is intentionally thin, so deep scene decomposition still remains for a later phase
- browser review is still needed to prove operator start-view and scene-shell behavior in live runtime

### Explicit Incomplete Items

- no planning rebuild
- no visual redesign
- no backend cleanup
- no booth runtime redesign
- no full `ExpoWorldScene.tsx` decomposition

### Remaining App / Scene Orchestration Debt

- `Expo3D.tsx` still composes:
  - scene data loading
  - `worldContract`
  - presence
  - zone system
- `ExpoSceneShell.tsx` is still only a boundary wrapper, not a deeper scene contract split
- `ExpoWorldScene.tsx` remains a large downstream orchestration choke point

### Remaining Operator / World / Debug Coupling Debt

- `useExpoOperatorLayer.tsx` still directly couples operator state to focus/start-view derivation
- debug still flows from operator layer into world scene through scene-shell props
- operator inspection still depends on global inspect sources exposed by the runtime scene
