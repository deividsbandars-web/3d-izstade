# RELEASE ROADMAP V1 — Web3D Expo Platform + GALA Modular-Home Studio

> Principal-architect master plan to take the canonical product from its current
> Phase 0–3 state to a stable, production-ready release.
>
> **Owner of this document:** Principal Architect (planning). Implementer agents
> execute the numbered Implementation Packs below.
>
> **Status at authoring:** `productVisualAccepted=false`, `singleSourceRendererProven=false`,
> `stagingDeployAllowed=false`, `architectureAuditPassed=false`. Worktree is dirty
> (30+ modified files, untracked `artifacts/`, multiple ad-hoc audit `.md`/`.json` at repo root).

---

## 0. How to use this document

1. Phases are **strictly ordered**. Do not start a phase until the prior phase's
   exit gate passes. Within a phase, packs may run in parallel unless a pack
   declares a dependency.
2. Each **Implementation Pack** is self-contained and copy-pasteable to a single
   implementer agent. It names exact files, the task, the constraints, the
   validation commands, and the Definition of Done (DoD).
3. **Every pack** must end by re-running the relevant gates from
   [§9 Validation Gate Reference](#9-validation-gate-reference) and appending an
   entry to `docs/CURRENT_TASK.md` in the established format (objective,
   implementation, validation, touched files, product/release status, next step).
4. **No pack may** change camera/FOV/lookAt on the sponsor boulevard path, alter
   auth/quote/payment behavior, or perform a staging/production deploy unless the
   pack explicitly says so. Product-visual acceptance is a human gate, never a
   self-reported flag.

### Scope lock (from project constraints)

| In scope (release path) | Out of scope / deprioritized |
| --- | --- |
| Root Vite SPA (`/expo-3d`, `/modular-homes/studio`, sponsor boulevard) | `WarpalaUE5/`, `GALA_PresentationUE5_Clean/`, Pixel Streaming runtime |
| `/api/expo/scene` + GALA quote-submission API | `apps/frontend/`, `assets-intake/`, `tower-cluster/` |
| `backend-server` (Express) + Supabase data/auth/RLS | Optional premium/operator archives, legacy `server/` sync |
| QA scripts (`scripts/qa-gala-*`, `scripts/check-*`) | UE5 import/streaming tooling, commercial-demo PowerShell |

---

## 1. Audit findings (current repository state)

### 1.1 Frontend (Vite SPA)
- **Routing** (`src/App.tsx`): React Router v7, all routes lazy-loaded. Canonical 3D
  routes are mounted **outside** the `Layout` shell: `/expo-3d` (`Expo3D`) and
  `/modular-homes/studio` (`ModularHomeStudioPage`). There are **no route-level error
  boundaries** — a lazy chunk failure or a render throw shows only the raw Suspense
  fallback ("Initializing Warpala OS...") or a blank screen.
- **Bundling** (`vite.config.ts`): `manualChunks` already splits `modular-home`,
  `three-core`, `react-three-vendor`, `react-vendor`, `supabase-vendor`,
  `stripe-vendor`. **However** the build still emits the Vite "large chunk" warning
  (>500 kB) on `Expo3D`/three vendor on every build per `docs/CURRENT_TASK.md`. The
  chunk budget is documented but **not enforced**.
- **PWA**: `vite-plugin-pwa` with `maximumFileSizeToCacheInBytes: 5_000_000` and
  `registerType: 'autoUpdate'`. Workbox precache will silently skip assets >5 MB.
- **Monolithic / mixed-responsibility files** (top offenders, lines):
  | File | Lines | Note |
  | --- | ---: | --- |
  | `src/pages/expo/CompanyAdmin.tsx` | 2763 | sponsor admin page, mixed UI+state+fetch |
  | `src/modules/expo/runtime/modularHome/modularHomeComponents.ts` | 2259 | catalogue/config "everything" module |
  | `src/modules/expo/runtime/modularHome/ModularHomeProjectSummary.tsx` | 2228 | summary UI + derivations |
  | `src/modules/expo/runtime/operator/model/reviewOperatorSession.ts` | 1750 | operator (deprioritized) |
  | `src/modules/expo/runtime/modularHome/modularHomeProducts.ts` | 1699 | API surface over extracted JSON |
  | `src/modules/city/CityGenerator.ts` | 1670 | legacy city geometry |
  | `src/pages/expo/SponsorLeadInbox.tsx` | 1633 | sponsor lead inbox page |
  | `src/modules/expo/runtime/modularHome/modularHomeEstimate.ts` | 1460 | pricing/estimate engine |
  | `src/modules/expo/runtime/modularHome/ModularHomeEstimatePanel.tsx` | 1395 | estimate UI |
  | `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts` | 1351 | config state machine |
  | `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx` | 1268 | QA hook compiled into runtime |
  | `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx` | 1003 | player physics + door + collision |
- **QA-in-runtime smell**: `Expo3DQAHook.tsx` (1268 lines) and the `window.__WARPALA_*`
  facades live in the shipped runtime tree. They must be tree-shaken / dev-gated for
  the production bundle.

### 1.2 GALA renderer ownership
- `docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md` already defines a clear owner matrix.
  The active render path is `ExpoWorldSceneLayers → ModularHomeModel → GalaHouseShell
  → GalaConstructionRenderer → {wall, opening, floor/ceiling, cladding, room, roof}`
  assemblies, backed by the `GalaConstructionModel.ts` **adapter** (explicitly *not* a
  proven single source).
- **Contradiction to resolve:** the contract lists `GalaInteriorFurniture.tsx`,
  `GalaOpenings.tsx`, `GalaInterior.tsx` as *legacy/inactive*, yet recent CURRENT_TASK
  entries and the dirty worktree modify `GalaInteriorFurniture.tsx` as if active.
  Ownership truth is ambiguous and must be reconciled before refactor.
- Physics/collision (`GalaFloorplan.ts` + `ExpoWorldPlayerLayer.tsx`), door runtime
  (`GalaHouseState.ts`/`GalaDoorState.ts`), and DOM overlays are separate documented
  owners. Good seams already exist.

### 1.3 Backend & packaging — **highest-risk finding**
- **Two divergent backend builds:**
  - *Full server* — `backend-server/server.ts` + `routes/api.ts` + `tsconfig.json`.
    Serves the canonical product, **including** `POST /api/modular-home/quote`,
    calculator leads, analytics, sponsor admin/lead-inbox, billing, etc.
    `tsconfig.json` **compiles root `src/backend`, `src/lib`, `src/core`, `src/services`
    into `backend-server/dist`** (deep root↔backend coupling). `docker-compose.yml`
    runs this via **`Dockerfile.full` → `tsx backend-server/server.ts`** (interpreted,
    *not* from compiled `dist`) "because the current ESM output layout in
    backend-server/dist" is unreliable.
  - *Minimal server* — `server.docker.ts` + `routes/api.docker.ts` + `tsconfig.docker.json`.
    Serves **only** `/pixel-streaming/*`, `/expo/lead`, `/expo/scene`. **It does NOT
    serve `/modular-home/quote`.** This is what `npm run build:docker` /
    `backend-server/Dockerfile` (`start:docker`) produce and the only path that cleanly
    compiles+runs from `dist`.
  - **Release risk:** if production deploys via the minimal Docker path, the GALA
    lead-gen endpoint is silently absent; if it deploys via the full path, it ships
    interpreted source with an unreliable compiled artifact. The "production backend"
    target is **undefined** and must be pinned in Phase 4.
- **GALA quote endpoint is deliberately NOT production-ready**
  (`backend-server/controllers/modularHomeQuoteController.ts`):
  `productionReady: false`; enabled only when `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED=true`,
  **and** request carries `?homeQuoteBackend=1`, **and** host/env is staging/preview.
  Rate limiting is **in-process `Map`** (5/10min/IP) — not multi-instance safe. No
  honeypot/Turnstile. Email/CRM handoff is stubbed (`emailHandoffQueued: false`). This
  gate must be productionized to release the GALA studio.
- **Env contracts:**
  - Frontend (`src/config/runtimeEnv.ts`): **required** `VITE_PUBLIC_API_BASE_URL`,
    `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; optional signaling/STUN/TURN.
  - Backend (`backend-server/config/runtimeEnv.ts`): **required** `SUPABASE_URL`,
    `SUPABASE_SERVICE_KEY`, `SIGNALING_STATUS_BASE_URL`, `UE5_SECRET_KEY`. The full
    server **forces UE5/signaling env even for a GALA-only deploy** — a coupling to the
    deprioritized Pixel Streaming path that should be made optional or stubbed.

### 1.4 Supabase
- 40+ ordered migrations under `supabase/migrations/`. The GALA table
  `modular_home_quote_requests` (`20260609040000`) is **correctly hardened**: RLS
  enabled, **default-deny** policy (`USING(false) WITH CHECK(false)`), service-role-only
  insert/select (later granted in `20260620000000`), sensible indexes + `updated_at`
  trigger. Admin read/export/status routes are `adminOnly` in `api.ts`.
- **Gap:** there is no automated check that migrations are applied in order or that RLS
  is still default-deny on release; this is verified only manually today.

### 1.5 QA tooling
- **22** `scripts/qa-gala-*.mjs` + **13** `scripts/check-*.mjs`. High overlap and at
  least one known **contradiction**: legacy construction-renderer QA reports floor-color
  flags that the focused design-intent audit passes (noted in `CURRENT_TASK.md`).
- Boundary checks are solid: `check-expo-boundaries.mjs` enforces that `src/shared/expo`
  never imports React/UI/modules and that backend never imports `src/modules/expo`.
- **No CI**: all gates run locally/manually. There is no GitHub Actions (or equivalent)
  wiring the gates into a PR check.

### 1.6 Repo hygiene
- Repo root is littered with ad-hoc audit artifacts (`AUDIT.md`, `*_OWNER_TRACE.json`,
  `WALL_SKIN_*`, `INTERIOR_PERFORMANCE_*`, `ss1..4.png`, `tmp-*.log`,
  `FILES_CHANGED.txt`, `diagnostics_output.txt`) and an `artifacts/` tree. These
  inflate the build context and obscure the release surface.

---

## 2. Release path definition (the single source of "what ships")

The release is **GREEN** when all of the following are simultaneously true:

1. `git status` is clean on the release branch; only intended files are tracked.
2. `npm run build` (root) succeeds **with no chunk over the enforced budget**.
3. `npm run lint` + `npm run check:all` pass.
4. Backend: a **single, pinned** production server target builds from `dist` and runs
   from `dist` (no `tsx` in production), and serves `/api/expo/scene` **and**
   `/api/modular-home/quote`.
5. GALA quote endpoint is production-gated (env-flag controlled, distributed rate limit,
   spam protection) and verified end-to-end against the production Supabase table with
   RLS default-deny intact.
6. Static + motion performance budgets pass on desktop and a constrained mobile profile.
7. A human product-owner records visual acceptance (`productVisualAccepted=true`).

---

## 3. Phase 0 — Worktree freeze & change-ownership baseline

**Goal:** establish a clean, attributable baseline. You cannot release from a 30-file
dirty tree with untracked root artifacts. **Exit gate:** clean `git status` on a release
branch; `build`/`lint`/`check:all` green; CURRENT_TASK reflects the freeze.

### Pack 0.1 — Triage and commit the dirty worktree
- **Files:** all currently-modified `src/modules/expo/runtime/modularHome/**`,
  `scripts/qa-gala-*.mjs`, `vite.config.ts`, `docs/CURRENT_TASK.md` (see `git status`).
- **Task (copy-paste):**
  > Run `git status` and `git diff --stat`. Group the 30 modified files into coherent
  > commits by subsystem (GALA construction renderer, GALA floorplan/state, QA scripts,
  > world/scene, build config). For each group, write a conventional commit on the
  > current `feat/booth-camera-screen-feed-current` branch. Do **not** alter behavior;
  > this is a commit-hygiene pass only. After committing, run `npm run lint`,
  > `npm run check:all`, and `npm run build` and record results in `docs/CURRENT_TASK.md`.
- **Validation:** `git status` clean except untracked artifacts; `npm run lint`;
  `npm run check:all`; `npm run build`.
- **DoD:** working tree clean of tracked changes; all gates green; commits attributable.

### Pack 0.2 — Quarantine root audit artifacts
- **Files:** root-level `*.md`/`*.json`/`*.png`/`*.log` audit debris (`AUDIT.md`,
  `AUDIT_STATUS_AFTER_WALL_SKIN_REMEDIATION.json`, `CLADDING_*`, `INTERIOR_PERFORMANCE_*`,
  `OPENING_INTERIOR_FLOOR_PERFORMANCE_*`, `WALL_SKIN_*`, `MANUAL_WALL_SKIN_REVIEW.md`,
  `VISUAL_*`, `ss1.png`–`ss4.png`, `tmp-*.log`, `diagnostics_output.txt`,
  `FILES_CHANGED.txt`, `modular-home-studio-detail-upgrade-final-entries.txt`), plus
  `artifacts/`, `review_artifacts/`.
- **Task (copy-paste):**
  > Move the listed root-level audit/debug artifacts into `docs/recovery/2026-06-29-audit-archive/`
  > (keep history, do not delete). Confirm `.gitignore` already ignores `artifacts/` and
  > `artifacts/root-archive/`; extend it to ignore `tmp-*.log`, `*.stderr.log`,
  > `*.stdout.log`, and root `ss*.png`. Verify the Docker build context shrinks
  > (`docker build` dry inputs) and that `npm run build` is unaffected.
- **Validation:** `npm run build`; `git status` shows only the intended moves;
  no source import references the moved files (`rg` for filenames).
- **DoD:** repo root contains only product/config files + canonical docs; build green.

### Pack 0.3 — Cut the release branch and pin the baseline
- **Task (copy-paste):**
  > From the clean tree, create branch `release/v1-stabilization` off the freeze commit.
  > Tag the baseline `v1-baseline`. Add a `docs/RELEASE_BASELINE.md` capturing: current
  > commit SHA, output of `npm run build` chunk sizes, `npm run check:all` summary, and
  > the backend `tsc -p tsconfig.json` / `tsc -p tsconfig.docker.json` results. This is
  > the reference point all later phases are measured against.
- **DoD:** `release/v1-stabilization` branch + `v1-baseline` tag exist; baseline doc committed.

---

## 4. Phase 1 — Architecture stabilization & ownership contracts

**Goal:** freeze canonical ownership so refactors in Phase 2 are safe. **Exit gate:**
ownership contracts updated and enforced by a check script; backend packaging target
pinned; `check:all` green.

### Pack 1.1 — Reconcile GALA renderer active-vs-legacy ownership
- **Files:** `docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md`,
  `src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx`, `GalaInterior.tsx`,
  `GalaOpenings.tsx`, `GalaCeiling.tsx`, `ModularHomeModel.tsx`,
  `construction/GalaRoomAssembly.tsx`, `construction/GalaConstructionRenderer.tsx`.
- **Task (copy-paste):**
  > Determine empirically which furniture/interior/opening modules are actually mounted
  > on `/modular-homes/studio?homeStudio=1` (exterior and interior). Use
  > `scripts/qa-gala-renderer-ownership-audit.mjs` + a runtime scene inventory. Resolve
  > the contradiction in `GALA_RENDERER_OWNERSHIP_CONTRACT.md` where
  > `GalaInteriorFurniture.tsx`/`GalaOpenings.tsx`/`GalaInterior.tsx` are listed as
  > "legacy/inactive" but are still edited as active. Either (a) update the contract to
  > mark them active with their real owners, or (b) confirm they are dead and move them
  > under a `legacy/` subfolder excluded from the active route. Do **not** change rendered
  > output. Update the owner matrix to match reality.
- **Validation:** `npm run lint`; `node --check` on edited mjs; `qa-gala-renderer-ownership-audit.mjs`;
  `qa-gala-dom-overlay-audit.mjs`; `npm run build`.
- **DoD:** ownership contract matches the actual mounted tree; no behavior change;
  legacy files clearly separated.

### Pack 1.2 — Add an ownership/legacy-import guard script
- **Files:** new `scripts/check-gala-renderer-ownership.mjs`; wire into `package.json`
  `check:all`.
- **Task (copy-paste):**
  > Create `scripts/check-gala-renderer-ownership.mjs` that fails if any file under the
  > active GALA construction render path imports a module the ownership contract marks as
  > legacy (mirror the AST/regex approach in `scripts/check-expo-boundaries.mjs`). Add
  > `"check:gala-ownership": "node scripts/check-gala-renderer-ownership.mjs"` and append
  > it to the `check:all` chain. This is the automated enforcement of Pack 1.1.
- **Validation:** `npm run check:gala-ownership`; `npm run check:all`.
- **DoD:** script passes on the reconciled tree and fails if legacy imports are reintroduced.

### Pack 1.3 — Pin the production backend target (resolve dual-build)
- **Files:** `backend-server/tsconfig.json`, `backend-server/tsconfig.docker.json`,
  `backend-server/routes/api.docker.ts`, `backend-server/server.docker.ts`,
  `backend-server/Dockerfile`, `backend-server/Dockerfile.full`, `docker-compose.yml`,
  `backend-server/package.json`, new `docs/BACKEND_RELEASE_PACKAGING.md`.
- **Task (copy-paste):**
  > Decide and document the single production backend target. The full server
  > (`server.ts`+`api.ts`) is the only one that serves `/api/modular-home/quote`, so it
  > must be the release target. (1) Make the full backend build **and run from compiled
  > `dist`** — fix the ESM output layout so `npm run build` + `npm start`
  > (`node dist/backend-server/server.js`) work without `tsx`; if root `src/**` coupling
  > blocks this, document and minimize the compiled root surface
  > (`src/backend`, `src/lib`, `src/core`, `src/services`). (2) Update `Dockerfile.full`
  > to run the compiled artifact, not `tsx`. (3) Either retire the minimal
  > `api.docker.ts`/`server.docker.ts`/`Dockerfile` path or add `/modular-home/quote`
  > (+ its admin routes) to `api.docker.ts` and clearly label it. (4) Write
  > `docs/BACKEND_RELEASE_PACKAGING.md` mapping each route file → build → Docker image →
  > deploy command, and which one is canonical. Do not change route auth policy.
- **Validation:** in `backend-server/`: `npx tsc --noEmit -p tsconfig.json`;
  `npm run build`; `node dist/backend-server/server.js` boots with required env;
  `curl /api/expo/scene` 200 and `POST /api/modular-home/quote` reaches the gate logic.
- **DoD:** exactly one canonical production backend target, built+run from `dist`, serving
  both `/api/expo/scene` and `/api/modular-home/quote`; packaging doc committed.

### Pack 1.4 — Audit & narrow the root↔backend shared compile boundary
- **Files:** `backend-server/tsconfig.json` (`include` of `../src/**`),
  `scripts/check-backend-boundaries.mjs`, `scripts/check-backend-shared-boundaries.cjs`,
  `docs/BACKEND_SERVER_ONLY_DEPENDENCY_AUDIT.md`.
- **Task (copy-paste):**
  > Enumerate exactly which files under `src/backend`, `src/lib`, `src/core`,
  > `src/services` are compiled into the backend (`backend-server/tsconfig.json`). For
  > each, confirm it is genuinely shared and free of browser-only/React imports. Tighten
  > the `include` globs to the minimal shared set. Confirm
  > `check:backend-boundaries` / `check:backend-shared-boundaries` still pass and extend
  > them if any non-shared file is being pulled in. Update
  > `docs/BACKEND_SERVER_ONLY_DEPENDENCY_AUDIT.md`.
- **Validation:** `npm run check:backend-boundaries`; `npm run check:backend-shared-boundaries`;
  backend `tsc -p tsconfig.json`.
- **DoD:** the compiled-shared surface is minimal, documented, and boundary-checked.

---

## 5. Phase 2 — Codebase refactoring (monolith extraction)

**Goal:** extract clear seams from the largest mixed-responsibility files **without
altering runtime behavior**. Each pack is behavior-preserving and gated by build+lint+QA.
**Exit gate:** no targeted file exceeds ~800 lines without justification; all gates green.

> Refactor rule for every pack in this phase: **pure move/extract**. Public exports keep
> their import paths (re-export from the original module). Add no new dependencies. If a
> behavior change seems necessary, stop and escalate.

### Pack 2.1 — Split `modularHomeComponents.ts` (2259 lines)
- **Files:** `src/modules/expo/runtime/modularHome/modularHomeComponents.ts` →
  new `modularHome/components/` submodules; keep `modularHomeComponents.ts` as a barrel
  re-export.
- **Task (copy-paste):**
  > Identify the distinct concern clusters in `modularHomeComponents.ts` (data tables,
  > option catalogues, derivation helpers, type definitions). Extract each cluster into a
  > focused file under `modularHome/components/` and re-export everything from the original
  > `modularHomeComponents.ts` so no importing file changes. No logic edits. Verify the
  > `src/modules/expo/__tests__/modularHomeProducts.test.ts` still passes.
- **Validation:** `npm run lint`; `npm run build`; run the modular-home test fixture;
  `npm run check:expo-boundaries`.
- **DoD:** original module is a thin barrel; submodules <600 lines each; tests/build green.

### Pack 2.2 — Split the estimate/pricing engine
- **Files:** `modularHomeEstimate.ts` (1460), `modularHomePricing.ts` (533),
  `modularHomeSupplierCosts.ts` (518), `modularHomeQuantities.ts` (242).
- **Task (copy-paste):**
  > Within `modularHomeEstimate.ts`, separate (a) the estimate computation core,
  > (b) line-item/scope formatting, and (c) currency/VAT helpers into sibling files,
  > re-exported from `modularHomeEstimate.ts`. Keep numeric output identical. Add a unit
  > test snapshotting `estimatedTotal` + line items for the 3 known products
  > (`compact-timber-40`, `family-timber-80`, `sauna-cabin-25`) before and after to prove
  > parity.
- **Validation:** new parity test; `npm run lint`; `npm run build`.
- **DoD:** identical estimate outputs proven by snapshot test; files <800 lines.

### Pack 2.3 — Decompose `CompanyAdmin.tsx` (2763) and `SponsorLeadInbox.tsx` (1633)
- **Files:** `src/pages/expo/CompanyAdmin.tsx`, `src/pages/expo/SponsorLeadInbox.tsx`.
- **Task (copy-paste):**
  > Extract data-fetching/state into hooks (`useCompanyAdminState`,
  > `useSponsorLeadInbox`) and break the render tree into section components under
  > `src/pages/expo/companyAdmin/` and `.../sponsorLeadInbox/`. Move any reusable fetch
  > logic to `src/modules/expo/services`. Do not change API calls or auth gating. Verify
  > with the existing browser-smoke gates.
- **Validation:** `npm run lint`; `npm run build`;
  `npm run check:expo-sponsor-inbox-browser-smoke`; `npm run check:expo-sponsor-inbox-auth`.
- **DoD:** each page shell <600 lines; sections + hooks extracted; smoke + auth gates green.

### Pack 2.4 — Extract player/physics + door from `ExpoWorldPlayerLayer.tsx` (1003)
- **Files:** `src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx`,
  `useGalaShowroomMovement.ts`, `GalaFloorplan.ts`, `GalaHouseState.ts`.
- **Task (copy-paste):**
  > Separate the GALA collision/door-interaction logic from generic boulevard player
  > movement into a dedicated hook/module, preserving the ownership contract
  > (physics owner = `GalaFloorplan.ts` data + player layer runtime). Do not change
  > collision envelopes, eye height, or door passability. Prove parity with
  > `scripts/qa-gala-real-user-walk-physics.mjs` and `qa-gala-motion-performance-audit.mjs`.
- **Validation:** `qa-gala-real-user-walk-physics.mjs`; `qa-gala-motion-performance-audit.mjs`;
  `npm run lint`; `npm run build`.
- **DoD:** movement/physics parity proven; player layer <600 lines.

### Pack 2.5 — Dev-gate the QA hook out of the production bundle
- **Files:** `src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx` (1268),
  `src/modules/expo/runtime/app/Expo3D.tsx`, `vite.config.ts`.
- **Task (copy-paste):**
  > Ensure `Expo3DQAHook` and all `window.__WARPALA_*` debug facades are mounted only
  > behind a `qa3d=1`/dev guard and are tree-shaken from the production bundle. Confirm
  > via `npm run build` + bundle inspection that QA-hook code is absent from the default
  > production chunk. Keep QA capability available when the flag is present.
- **Validation:** `npm run build` + grep the emitted `dist/assets/*.js` for QA-hook
  symbols (must be absent in default chunk); `npm run lint`.
- **DoD:** production bundle excludes QA instrumentation; flagged QA still works.

---

## 6. Phase 3 — Frontend (Vite SPA) release readiness

**Goal:** assets, resilience, mobile/a11y. **Exit gate:** enforced chunk budget, route
error boundaries, graceful low-end degradation, mobile lead-gen flow verified.

### Pack 3.1 — Enforce a chunk-size budget (kill the silent warning)
- **Files:** `vite.config.ts`, `package.json`, new `scripts/check-bundle-budget.mjs`.
- **Task (copy-paste):**
  > Define explicit gzip budgets per chunk (e.g. `three-core` ≤ X, `modular-home` ≤ Y,
  > `Expo3D` entry ≤ Z; pick values from the Phase 0 baseline + 10% headroom). Set
  > `build.chunkSizeWarningLimit` and add `scripts/check-bundle-budget.mjs` that reads the
  > rollup output (or `dist` sizes) and **fails** when a chunk exceeds budget. Wire as
  > `"check:bundle-budget"`. If `three-core`/`Expo3D` exceed budget, split further
  > (e.g. lazy-load postprocessing/N8AO, drei addons) without changing visuals.
- **Validation:** `npm run build && npm run check:bundle-budget`.
- **DoD:** build fails on budget regressions; current chunks pass the budget.

### Pack 3.2 — Route-level error boundaries + graceful degradation
- **Files:** `src/App.tsx`, new `src/components/RouteErrorBoundary.tsx`,
  new `src/components/WebGLUnsupported.tsx`, `src/modules/expo/runtime/app/Expo3D.tsx`,
  `src/pages/modularHome/ModularHomeStudioPage.tsx`.
- **Task (copy-paste):**
  > Wrap `/expo-3d` and `/modular-homes/studio` (and ideally all lazy routes) in an error
  > boundary that renders a branded recovery UI + reload action instead of a blank screen
  > on chunk-load failure or render throw. Add a WebGL capability probe: if WebGL2 (or
  > WebGL) is unavailable, render a static fallback for the 3D routes with a CTA to the
  > quote form rather than a crashed canvas. Keep the lead-gen path reachable without 3D.
- **Validation:** `npm run lint`; `npm run build`; manual: simulate WebGL-off and a
  forced chunk error; both show recovery UI, not blank.
- **DoD:** no blank-screen failure mode on the two canonical routes; lead form reachable
  without WebGL.

### Pack 3.3 — Mobile DPR caps, zone visibility, instancing audit
- **Files:** `ExpoWorldCanvasShell.tsx`, `ExpoWorldSceneLayers.tsx`,
  `useGalaShowroomMovement.ts`, GALA construction assemblies.
- **Task (copy-paste):**
  > Verify and, where missing, implement: aggressive mobile DPR caps (target 30 FPS on a
  > constrained profile, 60 on desktop), zone-based visibility culling, and instancing for
  > repeated geometry (cladding boards, wall cells, furniture). Confirm AO/postprocessing
  > stays disabled on low-quality/mobile paths (already gated per CURRENT_TASK). Capture
  > before/after draw-call + FPS numbers with `qa-gala-performance-budget-audit.mjs` and
  > `qa-gala-motion-performance-audit.mjs` on both desktop and a throttled profile.
- **Validation:** `qa-gala-performance-budget-audit.mjs`;
  `qa-gala-motion-performance-audit.mjs` (desktop + throttled); `npm run build`.
- **DoD:** documented FPS/draw-call evidence meets 30/60 targets on both profiles.

### Pack 3.4 — Mobile-first responsiveness + accessibility for the lead-gen flow
- **Files:** `modularHome/ModularHomeQuoteForm.tsx`, `ConfiguratorOptionsPanel.tsx`,
  `ModularHomeDemoOverlay.tsx`, `pages/modularHome/ModularHomeStudioPage.tsx`.
- **Task (copy-paste):**
  > Make the quote/configurator overlay fully usable on a 360–414px viewport: scrollable
  > panels, tap targets ≥44px, no clipped controls over the canvas. Add accessibility:
  > labelled inputs, focus order, visible focus rings, `aria-live` on submit
  > success/error, and keyboard reachability of every form control and the consent
  > checkbox. Do not change the submit payload contract (`modularHomeQuoteBackend.ts`).
- **Validation:** `npm run lint`; `npm run build`; manual mobile-viewport walkthrough +
  keyboard-only submission; axe/lighthouse a11y spot check.
- **DoD:** lead-gen flow completable on mobile and via keyboard; no a11y blockers on the
  form.

### Pack 3.5 — Asset optimization (PBR dedupe, GLB lazy-load, precache sanity)
- **Files:** `public/models/gala/**`, `construction/GalaConstructionPbrTextures.ts`,
  `GalaInteriorFurniture.tsx`, `vite.config.ts` (PWA workbox),
  `scripts/build-expo-texture-pipeline.mjs`, `scripts/check-expo-texture-pipeline.mjs`.
- **Task (copy-paste):**
  > Audit `public/models/gala` and the texture pipeline for duplicate PBR sets and
  > oversized maps; deduplicate shared 1K maps (already partly done — confirm no per-mesh
  > clones). Confirm GLB furniture is lazy-loaded via Suspense and not in the initial
  > chunk. Verify every asset the studio needs is either precached (≤5 MB workbox cap) or
  > intentionally runtime-fetched; flag assets >5 MB that workbox will silently skip. Run
  > the texture pipeline checks.
- **Validation:** `npm run check:expo-texture-pipeline`; `npm run build`;
  `npm run check:expo-release-assets`.
- **DoD:** no duplicate texture payloads; no asset silently dropped from precache;
  release-asset check green.

---

## 7. Phase 4 — Backend & infrastructure hardening

**Goal:** make the canonical API production-ready and the data layer provably secure.
**Exit gate:** GALA quote endpoint productionized end-to-end; env matrix documented;
RLS verified; backend tests green.

### Pack 4.1 — Productionize the GALA quote endpoint
- **Files:** `backend-server/controllers/modularHomeQuoteController.ts`,
  `backend-server/schemas/quoteValidation.ts`, `backend-server/middleware/rateLimit.ts`,
  `backend-server/__tests__/modularHomeQuoteController.test.ts`,
  `src/modules/expo/runtime/modularHome/modularHomeQuoteBackend.ts`.
- **Task (copy-paste):**
  > Move the quote endpoint from staging-only to production-capable **behind explicit
  > env config** (keep `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED`; add production host
  > allowlist via `MODULAR_HOME_QUOTE_STAGING_HOSTS`/a new production host var). Replace
  > the in-process `Map` rate limiter with a **distributed** limiter (Redis is already a
  > compose dependency) so multi-instance deploys are safe. Add spam protection (honeypot
  > field + optional Turnstile token verification) and a duplicate-submission guard by
  > normalized email + product/config hash. Keep server-side validation authoritative.
  > Set `productionReady` accurately. Extend the controller test for: production-host
  > accept, distributed-limit behavior, honeypot reject, duplicate reject. Do not weaken
  > existing validation.
- **Validation:** backend `tsc -p tsconfig.json`; backend tests
  (`modularHomeQuoteController.test.ts`); `npm run check:modular-home-quote-staging`;
  `npm run lint` (backend).
- **DoD:** endpoint safe for production multi-instance, spam-resistant, fully tested;
  `productionReady` reflects reality.

### Pack 4.2 — Email/CRM handoff for accepted quotes
- **Files:** `modularHomeQuoteController.ts`, new
  `backend-server/services/modularHomeQuoteNotifier.ts`, `events/subscribers.ts`,
  env docs.
- **Task (copy-paste):**
  > Implement the planned email handoff (currently `emailHandoffQueued: false`) behind
  > `MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED=true`, using the existing `resend`
  > dependency. Queue after the Supabase insert; never block the visitor response on the
  > email provider; make it idempotent by quote id. Log handoff result separately from the
  > visitor response. Default disabled.
- **Validation:** unit test for notifier (enabled/disabled/idempotent); backend `tsc`;
  backend lint.
- **DoD:** opt-in, non-blocking, idempotent notification; default off; tested.

### Pack 4.3 — Decouple required UE5/signaling env from a GALA-only deploy
- **Files:** `backend-server/config/runtimeEnv.ts`, `backend-server/server.ts`,
  `docker-compose.yml`, `docs/BACKEND_RELEASE_PACKAGING.md`.
- **Task (copy-paste):**
  > `getBackendRuntimeEnv()` currently hard-requires `SIGNALING_STATUS_BASE_URL` and
  > `UE5_SECRET_KEY` even when Pixel Streaming is out of scope. Make these required **only**
  > when the pixel-streaming routes are enabled (feature-flag the streaming controllers),
  > so a GALA+expo-scene production deploy can boot without UE5 infra. Keep
  > `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` required. Do not change behavior when the flags
  > are set.
- **Validation:** `backend-server/config/runtimeEnv` unit test (`runtimeEnv.test.ts`)
  extended; boot the server with only Supabase env set; backend `tsc`.
- **DoD:** GALA-only deploy boots without UE5/signaling secrets; streaming still works
  when enabled.

### Pack 4.4 — Supabase RLS & migration-order verification gate
- **Files:** `supabase/migrations/**`, new `scripts/check-supabase-rls.mjs`,
  `package.json`.
- **Task (copy-paste):**
  > Add `scripts/check-supabase-rls.mjs` that statically asserts release-critical
  > invariants over the migration SQL: `modular_home_quote_requests` keeps RLS enabled
  > with a default-deny policy and no anon/auth SELECT/UPDATE/DELETE grant; expo public
  > scene tables expose only the intended public SELECT; migration filenames are strictly
  > ordered with no gaps in the dated sequence. Wire as `"check:supabase-rls"` and add to
  > `check:all`. Document the intended public-vs-protected table matrix in
  > `docs/CURRENT_INFRASTRUCTURE_INVENTORY.md`.
- **Validation:** `npm run check:supabase-rls`; `npm run check:all`.
- **DoD:** automated RLS/ordering invariants pass; table access matrix documented.

### Pack 4.5 — Production environment variable matrix + `.env.example`
- **Files:** new `.env.example` (root), `backend-server/.env.example`,
  `docs/CURRENT_INFRASTRUCTURE_INVENTORY.md`, `vercel.json`.
- **Task (copy-paste):**
  > Produce the authoritative env matrix from `src/config/runtimeEnv.ts` and
  > `backend-server/config/runtimeEnv.ts` plus the quote-controller env flags. Create
  > `.env.example` files marking each var Required/Optional, its consumer (frontend build
  > vs backend runtime), and default. Confirm `vercel.json` build picks up
  > `VITE_PUBLIC_API_BASE_URL`/`VITE_SUPABASE_*` at build time. See
  > [§8 Environment Variable Matrix](#8-environment-variable-matrix) for the starting
  > inventory.
- **Validation:** frontend `npm run build` fails fast with a clear error when a required
  `VITE_*` is missing; backend boot fails fast on missing required var (already the case
  — confirm messages are actionable).
- **DoD:** complete, accurate `.env.example` for both tiers; required-var failure modes
  verified.

---

## 8. Environment Variable Matrix

> Starting inventory derived from the env resolvers; Pack 4.5 finalizes `.env.example`.

### Frontend (build-time, `VITE_*` — `src/config/runtimeEnv.ts`)
| Var | Required | Notes |
| --- | --- | --- |
| `VITE_PUBLIC_API_BASE_URL` | **Yes** (prod) | Dev derives `host:3000`; prod must set explicitly |
| `VITE_SUPABASE_URL` | **Yes** | http/https |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | anon key only |
| `VITE_PUBLIC_APP_URL` | No | else derived from API base host |
| `VITE_SIGNALING_SERVER_URL` | No | ws/wss; Pixel Streaming (deprioritized) |
| `VITE_STUN_SERVER_URLS` / `VITE_TURN_SERVER_URLS` | No | comma list; streaming only |
| `VITE_TURN_USERNAME` / `VITE_TURN_PASSWORD` | Pair | both or neither |
| `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS` | No | default 2500 |

### Backend (runtime — `backend-server/config/runtimeEnv.ts` + quote controller)
| Var | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | **Yes** | http/https |
| `SUPABASE_SERVICE_KEY` | **Yes** | service role; never exposed to client |
| `SIGNALING_STATUS_BASE_URL` | Yes today → **make conditional** (Pack 4.3) | streaming only |
| `UE5_SECRET_KEY` | Yes today → **make conditional** (Pack 4.3) | streaming only |
| `PORT` | No | default 3000 |
| `PIXEL_STREAMING_STATUS_TIMEOUT_MS` | No | default 2500 |
| `REDIS_URL` | **Yes** (after Pack 4.1) | distributed rate limit |
| `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED` | **Yes** to accept quotes | `true` to enable |
| `MODULAR_HOME_QUOTE_STAGING_HOSTS` | Recommended | host allowlist (+ prod host var, Pack 4.1) |
| `MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED` | No | default off (Pack 4.2) |
| `APP_ENV` / `VERCEL_ENV` | Contextual | gate environment detection |

---

## 9. Validation Gate Reference

Every pack runs the gates relevant to its surface. The **release gate** = all of these.

| Gate | Command | Surface |
| --- | --- | --- |
| Lint (frontend) | `npm run lint` | all `src/**` |
| Lint (backend) | `npm run lint` in `backend-server/` | `backend-server/**` |
| Build (frontend) | `npm run build` | SPA + chunk emit |
| Bundle budget (new, Pack 3.1) | `npm run check:bundle-budget` | chunk sizes |
| Expo boundaries | `npm run check:expo-boundaries` | shared/backend import rules |
| Backend boundaries | `npm run check:backend-boundaries` + `:backend-shared-boundaries` | root↔backend coupling |
| GALA ownership (new, Pack 1.2) | `npm run check:gala-ownership` | active vs legacy render imports |
| Supabase RLS (new, Pack 4.4) | `npm run check:supabase-rls` | RLS + migration order |
| All static checks | `npm run check:all` | aggregate (extend to include new checks) |
| Backend typecheck | `npx tsc --noEmit -p tsconfig.json` in `backend-server/` | full server |
| Backend docker typecheck | `npx tsc --noEmit -p tsconfig.docker.json` in `backend-server/` | minimal/whichever survives Pack 1.3 |
| Quote staging contract | `npm run check:modular-home-quote-staging` | quote API gate |
| Sponsor inbox auth/smoke | `npm run check:expo-sponsor-inbox-auth` / `:browser-smoke` | sponsor admin path |
| Staging readiness | `npm run check:staging-readiness` | pre-deploy aggregate |

### GALA visual/performance acceptance budgets (Static & Motion)
Consolidated in Phase 5; current passing references from `docs/CURRENT_TASK.md` /
`docs/GALA_PERFORMANCE_BUDGET.md`:
- **Static (desktop, prod build):** exterior ≈ 274 draw calls / ≈15.1k tris; interior
  ≈ 208 / ≈14.1k. Treat as ceilings; do not regress.
- **Motion:** p95 frame time ≤ ~5 ms, **0** stutters > 50 ms (both routes).
- **Mobile/constrained:** must hold **30 FPS** (Pack 3.3 to produce evidence on a
  throttled profile — currently unproven).
- **Visual acceptance:** human product-owner sign-off only.

---

## 10. Phase 5 — QA, validation & CI/CD gates

**Goal:** consolidate QA, remove contradictions, and wire gates into CI. **Exit gate:**
single non-contradictory GALA QA suite + a CI pipeline that runs the release gate on PRs.

### Pack 5.1 — Consolidate and de-duplicate the GALA QA scripts
- **Files:** all `scripts/qa-gala-*.mjs` (22 files); new `scripts/qa-gala/` folder or a
  single `scripts/qa-gala-suite.mjs` orchestrator; `docs/GALA_PERFORMANCE_BUDGET.md`,
  `docs/final-visual-review-checklist.md`.
- **Task (copy-paste):**
  > Map the 22 `qa-gala-*.mjs` scripts to the assertions they own. Eliminate the known
  > contradiction (legacy construction-renderer floor-color flags vs the design-intent
  > audit) by deleting/retiring stale assertions and keeping one authoritative check per
  > concern (geometry/clip, floor-ground isolation, furniture clearance, wall-skin
  > coverage, motion perf, static budget, DOM overlay, ownership, visual acceptance).
  > Provide a single `qa-gala-suite.mjs` entry that runs the canonical set against a
  > preview URL and emits one consolidated report. Document which scripts are retired.
- **Validation:** `node --check` on all touched scripts; run `qa-gala-suite.mjs` against
  a local preview; confirm no contradictory pass/fail.
- **DoD:** one canonical, internally-consistent GALA QA suite; retired scripts documented.

### Pack 5.2 — CI pipeline (PR gate)
- **Files:** new `.github/workflows/release-gate.yml` (or platform equivalent),
  `package.json`.
- **Task (copy-paste):**
  > Add a CI workflow that on every PR to `main`/`release/*` runs: install, frontend
  > `lint` + `build` + `check:bundle-budget`, `check:all` (incl. new ownership/RLS
  > checks), backend `tsc` (full target) + backend `lint` + backend tests, and the quote
  > staging contract check. Cache `node_modules`. Fail the PR on any gate failure. Do not
  > run deploys from CI yet. Document the pipeline in `docs/CURRENT_INFRASTRUCTURE_INVENTORY.md`.
- **Validation:** open a draft PR; confirm the workflow runs and gates correctly
  pass/fail.
- **DoD:** green-required CI gate on PRs; deploys excluded.

### Pack 5.3 — Backend test coverage for the canonical API surface
- **Files:** `backend-server/__tests__/**`, `routes/api.ts`.
- **Task (copy-paste):**
  > Confirm every public route in `api.ts` that is in release scope has at least a
  > contract test: `/expo/scene`, `/expo/lead`, `/calculator/lead`, `/modular-home/quote`
  > (success + each gate rejection), and the `adminOnly` modular-home quote admin routes
  > (auth-required). Add missing tests. Keep them hermetic (mock Supabase storage client,
  > as the quote controller already supports via injectable storage).
- **Validation:** backend test run green; `npm run check:modular-home-quote-staging`.
- **DoD:** canonical release routes have contract tests; all green.

---

## 11. Phase 6 — Release cut & go/no-go

**Goal:** ship. **Exit gate:** signed go/no-go checklist.

### Pack 6.1 — Staging deploy + end-to-end verification
- **Files:** `scripts/deploy:staging:*`, `docs/launch-dossier.md`,
  `docs/LAUNCH_READINESS_SNAPSHOT_*.md`.
- **Task (copy-paste):**
  > With explicit product-owner authorization, deploy frontend
  > (`npm run deploy:staging:preview`) and backend
  > (`npm run deploy:staging:backend`) to staging. Run `check:staging-readiness`,
  > `check:expo-staging-browser-smoke`, and a real `?homeQuoteBackend=1` submission
  > against the staging Supabase table; confirm the row lands with RLS intact and admin
  > read works. Capture evidence. Do **not** promote to production in this pack.
- **Validation:** `npm run check:staging-readiness`; `check:expo-staging-browser-smoke`;
  live quote round-trip on staging.
- **DoD:** full release path verified on staging with evidence; no prod promotion yet.

### Pack 6.2 — Production go/no-go checklist + promotion
- **Task (copy-paste):**
  > Compile the go/no-go: (1) all §9 gates green in CI; (2) bundle budget met;
  > (3) backend ships from `dist` (no `tsx` in prod) serving scene + quote;
  > (4) quote endpoint production-gated + distributed-limited + spam-protected;
  > (5) RLS default-deny verified on prod; (6) 30/60 FPS evidence on mobile/desktop;
  > (7) `productVisualAccepted=true` recorded by a human. Only when **all** are checked,
  > run `promote:staging` → `promote:production`. Record the release in `CHANGELOG.md`.
- **DoD:** signed checklist; production promotion executed; release tagged + changelog updated.

---

## 12. Risk register

| # | Risk | Severity | Mitigation pack |
| --- | --- | --- | --- |
| R1 | Production backend serves the minimal `api.docker.ts` → GALA quote endpoint absent | **Critical** | 1.3 |
| R2 | Full server runs interpreted via `tsx`; compiled `dist` layout unreliable | **High** | 1.3 |
| R3 | Quote rate limiter is in-process `Map`; unsafe across instances | **High** | 4.1 |
| R4 | No spam/abuse protection on quote endpoint when promoted public | **High** | 4.1 |
| R5 | No route error boundaries → blank-screen failure on chunk/render error | **High** | 3.2 |
| R6 | Chunk-size warning unenforced; bundle can silently bloat | Medium | 3.1 |
| R7 | Renderer ownership contract contradicts edited "legacy" files | Medium | 1.1, 1.2 |
| R8 | Backend hard-requires UE5/signaling env for a GALA-only deploy | Medium | 4.3 |
| R9 | Contradictory GALA QA scripts mask real regressions | Medium | 5.1 |
| R10 | Mobile 30 FPS target unproven on constrained devices | Medium | 3.3 |
| R11 | No CI; gates run manually and can be skipped | Medium | 5.2 |
| R12 | RLS / migration-order regressions undetected until runtime | Medium | 4.4 |
| R13 | Repo-root artifact debris inflates build context / obscures release surface | Low | 0.2 |
| R14 | Workbox 5 MB precache cap may silently drop large GLB/textures | Low | 3.5 |

---

## 13. Phase dependency summary

```
Phase 0 (freeze)  ─►  Phase 1 (arch/ownership + backend target)
                          │
                          ├─►  Phase 2 (refactor) ──┐
                          │                          ├─►  Phase 5 (QA/CI)  ─►  Phase 6 (release)
                          └─►  Phase 3 (frontend) ───┤
                          └─►  Phase 4 (backend) ────┘
```
- Phase 1 must complete before 2/3/4 (ownership + packaging target are prerequisites).
- Phases 2, 3, 4 can proceed in parallel once Phase 1's exit gate passes.
- Phase 5 needs the refactor/frontend/backend work stable to consolidate QA + wire CI.
- Phase 6 is gated on everything above + human visual acceptance.
```
```
