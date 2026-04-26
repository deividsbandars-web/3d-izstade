## Phase 18: Expo Domain Import Boundary Enforcement

### What changed

This phase added automated enforcement around the expo shared/domain boundary.

The repo now has a deterministic import-boundary check:

- `scripts/check-expo-boundaries.mjs`
- `npm run check:expo-boundaries`

The check protects these rules:

- `src/shared/expo/**` must not import `src/modules/expo/**`
- `backend-server/**` must not import `src/modules/expo/**`
- `src/backend/expo/**` must not import `src/modules/expo/**`
- `src/shared/expo/**` must not import React/runtime/UI layers

### Boundary enforcement contract

The new check resolves relative imports and fails the build if any of the protected trees cross back into frontend expo compatibility/runtime code.

It is CI-friendly because it is:

- deterministic
- filesystem-based
- non-interactive
- zero-network

### Compatibility wrapper hardening

Compatibility-only wrappers under `src/modules/expo/**` now have a stricter top-of-file warning:

- canonical source is `src/shared/expo/**`
- frontend compatibility only
- do not import from backend/shared/domain code

Files hardened in this phase:

- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/types/scene.ts`
- `src/modules/expo/lib/boulevardLayout.ts`
- `src/modules/expo/lib/districtTheme.ts`
- `src/modules/expo/walk-region.ts`

### Compatibility preserved

Preserved:

- `/api/expo/scene`
- frontend runtime behavior
- backend scene contract behavior
- compatibility wrapper imports under `src/modules/expo/**`

### What this phase did not do

This phase did not change:

- planning
- rendering
- operators
- visual UI
- backend domain behavior

It only hardened the architectural boundary against future regression.
