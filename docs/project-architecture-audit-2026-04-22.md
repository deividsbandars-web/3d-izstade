# Project Architecture Audit 2026-04-22

## Scope

This audit is for the whole `3d-izstade` repo, with primary focus on the expo runtime and the architecture decisions that now slow down iteration.

The goal is not another patch plan. The goal is to identify where the foundation is structurally wrong, what can be kept, what must be isolated, and what should be rebuilt.

## Executive Diagnosis

The project is not failing because of one bad file. It is failing because the expo surface is currently spread across multiple overlapping systems:

- old expo module vs new runtime expo module
- public minimal production backend vs full staging backend
- central city skeleton vs rear campus/stadium as separate world logic
- frontend review tooling mixed into production HUD
- TS and legacy JS duplicates in backend domains
- product surface mixed with prototype/admin/marketplace/platform layers in one repo without hard boundaries

The result is predictable:

- visual fixes land in the wrong layer
- runtime behavior differs between environments
- screens, city logic, and district logic fight the architecture instead of using it
- debugging becomes expensive because there is no single authoritative world model

## What Is Actually Good

These are worth keeping and hardening rather than deleting:

1. `src/modules/expo/runtime/*`
- this is the right direction for the live expo runtime split
- app/world/booths/data separation already exists conceptually

2. `backend-server`
- there is now a real full-platform backend path
- staging proved that the authenticated platform surface can run independently of the sponsor-minimal production backend

3. `controlled hybrid deployment`
- `www.30sek24.com` + `api.30sek24.com` as public minimal surface
- `staging.30sek24.com` + `api-staging.30sek24.com` as full platform review surface
- this is a healthy operational pattern and should stay

4. Supabase migration history
- imperfect, but there is at least a visible database evolution trail

## Core Structural Problems

### 1. Two Expo Architectures Still Coexist

There is an old expo layer under:

- `src/modules/expo/*`

and a newer runtime-oriented layer under:

- `src/modules/expo/runtime/*`

This is the biggest root cause of confusion. The repo still presents multiple plausible places to make a change.

Impact:

- engineers can patch the wrong entrypoint
- visual behavior can appear unchanged even after code changes
- audits become slower because the true runtime path is not obvious from the tree

### 2. The World Is No Longer One City Layer

The current world is not a single city skeleton anymore.

It is at least:

- arrival / gateway
- left districts
- center spine
- right districts
- tower clusters
- rear campus / stadium

But world screen logic still behaves as if one central builder can meaningfully place screens across the whole city.

That assumption is now broken.

Impact:

- screens cluster in the center
- stadium and peripheral districts are underserved
- facing logic becomes artificial
- the builder works against the map instead of with it

### 3. Environment Truth Was Historically Unclear

Production and staging were not clearly separated before the recent work.

Reality now:

- production backend is intentionally minimal
- staging backend is intentionally full-platform

Before this was clarified, the same feature could exist in repo, not exist in production, and partially exist in staging.

Impact:

- "it is merged but not visible"
- unnecessary debugging against the wrong environment
- false regressions caused by stale assumptions

### 4. Expo UI Review Tools Are Mixed Into User HUD

`ExpoWorldHud.tsx` became a runtime/operator/debug surface and a user-facing HUD at the same time.

That is workable short-term, but structurally wrong.

Impact:

- review tools can pollute the visual experience
- production and operator concerns are coupled
- every new inspection tool risks making the world less readable

### 5. Backend Domain Surface Is Too Broad For One Repo Layer

The repo mixes:

- expo runtime backend
- billing
- leads
- growth
- platform
- workflows
- agent orchestration
- marketplace
- outreach

inside one general `src/backend` and `backend-server` surface.

That is survivable, but it needs domain boundaries. Right now it still reads as one expanding monolith.

### 6. Legacy JS/TS Duality Still Exists

There are still `.js` and `.ts` pairs across backend domains.

Impact:

- ambiguity in import/runtime behavior
- increased risk of stale compiled expectations
- harder audits and harder rebuilds

## Expo-Specific Verdict

The expo surface should not be incrementally "styled into health" on top of the current screen/world planning assumptions.

The correct expo direction is:

1. keep the runtime split
2. rebuild world planning around zones, not one central city builder
3. isolate operator tooling from the presentation HUD
4. treat staging as the authoritative full-platform review surface

## Keep / Refactor / Rebuild

### Keep

- `src/modules/expo/runtime/app/*`
- `src/modules/expo/runtime/booths/*`
- `src/modules/expo/runtime/data/*`
- `backend-server/*` as the full platform server base
- `docker-compose.staging.yml`
- `backend-server/Dockerfile.full`
- controlled hybrid deploy split

### Refactor

- `src/modules/expo/runtime/world/*`
- `src/modules/expo/layout-engine.ts`
- `src/modules/expo/world-contract.ts`
- `src/modules/expo/sceneWorld.ts`
- `src/modules/expo/components/*` that still overlap runtime concepts
- `src/backend/*` domain structure
- duplicate JS/TS backend files

### Rebuild

- world screen planning architecture
- district zoning/planning surface for visuals
- operator review UI surface as a separate overlay contract
- city ownership model so that rear campus/stadium/perimeter are first-class world zones, not special cases glued onto a central builder

## Recommended Target Architecture

### A. Expo Runtime

Keep expo runtime inside a strict tree:

- `runtime/app`
- `runtime/world`
- `runtime/booths`
- `runtime/data`
- `runtime/operator`
- `runtime/planning`

New requirement:

- `runtime/world` must not own planning rules
- `runtime/planning` must not render

### B. Zonal World Planning

Replace one global screen builder with zonal planners:

- `buildArrivalZonePlan`
- `buildLeftDistrictZonePlan`
- `buildCenterSpineZonePlan`
- `buildRightDistrictZonePlan`
- `buildTowerClusterZonePlan`
- `buildRearCampusZonePlan`

Each zone planner should own:

- anchors
- allowed screen families
- density rules
- facing rules
- no-overlap rules
- viewer priority directions

### C. Operator Surface

Create a separate operator contract:

- compact HUD in world
- expandable debug drawer
- teleport/spawn network
- evidence capture hooks

Do not keep expanding one mixed `ExpoWorldHud`.

### D. Backend Domain Boundaries

Split backend by bounded context:

- `expo`
- `platform`
- `billing`
- `marketplace`
- `workflows`
- `growth`
- `leads`
- `agents`

Then keep `backend-server/routes` as thin composition only.

### E. Environment Policy

Keep:

- production public = minimal sponsor surface
- staging = full platform review surface

Make this explicit in repo docs and health metadata.

## Highest-Priority Technical Debt

1. old expo vs runtime expo coexistence
2. single-builder assumption for world screens
3. mixed operator/user HUD
4. backend domain monolith growth
5. JS/TS duplication in backend
6. perception gaps caused by PWA/service worker caching

## Recommended Execution Order

1. freeze current controlled hybrid architecture
2. remove ambiguity around live expo entrypoints
3. introduce zonal screen planning contract
4. move operator tooling into its own layer
5. clean backend domain ownership
6. remove stale JS duplicates once import/runtime paths are stable

## Final Verdict

The project does not need a total rewrite.

But the expo architecture does need a deliberate partial rebuild around:

- zonal planning
- cleaner runtime boundaries
- stricter environment truth
- isolated operator tooling

If new features continue to land directly on the old assumptions, the expo surface will keep degrading.

The foundation is not hopeless. But it is no longer safe to keep treating the central city builder as the source of truth for the entire exhibition world.
