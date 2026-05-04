## Doppler Vercel / Supabase Integration Plan

Date: `2026-04-29`

### Confirmed local facts

#### Vercel

Repo is linked to Vercel project:
- project name: `app`
- project id: `prj_KwOh0cg4WbmQcUqLyB4yeYUNgyFQ`

Source:
- [project.json](/C:/3d/.vercel/project.json)

Vercel routing/build contract exists here:
- [vercel.json](/C:/3d/vercel.json)

#### Supabase

Local linked Supabase project ref:
- `gbmxrposlrhctyaaznmj`

Source:
- [project-ref](/C:/3d/supabase/.temp/project-ref)

Supabase edge functions in this repo do use runtime secrets:
- [create-checkout-session/index.ts](/C:/3d/supabase/functions/create-checkout-session/index.ts)
- [stripe-webhook/index.ts](/C:/3d/supabase/functions/stripe-webhook/index.ts)

This means Supabase integration is not theoretical here. It has real value for edge-function secret sync.

### Official integration capabilities

Official docs confirm:
- Doppler supports automatic sync to Vercel
- Vercel requires a separate integration per environment
- Doppler supports automatic sync to Supabase projects

References:
- https://docs.doppler.com/docs/vercel
- https://docs.doppler.com/docs/supabase

### What should be integrated first

#### 1. Vercel first

Reason:
- Vercel is already the deployment control plane for the main app.
- You already care about `Production`, and likely `Preview`.
- Doppler maps cleanly to Vercel environments:
  - `dev` -> `Development`
  - `stg` -> `Preview`
  - `prd` -> `Production`

This is the cleanest place to make Doppler the source of truth first.

#### 2. Supabase second

Reason:
- Supabase integration is useful mainly for edge-function secrets.
- It should only be enabled after environment ownership is clear.

### Important blockers before Supabase sync

#### Blocker A: only one linked Supabase project is visible locally

Current local evidence shows one Supabase project ref only:
- `gbmxrposlrhctyaaznmj`

If this is your production Supabase project, do not sync `stg` into the same target.

You need to know:
- production Supabase project ref
- staging Supabase project ref, if staging is supposed to be isolated

#### Blocker B: naming mismatch for Supabase edge functions

Main app / backend server currently use:
- `STRIPE_SECRET`
- `SUPABASE_SERVICE_KEY`

Supabase edge functions currently use:
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Relevant files:
- [runtimeEnv.ts](/C:/3d/backend-server/config/runtimeEnv.ts)
- [create-checkout-session/index.ts](/C:/3d/supabase/functions/create-checkout-session/index.ts)
- [stripe-webhook/index.ts](/C:/3d/supabase/functions/stripe-webhook/index.ts)

This means Doppler sync to Supabase cannot be treated as a naive mirror of the app keys.

You have two safe options:
- keep duplicate keys in Doppler for Supabase compatibility
- later normalize naming in code

For now, duplicate keys is the lower-risk option.

### Recommended environment mapping

#### Vercel

- Doppler `dev` -> Vercel `Development`
- Doppler `stg` -> Vercel `Preview`
- Doppler `prd` -> Vercel `Production`

#### Supabase

If you have separate Supabase projects:
- Doppler `stg` -> staging Supabase project
- Doppler `prd` -> production Supabase project

If you only have one Supabase project right now:
- sync only the environment that actually owns that project
- do not pretend `stg` is isolated if it is not

### Recommended execution order

1. Fill Doppler `stg`
2. Fill Doppler `prd`
3. Connect Doppler to Vercel for all three environments
4. Verify Vercel deploys read the synced env
5. Identify staging vs production Supabase project ownership
6. Add Supabase integration only for the correct project/config pair
7. Add compatibility duplicates for:
   - `STRIPE_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Practical recommendation

Use Doppler as the source of truth.

But do it in this order:
- Vercel first
- Supabase second

That gives you immediate value with low ambiguity, while avoiding accidental staging/production secret crossover inside Supabase.
