/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_BASE_URL?: string;
  readonly VITE_PUBLIC_APP_URL?: string;
  readonly VITE_SIGNALING_SERVER_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_STUN_SERVER_URLS?: string;
  readonly VITE_TURN_SERVER_URLS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_PASSWORD?: string;
  readonly VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS?: string;
  readonly VITE_ENABLE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __WARPALA_ENABLE_DEMO_ROUTES__: boolean;
