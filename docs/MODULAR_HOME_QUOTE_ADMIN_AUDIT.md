# Modular Home Quote Admin Audit

## Scope

- Date: `2026-06-18`
- Goal: audit the existing Modular Home quote/admin follow-through MVP
- Canonical surfaces preserved:
  - `/modular-homes/studio`
  - `/modular-homes/quotes`
  - root Expo/Modular Home browser flow

## Existing Files / Routes / Tables

Frontend surfaces:

- `src/pages/modularHome/ModularHomeStudioPage.tsx`
  - dedicated browser-based modular home studio shell
- `src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx`
  - primary in-browser home design / estimate / quote presentation layer
- `src/modules/expo/runtime/modularHome/HomeDesignInstanceShell.tsx`
  - separates city preview from detailed home design sections
- `src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx`
  - customer quote/request form
- `src/pages/modularHome/ModularHomeQuoteReview.tsx`
  - existing admin/operator review surface
- `src/modules/expo/runtime/modularHome/modularHomeQuoteReview.ts`
  - normalization and review-row model for backend, local preview, and mock rows
- `src/app/modularHome/modularHomeQuoteAdminApi.ts`
  - protected quote admin API client

Backend routes/controllers:

- `POST /api/modular-home/quote`
  - `backend-server/routes/api.ts`
  - `backend-server/controllers/modularHomeQuoteController.ts`
- protected admin routes:
  - `GET /api/modular-home/quotes`
  - `GET /api/modular-home/quotes/export`
  - `GET /api/modular-home/quotes/:quoteId`
  - `PATCH /api/modular-home/quotes/:quoteId/ops`
  - `PATCH /api/modular-home/quotes/:quoteId/status`

Supabase tables/migrations:

- `supabase/migrations/20260609040000_modular_home_quote_requests.sql`
  - creates `public.modular_home_quote_requests`
- `supabase/migrations/20260609164000_modular_home_quote_sales_ops.sql`
  - adds:
    - `consultant_assignment`
    - `follow_up_required`
    - `status_history`

## What Already Works

Customer-side flow already present:

- browser-based modular home configurator and estimate flow exists
- customer quote request form exists
- local preview queue exists when backend mode is disabled
- real backend submission path exists behind:
  - frontend/backend flagging
  - staging-only host/environment gating
  - server validation
  - Supabase service-role insert

Admin/operator follow-through already present:

- `/modular-homes/quotes` is already a protected admin review surface
- quote rows can be listed, filtered, viewed in detail, exported, and updated
- quote detail already exposes:
  - customer contact
  - selected home configuration
  - estimate
  - message
  - consultant assignment
  - follow-up required flag
  - internal note
  - status history
- admin-only status workflow already exists:
  - `new`
  - `contacted`
  - `quoted`
  - `won`
  - `lost`

Security and data boundaries already present:

- public clients do not read quote rows directly from Supabase
- protected backend routes sit behind `authMiddleware + adminOnly`
- RLS denies direct client access to `modular_home_quote_requests`

## What Is Missing

Still incomplete for broader launch hardening:

- no dedicated audit log target for exports/status changes
- no distributed production-ready rate limiting for public quote collection
- no CRM/email handoff enabled by default
- no browser automation or CI smoke for the quote admin route
- no separate lightweight operator dashboard beyond the review page

Before this task, what was weakest in the current operator flow:

- follow-up visibility existed as raw fields, but not as a clearer next-action summary
- unassigned/follow-up workload visibility was present only by reading individual rows

## Safest Next Implementation Step

Safest minimal path:

1. keep `/modular-homes/quotes` as the canonical admin/operator surface
2. improve read-only follow-up visibility inside that existing page
3. avoid new tables, routes, or upload/storage workflows
4. reuse:
   - `consultant_assignment`
   - `follow_up_required`
   - `internal_note`
   - `status_history`
   - quote status

That is the smallest safe follow-through improvement because the page, data model, and protected routes already exist.

## What Must Not Be Touched

- modular home pricing logic
- quote estimate calculation rules unless a verified bug is found first
- sponsor pricing or sponsor flows
- sponsor publish/review logic
- sponsor media review logic
- `/api/expo/scene`
- GLB/GLTF/upload/storage workflow introduction
- Unreal/Pixel Streaming baseline changes
- deployment, env, Doppler, Redis, TURN, signaling, Docker Compose
