# Staging Admin Access Audit

Scope: audit only. No code, database, env, or deployment changes were made.

## Executive Summary

The current `/expo/admin` and CompanyAdmin media review access path is **role-based**, not email-allowlist-based.

The effective staging admin gate used by the running app is:

* **Frontend**: `session.user.app_metadata.role === 'admin'`
* **Backend**: `req.user.role === 'admin'` enforced by `adminOnly`

Sponsor access to booth/media workflows is separate and is based on booth ownership or admin role, not on a generic admin email allowlist.

## What the frontend checks

### `/expo/admin` route

The route exists in the root Vite SPA:

* `src/App.tsx` registers `expo/admin` and renders `CompanyAdmin`

### CompanyAdmin admin/sponsor checks

The `CompanyAdmin` page reads the authenticated session and sets operator/admin state from auth metadata:

* `src/pages/expo/CompanyAdmin.tsx`
* `setIsOperatorAdmin(sessionData.session.user.app_metadata?.role === 'admin')`

That same component gates:

* sponsor asset upload controls
* sponsor public-release controls
* approve / reject / promote actions

If the session is not ready or the user is not admin, the page shows access notices and disables the relevant actions.

## What the backend checks

The media review approve / reject / promote route is protected in two layers:

* `backend-server/routes/api.ts` mounts:
  * `POST /expo/booths/:boothId/media-review-upload` behind `authMiddleware`
  * `PATCH /expo/booths/:boothId/media-review-uploads` behind `adminOnly`
* `backend-server/middleware/authMiddleware.ts` derives `req.user.role` from `user.app_metadata?.role`
* `backend-server/controllers/expoDataController.ts` checks `req.user?.role !== 'admin'` before review actions

So the approve / reject / promote path is effectively admin-only by auth metadata role.

## Which Supabase fields store role / permission data

There are two role-related layers in the repo:

1. **Current runtime admin gate**
   * Supabase Auth JWT `app_metadata.role`
   * This is what the frontend and backend currently read for admin access

2. **Legacy / policy role field**
   * `public.users.role`
   * Present in schema and referenced by older RLS/security policies

Other related fields:

* `user_profiles.company_id` is a company-membership field, not an admin-permission field
* booth ownership checks use `contact_info.owner_user_id`, `contact_info.owner_email`, and `org_id`

## How to safely grant admin access to a staging test account

Use a disposable staging user only.

### Recommended path

1. Open the Supabase Dashboard for the staging project.
2. Go to **Authentication -> Users**.
3. Select the disposable test user.
4. Set the auth metadata role to:

   ```json
   { "role": "admin" }
   ```

5. Sign the user out and back in so the JWT picks up the new metadata.
6. Re-test `/expo/admin` and the CompanyAdmin media review controls.

### Optional legacy alignment

If older RLS or internal tooling still depends on `public.users.role`, mirror the role there as well:

```sql
update public.users
set role = 'admin'
where id = '<auth_uid_here>';
```

Replace `<auth_uid_here>` with the Supabase Auth user UUID for the staging test account.

### Do not use

* `user_profiles.company_id` as an admin grant mechanism
* production users
* email allowlists unless you add them later in code on purpose

## Does admin access use an email allowlist?

No email allowlist was found in the examined `/expo/admin` / CompanyAdmin media-review path.

The current access model is:

* **admin** = auth metadata role
* **sponsor access** = booth ownership / managed-booth lookup
* **legacy policy support** = `public.users.role`

## Practical staging test account setup

For a safe staging test account:

1. Create or choose a disposable staging user.
2. Assign `app_metadata.role = admin`.
3. Optionally set `public.users.role = 'admin'` for compatibility.
4. Ensure the user is signed into the staging domain.
5. Refresh the session and verify `CompanyAdmin` markers appear.

## Audit conclusion

To grant staging admin access for `/expo/admin` and CompanyAdmin media review controls, the repo currently expects the authenticated user to carry `app_metadata.role = 'admin'`. The backend enforces the same role on approve / reject / promote actions. Legacy `public.users.role` still exists, but the runtime gate used by the app is auth metadata plus booth ownership for sponsor-scoped actions.

