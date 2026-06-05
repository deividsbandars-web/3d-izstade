# Modular Home Quote Backend Hardening Plan

Status: backend submission path exists but must remain disabled by default.

## Current gates
- Server storage is disabled unless `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED=true`.
- Client can attempt backend submission only with explicit `?homeQuoteBackend=1`.
- Frontend default remains localStorage-only preview quote queue.
- Route: `POST /api/modular-home/quote?homeQuoteBackend=1`.
- Storage target: `modular_home_quote_requests`.
- Email/CRM handoff is disabled unless `MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED=true`.

## Required before production enablement
- Add route-specific distributed rate limiting using Redis/Supabase counters, not process memory.
- Keep the existing global API limit as a fallback only.
- Add duplicate guard by normalized email + selected product/config hash.
- Add spam prevention such as honeypot/timing field or Turnstile before public traffic.
- Confirm Supabase RLS policies before any production data collection.
- Build protected admin review workflow before broad launch.
- Add audit log rows for rejects, inserts, handoff queueing, status changes and exports.
- Review consent/privacy copy with the live privacy policy version.

## Rate limiting plan
Current state:
- `backend-server/middleware/rateLimit.ts` applies an in-memory 60 requests/minute/IP limit across API routes.

Production requirement:
- Add quote-specific limit before enabling real collection: recommended 5 successful quote attempts / 10 minutes / IP.
- Add second limit: 3 attempts / 30 minutes / normalized email.
- Store counters in Redis or Supabase so Vercel/server restarts and multiple instances do not reset protection.
- Do not rely on the existing in-memory middleware as the only control.

## Consent and privacy versioning
Current required server values:
- Consent version: `modular-home-quote-consent-v1`.
- Privacy version: `privacy-v1`.
- Consent text must match the approved backend quote consent copy.

Server behavior:
- `accepted` must be true.
- `acceptedAt` must be valid ISO date.
- `consentText`, `consentVersion` and `privacyVersion` are validated server-side.
- Future privacy text changes must bump version and keep migration notes.

## Supabase RLS and storage policy notes
Target table:
- `modular_home_quote_requests`.

Required policy stance:
- Public anon/client keys must not have `SELECT`, `UPDATE` or `DELETE` access.
- Public anon/client keys should not insert directly; insertion should happen only through trusted backend service role while feature flag is enabled.
- Admin/sales review must be behind authenticated protected API.
- Export actions must require admin role and audit log entry.
- No file upload bucket is enabled by this quote route.

Suggested table fields:
- `id uuid primary key default gen_random_uuid()`.
- `created_at timestamptz default now()`.
- `status text default 'new'`.
- `requester jsonb not null`.
- `project jsonb not null`.
- `config jsonb not null`.
- `estimate jsonb not null`.
- `consent jsonb not null`.
- `attribution jsonb not null`.
- `source jsonb not null`.

## Spam prevention
Required before launch:
- Honeypot or timing field in frontend payload.
- Server-side reject for filled honeypot or impossible submit timing.
- Duplicate guard by email/product/config hash.
- Max lengths and enum validation remain mandatory.
- Optional Turnstile/hCaptcha for public campaigns.

## Admin access requirements
- Quote viewer must not be publicly linked or accessible without auth.
- Admin viewer should require role claim or workspace/company allowlist.
- Status changes require actor id, previous status, next status and timestamp.
- CSV/JSON exports require actor id and audit log entry.

## Email/CRM handoff plan
- Keep disabled until `MODULAR_HOME_QUOTE_EMAIL_HANDOFF_ENABLED=true`.
- Queue email/CRM notification after Supabase insert succeeds.
- Handoff must be idempotent by quote id.
- Visitor response should not depend on email provider success.
- Log handoff success/failure without leaking PII in public responses.

## Audit log requirements
Create a separate audit target before production enablement, for example `modular_home_quote_audit_log`.

Record:
- disabled backend attempts without raw PII payload.
- missing `homeQuoteBackend=1` attempts.
- validation failures by code, request id and coarse source metadata.
- successful insert id and consent/privacy versions.
- email/CRM queue result.
- admin status changes.
- exports.

## Production enablement decision
Do not enable `MODULAR_HOME_QUOTE_SUBMISSION_ENABLED=true` until:
- route-specific distributed rate limiting exists;
- RLS/storage policy is reviewed;
- consent/privacy version is approved;
- protected admin workflow exists;
- audit logging exists;
- email/CRM behavior is explicitly decided.
