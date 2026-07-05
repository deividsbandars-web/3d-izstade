# Staging Auth UX Validation

Task: expose the existing Supabase email/password login entrypoint in the shared nav, show account state when signed in, and add a safe logout control.

## Validation commands

* `npm.cmd run build`
* `npm.cmd run lint`
* `doppler run -- node scripts/smoke-backend-supabase.mjs`

## Results

* `npm.cmd run build` passed.
* `npm.cmd run lint` passed with existing repository warnings only.
* `doppler run -- node scripts/smoke-backend-supabase.mjs` reached the backend and `/health` returned `200`, but `/api/expo/scene` failed with `500` and the smoke reported:

  * `permission denied for table sectors`

## Manual staging validation still required

The following should be checked in staging by an operator with a valid signed-in session:

1. Logged-out `/expo/admin` shows or links to login.
2. `/login?next=/expo/admin` signs in and returns to `/expo/admin`.
3. Shared nav shows account state and `Logout` when signed in.
4. `Logout` signs the user out and returns to `/login` or `/login?next=/expo/admin` depending on the current route.
5. Re-login works after logout.

## Notes

* The login page already honors `next=` after successful sign-in, so no auth architecture change was required.
* The shared nav now exposes a visible `LOGIN` link when no session exists and a redacted account chip plus `LOGOUT` button when a session exists.
* No backend auth rules or Supabase migrations were changed.

