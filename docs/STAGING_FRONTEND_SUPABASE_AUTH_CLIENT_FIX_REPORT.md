# Staging Frontend Supabase Auth Client Fix Report

Date: `2026-06-20`

## Scope

- Target: `https://staging.30sek24.com`
- Supabase project ref: `aasovfczmqytdtugcrmh`
- Goal: make browser login send the required Supabase anon key and fail clearly if the browser auth env is missing

## Root Cause

- The browser auth flow depended on a separate frontend Supabase client path that could fall back to dummy values instead of the real staging env.
- That allowed the active MVP to reach Supabase Auth without the expected browser `apikey` header when the staging bundle/env state was wrong.
- The shared frontend runtime resolver also still contained dummy Supabase fallback values, which made the browser config story harder to reason about.

## Fix Applied

- `src/lib/supabaseClient.ts`
  - removed the dummy Supabase fallback behavior
  - uses the shared frontend runtime env for browser builds so the auth client reads the same canonical `VITE_*` env object as the rest of the app
  - falls back to `process.env` only for Node-side imports that are not the browser runtime
  - creates the real browser client only when the required env is present
  - otherwise exposes a clear `Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for this environment.` error in the browser path
- `src/lib/supabaseClient.js`
  - kept in sync with the TypeScript source for any JS-importing paths
- `src/core/supabase.ts`
  - continues to re-export the canonical browser auth client
- `src/pages/Login.tsx`
  - now surfaces the auth configuration error directly
  - only runs backend bootstrap after a real session exists
  - no longer shows misleading registration success when sign-up does not establish a session
- `src/config/runtimeEnv.ts`
  - removed the stale dummy Supabase fallback values from the shared frontend env resolver
  - added a shared `resolveFrontendSupabaseAuthEnv()` helper for browser Supabase client initialization
  - now also derives a public app origin when `VITE_PUBLIC_APP_URL` is present or when the app origin can be inferred from `VITE_PUBLIC_API_BASE_URL`
  - the shared runtime env now requires real Supabase values instead of silently substituting a placeholder
- `src/pages/Login.tsx`
  - the password reset redirect now fails fast outside local dev if no usable public app origin is configured
- `src/__tests__/runtimeEnv.test.ts`
  - updated to reflect the stricter no-dummy behavior

## Client / Env Table

| file | client source | env source | used by login? | safe/canonical? | action required |
| --- | --- | --- | --- | --- | --- |
| `src/lib/supabaseClient.ts` | browser Supabase client via `getFrontendRuntimeEnv()` | `VITE_PUBLIC_API_BASE_URL`, `VITE_PUBLIC_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | yes | yes | keep browser auth on the canonical runtime env path |
| `src/lib/supabaseClient.ts` | Node-side fallback for non-browser imports | `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `process.env` | no | yes for server-side imports only | keep explicit so backend smoke does not fail on browser-only env |
| `src/pages/Login.tsx` | shared auth client from `src/core/supabase.ts` | same as `src/lib/supabaseClient.ts` | yes | yes | validate a real authenticated browser session |
| `src/config/runtimeEnv.ts` | shared frontend env resolver | `VITE_PUBLIC_API_BASE_URL`, `VITE_PUBLIC_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | indirect | yes | keep canonical and fail fast when missing |

## Validation

- `npm.cmd run build` passed.
- `npm.cmd run lint` passed.
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/smoke-backend-supabase.mjs` passed after the auth-client change was restored to a browser-safe path.
- `powershell.exe -ExecutionPolicy Bypass -File scripts/run-with-doppler.ps1 run -- node scripts/check-modular-home-quote-staging.mjs --json` passed and cleaned up the disposable smoke quote row.
- `npm.cmd run deploy:staging:preview` completed and produced `https://app-staging-kmk61bfgo-esaukans-6934s-projects.vercel.app`.
- `npm.cmd run promote:staging -- https://app-staging-kmk61bfgo-esaukans-6934s-projects.vercel.app` promoted the fixed bundle to `https://staging.30sek24.com`.
- `npm.cmd run check:expo-staging-browser-smoke -- --base-url=https://staging.30sek24.com --json` passed on the promoted bundle.
- The browser smoke confirmed the live staging bundle is the cleaned product story and includes the `Open Modular Homes` CTA.
- CDP browser checks on the promoted staging alias confirmed the live login route now renders `Forgot password?` and the `/reset-password` recovery route renders its form.
- Supabase auth config for project `aasovfczmqytdtugcrmh` was verified through the management API and now uses the staging site URL instead of `localhost:3000`.
- Vercel preview/production env inspection did not show a missing public app URL as the root cause for the reset redirect; the issue was in Supabase auth config.
- Live browser network proof captured a `POST https://aasovfczmqytdtugcrmh.supabase.co/auth/v1/token?grant_type=refresh_token` request with `apikey` and `authorization` headers present.
- The live refresh-token request did not return the earlier `No API key found in request` failure.
- A disposable duplicate-registration probe produced `400` on the first submit and `429` on the second submit, so the UI must stay neutral instead of claiming a deterministic "already exists" result.

## What I Could Not Prove Here

- I did not test a real customer email or password.
- I did not mutate staging data.
- I did not print or commit any cookies, tokens, storage-state contents, browser profiles, or auth secret values.

## Current Status

- The staging frontend now uses a strict browser Supabase auth client instead of a dummy fallback.
- The live staging alias was redeployed with the fix.
- Public staging smoke is green.
- Authenticated browser-admin validation for `/modular-homes/quotes` is complete on a live staging browser session.
