# Phase 152: Sponsor Screen Subtle Hover Highlight First Slice

Status: PASS

Goal:
- Add minimal visual hover highlight only for route-action sponsor screens.
- Keep inert screens fully silent.
- Avoid tooltip, CTA hint, broad pointer system, route changes, and layout changes.

Implementation summary:
- The implementation stays entirely inside `src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx`.
- Route-action gating still comes from `resolvedAction.kind === 'route'`.
- A local hovered assignment state was added to support a per-assignment visual emphasis.
- The hover treatment is limited to small opacity emphasis on assignment-owned `plane` and `texture-plane` primitives.

Behavior:
- Route-action sponsor screens:
  - remain clickable
  - keep cursor pointer affordance
  - now receive a subtle visual hover highlight
- No-action sponsor screens:
  - remain inert
  - receive no click
  - receive no cursor
  - receive no highlight
  - receive no tooltip

Key implementation details:
- `useState` tracks `hoveredAssignmentId`.
- `onPointerOver` sets the hovered assignment only for route-action screens.
- `onPointerOut` clears the hovered assignment only for route-action screens.
- `useEffect` cleanup resets `document.body.style.cursor = 'auto'` on unmount.
- `renderPrimitive(...)` now accepts a `highlighted` flag.
- Highlight is implemented via a small local opacity increase:
  - `plane`
  - `texture-plane`
- `text` primitives remain unchanged to keep the first slice conservative.

Preserved behavior:
- Click still uses `navigate(resolvedAction.route)`.
- `event.stopPropagation()` remains in the click handler.
- Resolver behavior remains unchanged.
- Route contract remains resolver-owned.

Scope confirmation:
- No `WorldCityScreenSurfaces.tsx` redesign.
- No `worldContract` changes.
- No `App.tsx` changes.
- No route additions.
- No screen position, rotation, size, or layout changes.
- No booth feature stack, calculator, or AI behavior changes.
