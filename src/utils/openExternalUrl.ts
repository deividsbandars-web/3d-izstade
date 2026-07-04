export type ExternalWindowOpen = (url?: string | URL, target?: string, features?: string) => Window | null;

export function normalizeExternalHttpUrl(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function openExternalUrl(
  value: unknown,
  openWindow: ExternalWindowOpen | null | undefined = typeof window !== 'undefined' ? window.open.bind(window) : null,
) {
  const url = normalizeExternalHttpUrl(value);
  if (!url || !openWindow) {
    return false;
  }

  openWindow(url, '_blank', 'noopener,noreferrer');
  return true;
}
