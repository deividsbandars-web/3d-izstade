# Staging Auth/Profile Bootstrap Live Validation Report

## Verdict
PASS WITH WARNINGS

## What Was Validated

- The affected staging account can log in through `/login?next=/expo/admin`.
- The signed-in browser reaches `/expo/admin`.
- The account chip shows the expected ADMIN role marker for the affected account.
- `LOGOUT` is visible and `LOGIN` is hidden after sign-in.
- The browser flow uses `POST /api/auth/bootstrap`.
- The protected backend bearer replay returns `200` for `/api/expo/booths/managed`.
- The no-token probe for the protected route still returns `401`.
- A fresh staging registration shows the intended confirmation UX when sign-up does not immediately establish a session.
- The browser network trace did not show direct browser writes to `companies` or `user_profiles`.

## Validation Evidence

- Repo build passed.
- Repo lint passed with the same pre-existing warnings already present in the repository.
- Backend build passed.
- Staging backend smoke passed with `/health -> 200` and `/api/expo/scene -> 200`.
- `/api/expo/scene` continued to report `authPolicy -> public-readonly` and omit `expo_review_media`.

## Remaining Warnings

- Existing repository lint warnings remain.
- The browser smoke still reports the benign PWA icon warning for `pwa-192x192.png`.

## Conclusion

- The staging auth/profile bootstrap fix is live and validated in the browser.
