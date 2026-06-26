# Current Task

- Last updated: `2026-06-27`
- Active objective: Phase 0 emergency cleanup, legacy modular-home cleanup verification, and `@types/three` dependency classification.
- Latest status:
  - Stashed optional Unreal asset work and the previous Pixel Streaming viewer deletion state before cleanup:
    - `stash@{0}`: `phase0 supabase temp metadata before cleanup`
    - `stash@{1}`: `phase0 optional unreal assets before cleanup`
  - Stashed tracked Supabase `.temp` metadata instead of committing local environment state.
  - Added `.codex/` and `GALA_PresentationUE5_Clean/` to `.gitignore` as local/generated evidence and presentation artifacts.
  - Preserved `src/modules/expo/PixelStreamingViewer.tsx` as a dependency-free legacy placeholder so cleanup does not leave a source deletion or reintroduce removed Pixel Streaming packages.
  - Confirmed `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx` is 550 lines, has no `renderLegacyModulePreview`, and no longer contains the named dead legacy module-block internals.
  - Confirmed `InteriorWalkthroughScene` import remains and `GalaHouseShell` remains the active exterior render path.
  - Moved `@types/three` from production dependencies to devDependencies and refreshed `package-lock.json` with `npm.cmd install`.
- Latest validation:
  - `npm.cmd run build` passed.
  - `npm.cmd run lint` passed.
  - `npm.cmd run check:all` passed.
  - Browser smoke against local Vite preview passed for `/modular-homes/studio?view=exterior&homeStudio=1`; the modular-home exterior rendered with a 1280x900 canvas.
- Latest touched files:
  - `.gitignore`
  - `package.json`
  - `package-lock.json`
  - `src/modules/expo/PixelStreamingViewer.tsx`
  - `src/modules/expo/runtime/modularHome/ModularHomeModel.tsx`
  - `docs/CURRENT_TASK.md`
- Session note: the Windows/WSL agent-environment audit, legacy module cleanup, Gala movement extraction, and GALA remediation state below are historical context from previous tasks and are not the active objective for this turn.
- Audit status:
  - Sensitive Codex auth material remains under `C:\Users\esauk\.codex\auth.json`; treat it as secret state, not working data.
  - Codex repo-specific trust state for `C:\3d` has been removed.
  - Codex custom prefix overrides were cleared from `C:\Users\esauk\.codex\rules\default.rules`.
  - Gemini trust/projects entries for `C:\3d` have been removed.
  - VS Code Codex-in-WSL override has been disabled.
  - Root `AGENTS.md` was simplified and the duplicate `handoff/.context-lite-stage/AGENTS.md` was removed so the repo has one canonical agent-instruction file.
  - Repo-specific root trust state was removed from Codex and Gemini config.
  - Root `zip`/`png` artifacts and `tmp*` directories were moved under `artifacts/root-archive/2026-06-26`.
  - `.gitignore` was tightened to ignore `artifacts/root-archive/` and legacy `server` build/dependency outputs.
  - Live alternate work roots were found at `C:\3d_phase161_pr` and `C:\3d-lfs-clean`.
  - No repo-local `.vscode` folder or Copilot instruction file was found in `C:\3d`.
  - Removed local trace folders: `C:\Users\esauk\.copilot`, `C:\Users\esauk\.claude\debug`, `C:\Users\esauk\.gemini\history`, `C:\Users\esauk\.gemini\tmp`.
  - Removed Codex runtime caches and scratch folders, but active Codex runtime files keep getting recreated while Codex is running: `cap_sid`, `history.jsonl`, `models_cache.json`, `goals_1.sqlite*`, `logs_2.sqlite*`, `state_5.sqlite*`, `.sandbox*`, `sandbox*.log`.
  - `C:\3d_phase161_pr` is empty; `C:\3d-lfs-clean` is still a full alternate project tree outside the canonical repo root.
  - Cleaned additional user-profile traces and caches under `C:\Users\esauk`: removed `AppData\Local\npm-cache`, VS Code `chatSessions` and `chatEditingSessions` under `AppData\Roaming\Code\User\workspaceStorage`, `globalStorage\emptyWindowChatSessions`, `.supabase\traces`, `.aider\caches`, `.cache`, empty `.claude`, empty `.templateengine`, and stray `package.json.bak`.
  - Removed obsolete VS Code OpenAI extension folders `openai.chatgpt-26.5616.81150-win32-x64` and `openai.chatgpt-26.5623.30605-win32-x64`; `openai.chatgpt-26.5623.31443-win32-x64` is still present and likely locked by an active VS Code/Codex process.
  - Cleared most of `AppData\Local\Temp`; a small locked remainder is still present for active applications such as Adobe, Docker Desktop, and Logitech G Hub.
  - Removed `C:\Users\esauk\vscode-remote-wsl\stable\unknown`, which had accumulated a large dump of repeated `vscode-server-stable-linux-x64.tar.gz_*` files.
  - Removed `C:\temp\edge-codex`, which was a full temporary Edge profile containing browsing/session state including `30sek` and `vercel` traces.
- Rejected evidence:
  - `C:\qa\visual-evidence\20260626-033206-gala-interior-performance-geometry-remediation-local`
- New local remediation evidence:
  - `C:\qa\visual-evidence\20260626-050056-gala-opening-interior-floor-performance-remediation-local`

## Status

No staging deploy was performed.
No backend, auth, quote, payment, public route, camera, FOV, or lookAt changes were made.
No acceptance record was created.
`productVisualAccepted=false`.
`stagingDeployAllowed=false`.
`finalLocalAcceptanceRecommended=false`.
`openingClippingRejectedByProductOwner=true`.
`interiorWallSkinRejectedByProductOwner=true`.
`floorGroundContaminationRejectedByProductOwner=true`.
`renderPerformanceRejectedByProductOwner=true`.
`singleSourceRendererProven=false`.

## Completed Audit

- Created blocker audit:
  - `OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md`
- Created owner trace:
  - `OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json`
- Updated wall-skin system spec:
  - `docs/GALA_WALL_SKIN_SYSTEM_SPEC.md`
- Created opening clip spec:
  - `docs/GALA_OPENING_CLIP_SPEC.md`
- Created floor/ground isolation spec:
  - `docs/GALA_FLOOR_GROUND_ISOLATION_SPEC.md`
- Updated performance budget:
  - `docs/GALA_PERFORMANCE_BUDGET.md`

## Completed Remediation

- Removed exterior horizontal scarf-joint board marks.
- Clipped exterior boards and reveal backing out of window/door aperture volumes.
- Made window glass transparent/readable.
- Kept open door portal visually clear.
- Matched interior boards to the exterior wall-skin module and timber tone:
  - board width: `0.18m`
  - reveal/gap width: `0.014m`
- Removed unwanted interior horizontal banding effect by making documented trim use the timber board color.
- Disabled homeStudio world-ground detail/sponsor/arrival/transition overlays inside the house footprint and lowered the remaining global ground.
- Cached GALA door collision segments, bypassed legacy expo-city raycast/elevator physics in homeStudio walking, moved keyboard motion state to refs, gated construction-audit scene traversal during movement, disabled homeStudio presence networking, and throttled homeStudio movement reporting.
- Added/updated QA:
  - `scripts/qa-gala-opening-clip-audit.mjs`
  - `scripts/qa-gala-floor-ground-isolation-audit.mjs`
  - `scripts/qa-gala-motion-performance-audit.mjs`
  - `scripts/qa-gala-furniture-clearance-audit.mjs`
  - existing wall-skin/design-intent/construction renderer guards.

## Evidence Result

- Opening clip QA passed.
- Floor/ground isolation QA passed.
- Motion performance QA passed against local preview bundle:
  - exterior motion p95 `4.3ms`, max `24.9ms`, stutters `0`
  - interior motion p95 `4.3ms`, max `20.9ms`, stutters `0`
- Static performance budget QA passed.
- Furniture clearance QA passed:
  - `wallIntersectionsDetected=false`
  - `throughWallVisibilityDetected=false`
- Wall-skin coverage QA passed.
- Cladding dimension QA passed.
- Visual design-intent QA passed.
- Visual acceptance QA passed.
- View readability diagnostic passed.
- DOM overlay QA passed.
- Renderer ownership scoped QA passed.
- Construction renderer QA passed.
- Manual remediation review:
  - PASS: 10
  - WARN: 0
  - FAIL: 0
  - NOT TESTED: 0

## Validation

- `npm.cmd run build` passed outside the sandbox after a sandbox path-only Vite emit failure.
  - Existing Vite large chunk warning remains.
- `npm.cmd run lint` passed.
- All required `node --check` commands passed.
- Browser QA was run against local Vite preview at `http://127.0.0.1:4273`.
- Local route smoke returned HTTP 200 for exterior studio, interior studio, start outside, start inside, and quote review.

## Touched Files

- `OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md`
- `OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json`
- `docs/GALA_WALL_SKIN_SYSTEM_SPEC.md`
- `docs/GALA_OPENING_CLIP_SPEC.md`
- `docs/GALA_FLOOR_GROUND_ISOLATION_SPEC.md`
- `docs/GALA_PERFORMANCE_BUDGET.md`
- `docs/CURRENT_TASK.md`
- `scripts/qa-gala-opening-clip-audit.mjs`
- `scripts/qa-gala-floor-ground-isolation-audit.mjs`
- `scripts/qa-gala-motion-performance-audit.mjs`
- `scripts/qa-gala-furniture-clearance-audit.mjs`
- `scripts/qa-gala-wall-skin-coverage-audit.mjs`
- `scripts/qa-gala-visual-design-intent-audit.mjs`
- `scripts/qa-gala-construction-renderer.mjs`
- `src/modules/expo/runtime/app/Expo3D.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx`
- `src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts`
- `src/modules/expo/runtime/world/WorldGroundPlane.tsx`
- `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`
- `src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx`
- `AGENTS.md`
- `.gitignore`

## Remaining Blockers

- Agent environment cleanup is not fully final while Codex is still running, because live runtime SQLite/log files under `C:\Users\esauk\.codex` are recreated immediately.
- Alternate project tree `C:\3d-lfs-clean` still exists outside `C:\3d`.
- One obsolete VS Code OpenAI extension folder and a small set of Temp files remain locked by active processes.
- Product-owner review of `C:\qa\visual-evidence\20260626-050056-gala-opening-interior-floor-performance-remediation-local` is still required before any local visual acceptance can be recorded.
- No acceptance record has been created.
- No staging deploy is allowed until explicitly requested.
- `architectureAuditPassed=false`.
- `singleSourceRendererProven=false`; this remediation proves scoped wall/opening/floor/performance behavior, not full renderer unification.

## Next Step

Close active Codex/VS Code Codex processes, remove the regenerated live `.codex` runtime files plus the locked obsolete extension/temp leftovers, then decide whether `C:\3d-lfs-clean` should be archived or deleted so `C:\3d` stays the only canonical working tree.

## 2026-06-26 Repository Architecture Audit Handoff

- Objective completed this turn: inspected the canonical root Vite SPA, `backend-server`, expo runtime, modular-home GALA renderer path, build/boundary tooling, and current task/audit docs to prepare an architect-planner prompt for Claude Opus 4.6.
- Key finding: root Vite SPA and `backend-server` still validate, but the worktree is heavily dirty across release frontend, backend, Supabase temp state, deployment/signaling, and optional Unreal paths. Stabilization and change ownership should precede new modular-home feature work.
- Key finding: GALA modular-home rendering is ownership-contracted, not single-source. `GalaConstructionModel.ts` is an adapter, while physics/collision, DOM overlays, route state, door runtime, and roof rendering remain separate documented owners.
- Key finding: modular-home implementation has oversized mixed-responsibility files, including `ModularHomeModel.tsx`, `ModularHomeDemoOverlay.tsx`, and `modularHomeProducts.ts`; refactoring should extract seams without changing runtime behavior first.
- Key finding: backend `tsconfig.json` intentionally compiles parts of root `src/**` into `backend-server/dist`; this should be audited as a release-packaging boundary and compared against `tsconfig.docker.json`.
- Validation run this turn:
  - `npm.cmd run check:expo-boundaries` passed.
  - `npm.cmd run check:backend-boundaries` passed.
  - `npm.cmd run lint` passed.
  - `npm.cmd run build` passed for the root frontend; expected large chunk warning remains for `Expo3D` and `three-vendor`.
  - `npm.cmd run build` in `backend-server` failed inside the sandbox with `EPERM` writes to `backend-server/dist`, then passed outside the sandbox.
- Touched files this turn:
  - `docs/CURRENT_TASK.md`
- Next recommended step: give Claude Opus 4.6 the planner prompt from this audit and require a staged plan that first freezes canonical runtime/change ownership, then audits modular-home renderer unification, then proposes minimal implementation packs with explicit validation gates.
