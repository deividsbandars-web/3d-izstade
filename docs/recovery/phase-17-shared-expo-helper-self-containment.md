## Phase 17: Shared Expo Helper Self-Containment

### What changed

This phase finished the remaining helper extraction needed to make `src/shared/expo/**` self-contained from the frontend expo module tree.

Canonical shared expo domain now includes:

- `src/shared/expo/sceneContract.ts`
- `src/shared/expo/layoutEngine.ts`
- `src/shared/expo/worldContract.ts`
- `src/shared/expo/lib/boulevardLayout.ts`
- `src/shared/expo/lib/districtTheme.ts`
- `src/shared/expo/walkRegion.ts`

### Shared helper extraction

Extracted pure helper/domain logic from frontend module paths into shared:

- `src/modules/expo/lib/boulevardLayout.ts` -> `src/shared/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/districtTheme.ts` -> `src/shared/expo/lib/districtTheme.ts`
- `src/modules/expo/walk-region.ts` -> `src/shared/expo/walkRegion.ts`

`src/shared/expo/layoutEngine.ts` now imports only shared helpers:

- `./lib/boulevardLayout.js`
- `./lib/districtTheme.js`

`src/shared/expo/worldContract.ts` now imports only shared helpers:

- `./walkRegion.js`
- `./lib/boulevardLayout.js`

### Compatibility wrappers

Frontend compatibility surfaces remain, but now point only to shared:

- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/types/scene.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/districtTheme.ts`
- `src/modules/expo/walk-region.ts`

The import direction is now correct:

- `src/modules/expo/**` -> `src/shared/expo/**`
- not the reverse

### Backend/shared import boundary

After this phase:

- `src/shared/expo/**` does not import `src/modules/expo/**`
- `backend-server/**` and `src/backend/expo/**` do not import `src/modules/expo/**`

This means the shared expo domain root is now structurally hard and no longer depends on frontend expo implementation files for helper authority.

### Compatibility preserved

Preserved:

- `/api/expo/scene`
- frontend runtime behavior
- backend scene contract behavior
- compatibility imports under `src/modules/expo/**`

### What did not move

This phase did not move:

- React/runtime/world code
- planning logic
- renderer logic
- operator code
- visual presentation logic

Only pure helper/domain logic was extracted.
