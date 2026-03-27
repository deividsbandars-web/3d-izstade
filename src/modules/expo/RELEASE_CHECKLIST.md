# Expo Sponsor Boulevard Release Checklist

- Backend failure does not produce an empty walkable scene.
- Sponsor booths still render with fallback shell, fallback CTA, and non-broken poster/logo areas when sponsor assets are missing.
- No `Big Buck Bunny`, `test-videos.co.uk`, or placeholder image/video URLs are active in the release path.
- Sponsor boulevard layout is deterministic across reloads.
- Pointer lock can be exited safely with `Esc`.
- Scene remains usable on mid-range hardware with multiple booths visible.
- Debug mode is off by default in production-safe runtime config.
- Static city backdrop remains active and procedural city generation is not in the release path.
