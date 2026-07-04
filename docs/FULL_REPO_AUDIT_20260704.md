# Full Repo Audit - 2026-07-04

## Scope

Audited the release-relevant Warpala repo surface for the canonical product:

- root Vite SPA
- `backend-server`
- `/expo-3d`
- `/api/expo/scene`
- sponsor boulevard, booths, city screens, sponsor setup, modular-home studio
- Supabase migrations/contracts, release gates, Docker/Vercel hygiene, focused Web3D tests

Per `AGENTS.md`, I did not deep-audit archival/operator folders such as `WarpalaUE5/`, `assets-intake/`, `handoff/`, `diagnostics/`, `apps/frontend/`, `docs/recovery/`, `node_modules/`, or generated `dist/` source code. I did inspect `dist` output size through build/gate results.

No deployment, staging, production, or Supabase state was changed.

## Executive Summary

Warpala is much stronger than a raw tech demo now: the root Vite expo exists, scene data is config/API driven, city screen rental exists, sponsor booth setup exists, modular-home studio exists, community board/graffiti/presence exists, and the release gate suite is substantial.

The product is still not commercially finished. The blockers are mostly product clarity, release scope control, transactional screen/booth ownership, visual/payload risk, and too much internal/operator language leaking into normal buyer paths.

The most serious risk is the current repo state: `239` changed/untracked entries (`175` modified, `64` untracked). That makes it hard to know what is intended release work, what is experimental, and what is safe to ship.

## Release Readiness Verdict

Status: not release-ready.

Reasons:

- Large dirty worktree with many release-scope changes.
- `productVisualAccepted=false` remains unchanged.
- City screen rental is understandable but not yet a transactional inventory/booking system.
- Sponsor admin still contains too much technical/operator wording.
- Public route surface includes many internal/legacy pages by direct URL.
- Release static payload is close to its budget ceiling.
- Human visual acceptance is still required.

## Strong Areas

- `/api/expo/scene` is the canonical public scene endpoint and is public-readonly in `backend-server/controllers/expoController.ts:7`.
- Public scene content sanitizes placeholder/sample media through `normalizeReleaseMediaUrl` in `backend-server/controllers/expoController.ts:147`.
- Booth/screen presentation has focused tests for scene contract, booth presentation, media safety, screen runtime policy, overlap, proximity, and readable surface rendering.
- City screen rental exists at `/expo/city-screens` and routes exact selected screens into sponsor admin.
- City screen campaign validation has dates, max duration, status lifecycle, price estimate, and overlap detection.
- Deployment hygiene checks exist for Vercel context, Docker context, secret env exclusion, production branch guard, release static payload, Expo boundaries, backend boundaries, GALA ownership, and Supabase RLS.
- Backend tests pass as a suite.
- Community board/graffiti/presence now has moderation, rate limits, reporting, removal, retention, and tests.

## P0 Findings

### P0.1 Dirty Worktree Is Too Large For Release Control

Evidence:

- `git status --short`: `175` modified and `64` untracked entries.
- `git diff --stat`: `175 files changed, 7965 insertions(+), 1970 deletions(-)`.

Why it matters:

This is the biggest operational risk. A product release needs a known, reviewable set of changes. Right now product work, infrastructure changes, tests, docs, community work, screen work, billing, AI, deployment scripts, and large visual changes are all mixed.

Action:

- Freeze feature work.
- Split into reviewable scopes: `expo core`, `screen rental`, `sponsor admin`, `community`, `modular-home`, `infra/release`, `docs`.
- Do not deploy until the release branch has a clean, reviewed baseline.

### P0.2 Human Visual Acceptance Still Missing

Evidence:

- `docs/CURRENT_TASK.md` repeatedly records `productVisualAccepted=false`.

Why it matters:

The product is visual and sponsor-facing. Passing tests is not enough. The city and modular-home proof case need human acceptance before they are sold.

Action:

- Run a dedicated visual acceptance pass for `/expo-3d`, `/expo/city-screens`, `/expo/admin?task=city-screen`, `/expo/admin?task=booth`, and `/modular-homes/studio`.
- Capture desktop/mobile screenshots and mark accepted/rejected explicitly.

### P0.3 Internal/Legacy Routes Are Still Publicly Routable

Evidence:

- `src/App.tsx:134` to `src/App.tsx:165` registers many internal/legacy routes including platform dashboard, platform leads, project builder, clients, inventory, finances, documents, settings.
- `src/config/releaseRouteOwnership.ts:38` to `src/config/releaseRouteOwnership.ts:46` labels several of these as `internal`, but that file is metadata/navigation, not a route guard.

Why it matters:

The public product should feel like a focused sponsor expo. Direct URLs can expose unfinished backoffice tools and confuse buyers. Backend APIs may be protected, but the UI surface itself still loads.

Action:

- Add route-level release gating for `internal` and `demo-only` routes.
- Keep only canonical buyer routes public by default.
- Put internal pages behind explicit auth/role or operator mode.

### P0.4 `/api/leads/capture` Looks Incorrectly Protected

Evidence:

- `backend-server/routes/api.ts:134` places `POST /leads/capture` under `protectedRouter`.
- The same line says: `This was incorrectly protected before`.
- `src/backend/distribution/distributionApplicationService.ts:42` renders a public form posting to `/api/leads/capture`.
- `backend-server/routes/__tests__/releaseApiPublicRoutes.test.ts:38` to `backend-server/routes/__tests__/releaseApiPublicRoutes.test.ts:48` manually mounts public controllers instead of testing the actual `createApiRouter`.

Why it matters:

If the landing/distribution form is active, public lead capture will return auth errors. This is a direct revenue/lead loss bug.

Action:

- Decide whether `/api/leads/capture` is a public landing form endpoint or an internal CRM endpoint.
- If public, move it before `protectedRouter.use(authMiddleware)` and add abuse controls.
- Add an actual mounted-router test for `createApiRouter`.

## P1 Findings

### P1.1 Sponsor Admin Is Still Too Hard For Buyers

Evidence:

- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:258` and `:262` uses technical URL/media language.
- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:964` says only an operator can approve/publish city advertising.
- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:1025` refers to "operator review".
- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:1326` exposes direct media-file rules.
- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:2535` exposes value tier, score, size and `operatorZoneId`.
- `src/pages/expo/companyAdmin/CompanyAdminView.tsx:2585` explains public video URL restrictions in technical terms.

Why it matters:

This matches the user feedback: a sponsor should not need to learn internal language before uploading a logo, image, video, CTA, or choosing a city screen.

Action:

- Keep `Advanced` for operators.
- Default sponsor path should ask for plain content: sponsor name, logo, headline, short offer, website/CTA, image/video file, dates, selected screen.
- Hide slot score, operator zone IDs, direct URL rules, and promotion mechanics from the normal buyer path.

### P1.2 Global Public Layout Still Leaks Operator/System Language

Evidence:

- `src/components/Layout.tsx:82` hides global HUD only on `/expo/admin`.
- `src/components/Layout.tsx:292` renders `GlobalChat` on other public routes.
- `src/components/Layout.tsx:309` renders `MEZGLS: RTX_4080_ULTRA`.
- `src/components/Layout.tsx:310` renders `SYSTEM_SYNC: ACTIVE`.
- `src/config/releaseRouteOwnership.ts:24` and `:25` include `SPONSOR ADMIN` and `LEAD INBOX` as utility nav items.

Why it matters:

Sponsor-facing pages should not look like an operator console. This hurts trust and sellability.

Action:

- Remove system-sync footer from public buyer pages.
- Move admin/lead inbox behind account/auth state.
- Keep operator diagnostics only behind explicit `operator=1` or role checks.

### P1.3 City Screen Rental Is Config-Driven But Not A True Inventory System

Evidence:

- `src/shared/expo/screenInventory.ts:1` to `:174` defines screen inventory in shared code.
- `src/pages/expo/CityScreenMarketplace.tsx:27` to `:29` explains exact screen rental.
- `src/app/expo/cityScreenRental.ts:7` filters city screen slots from shared config.
- `backend-server/controllers/expoDataController.ts:65` validates city screen campaign payload.
- `backend-server/controllers/expoDataController.ts:125` checks conflicts by scanning existing managed booth records.

Why it matters:

The flow is now understandable, but screen inventory, price hints, ownership, availability, and booking conflict control are not backed by a dedicated transactional table. A frontend/backend deploy is still needed to change screen inventory.

Action:

- Add backend/config/schema support for city screen inventory, reservation, owner, price, status, campaign schedule, media, and audit state.
- Use DB constraints or transactions to prevent simultaneous double booking.

### P1.4 City Screen Conflict Detection Is Not Transactional

Evidence:

- `backend-server/controllers/expoDataController.ts:101` to `:125` builds existing campaign state by listing booths.
- `backend-server/controllers/expoDataController.ts:125` to `:132` rejects conflicts after the scan.

Why it matters:

Two simultaneous requests for the same screen/date can race. The current validation reduces mistakes, but it is not a booking lock.

Action:

- Move city screen bookings into a dedicated DB table with a lock/constraint strategy.
- Add tests for simultaneous conflict behavior after schema support exists.

### P1.5 Public Route Tests Do Not Prove Actual Auth Placement

Evidence:

- `backend-server/routes/__tests__/releaseApiPublicRoutes.test.ts:38` to `:48` manually mounts `/api/expo/lead`, `/api/calculator/lead`, and `/api/modular-home/quote`.
- `backend-server/routes/api.ts:33` creates the real router, and `backend-server/routes/api.ts:64` applies auth to the protected router.

Why it matters:

Manual controller tests can pass while the actual route placement is wrong. The `/api/leads/capture` issue is exactly the kind of regression this misses.

Action:

- Add tests that mount `createApiRouter()` and verify public/protected status for all release endpoints.

### P1.6 Release Static Payload Is Too Close To The Ceiling

Evidence:

- `npm.cmd run check:all` passed, but reported:
  - raw source texture pack excluded: `927.58 MiB`
  - release public payload: `801.86 MiB / 850 MiB`
  - built dist payload: `806.06 MiB / 850 MiB`
- `public/textures/expo/hero-paver-4k/pavement_01_diff_4k.png` is `99,079,273` bytes.
- Several other `public/textures` and `public/models` assets are 80-95 MB.

Why it matters:

The gate passes, but the margin is thin. One new model or texture can break release payload budget. Heavy local `public/` content also raises accidental deployment risk.

Action:

- Move raw/source assets out of `public/`.
- Keep only compressed runtime release assets in `public/`.
- Lower budget targets once the release path is stabilized.

### P1.7 `default_booth.glb` Is A Zero-Byte Release Asset Advisory

Evidence:

- `npm.cmd run check:all` reports: `advisory public/models/default_booth.glb: zeroByte=true sizeMiB=0`.

Why it matters:

Even if advisory-only, a zero-byte model is an asset quality smell. If any fallback path uses it later, booth rendering can break.

Action:

- Replace with a real lightweight fallback GLB or remove all references and delete the asset.
- Promote the advisory to a failing gate if it remains release-addressable.

### P1.8 PWA Branding Still Says Platformu Centrs

Evidence:

- `vite.config.ts:75` uses `name: 'Platformu Centrs'`.
- `vite.config.ts:76` uses `short_name: 'PCentrs'`.

Why it matters:

The canonical product is Warpala. Browser install metadata and app shell branding should not present another product name.

Action:

- Align manifest metadata with Warpala sponsor expo branding.

### P1.9 Community Feature Is Not Production-Persistent Until Supabase Migration Is Applied

Evidence:

- `supabase/migrations/20260704160000_expo_community_content.sql:6` creates `expo_community_entries`.
- `supabase/migrations/20260704160000_expo_community_content.sql:36` creates `expo_community_graffiti`.
- `supabase/migrations/20260704160000_expo_community_content.sql:104` to `:117` enables RLS and service-role grants.
- This migration file exists but was not applied.

Why it matters:

The feature works in dev/test memory fallback, but production needs explicit migration and environment configuration.

Action:

- Apply only after explicit authorization.
- Configure `EXPO_COMMUNITY_STORAGE=supabase`.
- Run two-authenticated-browser validation.

### P1.10 Production Rate Limits Fail Closed On Redis

Evidence:

- `backend-server/middleware/rateLimit.ts:14` to `:18` treats production as requiring Redis.
- `backend-server/middleware/rateLimit.ts:51` to `:57` returns `503 RATE_LIMIT_UNAVAILABLE`.
- `backend-server/routes/api.ts:38` applies the global rate limiter to all API routes.

Why it matters:

Fail-closed is defensible, but operational readiness needs Redis health checks and clear incidents/runbooks. A missing `REDIS_URL` or Redis outage can make the API unusable.

Action:

- Add production Redis readiness checks.
- Document the expected failure mode.
- Make `/health` include dependency state or add a separate readiness endpoint.

## P2 Findings

### P2.1 Modular-Home Studio Still Uses Too Much Placeholder Language

Evidence:

- `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts:346` uses `Green roof placeholder`.
- `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts:354` uses `Covered terrace placeholder`.
- `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts:422` uses `Round gutter placeholder`.
- `src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts:572` uses `Wardrobe placeholder`.
- `src/modules/expo/runtime/modularHome/ModularHomeProjectSummary.tsx:689` says no live quote was submitted and browser localStorage only.
- `src/modules/expo/runtime/modularHome/ModularHomeProjectSummary.tsx:947` says model preview placeholder.

Why it matters:

The modular-home studio is a proof case. It can be a preview, but buyer-facing text should not repeatedly say placeholder unless the section is explicitly internal.

Action:

- Replace buyer-facing placeholder labels with plain names like `Green roof`, `Covered terrace`, `Round gutter`, `Wardrobe`.
- Keep supplier uncertainty in internal estimate notes, not primary labels.

### P2.2 Modular-Home Quote Review Has Dev/Mock Paths

Evidence:

- `src/pages/modularHome/ModularHomeQuoteReview.tsx:611` switches between protected admin/staging and local dev review.
- `src/pages/modularHome/ModularHomeQuoteReview.tsx:696` includes `mock-review` option outside protected backend.
- `src/pages/modularHome/ModularHomeQuoteReview.tsx:711` renders `Include mock rows`.

Why it matters:

This is acceptable for local dev, but direct access on a buyer-facing release domain should not expose mock review concepts.

Action:

- Gate local/mock review behind development or operator mode only.
- Keep quote review protected and admin-only in release.

### P2.3 LocalStorage Queues Can Confuse Users About Submission State

Evidence:

- `src/app/expo/sponsorPackageRequest.ts:158` to `:168` stores sponsor package requests in localStorage queue.
- `src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx:97` to `:111` stores modular quote preview requests in localStorage.
- `src/modules/expo/runtime/boothProduct/sponsorConciergeLeadCapture.ts:195` submits booth leads to `/api/expo/lead`, with queue behavior nearby in the same module.

Why it matters:

If a buyer thinks a request was submitted but it is only queued locally, commercial trust breaks.

Action:

- Make local-only states explicit and temporary.
- Prefer backend submission for real quote/lead paths.
- Add resend/clear UX where queues remain.

### P2.4 Some Legacy UI Still Uses Alerts, Localhost, Mocks, Or Console Logs

Evidence:

- `src/ui/Dashboard.tsx:16` and `:35` fetch hardcoded `http://localhost:3000`.
- `src/ui/AuthPage.tsx:17` uses `http://localhost:3000`.
- `src/app/workflows/WorkflowBuilder.tsx:50` and `:52` use `alert`.
- `src/backend/revenue/offerGenerator.ts` has mock Stripe URL behavior.
- `src/services/aiService.ts:27` logs prompt prefix.

Why it matters:

Even if these are not primary expo pages, exposed legacy routes make the product feel unfinished.

Action:

- Gate legacy pages out of release routes.
- Remove hardcoded localhost from reachable UI.
- Avoid logging user prompts in browser/service code.

### P2.5 City Visual Quality Still Needs Human Art Direction

Evidence:

- Prior `docs/CURRENT_TASK.md` residual risks report dark/flat foreground, subtle lane markers, clipped/dark side screens, dense silhouettes, and mobile first-view composition needing review.
- Current tests validate placement/readability constraints but do not prove premium art direction.

Why it matters:

Sponsors buy what they can see. A city can pass tests and still feel cheap or confusing.

Action:

- Run a visual pass focused on first 10 seconds of walking.
- Reduce clutter, strengthen walking lane hierarchy, improve booth/screen read distance, and tune ground/material palette.

## Backend/Schema Support Needed

Required backend/config/schema work:

- Dedicated city screen inventory table.
- City screen reservation/campaign table with owner, price, status, start/end dates, media, fallback image, priority, and audit.
- Transactional or constraint-backed screen booking conflict prevention.
- Payment/contract/invoice lifecycle for booth and screen rental.
- Sponsor asset lifecycle that avoids direct public URL learning for buyers.
- Community Supabase migration application and storage env configuration.
- Readiness/health endpoint for Redis/Supabase/storage dependencies.
- Mounted-router public/protected route contract tests.

## Improvements Possible Without Backend Contract Changes

Can be done now:

- Gate internal/legacy routes in the frontend.
- Hide public operator/system footer language.
- Hide admin/lead inbox nav unless authenticated.
- Simplify sponsor admin copy and default to quick setup.
- Move technical URL and approval details into Advanced/operator help.
- Replace modular-home placeholder labels in buyer-facing controls.
- Tighten PWA/brand metadata.
- Replace/remove zero-byte `default_booth.glb`.
- Move raw source assets out of `public/` or enforce stronger local hygiene.

## Validation Run

Passed:

- `npm.cmd run check:all`
- `npm.cmd run check:backend-tests`
- `npx.cmd tsc --noEmit -p tsconfig.app.json`
- `npx.cmd tsc --noEmit -p backend-server/tsconfig.json`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run check:bundle-budget`
- `npx.cmd tsx src/modules/expo/__tests__/sceneContract.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/sponsorBoothPresentation.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenRuntimePolicy.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenContentMediaSafety.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenSurfaceOverlapDiagnostics.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenBoothProximityDiagnostics.test.ts`
- `npx.cmd tsx src/shared/expo/cityScreenCampaign.test.ts`
- `npx.cmd tsx src/app/expo/cityScreenRental.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/managedScreenAssignmentOverride.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/modularHomeConfiguratorPrimaryControls.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/worldScenePlanningPlacementStability.test.ts`
- `npx.cmd tsx src/modules/expo/runtime/community/expoPresencePolicy.test.ts`
- `npx.cmd tsx src/shared/expo/communityContent.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/cityCompositionPolish.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/boothArchitectureKit.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/productionSafeScreenCoverage.test.ts`
- `npx.cmd tsx src/modules/expo/__tests__/screenReadableSurfaceRendering.test.ts`
- `npx.cmd tsx backend-server/routes/__tests__/expoCommunity.controller.test.ts`
- `git diff --check`

Important warnings:

- `check:all` passed with release payload near the limit: `806.06 MiB / 850 MiB`.
- `check:all` emitted advisory: `public/models/default_booth.glb` is zero bytes.
- `git diff --check` passed but emitted many CRLF normalization warnings.
- Backend tests passed with expected negative-path logs for auth/rate-limit/signature failures.

Not run:

- No deployment smoke tests.
- No staging/production checks.
- No Supabase migrations applied.
- No browser visual screenshot capture for this audit pass. Existing screenshot artifacts from previous focused work remain available in `review_artifacts/`, but this audit did not create new screenshots.

## Recommended Fix Order

1. Stabilize the worktree and split the current changes into reviewable scopes.
2. Add frontend release route gating for internal/demo/legacy pages.
3. Fix `/api/leads/capture` route placement or explicitly retire that public form path.
4. Strip public operator/system language from buyer pages.
5. Simplify sponsor admin default flow and hide technical media/operator details.
6. Convert city screen rental from shared compiled config into backend-owned inventory/reservation state.
7. Lower release static payload risk and remove zero-byte assets.
8. Polish modular-home buyer labels and quote submission state.
9. Apply community Supabase migration only after explicit authorization and run real multi-user validation.
10. Run human visual acceptance and update `productVisualAccepted` only after approval.

## Release State

- Deployment changed: no.
- Staging changed: no.
- Production changed: no.
- Supabase changed: no.
- `productVisualAccepted` changed: no.
