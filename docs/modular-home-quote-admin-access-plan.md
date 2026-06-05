# Modular Home Quote Protected Admin Access Plan

Status: protected backend admin route foundation exists. Public quote data exposure remains blocked.

## Current frontend state
- `/modular-homes/quotes` remains localhost-only for local/mock review.
- It does not fetch production quote data on public hosts.
- It is not a production admin surface yet.

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
- `PATCH /api/modular-home/quotes/:quoteId/status`
  - Purpose: update one quote status.
  - Body: `{ "status": "new" | "contacted" | "qualified" | "closed" }`.
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
- `qualified`
- `closed`

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

## Admin UI next step
Recommended next UI step:
- Replace localhost-only `/modular-homes/quotes` with auth-aware behavior:
  - local/mock viewer on localhost;
  - protected API viewer on staging/production only when authenticated admin session exists;
  - blocked state for anonymous/non-admin users.

Do not make `/modular-homes/quotes` public data viewer.

## Remaining production blockers
- Real quote submission remains disabled by default unless `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED=true` and request has `?homeQuoteBackend=1`.
- Route-specific distributed rate limiting is still required before public lead collection.
- Audit log target still needs implementation before production exports/status updates.
- Email/CRM handoff remains disabled by default.
