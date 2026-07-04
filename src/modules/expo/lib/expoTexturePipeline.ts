const EXPO_SOURCE_PREFIX = '/textures/expo/';
const EXPO_RUNTIME_PREFIX = '/textures/expo-runtime/';

function isSourceTextureFallbackEnabled() {
  return Boolean(import.meta.env?.DEV && import.meta.env?.VITE_EXPO_ALLOW_SOURCE_TEXTURE_FALLBACK === '1');
}

export function isExpoPipelineTextureUrl(url: string | null | undefined) {
  return typeof url === 'string' && url.startsWith(EXPO_SOURCE_PREFIX) && url.toLowerCase().endsWith('.png');
}

export function resolveExpoRuntimeTextureUrl(url: string | null | undefined) {
  if (!isExpoPipelineTextureUrl(url)) {
    return url;
  }

  const normalizedUrl = String(url);

  return normalizedUrl
    .replace(EXPO_SOURCE_PREFIX, EXPO_RUNTIME_PREFIX)
    .replace(/\.png$/i, '.webp');
}

export function resolveExpoTextureCandidateUrls(url: string | null | undefined) {
  if (!url) {
    return [];
  }

  const runtimeUrl = resolveExpoRuntimeTextureUrl(url);
  if (!runtimeUrl || runtimeUrl === url) {
    return [url];
  }

  return isSourceTextureFallbackEnabled() ? [runtimeUrl, url] : [runtimeUrl];
}
