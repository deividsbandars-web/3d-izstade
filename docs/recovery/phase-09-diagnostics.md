## Phase 09 Diagnostics

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
- [ExpoWorldHud.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoWorldHud.tsx)

Operator surface:

- [runtime/operator/index.ts](/C:/3d/src/modules/expo/runtime/operator/index.ts)
- [reviewOperatorSession.ts](/C:/3d/src/modules/expo/runtime/operator/model/reviewOperatorSession.ts)
- [useExpoOperatorState.ts](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorState.ts)
- [ExpoOperatorZoneNav.tsx](/C:/3d/src/modules/expo/runtime/operator/navigation/ExpoOperatorZoneNav.tsx)
- [ExpoOperatorInspectionSummary.tsx](/C:/3d/src/modules/expo/runtime/operator/inspection/ExpoOperatorInspectionSummary.tsx)
- [ExpoOperatorDrawer.tsx](/C:/3d/src/modules/expo/runtime/operator/panel/ExpoOperatorDrawer.tsx)
- [ExpoOperatorOverlay.tsx](/C:/3d/src/modules/expo/runtime/operator/overlay/ExpoOperatorOverlay.tsx)

Docs:

- [phase-09-operator-and-hud-surface-split.md](/C:/3d/docs/recovery/phase-09-operator-and-hud-surface-split.md)
- [phase-09-diagnostics.md](/C:/3d/docs/recovery/phase-09-diagnostics.md)

### Remaining Risks

- `Expo3D.tsx` still coordinates both user and operator surfaces in one app entry
- operator overlay still shares the same runtime tree as the user world UI
- debug state is now operator-owned, but still wired from the app entry into scene rendering
- browser review is still needed to verify that staging operator ergonomics did not regress

### Explicit Incomplete Items

- no visual redesign
- no backend cleanup
- no `ExpoWorldScene.tsx` decomposition
- no operator/auth backend split
- no booth runtime redesign

### Remaining HUD / Operator Coupling Debt

- `Expo3D.tsx` still wires both surfaces in one place
- the user and operator surfaces still share some runtime inputs such as scene version and focus state
- there is still one common app-shell rather than a more isolated operator app boundary

### Remaining Scene / App Orchestration Debt

- `Expo3D.tsx` is still a large runtime orchestrator
- `ExpoWorldScene.tsx` remains untouched as a bigger decomposition debt
- operator surface gating is explicit now, but scene/app orchestration is not yet fully sliced into smaller shells
