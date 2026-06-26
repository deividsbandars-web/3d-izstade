# Web3D Expo Release Operations

Smoke check:

1. set `RELEASE_BASE_URL`
2. run `node scripts/release-smoke-check.mjs`
3. verify `/health` and `/api/expo/scene`
4. if you are operating the optional legacy runtime stack, verify `/api/pixel-streaming/status` separately

Rollback procedure:

1. redeploy previous frontend build
2. restore previous backend release
3. clear CDN/browser cache if scene contract changed
4. verify smoke checks before reopening traffic

Cache procedure:

1. bump frontend release build
2. invalidate service worker/browser cache on deploy verification
3. verify fresh `/api/expo/scene` payload after deploy

Theme audit:

1. fetch live `/api/expo/scene`
2. run `RELEASE_BASE_URL=https://your-release-host node scripts/audit-expo-scene-theme-mapping.mjs`
3. verify fallback rate is acceptable and no priority district falls back unintentionally
4. verify sector naming changes did not collapse to neutral theme

Visual wow gate:

1. capture spawn screenshots in `16:9`, `16:10`, and ultrawide
2. capture both standing entry and slightly elevated preview angles
3. capture boulevard midpoint, sector transition, and hero booth zone views
4. compare balanced vs quality screenshots side by side
5. verify skyline anchors, arrival silhouette, and sponsor surfaces remain legible

Spatial UX gate:

1. walk the main boulevard and confirm booth entry space stays clear
2. verify district anchors do not block approach paths or focal sponsor surfaces
3. verify gateway/signage remains readable from the player path
4. verify no landmark or anchor causes accidental hero booth occlusion

Performance gate:

1. measure first meaningful render and time to interactive movement
2. capture average FPS, 1% low FPS, and memory footprint
3. test at least a mid laptop, strong desktop, and conservative corporate machine
4. compare balanced vs quality and verify performance mode remains safe

