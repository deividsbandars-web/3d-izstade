# Environment Matrix

## Frontend release env

Required in staging and production:

- `VITE_PUBLIC_API_BASE_URL`
- `VITE_SIGNALING_SERVER_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS`

Optional but typed:

- `VITE_STUN_SERVER_URLS`
- `VITE_TURN_SERVER_URLS`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

Rules:

- `VITE_PUBLIC_API_BASE_URL` must be `http` or `https`
- `VITE_SIGNALING_SERVER_URL` must be `ws` or `wss`
- TURN username/password must either both exist or both be absent

## Backend release env

Required:

- `NODE_ENV`
- `PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SIGNALING_STATUS_BASE_URL`
- `PIXEL_STREAMING_STATUS_TIMEOUT_MS`
- `UE5_SECRET_KEY`

Rules:

- `SUPABASE_URL` and `SIGNALING_STATUS_BASE_URL` must be valid `http` or `https` URLs
- `PORT` and `PIXEL_STREAMING_STATUS_TIMEOUT_MS` must be positive numbers
- backend must not fall back to frontend anon credentials
- backend must not fall back to hardcoded shared secrets

## TURN / signaling release env

Required for premium Pixel Streaming operation:

- `TURN_SERVER_URLS`
- `TURN_USERNAME`
- `TURN_PASSWORD`
- `STUN_SERVER_URLS`

Compose contract:

- signaling and coturn services must not start in release mode with `change-me` or other weak fallback credentials
