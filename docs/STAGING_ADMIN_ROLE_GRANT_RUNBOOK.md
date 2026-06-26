# Staging Admin Role Grant Runbook

Use this runbook to grant `app_metadata.role = "admin"` to a disposable staging test user without touching production.

## Runtime rule

The app currently uses Supabase Auth metadata as the active admin gate:

* frontend: `session.user.app_metadata.role === 'admin'`
* backend: `req.user.role === 'admin'`

This runbook only changes the Supabase Auth metadata role. It does not touch `public.users.role`.

## Safe helper

Preferred CLI helper:

* `scripts/grant-staging-admin-role.mjs`

Default behavior is dry-run.

## Required environment

Set these before running the helper:

* `ADMIN_TARGET_EMAIL`
* or `ADMIN_TARGET_USER_ID`
* `SUPABASE_URL`
* `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

For apply mode, also set:

* `ADMIN_ROLE_APPLY=true`
* `ADMIN_EXPECTED_PROJECT_REF=<staging-project-ref>`

Optional diagnostics:

* `ADMIN_LOOKUP_HINT=<email fragment or user-id fragment>`
* `ADMIN_SHOW_FULL_EMAILS=true` for local-only troubleshooting only

## Dry-run example

```powershell
doppler run -- node scripts/grant-staging-admin-role.mjs
```

Or with explicit shell env:

```powershell
$env:ADMIN_TARGET_EMAIL='staging-admin@example.test'
$env:ADMIN_EXPECTED_PROJECT_REF='<staging-project-ref>'
doppler run -- node scripts/grant-staging-admin-role.mjs
```

Dry-run prints only redacted target information:

* Supabase host and project ref
* whether a service-role env is present
* target email
* auth user id
* lookup method used
* auth lookup status and reason
* whether an Auth user was found
* whether `public.users` contains a matching row
* current `app_metadata.role`
* intended `app_metadata.role = admin`

It does not change any data.

If the lookup fails, the helper exits cleanly and explains whether the issue looks like:

* wrong or missing email/user id
* wrong Supabase staging project
* public `users` row exists without an Auth user
* missing service-role env
* lookup hint returned no candidates
* auth lookup failed before it could search

## Apply example

```powershell
$env:ADMIN_TARGET_EMAIL='staging-admin@example.test'
$env:ADMIN_ROLE_APPLY='true'
$env:ADMIN_EXPECTED_PROJECT_REF='<staging-project-ref>'
doppler run -- node scripts/grant-staging-admin-role.mjs
```

Apply mode:

* requires an explicit project ref guard
* refuses the known production project ref already used in the repo
* only updates `auth.users.app_metadata.role` to `admin`
* leaves `public.users.role` untouched

After applying, sign out and back in so the JWT picks up the new role.

## Dashboard fallback

If you prefer the Supabase Dashboard:

1. Open the staging Supabase project.
2. Go to **Authentication -> Users**.
3. Select the disposable staging user.
4. Edit auth metadata to include:

   ```json
   { "role": "admin" }
   ```

5. Sign the user out and back in.
6. Re-test `/expo/admin` and CompanyAdmin media review controls.

## Legacy compatibility note

Some older policies still reference `public.users.role`.

Optional mirror SQL for later approval-only use:

```sql
update public.users
set role = 'admin'
where id = '<auth_uid_here>';
```

Do not run that SQL in the helper. Keep it as a manual compatibility step only if a later task explicitly asks for it.

The helper never updates `public.users.role`.

## Safety rules

* Staging only.
* No production users.
* No env files.
* No secrets in prompts, logs, or handoff ZIPs.
* No `public.users.role` changes from the helper.
* No mutation unless `ADMIN_ROLE_APPLY=true`.
* No production-looking Supabase URL or known production project ref.
