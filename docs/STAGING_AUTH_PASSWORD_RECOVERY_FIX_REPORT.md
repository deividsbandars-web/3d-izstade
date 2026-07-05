# Staging Auth Password Recovery Fix Report

Date: `2026-06-20`

## Scope

- Target: `https://staging.30sek24.com`
- Goal: add a user-visible forgot-password flow for the existing Supabase email/password login

## What Changed

- `src/pages/Login.tsx`
  - added a `Forgot password?` recovery mode
  - sends a Supabase password-reset email instead of pretending to authenticate
  - now builds the reset redirect from the public app origin instead of the current browser origin outside local dev
  - fails fast if staging/prod does not have a usable public app origin instead of falling back to `localhost`
  - uses a safe neutral message so the UI does not reveal whether the email exists
- `src/pages/ResetPassword.tsx`
  - new reset-password route for the recovery link
  - lets the user set and confirm a new password after opening the email link
  - keeps the user on staging-safe browser flow and does not touch production
- `src/App.tsx`
  - added the `/reset-password` route

## Product Story

- Sign in with email and password.
- If the password is forgotten, request a reset link.
- Open the reset link from email.
- Set a new password on the reset page.

## Validation

- `npm.cmd run build` passed after the new recovery flow was added.
- `npm.cmd run lint` passed after the new recovery flow was added.
- The staging frontend auth client fix and public browser smoke remained green.
- The current staging alias was redeployed with the recovery flow and CDP DOM checks confirmed:
  - `/login?next=/modular-homes/quotes` shows `Forgot password?`
  - `/reset-password?next=/modular-homes/quotes` renders the recovery form on live staging
- The reset redirect now prefers the public app origin derived from the frontend runtime env, so the email link is no longer tied to whichever machine initiated the reset when a canonical app origin is configured.
- If the staging/public app origin is missing, the login flow now fails fast instead of generating a reset link that points to `localhost:3000`.
- No real reset email was sent from this shell, so end-to-end inbox delivery was not claimed.
- Supabase auth config was corrected through the Supabase management API for project `aasovfczmqytdtugcrmh`:
  - `site_url` now points to `https://staging.30sek24.com`
  - `uri_allow_list` now includes `https://staging.30sek24.com/**`
- This was the direct fix for reset links opening `localhost:3000` on another machine.
- Repeated recovery attempts triggered Supabase email throttling, so the current blocker after the config fix is rate limiting rather than a localhost redirect.

## Limits

- I did not send a real reset email from this shell.
- I did not claim live end-to-end email delivery proof.
- I did not mutate production data.
- I did not print cookies, tokens, storage-state contents, or browser profiles.

## Status

- The login flow now exposes a real password-recovery path instead of leaving the user stuck on a failing sign-in screen.
