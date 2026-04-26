## Phase 16: Backend Expo Contract Extraction And Boundary Cleanup

### What changed

This phase removed backend authority over `src/modules/expo/**` compatibility surfaces and replaced it with a shared expo contract boundary under:

- `src/shared/expo/sceneContract.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`

The backend now imports expo scene contract and data-shaping builders from `src/shared/expo/**`, not from frontend-facing expo compatibility/runtime files.

### Backend import cleanup

Cleaned backend imports:

- `backend-server/controllers/expoDataController.ts`
- `src/backend/expo/scenes/expoSceneService.ts`
- `src/backend/expo/sceneBuilder.ts`
- `src/backend/expo/expoService.ts`
- `src/backend/expo/data/expoBoothStore.ts`
- `src/backend/expo/city/cityMapService.ts`

After this phase, backend no longer imports:

- `src/modules/expo/world-contract.ts`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/types/scene.ts`

as backend authority.

### Shared expo contract boundary

Canonical shared/domain boundary is now:

- `src/shared/expo/sceneContract.ts`
  - scene contract types
  - canonical district ids
  - release mode/version constants
- `src/shared/expo/layoutEngine.ts`
  - booth placement shaping
  - sector marker shaping
  - district theme shaping
- `src/shared/expo/worldContract.ts`
  - world contract shaping
  - district program summaries
  - world visual profile
  - start view and walk-region contract wiring

This phase only moved contract and data-shaping ownership. It did not move rendering, React runtime, planning renderers, or world scene implementation into shared/backend.

### Compatibility surfaces

These files are now compatibility-only wrappers:

- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/types/scene.ts`

They should not receive new backend contract logic.

### Route/controller/service boundary

Boundary after this phase:

- `backend-server/routes/**`
  - HTTP routing only
- `backend-server/controllers/expoDataController.ts`
  - request/response composition
  - uses shared expo contract builders
- `src/backend/expo/**`
  - backend scene/service/data composition
- `src/shared/expo/**`
  - canonical expo contract and pure data-shaping boundary
- `src/modules/expo/**`
  - frontend/runtime/compatibility surfaces

### Compatibility preserved

Preserved:

- `/api/expo/scene`
- backend staging/production split
- frontend imports using old compatibility module paths

### Transitional debt still remaining

Shared expo contract still depends on some pure helper modules under `src/modules/expo/lib/**` and `src/modules/expo/walk-region.js` for boulevard/walk shaping. Those are pure data helpers, not runtime/world/React renderers, but they remain a follow-up extraction target if the repo wants a stricter shared/domain root later.
