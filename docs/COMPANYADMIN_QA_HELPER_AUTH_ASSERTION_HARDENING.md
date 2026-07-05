# CompanyAdmin QA Helper Auth Assertion Hardening

## What Changed

- The signed-in CompanyAdmin browser QA helper now treats admin mode as a real authenticated session check, not just a route render check.
- Admin QA now requires:
  - `LOGIN` hidden
  - `LOGOUT` visible
  - `SIGN IN REQUIRED` absent
  - `Access denied` absent
  - an actual current-account chip
  - an `ADMIN` role marker in the current-account chip or account summary when the UI exposes it

## Why

- Earlier helper runs could incorrectly report `PASS (admin)` when the page was only rendering the shell or a login-required state.
- The current staging auth UX now exposes a visible account chip and logout control, so the helper should treat those as required evidence of a signed-in admin session.

## Expected Behavior

- Sponsor QA remains focused on sponsor-visible controls and hidden admin actions.
- Admin QA only passes when the browser session is actually signed in as admin.
- If the page shows `SIGN IN REQUIRED`, `LOGIN`, or no logout control, admin QA fails.

## Validation Summary

- Build and lint remained green.
- The backend smoke remained green.
- The helper now has a stricter admin assertion path.
- A positive admin storage-state replay was not available in this shell, so only the safe negative path could be exercised locally here.

## Operational Note

- The helper still does not mutate data.
- The helper still does not print storage-state contents or secrets.
- The helper still expects non-committed storage-state files outside the repo for real signed-in validation.
