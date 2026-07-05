# RELEASE ROADMAP V1 — Implementer Prompts

> Copy-paste, cold-start-ready prompts for each Implementation Pack in
> `docs/RELEASE_ROADMAP_V1.md`. Each prompt is self-contained: paste the
> **Standing Context Block** once at the top of the agent session (or rely on
> `AGENTS.md`), then paste the pack prompt. Hand off **one pack per agent**.
>
> Execute packs in roadmap order. Phase 0 → Phase 1 are prerequisites; Phases 2/3/4
> may run in parallel after Phase 1's exit gate; then Phase 5, then Phase 6.

---

## Standing Context Block (paste first, every session)

```
You are an implementer agent on the Warpala Web3D expo platform + GALA modular-home
studio. Canonical product = root Vite SPA (/expo-3d, /modular-homes/studio, sponsor
boulevard) + /api/expo/scene + the GALA quote API. Stack: Vite SPA frontend,
backend-server (Express), Supabase (data/auth/RLS).

OUT OF SCOPE / do not touch: WarpalaUE5/, GALA_PresentationUE5_Clean/, Pixel Streaming
runtime, apps/frontend/, assets-intake/, tower-cluster/, legacy server/ sync.

HARD RULES:
- Behavior-preserving unless the pack explicitly authorizes a behavior change.
- Never change sponsor-boulevard camera/FOV/lookAt.
- Never change auth/quote/payment behavior unless the pack says so.
- No staging/production deploy unless the pack explicitly authorizes it.
- Product-visual acceptance is a HUMAN gate — never self-report productVisualAccepted=true.
- Commands on Windows use npm.cmd / npx.cmd. Bash tool is also available.

ALWAYS finish a pack by:
1. Running the pack's listed validation commands and recording real output.
2. Appending an entry to docs/CURRENT_TASK.md in the existing format:
   objective, implementation status, validation (with pass/fail), touched files,
   product/release status, next step.
3. Reporting exactly which files changed and which gates passed/failed.

Reference: docs/RELEASE_ROADMAP_V1.md (full plan, risk register, env matrix,
validation-gate table). Ownership truth: docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md.
```

---

# Phase 0 — Worktree freeze & change-ownership baseline

## Pack 0.1 — Triage and commit the dirty worktree
```
Goal: establish a clean, attributable baseline. The worktree currently has 30+ modified
files and untracked debris.

Steps:
1. Run `git status` and `git diff --stat`.
2. Group the modified tracked files into coherent commits by subsystem:
   (a) GALA construction renderer (src/modules/expo/runtime/modularHome/construction/**),
   (b) GALA floorplan/state (GalaFloorplan.ts, GalaHouseState.ts, GalaHouseConfig.ts, etc.),
   (c) QA scripts (scripts/qa-gala-*.mjs),
   (d) world/scene (src/modules/expo/runtime/world/**),
   (e) build/config (vite.config.ts),
   (f) docs (docs/CURRENT_TASK.md).
3. Write one conventional commit per group on the current branch
   feat/booth-camera-screen-feed-current. This is a commit-hygiene pass ONLY — do not
   alter any behavior.

Validation: npm.cmd run lint ; npm.cmd run check:all ; npm.cmd run build
DoD: working tree clean of tracked changes; all gates green; commits attributable.
```

## Pack 0.2 — Quarantine root audit artifacts
```
Goal: clean the repo root of ad-hoc audit/debug debris so the release surface and Docker
build context are clear.

Move these root-level artifacts into docs/recovery/2026-06-29-audit-archive/ (preserve
history; do NOT delete): AUDIT.md, AUDIT_STATUS_AFTER_WALL_SKIN_REMEDIATION.json,
CLADDING_ARCHITECTURE_CONFLICT_AUDIT.md, CLADDING_OWNER_TRACE.json,
INTERIOR_PERFORMANCE_GEOMETRY_AUDIT.md, INTERIOR_PERFORMANCE_GEOMETRY_OWNER_TRACE.json,
OPENING_INTERIOR_FLOOR_PERFORMANCE_AUDIT.md, OPENING_INTERIOR_FLOOR_PERFORMANCE_OWNER_TRACE.json,
WALL_SKIN_ARCHITECTURE_AUDIT.md, WALL_SKIN_OWNER_TRACE.json, MANUAL_WALL_SKIN_REVIEW.md,
VISUAL_DESIGN_INTENT_REMEDIATION.md, VISUAL_MATERIAL_OWNER_MATRIX.json,
VISUAL_REGRESSION_ARCHAEOLOGY.md, PROJECT_CONTEXT_LOCK.md, FILES_CHANGED.txt,
diagnostics_output.txt, modular-home-studio-detail-upgrade-final-entries.txt,
ss1.png, ss2.png, ss3.png, ss4.png, tmp-*.log.

Then: confirm .gitignore ignores artifacts/ and artifacts/root-archive/; extend it to
ignore tmp-*.log, *.stderr.log, *.stdout.log, and root ss*.png. Before moving any file,
grep the codebase (rg <filename>) to confirm no source imports it.

Validation: npm.cmd run build ; git status (only intended moves) ;
rg for moved filenames returns no source references.
DoD: repo root contains only product/config + canonical docs; build green.
```

## Pack 0.3 — Cut the release branch and pin the baseline
```
Goal: pin a measurable reference point.

Steps (run only after 0.1 and 0.2 are merged and the tree is clean):
1. Create branch release/v1-stabilization off the freeze commit; tag it v1-baseline.
2. Create docs/RELEASE_BASELINE.md capturing: current commit SHA; the chunk sizes from
   `npm.cmd run build`; the `npm.cmd run check:all` summary; and the results of
   `npx.cmd tsc --noEmit -p tsconfig.json` and `... -p tsconfig.docker.json` run inside
   backend-server.

Validation: branch + tag exist; baseline doc committed.
DoD: release/v1-stabilization branch + v1-baseline tag + docs/RELEASE_BASELINE.md exist.
```

---

# Phase 1 — Architecture stabilization & ownership contracts

## Pack 1.1 — Reconcile GALA renderer active-vs-legacy ownership
```
Goal: resolve the contradiction where docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md lists
GalaInteriorFurniture.tsx / GalaOpenings.tsx / GalaInterior.tsx as "legacy/inactive" but
recent work edits them as active.

Steps:
1. Empirically determine which furniture/interior/opening modules are actually MOUNTED on
   /modular-homes/studio?homeStudio=1 (exterior AND interior). Use
   scripts/qa-gala-renderer-ownership-audit.mjs plus a runtime scene inventory.
2. Resolve the contradiction: either (a) update the ownership contract to mark the truly
   mounted files as active with their real owners, or (b) confirm a file is dead and move
   it under a clearly-named legacy/ subfolder excluded from the active route.
3. Do NOT change any rendered output. Update the owner matrix in the contract to match
   the actual mounted tree.

Files: docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md, src/modules/expo/runtime/modularHome/
GalaInteriorFurniture.tsx, GalaInterior.tsx, GalaOpenings.tsx, GalaCeiling.tsx,
ModularHomeModel.tsx, construction/GalaRoomAssembly.tsx, construction/GalaConstructionRenderer.tsx.

Validation: npm.cmd run lint ; node --check on any edited .mjs ;
node scripts/qa-gala-renderer-ownership-audit.mjs ; node scripts/qa-gala-dom-overlay-audit.mjs ;
npm.cmd run build.
DoD: ownership contract matches the mounted tree; no behavior change; legacy clearly separated.
```

## Pack 1.2 — Add an ownership/legacy-import guard script
```
Goal: automate enforcement of Pack 1.1.

Create scripts/check-gala-renderer-ownership.mjs that fails if any file on the active GALA
construction render path imports a module the ownership contract marks legacy. Mirror the
regex/AST scanning approach in scripts/check-expo-boundaries.mjs. Add
"check:gala-ownership": "node scripts/check-gala-renderer-ownership.mjs" to package.json
and append it to the check:all chain.

Validation: npm.cmd run check:gala-ownership ; npm.cmd run check:all.
DoD: script passes on the reconciled tree and fails if a legacy import is reintroduced.
```

## Pack 1.3 — Pin the production backend target (resolve dual-build)  [CRITICAL — R1/R2]
```
Goal: there are two divergent backend builds and the production target is undefined.
The full server (server.ts + routes/api.ts) is the only one serving
POST /api/modular-home/quote, so it MUST be the release target — but docker-compose runs
it via `tsx` (interpreted) because the compiled dist layout is unreliable. Fix this.

Steps:
1. Make the full backend BUILD and RUN from compiled dist: `npm run build` (tsc -p
   tsconfig.json) then `node dist/backend-server/server.js` must boot without tsx. If the
   root src/** coupling (src/backend, src/lib, src/core, src/services compiled via
   tsconfig.json) blocks a clean dist layout, minimize and document that compiled root
   surface.
2. Update backend-server/Dockerfile.full to run the compiled artifact, not tsx.
3. Decide the minimal path: EITHER retire api.docker.ts/server.docker.ts/Dockerfile/
   tsconfig.docker.json, OR add /modular-home/quote (+ its adminOnly admin routes) to
   api.docker.ts and clearly label which image is canonical.
4. Write docs/BACKEND_RELEASE_PACKAGING.md: map each route file -> tsconfig -> build
   command -> Docker image -> deploy command, naming the ONE canonical production target.
   Do not change any route auth policy.

Files: backend-server/{tsconfig.json, tsconfig.docker.json, routes/api.docker.ts,
server.docker.ts, Dockerfile, Dockerfile.full, package.json}, docker-compose.yml,
docs/BACKEND_RELEASE_PACKAGING.md.

Validation (run inside backend-server): npx.cmd tsc --noEmit -p tsconfig.json ;
npm.cmd run build ; node dist/backend-server/server.js boots with required env ;
curl http://127.0.0.1:3000/api/expo/scene returns 200 ;
POST http://127.0.0.1:3000/api/modular-home/quote reaches the gate logic (not 404).
DoD: exactly ONE canonical production backend target, built+run from dist, serving both
/api/expo/scene and /api/modular-home/quote; packaging doc committed.
```

## Pack 1.4 — Narrow the root↔backend shared compile boundary
```
Goal: tighten the deep coupling where backend-server/tsconfig.json compiles ../src/backend,
../src/lib, ../src/core, ../src/services into the backend.

Steps:
1. Enumerate exactly which files under those four src trees are compiled into the backend.
2. For each, confirm it is genuinely shared and free of browser-only/React imports.
3. Tighten the tsconfig.json `include` globs to the minimal shared set.
4. Confirm check:backend-boundaries / check:backend-shared-boundaries still pass; extend
   them if any non-shared file is being pulled in. Update
   docs/BACKEND_SERVER_ONLY_DEPENDENCY_AUDIT.md.

Validation: npm.cmd run check:backend-boundaries ; npm.cmd run check:backend-shared-boundaries ;
(in backend-server) npx.cmd tsc --noEmit -p tsconfig.json.
DoD: compiled-shared surface is minimal, documented, and boundary-checked.
```

---

# Phase 2 — Codebase refactoring (behavior-preserving)

> Phase-2 rule: pure move/extract. Keep every public export's import path stable
> (re-export from the original module as a barrel). Add no new dependencies. If a behavior
> change seems required, STOP and escalate.

## Pack 2.1 — Split modularHomeComponents.ts (2259 lines)
```
File: src/modules/expo/runtime/modularHome/modularHomeComponents.ts
Extract the distinct concern clusters (data tables, option catalogues, derivation
helpers, type definitions) into focused files under modularHome/components/, then make
modularHomeComponents.ts a thin barrel that re-exports everything so no importer changes.
No logic edits.

Validation: npm.cmd run lint ; npm.cmd run build ;
npx.cmd tsx scripts/... (run the modularHomeProducts test fixture:
src/modules/expo/__tests__/modularHomeProducts.test.ts) ; npm.cmd run check:expo-boundaries.
DoD: original module is a thin barrel; submodules <600 lines each; tests + build green.
```

## Pack 2.2 — Split the estimate/pricing engine
```
Files: modularHomeEstimate.ts (1460), modularHomePricing.ts, modularHomeSupplierCosts.ts,
modularHomeQuantities.ts (all under src/modules/expo/runtime/modularHome/).
Separate modularHomeEstimate.ts into: (a) estimate computation core, (b) line-item/scope
formatting, (c) currency/VAT helpers — re-exported from modularHomeEstimate.ts. Output
must be numerically identical. Add a parity test snapshotting estimatedTotal + line items
for compact-timber-40, family-timber-80, sauna-cabin-25 before vs after.

Validation: new parity test ; npm.cmd run lint ; npm.cmd run build.
DoD: identical estimate outputs proven by snapshot test; files <800 lines.
```

## Pack 2.3 — Decompose CompanyAdmin.tsx (2763) and SponsorLeadInbox.tsx (1633)
```
Files: src/pages/expo/CompanyAdmin.tsx, src/pages/expo/SponsorLeadInbox.tsx.
Extract data-fetching/state into hooks (useCompanyAdminState, useSponsorLeadInbox) and
break each render tree into section components under src/pages/expo/companyAdmin/ and
.../sponsorLeadInbox/. Move reusable fetch logic into src/modules/expo/services. Do not
change any API call or auth gating.

Validation: npm.cmd run lint ; npm.cmd run build ;
npm.cmd run check:expo-sponsor-inbox-browser-smoke ; npm.cmd run check:expo-sponsor-inbox-auth.
DoD: each page shell <600 lines; sections + hooks extracted; smoke + auth gates green.
```

## Pack 2.4 — Extract player/physics + door from ExpoWorldPlayerLayer.tsx (1003)
```
Files: src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx,
useGalaShowroomMovement.ts, GalaFloorplan.ts, GalaHouseState.ts.
Separate GALA collision/door-interaction logic from generic boulevard player movement into
a dedicated hook/module, preserving the ownership contract (physics owner = GalaFloorplan.ts
data + player-layer runtime). Do NOT change collision envelopes, eye height, or door
passability.

Validation: node scripts/qa-gala-real-user-walk-physics.mjs ;
node scripts/qa-gala-motion-performance-audit.mjs ; npm.cmd run lint ; npm.cmd run build.
DoD: movement/physics parity proven; player layer <600 lines.
```

## Pack 2.5 — Dev-gate the QA hook out of the production bundle
```
Files: src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx (1268),
src/modules/expo/runtime/app/Expo3D.tsx, vite.config.ts.
Ensure Expo3DQAHook and all window.__WARPALA_* debug facades mount only behind a
qa3d=1 / dev guard and are tree-shaken from the production bundle. Keep QA capability when
the flag is present.

Validation: npm.cmd run build, then grep emitted dist/assets/*.js for QA-hook symbols
(must be absent from the default production chunk) ; npm.cmd run lint.
DoD: production bundle excludes QA instrumentation; flagged QA still works.
```

---

# Phase 3 — Frontend (Vite SPA) release readiness

## Pack 3.1 — Enforce a chunk-size budget
```
Files: vite.config.ts, package.json, new scripts/check-bundle-budget.mjs.
Define explicit gzip budgets per chunk (three-core, modular-home, react-three-vendor,
react-vendor, Expo3D entry) using the Phase-0 baseline + 10% headroom. Set
build.chunkSizeWarningLimit and add scripts/check-bundle-budget.mjs that reads the rollup/
dist output and FAILS when a chunk exceeds budget. Wire as "check:bundle-budget". If
three-core/Expo3D exceed budget, split further (lazy-load @react-three/postprocessing/N8AO,
drei addons) without changing visuals.

Validation: npm.cmd run build && npm.cmd run check:bundle-budget.
DoD: build fails on budget regressions; current chunks pass.
```

## Pack 3.2 — Route-level error boundaries + graceful degradation
```
Files: src/App.tsx, new src/components/RouteErrorBoundary.tsx, new
src/components/WebGLUnsupported.tsx, src/modules/expo/runtime/app/Expo3D.tsx,
src/pages/modularHome/ModularHomeStudioPage.tsx.
Wrap /expo-3d and /modular-homes/studio (ideally all lazy routes) in an error boundary
that renders a branded recovery UI + reload action on chunk-load failure or render throw
(no blank screen / no raw "Initializing Warpala OS..."). Add a WebGL capability probe: if
WebGL(2) is unavailable, render a static fallback for the 3D routes with a CTA to the quote
form. Keep the lead-gen path reachable without 3D.

Validation: npm.cmd run lint ; npm.cmd run build ; manually simulate WebGL-off and a forced
chunk error — both must show the recovery UI, not a blank page.
DoD: no blank-screen failure mode on the two canonical routes; lead form reachable without WebGL.
```

## Pack 3.3 — Mobile DPR caps, zone visibility, instancing audit
```
Files: src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx,
ExpoWorldSceneLayers.tsx, useGalaShowroomMovement.ts, GALA construction assemblies.
Verify and, where missing, implement: aggressive mobile DPR caps (target 30 FPS constrained,
60 desktop), zone-based visibility culling, instancing for repeated geometry (cladding
boards, wall cells, furniture). Confirm AO/postprocessing stays disabled on low-quality/
mobile paths. Capture before/after draw-call + FPS on desktop AND a throttled profile.

Validation: node scripts/qa-gala-performance-budget-audit.mjs ;
node scripts/qa-gala-motion-performance-audit.mjs (desktop + throttled) ; npm.cmd run build.
DoD: documented FPS/draw-call evidence meets 30/60 targets on both profiles.
```

## Pack 3.4 — Mobile-first responsiveness + accessibility for the lead-gen flow
```
Files: src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx,
ConfiguratorOptionsPanel.tsx, ModularHomeDemoOverlay.tsx,
src/pages/modularHome/ModularHomeStudioPage.tsx.
Make the quote/configurator overlay fully usable at 360–414px: scrollable panels, tap
targets >=44px, no clipped controls over the canvas. Add accessibility: labelled inputs,
correct focus order, visible focus rings, aria-live on submit success/error, keyboard
reachability of every control incl. the consent checkbox. Do NOT change the submit payload
contract (modularHomeQuoteBackend.ts).

Validation: npm.cmd run lint ; npm.cmd run build ; manual mobile-viewport + keyboard-only
submission ; axe/Lighthouse a11y spot check.
DoD: lead-gen flow completable on mobile and via keyboard; no a11y blockers on the form.
```

## Pack 3.5 — Asset optimization (PBR dedupe, GLB lazy-load, precache sanity)
```
Files: public/models/gala/**, src/modules/expo/runtime/modularHome/construction/
GalaConstructionPbrTextures.ts, GalaInteriorFurniture.tsx, vite.config.ts (PWA workbox),
scripts/build-expo-texture-pipeline.mjs, scripts/check-expo-texture-pipeline.mjs.
Audit public/models/gala and the texture pipeline for duplicate PBR sets and oversized
maps; deduplicate shared 1K maps (confirm no per-mesh clones). Confirm GLB furniture is
lazy-loaded via Suspense and not in the initial chunk. Verify every studio asset is either
precached (<=5 MB workbox cap) or intentionally runtime-fetched; flag any asset >5 MB that
workbox will silently skip.

Validation: npm.cmd run check:expo-texture-pipeline ; npm.cmd run build ;
npm.cmd run check:expo-release-assets.
DoD: no duplicate texture payloads; nothing silently dropped from precache; release-asset check green.
```

---

# Phase 4 — Backend & infrastructure hardening

## Pack 4.1 — Productionize the GALA quote endpoint  [CRITICAL]
```
Goal: move POST /api/modular-home/quote from staging-only (productionReady:false) to
production-capable, behind explicit env config.

Files: backend-server/controllers/modularHomeQuoteController.ts,
backend-server/schemas/quoteValidation.ts, backend-server/middleware/rateLimit.ts,
backend-server/__tests__/modularHomeQuoteController.test.ts,
src/modules/expo/runtime/modularHome/modularHomeQuoteBackend.ts.

Steps:
1. Keep MODULAR_HOME_QUOTE_SUBMISSION_ENABLED. Add a production host allowlist (extend
   MODULAR_HOME_QUOTE_STAGING_HOSTS or add a production host var) so production hosts are
   accepted only when intended.
2. Replace the in-process Map rate limiter with a DISTRIBUTED limiter backed by Redis
   (already a compose dependency; REDIS_URL). Multi-instance safe.
3. Add spam protection: a honeypot field + optional Turnstile token verification.
4. Add a duplicate-submission guard by normalized email + product/config hash.
5. Keep server-side validation authoritative; do not weaken existing validation.
6. Set productionReady accurately. Extend the controller test: production-host accept,
   distributed-limit behavior, honeypot reject, duplicate reject.

Validation (inside backend-server): npx.cmd tsc --noEmit -p tsconfig.json ; run
modularHomeQuoteController.test.ts ; (root) npm.cmd run check:modular-home-quote-staging ;
backend lint.
DoD: endpoint safe for multi-instance production, spam-resistant, fully tested; productionReady accurate.
```

## Pack 4.2 — Email/CRM handoff for accepted quotes
```
Files: backend-server/controllers/modularHomeQuoteController.ts, new
backend-server/services/modularHomeQuoteNotifier.ts, events/subscribers.ts.
Implement the planned email handoff (currently emailHandoffQueued:false) behind
MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED=true using the existing `resend` dependency. Queue
AFTER the Supabase insert; never block the visitor response on the email provider; make it
idempotent by quote id; log handoff result separately. Default disabled.

Validation: unit test for the notifier (enabled/disabled/idempotent) ;
(backend) npx.cmd tsc --noEmit -p tsconfig.json ; backend lint.
DoD: opt-in, non-blocking, idempotent notification; default off; tested.
```

## Pack 4.3 — Decouple required UE5/signaling env from a GALA-only deploy
```
Files: backend-server/config/runtimeEnv.ts, backend-server/server.ts, docker-compose.yml,
docs/BACKEND_RELEASE_PACKAGING.md.
getBackendRuntimeEnv() hard-requires SIGNALING_STATUS_BASE_URL and UE5_SECRET_KEY even
though Pixel Streaming is out of scope. Make these required ONLY when the pixel-streaming
routes are enabled (feature-flag the streaming controllers), so a GALA + /expo/scene
production deploy can boot with only Supabase env. Keep SUPABASE_URL/SUPABASE_SERVICE_KEY
required. No behavior change when the flags are set.

Validation: extend backend-server/__tests__/runtimeEnv.test.ts ; boot the server with only
Supabase env set ; (backend) npx.cmd tsc --noEmit -p tsconfig.json.
DoD: GALA-only deploy boots without UE5/signaling secrets; streaming still works when enabled.
```

## Pack 4.4 — Supabase RLS & migration-order verification gate
```
Files: supabase/migrations/**, new scripts/check-supabase-rls.mjs, package.json,
docs/CURRENT_INFRASTRUCTURE_INVENTORY.md.
Add scripts/check-supabase-rls.mjs asserting, by static SQL inspection:
- modular_home_quote_requests keeps RLS enabled with a default-deny policy and NO
  anon/auth SELECT/UPDATE/DELETE grant;
- expo public-scene tables expose only the intended public SELECT;
- migration filenames are strictly date-ordered with no sequence gaps.
Wire as "check:supabase-rls" and add it to check:all. Document the public-vs-protected
table matrix in docs/CURRENT_INFRASTRUCTURE_INVENTORY.md.

Validation: npm.cmd run check:supabase-rls ; npm.cmd run check:all.
DoD: automated RLS/ordering invariants pass; table access matrix documented.
```

## Pack 4.5 — Production env matrix + .env.example
```
Files: new .env.example (root), new backend-server/.env.example,
docs/CURRENT_INFRASTRUCTURE_INVENTORY.md, vercel.json.
Produce the authoritative env matrix from src/config/runtimeEnv.ts,
backend-server/config/runtimeEnv.ts, and the quote-controller env flags (see the matrix in
docs/RELEASE_ROADMAP_V1.md §8). Create .env.example for both tiers marking each var
Required/Optional, consumer (frontend build vs backend runtime), and default. Confirm
vercel.json build consumes VITE_PUBLIC_API_BASE_URL / VITE_SUPABASE_* at build time.

Validation: frontend npm.cmd run build fails fast with a clear error when a required VITE_*
is missing ; backend boot fails fast on a missing required var with an actionable message.
DoD: complete, accurate .env.example for both tiers; required-var failure modes verified.
```

---

# Phase 5 — QA, validation & CI/CD gates

## Pack 5.1 — Consolidate and de-duplicate the GALA QA scripts
```
Files: all scripts/qa-gala-*.mjs (22 files); new scripts/qa-gala-suite.mjs orchestrator;
docs/GALA_PERFORMANCE_BUDGET.md, docs/final-visual-review-checklist.md.
Map the 22 qa-gala-*.mjs scripts to the assertions they own. Eliminate the known
contradiction (legacy construction-renderer floor-color flags vs the design-intent audit)
by retiring stale assertions and keeping ONE authoritative check per concern: geometry/clip,
floor-ground isolation, furniture clearance, wall-skin coverage, motion perf, static budget,
DOM overlay, ownership, visual acceptance. Provide a single qa-gala-suite.mjs that runs the
canonical set against a preview URL and emits one consolidated report. Document retired scripts.

Validation: node --check on all touched scripts ; run qa-gala-suite.mjs against a local
preview ; confirm no contradictory pass/fail.
DoD: one canonical, internally-consistent GALA QA suite; retired scripts documented.
```

## Pack 5.2 — CI pipeline (PR gate)
```
Files: new .github/workflows/release-gate.yml, package.json,
docs/CURRENT_INFRASTRUCTURE_INVENTORY.md.
Add a CI workflow that on every PR to main/release/* runs: install; frontend lint + build +
check:bundle-budget; check:all (incl. new check:gala-ownership and check:supabase-rls);
backend tsc (full target) + backend lint + backend tests; check:modular-home-quote-staging.
Cache node_modules. Fail the PR on any gate failure. Do NOT run deploys from CI. Document
the pipeline.

Validation: open a draft PR; confirm the workflow runs and gates pass/fail correctly.
DoD: green-required CI gate on PRs; deploys excluded.
```

## Pack 5.3 — Backend test coverage for the canonical API surface
```
Files: backend-server/__tests__/**, backend-server/routes/api.ts.
Ensure every release-scope public route in api.ts has at least a contract test:
/expo/scene, /expo/lead, /calculator/lead, /modular-home/quote (success + each gate
rejection: disabled, missing flag, non-staging host, rate-limited, validation error), and
the adminOnly modular-home quote admin routes (auth-required). Add missing tests; keep them
hermetic (mock the Supabase storage client — the quote controller already supports an
injectable storage client).

Validation: backend test run green ; npm.cmd run check:modular-home-quote-staging.
DoD: canonical release routes have contract tests; all green.
```

---

# Phase 6 — Release cut & go/no-go

## Pack 6.1 — Staging deploy + end-to-end verification  [requires explicit authorization]
```
PRECONDITION: product owner has explicitly authorized a staging deploy in this session.

Files: scripts/deploy:staging:* , docs/launch-dossier.md, docs/LAUNCH_READINESS_SNAPSHOT_*.md.
Deploy frontend (npm.cmd run deploy:staging:preview) and backend
(npm.cmd run deploy:staging:backend) to staging. Run npm.cmd run check:staging-readiness and
npm.cmd run check:expo-staging-browser-smoke. Perform a real ?homeQuoteBackend=1 submission
against the staging Supabase table; confirm the row lands with RLS intact and admin read
works. Capture evidence. Do NOT promote to production in this pack.

Validation: check:staging-readiness ; check:expo-staging-browser-smoke ; live quote round-trip on staging.
DoD: full release path verified on staging with evidence; no prod promotion yet.
```

## Pack 6.2 — Production go/no-go checklist + promotion  [requires explicit authorization]
```
PRECONDITION: 6.1 passed AND product owner authorizes production promotion in this session.

Compile and verify the go/no-go checklist:
1. All validation gates green in CI.
2. Bundle budget met.
3. Backend ships from dist (NO tsx in prod) serving /api/expo/scene AND /api/modular-home/quote.
4. Quote endpoint production-gated + distributed-limited + spam-protected.
5. RLS default-deny verified on the production Supabase table.
6. 30/60 FPS evidence on constrained-mobile + desktop.
7. productVisualAccepted=true recorded by a human product owner.

Only when ALL are checked: npm.cmd run promote:staging then npm.cmd run promote:production.
Record the release in CHANGELOG.md.

DoD: signed checklist; production promotion executed; release tagged + changelog updated.
```
```
