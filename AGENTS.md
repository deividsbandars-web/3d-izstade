# AGENTS.md

## Product Direction

This repo's canonical product is the sponsor-facing Web3D expo platform.

Prioritize:
- root Vite SPA as the release frontend
- `backend-server` as the release backend
- sponsor boulevard and `/api/expo/scene` as the default release path
- mobile-first performance and graceful degradation

Treat Pixel Streaming and Unreal tooling as optional premium/operator workflows, not the baseline product.

## Default Work Surface

Inspect first:
- `src/`
- `public/`
- `backend-server/`
- root `package.json`, `vite.config.ts`, `docker-compose*.yml`
- `supabase/` when backend data contracts are involved

Do not start in secondary or archival trees unless the task explicitly points there:
- `apps/frontend/`
- `WarpalaUE5/`
- `assets-intake/`
- `handoff/`
- `diagnostics/`
- `docs/recovery/`
- `GALA_*`

## Engineering Rules

- Keep sponsor, booth, zone, event, and mission content configuration-driven where possible.
- Do not hardcode sponsor-specific content deep inside rendering components.
- Preserve separation between performance controls, visibility systems, sponsor/booth presentation, and analytics/guide/mission systems.
- Prefer constrained-device rendering, aggressive mobile DPR caps, zone-based visibility, instancing/pooling, compressed textures, limited raycast targets, and paused offscreen media.
- Avoid heavy real-time shadows on mobile, generic metaverse clutter, duplicated filler structures, and noisy or overlapping sponsor surfaces.

Performance targets:
- mobile: stable 30 FPS
- desktop: stable 60 FPS where realistic

## Workflow

- Read `PROJECT_CONTEXT_LOCK.md` and `docs/CURRENT_TASK.md` first.
- Honor `.codexignore`.
- Prefer `rg --files` and targeted file reads over broad scans.
- Do not inspect `node_modules/`, `dist/`, `handoff/`, `diagnostics/`, `assets-intake/`, `WarpalaUE5/`, `apps/frontend/`, or `docs/recovery/` unless needed for the task.
- Make minimal focused changes.
- Run relevant validation for touched areas and report failures honestly.
- Update `docs/CURRENT_TASK.md` at the end of the task.
