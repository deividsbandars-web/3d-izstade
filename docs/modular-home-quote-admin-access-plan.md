# Modular Home Quote Protected Admin Access Plan

Status: protected backend admin route foundation is connected to the `/modular-homes/quotes` review UI. Public quote data exposure remains blocked.

## Current frontend state
- `/modular-homes/quotes` uses local/mock review only on localhost.
- On staging/public hosts it checks the Supabase session, then fetches protected backend quote rows only for admin users.
- Signed-out visitors see a sign-in required state and no quote data.
- Signed-in non-admin users receive access denied and no quote data.
- Status update and detail view actions call protected backend endpoints.

## Protected backend route foundation
Routes are mounted only under `protectedRouter` in `backend-server/routes/api.ts`.

Required middleware chain:
1. `rateLimitMiddleware` globally on `/api`.
2. `authMiddleware` on protected router.
3. `adminOnly` on Modular Home quote admin routes.

Routes:
- `GET /api/modular-home/quotes`
  - Purpose: list quote rows for authenticated admins.
  - Query: optional `limit`, optional `status`.
- `GET /api/modular-home/quotes/:quoteId`
  - Purpose: view one quote detail for authenticated admins.
- `PATCH /api/modular-home/quotes/:quoteId/status`
  - Purpose: update one quote status and optional admin-only internal note.
  - Body: `{ "status": "new" | "contacted" | "quoted" | "won" | "lost", "internalNote": "..." }`.
- `GET /api/modular-home/quotes/export?format=json|csv`
  - Purpose: export filtered quote rows for authenticated admins.
  - Query: optional `limit`, optional `status`, optional `format`.

## Role model
Current guard:
- `authMiddleware` validates Supabase JWT.
- `adminOnly` requires `user.app_metadata.role === "admin"`.

Production recommendation:
- Keep `admin` as the first gate.
- Add finer roles later if needed:
  - `modular_home_sales_admin`
  - `modular_home_sales_viewer`
  - `modular_home_sales_exporter`
- Export should require an explicit exporter role or admin role.

## Quote list behavior
Storage target:
- `modular_home_quote_requests`.

Selected fields:
- `id`
- `created_at`
- `status`
- `requester`
- `project`
- `config`
- `estimate`
- `consent`
- `attribution`
- `source`

Limit policy:
- Default list limit: 50.
- Max list limit: 200.
- Production should add pagination cursor before high-volume use.

## Status workflow
Allowed statuses:
- `new`
- `contacted`
- `quoted`
- `won`
- `lost`

Legacy status compatibility:
- Existing `qualified` rows are normalized to `quoted` in the admin UI.
- Existing `closed` rows are normalized to `won` in the admin UI.

Internal notes:
- `internal_note` is an admin-only field.
- It can be saved with status updates.
- It must not appear in public Modular Home preview/demo surfaces.

Future statuses may be added only after updating:
- controller status validator;
- admin UI labels;
- reporting/export mapping;
- audit log schema.

## Export rules
- Export route is protected by `authMiddleware + adminOnly`.
- Supported formats: JSON and CSV.
- Public visitors cannot export.
- Production export should write an audit log row with:
  - actor user id;
  - timestamp;
  - row count;
  - filters;
  - format.

## Supabase/RLS requirements
Before using this with production data:
- Public anon/client keys must not have `SELECT`, `UPDATE` or `DELETE` on `modular_home_quote_requests`.
- Frontend must not fetch `modular_home_quote_requests` directly.
- Backend service role can read/update only through protected admin endpoints.
- Consider a dedicated view or RPC for admin list rows if row shape grows.

## Admin UI state
- Localhost remains useful for local preview queue and mock rows.
- Staging/public hosts use the protected API only.
- The UI can list quotes, view one quote detail, update status, attach an internal note and export visible rows to JSON/CSV.
- Do not make `/modular-homes/quotes` a public data viewer.

## Remaining production blockers
- Real quote submission remains disabled by default unless `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED=true` and request has `?homeQuoteBackend=1`.
- Route-specific distributed rate limiting is still required before public lead collection.
- Audit log target still needs implementation before production exports/status updates.
- Email/CRM handoff remains disabled by default.
