# Web3D Expo Release Operations

Smoke check:

1. set `RELEASE_BASE_URL`
2. run `node scripts/release-smoke-check.mjs`
3. verify `/health`, `/api/expo/scene`, and `/api/pixel-streaming/status`

Rollback procedure:

1. redeploy previous frontend build
2. restore previous backend release
3. clear CDN/browser cache if scene contract changed
4. verify smoke checks before reopening traffic

Cache procedure:

1. bump frontend release build
2. invalidate service worker/browser cache on deploy verification
3. verify fresh `/api/expo/scene` payload after deploy
