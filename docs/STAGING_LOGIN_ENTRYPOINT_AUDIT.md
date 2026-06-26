# Staging Login Entrypoint Audit

Scope: audit only. No runtime, database, env, or deployment changes were made.

## Executive Summary

The current staging login entrypoint in the root Vite SPA is **`/login`**.

There is **no separate `/auth` or `/sign-in` route** in the inspected app route table, and the global top navigation does **not** expose a visible login button. Login is therefore reachable by:

* direct URL entry to `/login`
* redirect links from protected pages such as `/expo/admin`

Staging users can manually sign in today using the existing `/login` page and email/password Supabase auth.

## What exists

### Route config

The root SPA registers:

* `src/App.tsx` -> `<Route path="login" element={<Login />} />`

No matching route entries were found for:

* `/auth`
* `/sign-in`
* `/signin`

### Login page

`src/pages/Login.tsx` is the active auth page.

It uses Supabase auth directly:

* reads the current session with `supabase.auth.getSession()`
* signs in with `supabase.auth.signInWithPassword({ email, password })`
* supports a sign-up toggle that also uses Supabase auth
* redirects to `?next=` after successful login, defaulting to `/dashboard`

So the login UI is **email/password-based**, not magic-link or OAuth based.

### Where login is surfaced

The login page is not surfaced from the shared top nav.

`src/components/Layout.tsx` contains app nav links such as dashboard, projects, calculators, sponsor packages and live expo, but no login entry.

Login is surfaced indirectly from protected pages:

* `src/pages/expo/CompanyAdmin.tsx` redirects signed-out users to `/login?next=/expo/admin`
* `src/pages/expo/SponsorLeadInbox.tsx` redirects to `/login`
* `src/pages/modularHome/ModularHomeQuoteReview.tsx` redirects to `/login?next=/modular-homes/quotes`

## How staging login works today

### Manual steps

1. Open `https://staging.30sek24.com/login?next=/expo/admin`
2. Enter the staging account email and password.
3. Click **AUTORIZĒTIES**.
4. If the session already exists, the page will forward automatically to the `next` path.
5. After sign-in, open `/expo/admin` or return to the protected page.

### Auth type

The current UI supports:

* email/password sign-in
* email/password sign-up

The audit did **not** find a visible staging UI for:

* magic link sign-in
* OAuth sign-in

## Does the storage-state capture helper assume a missing login UI?

No. The helper does not implement login itself.

`scripts/capture-companyadmin-storage-state.mjs`:

* opens the staging browser against `/expo/admin`
* tells the operator to log in manually in the opened browser
* then captures storage state after the operator presses Enter

That means the helper assumes a **manual login path is available**, not a hidden automated login UI.

## Exact entrypoint conclusion

The actual staging login entrypoint is:

* **Primary:** `/login`
* **Protected-page redirect path:** `/login?next=/expo/admin`

It is **not** currently visible in the main navigation bar.

## Can users manually log in on staging today?

Yes.

The repo contains an active `/login` page that calls `supabase.auth.signInWithPassword`. The only caveat is discoverability: the page is not advertised in the shared top nav, so users generally need a direct URL or a redirect from a protected page.

## Safest next action

Use the existing route:

* open `/login?next=/expo/admin`
* sign in with the staging test account
* then re-run the storage-state capture or `/expo/admin` QA

If a more discoverable auth entry is needed later, the minimal next implementation would be to add a small visible login link in the shared nav or home page. That is **not required** for current staging login to work.

## Evidence summary

The audit was based on these repo checks:

* `src/App.tsx` route table includes `login`
* `src/pages/Login.tsx` uses `signInWithPassword`
* `src/components/Layout.tsx` has no login nav item
* `src/pages/expo/CompanyAdmin.tsx` redirects signed-out users to `/login?next=/expo/admin`
* `src/pages/expo/SponsorLeadInbox.tsx` redirects to `/login`
* `src/pages/modularHome/ModularHomeQuoteReview.tsx` redirects to `/login?next=/modular-homes/quotes`
* `scripts/capture-companyadmin-storage-state.mjs` instructs the operator to log in manually in the opened browser

