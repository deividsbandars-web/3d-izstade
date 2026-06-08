import { isValidExpoScreenSlotId } from './screenInventory.js';

export type ExpoManagedScreenContentMode = 'generated-card' | 'image' | 'video-placeholder';
export type ExpoManagedScreenContentStatus = 'draft' | 'published';
export type ExpoScreenMediaKind = 'image' | 'video';

export type ExpoScreenContentInput = {
  ctaLabel?: unknown;
  imageUrl?: unknown;
  mode?: unknown;
  screenSlotId?: unknown;
  status?: unknown;
  subtitle?: unknown;
  title?: unknown;
  videoUrl?: unknown;
};

export type ExpoScreenContentIssue = {
  field: 'imageUrl' | 'videoUrl' | 'mode' | 'screenSlotId' | 'status' | 'title' | 'subtitle' | 'ctaLabel';
  message: string;
};

export type ExpoScreenContentSavePayload = {
  ctaLabel: string;
  imageUrl: string;
  mode: ExpoManagedScreenContentMode;
  screenSlotId: string;
  status: ExpoManagedScreenContentStatus;
  subtitle: string;
  title: string;
  videoUrl: string;
};

export const EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const;
export const EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS = ['.mp4', '.webm'] as const;
export const EXPO_SCREEN_CONTENT_MAX_URL_LENGTH = 2048;

const LOCAL_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function trimForSave(value: unknown, maxLength: number) {
  return asString(value).replace(/\s+/g, ' ').slice(0, maxLength).trim();
}

export function normalizeExpoManagedScreenMode(value: unknown): ExpoManagedScreenContentMode {
  const normalized = asString(value).toLowerCase();

  if (normalized === 'image') {
    return 'image';
  }

  if (normalized === 'video' || normalized === 'video-placeholder') {
    return 'video-placeholder';
  }

  return 'generated-card';
}

export function normalizeExpoManagedScreenStatus(value: unknown): ExpoManagedScreenContentStatus {
  return asString(value).toLowerCase() === 'published' ? 'published' : 'draft';
}

function getUrlExtension(url: URL) {
  const pathname = url.pathname.toLowerCase();
  const match = pathname.match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

function hasWhitespaceOrControlCharacter(value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 32 || code === 127) {
      return true;
    }
  }

  return false;
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map((part) => Number(part));
  if (octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10
    || first === 127
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 169 && second === 254)
  );
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');

  return (
    LOCAL_HOSTNAMES.has(normalized)
    || normalized.endsWith('.local')
    || normalized.includes(':')
    || isPrivateIpv4(normalized)
  );
}

export function validateExpoScreenMediaUrl(value: unknown, kind: ExpoScreenMediaKind) {
  const rawUrl = asString(value);
  const allowedExtensions = kind === 'image'
    ? EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS
    : EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS;

  if (!rawUrl) {
    return { ok: true as const, reason: '', url: '' };
  }

  if (rawUrl.length > EXPO_SCREEN_CONTENT_MAX_URL_LENGTH) {
    return { ok: false as const, reason: `URL is too long. Keep it under ${EXPO_SCREEN_CONTENT_MAX_URL_LENGTH} characters.`, url: '' };
  }

  if (hasWhitespaceOrControlCharacter(rawUrl)) {
    return { ok: false as const, reason: 'URL cannot contain whitespace or control characters.', url: '' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false as const, reason: 'Use a complete public HTTPS URL.', url: '' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false as const, reason: 'Only HTTPS media URLs are allowed.', url: '' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false as const, reason: 'Media URLs cannot include embedded credentials.', url: '' };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false as const, reason: 'Local, private, or internal hostnames are not allowed.', url: '' };
  }

  const extension = getUrlExtension(parsed);
  if (!allowedExtensions.includes(extension as never)) {
    return {
      ok: false as const,
      reason: `Use ${allowedExtensions.join(', ')} files for ${kind} content.`,
      url: '',
    };
  }

  return { ok: true as const, reason: '', url: parsed.toString() };
}

export function normalizeExpoScreenContentForSave(input: ExpoScreenContentInput = {}) {
  const mode = normalizeExpoManagedScreenMode(input.mode);
  const imageResult = validateExpoScreenMediaUrl(input.imageUrl, 'image');
  const videoResult = validateExpoScreenMediaUrl(input.videoUrl, 'video');
  const screenSlotId = asString(input.screenSlotId);
  const issues: ExpoScreenContentIssue[] = [];

  if (!imageResult.ok) {
    issues.push({ field: 'imageUrl', message: imageResult.reason });
  }

  if (!videoResult.ok) {
    issues.push({ field: 'videoUrl', message: videoResult.reason });
  }

  if (mode === 'image' && !imageResult.url) {
    issues.push({ field: 'imageUrl', message: 'Image mode needs a valid HTTPS image URL.' });
  }

  if (mode === 'video-placeholder' && !videoResult.url) {
    issues.push({ field: 'videoUrl', message: 'Video placeholder mode needs a valid HTTPS .mp4 or .webm URL.' });
  }

  if (screenSlotId && !isValidExpoScreenSlotId(screenSlotId)) {
    issues.push({ field: 'screenSlotId', message: 'Selected screen slot is not in the expo screen inventory.' });
  }

  return {
    issues,
    ok: issues.length === 0,
    screenContent: {
      ctaLabel: trimForSave(input.ctaLabel, 32),
      imageUrl: imageResult.ok ? imageResult.url : '',
      mode,
      screenSlotId: screenSlotId && isValidExpoScreenSlotId(screenSlotId) ? screenSlotId : '',
      status: normalizeExpoManagedScreenStatus(input.status),
      subtitle: trimForSave(input.subtitle, 180),
      title: trimForSave(input.title, 80),
      videoUrl: videoResult.ok ? videoResult.url : '',
    } satisfies ExpoScreenContentSavePayload,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function sanitizeExpoManagedBoothAssets(assets3d: unknown) {
  const assets = asRecord(assets3d);
  const screenContentResult = normalizeExpoScreenContentForSave(asRecord(assets.screen_content));
  const videoResult = validateExpoScreenMediaUrl(assets.video_url, 'video');
  const sanitizedAssets: Record<string, unknown> = { ...assets };

  if (screenContentResult.ok) {
    sanitizedAssets.screen_content = screenContentResult.screenContent;
  } else {
    delete sanitizedAssets.screen_content;
  }

  if (videoResult.ok && videoResult.url) {
    sanitizedAssets.video_url = videoResult.url;
  } else if ('video_url' in sanitizedAssets) {
    sanitizedAssets.video_url = '';
  }

  return sanitizedAssets;
}
