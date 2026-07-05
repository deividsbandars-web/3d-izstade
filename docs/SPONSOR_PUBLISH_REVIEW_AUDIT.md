# Sponsor Publish Review Audit

## Scope

- Audit date: `2026-06-17`
- Change type: documentation only
- Canonical frontend: root Vite SPA
- Canonical backend: `backend-server`
- Canonical public scene contract: `/api/expo/scene`

## Repo Areas Inspected

- `supabase/migrations`
- `backend-server/routes/api.ts`
- `src/App.tsx`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/CompanyAdmin.tsx`
- `src/pages/expo/SponsorLeadInbox.tsx`
- `src/pages/expo/SponsorPackages.tsx`
- `src/app/expo/expoDashboardService.ts`
- `src/app/expo/sponsorPackageRequest.ts`
- `src/shared/expo/boothPublicationStatus.ts`
- `docs/LAUNCH_READINESS_SNAPSHOT_20260617.md`

## What Already Exists

### Frontend Routes And Pages

- `/expo-3d`
  - public Web3D expo surface
  - route declared in `src/App.tsx`
- `/expo/booth/:id`
  - browser booth room instance
  - page: `src/pages/expo/BoothRoom.tsx`
  - already contains sponsor-facing `WebBoothStudioPanel` guidance
- `/expo/admin`
  - sponsor/operator managed booth surface
  - page: `src/pages/expo/CompanyAdmin.tsx`
- `/expo/sponsor-packages`
  - sponsor package sales/request page
  - page: `src/pages/expo/SponsorPackages.tsx`
- `/expo/sponsor-leads`
  - sponsor lead inbox
  - page: `src/pages/expo/SponsorLeadInbox.tsx`

### Existing Backend Routes To Reuse

Public scene and lead capture:

- `GET /api/expo/scene`
- `POST /api/expo/lead`

Managed booth and review surfaces:

- `POST /api/expo/booths`
- `PATCH /api/expo/booths/:boothId`
- `GET /api/expo/booths/managed`
- `GET /api/expo/booths/:boothId`
- `GET /api/expo/booths`
- `GET /api/expo/analytics/booths/:boothId`
- `GET /api/expo/scenes/booth/:boothId`
- `GET /api/expo/scenes/city`
- `GET /api/expo/review/snapshot`
- `GET /api/expo/review/booths/:boothId`

Lead inbox and ops routes:

- `GET /api/expo/lead-inbox/:companySlug`
- `PATCH /api/expo/lead-inbox/:companySlug/leads/:leadId`
- `PATCH /api/expo/lead-inbox/:companySlug/leads/:leadId/ops`
- `PATCH /api/expo/review/booths/:boothId/leads/:leadId`
- `PATCH /api/expo/review/booths/:boothId/leads/:leadId/ops`

### Existing Sponsor/Booth Admin Capability

`src/pages/expo/CompanyAdmin.tsx` is already the strongest reuse point for MVP publish/review. It already includes:

- managed booth loading and save flow
- booth publication status selection and status helper usage
- sponsor asset pack editing
- screen content editing
- managed booth preview route generation
- booth analytics loading
- lead inbox loading and ops actions
- copy that separates admin preview from public scene release

`src/app/expo/expoDashboardService.ts` already persists:

- `assets_3d.screen_content`
- `assets_3d.sponsor_asset_pack`
- booth `status`
- booth `district`
- company name and description

This means the sponsor authoring surface already exists. The missing part is a tighter, explicit submission/approval workflow around it.

### Existing Publication Status Model

`src/shared/expo/boothPublicationStatus.ts` already defines and normalizes:

- `draft`
- `review`
- `approved`
- `active`
- `rejected`
- `archived`

Important current behavior:

- `submitted` already normalizes to `review`
- public scene eligibility is `active`
- label mapping already exists for sponsor/admin UI

This is the key reason not to invent a parallel publish-state system.

### Existing Sponsor Package Flow

`src/pages/expo/SponsorPackages.tsx` plus `src/app/expo/sponsorPackageRequest.ts` already provide:

- sponsor package catalog and routing
- package interest capture
- backend lead submission via `POST /api/expo/lead`
- local backup queue for request retries

This is already a working sponsor intent funnel and should be reused as the entry point for package upgrade and sales qualification.

### Existing Sponsor Lead Workflow

`src/pages/expo/SponsorLeadInbox.tsx` already provides:

- sponsor lead inbox UI
- lead status transitions:
  - `pending`
  - `contacted`
  - `closed`
  - `rejected`
- follow-up scheduling
- ops notes
- reply drafting
- package-interest parsing and qualification helpers

This is already useful for sponsor/package follow-up, but it is not the same thing as content publication approval.

## Existing Data Structures To Reuse

### Canonical Expo Tables

From `supabase/migrations` and current restore reports, the main sponsor publish/review MVP should reuse:

- `public.sectors`
  - expo grouping for the public scene
- `public.companies`
  - sponsor/company entity
  - confirmed release-seed fields include:
    - `sector_id`
    - `description`
    - `logo_url`
    - `website`
    - `location`
    - `contact_email`
    - `tier`
    - `sponsor_tier`
    - `priority`
    - `booth_type`
    - `tagline`
    - `booking_url`
    - `poster_url`
    - `hero_asset_url`
    - `cta_label`
    - `slug`
- `public.booths`
  - booth instance linked to company
  - confirmed release-seed and premium fields include:
    - `company_id`
    - `model_url`
    - `booth_type`
    - `poster_url`
    - `hero_asset_url`
    - `cta_label`
- `public.service_requests`
  - sponsor lead capture records behind `/api/expo/lead`
  - existing lead statuses are already aligned to sponsor follow-up use
- `public.expo_lead_ops`
  - lead ops notes and follow-up metadata
- `public.booth_analytics`
  - booth metrics
- `public.city_screens`
  - premium city-screen inventory
- `public.booth_screen_reservations`
  - premium booth-to-screen placement metadata
- `storage.objects` bucket/policies for `expo_assets`
  - already present as the intended sponsor asset bucket

### Legacy Or Compatibility Tables Still Present

These exist and should be preserved, but they are not the first choice for the next publish/review MVP if `companies` and `booths` already cover the release path:

- `public.expo_booth`
- `public.expo_booths`
- `public.booth_lead`
- `public.booth_offer`
- `public.booth_asset`

Reason: the current release path, scene seed, restore reports, and sponsor UI direction are already centered on `companies`, `booths`, `service_requests`, and managed booth assets/status.

## Publish/Review Capability Gaps

### What Exists But Is Only Partial

- `BoothRoom.tsx` has sponsor-facing publish/review guidance, but it is informational UI, not a full workflow.
- `CompanyAdmin.tsx` already exposes booth publication statuses and a submit/approve activation pattern, but this still looks more like an admin-managed control panel than a fully structured sponsor self-service workflow.
- review read routes already exist, but the repo evidence inspected here does not prove a complete operator review queue with explicit reviewer notes, rejection reasons, and publish audit history.

### What Is Missing Or Still Weak

- no clearly documented end-to-end lifecycle joining sponsor content editing, submission, operator review, approval, and public publish
- no audited dedicated review-note or approval-history persistence for booth publication decisions
- no confirmed self-service sponsor submission UX that cleanly locks draft changes from public release until operator approval
- no fully verified sponsor asset review workflow from placeholder/media URL to approved public asset state
- no clear publish/archive operator checklist tied to existing sponsor package tier and booth readiness

## Minimal MVP Publish/Review Design

### Reuse First

Reuse these exact surfaces first:

- sponsor authoring and review control:
  - `src/pages/expo/CompanyAdmin.tsx`
- sponsor package entry and upgrades:
  - `src/pages/expo/SponsorPackages.tsx`
- sponsor booth preview:
  - `src/pages/expo/BoothRoom.tsx`
- sponsor lead operations:
  - `src/pages/expo/SponsorLeadInbox.tsx`
- public release scene:
  - `GET /api/expo/scene`
- managed booth persistence:
  - `src/app/expo/expoDashboardService.ts`
- publication status helpers:
  - `src/shared/expo/boothPublicationStatus.ts`

### Recommended Status Lifecycle

User-facing lifecycle:

- `draft`
- `submitted`
- `approved`
- `published`
- `archived`

Recommended implementation mapping onto the existing codebase:

- `draft` -> existing `draft`
- `submitted` -> existing `review`
- `approved` -> existing `approved`
- `published` -> existing `active`
- `archived` -> existing `archived`

Reason: this preserves the current normalized status model and avoids migration churn just to rename states.

### Minimal Data-Flow Direction

1. Sponsor edits booth assets and screen content in `CompanyAdmin.tsx`.
2. Sponsor saves draft through the existing managed booth save path.
3. Sponsor submits for review by moving status from `draft` or `rejected` to normalized `review`.
4. Operator/admin uses the existing review snapshot/booth endpoints plus `CompanyAdmin.tsx` review context to inspect readiness.
5. Operator either:
   - sets status to `approved` or `active`
   - or returns it to `rejected` with a documented reason in the existing notes-friendly admin surface
6. Only `active` content remains eligible for the public `/api/expo/scene` release path.

### Concrete Next MVP Scope

Implement only the smallest missing seam:

- tighten `CompanyAdmin.tsx` around a sponsor-friendly publish checklist
- expose a clearer submitted/rejected/admin feedback loop using existing booth status values
- reuse existing review read routes instead of inventing a second admin app
- keep sponsor package upsell linked to the existing package page
- keep booth media as reviewed URL-based content for now

## Exact Files, Routes, And Tables To Reuse

### Files

- `src/pages/expo/CompanyAdmin.tsx`
- `src/pages/expo/BoothRoom.tsx`
- `src/pages/expo/SponsorPackages.tsx`
- `src/pages/expo/SponsorLeadInbox.tsx`
- `src/app/expo/expoDashboardService.ts`
- `src/app/expo/sponsorPackageRequest.ts`
- `src/shared/expo/boothPublicationStatus.ts`
- `backend-server/routes/api.ts`

### Routes

- `/expo/admin`
- `/expo/booth/:id`
- `/expo/sponsor-packages`
- `/expo/sponsor-leads`
- `GET /api/expo/scene`
- `POST /api/expo/lead`
- `GET /api/expo/review/snapshot`
- `GET /api/expo/review/booths/:boothId`
- `GET /api/expo/lead-inbox/:companySlug`
- `PATCH /api/expo/booths/:boothId`

### Tables And Storage

- `public.companies`
- `public.booths`
- `public.service_requests`
- `public.expo_lead_ops`
- `public.booth_analytics`
- `public.city_screens`
- `public.booth_screen_reservations`
- `storage.objects` for `expo_assets`

## What Should Not Be Touched

- do not rebuild the sponsor workflow in a new app
- do not move the release runtime away from the root Vite SPA
- do not replace `backend-server`
- do not replace Supabase
- do not change sponsor pricing logic
- do not rewrite sponsor lead logic
- do not change `/api/expo/scene` as the canonical public scene contract
- do not introduce Unreal, Pixel Streaming, GLB/GLTF/FBX, PlayCanvas, or Babylon into this workflow
- do not touch `apps/frontend`
- do not add a separate publish-state system when `boothPublicationStatus` already exists

## Recommended Next Implementation Prompt

Read `PROJECT_CONTEXT_LOCK.md`, `docs/LAUNCH_READINESS_SNAPSHOT_20260617.md`, and `docs/SPONSOR_PUBLISH_REVIEW_AUDIT.md` first.

Non-negotiables:

- Do not rebuild the project from scratch.
- Preserve the root Vite SPA as the canonical frontend.
- Preserve `backend-server` as the canonical backend.
- Preserve Doppler + Vercel + GitHub + Hetzner/VPS + Docker Compose + Redis + TURN/signaling + Supabase.
- Do not touch `apps/frontend`.
- Do not add Unreal, Pixel Streaming, GLB/GLTF/FBX, PlayCanvas, or Babylon.
- Reuse existing sponsor packages, booth rooms, sponsor leads, `/api/expo/scene`, and existing Supabase tables first.
- Make a minimal focused diff.

Goal:

Implement the smallest real sponsor publish/review workflow on top of the existing managed booth system.

Work first in:

- `src/pages/expo/CompanyAdmin.tsx`
- `src/shared/expo/boothPublicationStatus.ts` only if existing labels/helpers need small sponsor-facing wording updates
- related existing expo service files only if strictly required
- no new app tree

Tasks:

1. Reuse the existing booth publication statuses and map sponsor-facing copy to:
   - `draft`
   - `submitted`
   - `approved`
   - `published`
   - `archived`
2. Keep persistence mapped to existing normalized backend statuses:
   - `submitted` -> `review`
   - `published` -> `active`
3. Strengthen the existing `CompanyAdmin` publish section so sponsors can:
   - save draft
   - submit for review
   - see review feedback state
   - understand what becomes public in `/api/expo/scene`
4. Reuse existing review endpoints:
   - `GET /api/expo/review/snapshot`
   - `GET /api/expo/review/booths/:boothId`
5. Reuse existing package upgrade route and sponsor lead inbox routes; do not invent new pricing or lead logic.
6. Do not add new media storage flow in this step.
7. Do not add new migrations unless absolutely required and stop for approval before doing so.

Acceptance:

- sponsor publish/review is clearer and more actionable in the existing admin surface
- existing booth status model is reused, not replaced
- `/api/expo/scene` remains the public release contract
- no pricing, lead, deployment, backend-runtime, or route churn is introduced
