## Phase 09: Operator And HUD Surface Split

### Goal

Phase 09 separates user-facing HUD authority from operator/review/debug authority.

Before this phase:

- `Expo3D.tsx` acted as both runtime entry and operator host
- `ExpoWorldHud.tsx` acted as both user HUD and operator/debug panel host
- staging/review operator behavior was mixed directly into the user-facing surface

After this phase:

- user HUD is a production-safe runtime/app surface
- operator tooling lives under `runtime/operator/**`
- operator entry is explicitly gated
- `Expo3D.tsx` wires the two surfaces together instead of being the operator logic owner

### What Was Removed From User HUD Authority

The following no longer belong to `ExpoWorldHud.tsx`:

- review operator drawer/panel
- debug toggle authority
- review/inspection target basket flows
- focus/mark/debug controls
- layer/section toggle controls
- review operator zone selection UI

`ExpoWorldHud.tsx` is now responsible only for:

- user-facing presence panel
- mic toggle
- boulevard/radar presentation
- exit action
- mobile movement controls

That is the intended production-safe HUD role.

### New Operator Surface Contract

Canonical operator surface now lives under:

- [runtime/operator/model](/C:/3d/src/modules/expo/runtime/operator/model)
- [runtime/operator/state](/C:/3d/src/modules/expo/runtime/operator/state)
- [runtime/operator/navigation](/C:/3d/src/modules/expo/runtime/operator/navigation)
- [runtime/operator/inspection](/C:/3d/src/modules/expo/runtime/operator/inspection)
- [runtime/operator/panel](/C:/3d/src/modules/expo/runtime/operator/panel)
- [runtime/operator/overlay](/C:/3d/src/modules/expo/runtime/operator/overlay)

Canonical operator files introduced in this phase:

- [reviewOperatorSession.ts](/C:/3d/src/modules/expo/runtime/operator/model/reviewOperatorSession.ts)
- [useExpoOperatorState.ts](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorState.ts)
- [ExpoOperatorZoneNav.tsx](/C:/3d/src/modules/expo/runtime/operator/navigation/ExpoOperatorZoneNav.tsx)
- [ExpoOperatorInspectionSummary.tsx](/C:/3d/src/modules/expo/runtime/operator/inspection/ExpoOperatorInspectionSummary.tsx)
- [ExpoOperatorDrawer.tsx](/C:/3d/src/modules/expo/runtime/operator/panel/ExpoOperatorDrawer.tsx)
- [ExpoOperatorOverlay.tsx](/C:/3d/src/modules/expo/runtime/operator/overlay/ExpoOperatorOverlay.tsx)

The contract is now:

- `model` resolves whether operator mode is allowed
- `state` owns operator session state and the window review API
- `navigation` owns zone teleport selection UI
- `inspection` owns inspection presentation
- `panel` owns operator drawer/panel UI
- `overlay` owns operator surface composition

### Operator Gating

Operator entry is now explicit and centralized.

Gating lives in:

- [reviewOperatorSession.ts](/C:/3d/src/modules/expo/runtime/operator/model/reviewOperatorSession.ts)

Current contract:

- operator surface is enabled only when `?operator=1` is present
- and the runtime is either:
  - `import.meta.env.DEV`
  - or `staging.30sek24.com`

That means:

- production/user path is not the default operator host
- staging/review path can carry operator tooling deliberately
- operator mode is no longer just an accidental HUD branch

### Runtime Entry Wiring

`Expo3D.tsx` now acts as a wiring layer:

- resolves operator session
- creates operator state through `useExpoOperatorState`
- passes operator state to `ExpoOperatorOverlay`
- keeps user HUD separate through `ExpoWorldHud`

This is still not a full `ExpoWorldScene.tsx` decomposition, but it is a real surface split.

### Canonical Files After This Phase

User HUD:

- [ExpoWorldHud.tsx](/C:/3d/src/modules/expo/runtime/app/ExpoWorldHud.tsx)

Operator surface:

- [runtime/operator/index.ts](/C:/3d/src/modules/expo/runtime/operator/index.ts)
- [reviewOperatorSession.ts](/C:/3d/src/modules/expo/runtime/operator/model/reviewOperatorSession.ts)
- [useExpoOperatorState.ts](/C:/3d/src/modules/expo/runtime/operator/state/useExpoOperatorState.ts)
- [ExpoOperatorOverlay.tsx](/C:/3d/src/modules/expo/runtime/operator/overlay/ExpoOperatorOverlay.tsx)
- [ExpoOperatorDrawer.tsx](/C:/3d/src/modules/expo/runtime/operator/panel/ExpoOperatorDrawer.tsx)
- [ExpoOperatorZoneNav.tsx](/C:/3d/src/modules/expo/runtime/operator/navigation/ExpoOperatorZoneNav.tsx)
- [ExpoOperatorInspectionSummary.tsx](/C:/3d/src/modules/expo/runtime/operator/inspection/ExpoOperatorInspectionSummary.tsx)

Runtime entry:

- [Expo3D.tsx](/C:/3d/src/modules/expo/runtime/app/Expo3D.tsx)

### What Still Remains Mixed Or Transitional

- `Expo3D.tsx` still orchestrates both user and operator surface wiring in one runtime app entry
- debug state still affects world rendering through app wiring
- operator overlay still lives in the same page tree rather than a future more isolated app-shell layer
- `ExpoWorldScene.tsx` is still not decomposed

These are still debts, but the operator authority is no longer primarily hosted in the user HUD.
