# Prompt Template

Use this template for future Codex tasks.

## Base instruction

Read this file first and follow the project rules below.

## Project invariants

* Preserve the root Vite SPA as the canonical frontend.
* Preserve `backend-server` as the canonical backend.
* Preserve Vercel frontend, GitHub workflows, Hetzner/VPS backend, Docker Compose, Redis, TURN/signaling, Supabase and Doppler.
* Do not touch `apps/frontend`.
* Do not rebuild the project from scratch.
* Do not replace the current architecture.
* Do not introduce Unreal, Pixel Streaming, GLB/GLTF/FBX, PlayCanvas or Babylon as an MVP baseline.
* Do not expose service-role keys to frontend.
* Do not commit secrets, env files, cookies, storage-state files, tokens, browser profiles, generated media or screenshots with sensitive data.
* Do not mutate production data.
* Do not deploy production unless explicitly requested.
* Make the smallest focused diff.

## Standard task format

Task:
[Describe the specific goal.]

Scope:
[Files/areas allowed to change.]

Out of scope:
[Files/areas/features that must not change.]

Acceptance:

* [Expected result 1]
* [Expected result 2]
* [Expected result 3]

Validation:
Run and document:

* `npm run build`
* `npm run lint`
* `doppler run -- node scripts/smoke-backend-supabase.mjs`
* any task-specific command

Output:
Create a path-preserving ZIP containing only changed/created non-secret files, plus:

* `FILES_CHANGED.txt`
* `CHANGELOG.md`
* `VALIDATION.md`

After creating the file, update:

* `FILES_CHANGED.txt`
* `CHANGELOG.md`
* `VALIDATION.md`

Validation:

* `npm run build` is not required if this is docs-only, unless the repo policy requires it.
* `npm run lint` is not required if this is docs-only, unless the repo policy requires it.

Output:
Create a path-preserving ZIP containing only:

* `docs/PROMPT_TEMPLATE.md`
* `FILES_CHANGED.txt`
* `CHANGELOG.md`
* `VALIDATION.md`
