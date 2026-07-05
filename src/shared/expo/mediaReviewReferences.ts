import {
  EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
  EXPO_SCREEN_CONTENT_MAX_URL_LENGTH,
  EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
  validateExpoScreenMediaUrl,
} from './screenContentMedia.js';
import {
  normalizeExpoMediaReviewUploadRecords,
  type ExpoMediaReviewUploadRecord,
} from './mediaReviewUpload.js';

export type ExpoMediaReviewReferencesInput = {
  bookingUrl?: unknown;
  ctaLabel?: unknown;
  heroImageUrl?: unknown;
  heroVideoUrl?: unknown;
  logoUrl?: unknown;
  mediaNotes?: unknown;
  posterUrl?: unknown;
  tagline?: unknown;
  uploads?: unknown;
  websiteUrl?: unknown;
};

export type ExpoMediaReviewReferencesIssue = {
  field:
    | 'bookingUrl'
    | 'ctaLabel'
    | 'heroImageUrl'
    | 'heroVideoUrl'
    | 'logoUrl'
    | 'mediaNotes'
    | 'posterUrl'
    | 'tagline'
    | 'websiteUrl';
  message: string;
};

export type ExpoMediaReviewReferencesSavePayload = {
  bookingUrl: string;
  ctaLabel: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  logoUrl: string;
  mediaNotes: string;
  posterUrl: string;
  tagline: string;
  uploads: ExpoMediaReviewUploadRecord[];
  websiteUrl: string;
};

const LOCAL_HOSTNAMES = new Set(['localhost', '0.0.0.0']);

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function trimForSave(value: unknown, maxLength: number) {
  return asString(value).replace(/\s+/g, ' ').slice(0, maxLength).trim();
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

function validateHttpsUrl(value: unknown, label: string, allowedExtensions?: readonly string[]) {
  const rawUrl = asString(value);

  if (!rawUrl) {
    return { ok: true as const, reason: '', url: '' };
  }

  if (rawUrl.length > EXPO_SCREEN_CONTENT_MAX_URL_LENGTH) {
    return { ok: false as const, reason: `${label} URL is too long. Keep it under ${EXPO_SCREEN_CONTENT_MAX_URL_LENGTH} characters.`, url: '' };
  }

  if (hasWhitespaceOrControlCharacter(rawUrl)) {
    return { ok: false as const, reason: `${label} URL cannot contain whitespace or control characters.`, url: '' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false as const, reason: `Use a complete public HTTPS URL for ${label}.`, url: '' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false as const, reason: `Only HTTPS URLs are allowed for ${label}.`, url: '' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false as const, reason: `${label} URLs cannot include embedded credentials.`, url: '' };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false as const, reason: `Local, private, or internal hostnames are not allowed for ${label}.`, url: '' };
  }

  if (allowedExtensions?.length) {
    const extension = getUrlExtension(parsed);
    if (!allowedExtensions.includes(extension)) {
      return { ok: false as const, reason: `Use ${allowedExtensions.join(', ')} files for ${label}.`, url: '' };
    }
  }

  return { ok: true as const, reason: '', url: parsed.toString() };
}

export function normalizeExpoMediaReviewReferencesForSave(input: ExpoMediaReviewReferencesInput = {}) {
  const issues: ExpoMediaReviewReferencesIssue[] = [];
  const logoResult = validateExpoScreenMediaUrl(input.logoUrl, 'image');
  const posterResult = validateExpoScreenMediaUrl(input.posterUrl, 'image');
  const heroImageResult = validateExpoScreenMediaUrl(input.heroImageUrl, 'image');
  const heroVideoResult = validateExpoScreenMediaUrl(input.heroVideoUrl, 'video');
  const websiteResult = validateHttpsUrl(input.websiteUrl, 'website');
  const bookingResult = validateHttpsUrl(input.bookingUrl, 'booking link');

  if (!logoResult.ok) {
    issues.push({ field: 'logoUrl', message: logoResult.reason });
  }

  if (!posterResult.ok) {
    issues.push({ field: 'posterUrl', message: posterResult.reason });
  }

  if (!heroImageResult.ok) {
    issues.push({ field: 'heroImageUrl', message: heroImageResult.reason });
  }

  if (!heroVideoResult.ok) {
    issues.push({ field: 'heroVideoUrl', message: heroVideoResult.reason });
  }

  if (!websiteResult.ok) {
    issues.push({ field: 'websiteUrl', message: websiteResult.reason });
  }

  if (!bookingResult.ok) {
    issues.push({ field: 'bookingUrl', message: bookingResult.reason });
  }

  return {
    issues,
    ok: issues.length === 0,
    mediaReview: {
      bookingUrl: bookingResult.ok ? bookingResult.url : '',
      ctaLabel: trimForSave(input.ctaLabel, 32),
      heroImageUrl: heroImageResult.ok ? heroImageResult.url : '',
      heroVideoUrl: heroVideoResult.ok ? heroVideoResult.url : '',
      logoUrl: logoResult.ok ? logoResult.url : '',
      mediaNotes: trimForSave(input.mediaNotes, 320),
      posterUrl: posterResult.ok ? posterResult.url : '',
      tagline: trimForSave(input.tagline, 140),
      uploads: normalizeExpoMediaReviewUploadRecords(input.uploads),
      websiteUrl: websiteResult.ok ? websiteResult.url : '',
    } satisfies ExpoMediaReviewReferencesSavePayload,
  };
}

export function readExpoMediaReviewReferencesFromAssets(assets3d: unknown) {
  const assets = asRecord(assets3d);
  const rawMediaReview = asRecord(assets.media_review || assets.mediaReview);
  return normalizeExpoMediaReviewReferencesForSave({
    bookingUrl: rawMediaReview.bookingUrl || rawMediaReview.booking_url,
    ctaLabel: rawMediaReview.ctaLabel || rawMediaReview.cta_label,
    heroImageUrl: rawMediaReview.heroImageUrl || rawMediaReview.hero_image_url,
    heroVideoUrl: rawMediaReview.heroVideoUrl || rawMediaReview.hero_video_url,
    logoUrl: rawMediaReview.logoUrl || rawMediaReview.logo_url,
    mediaNotes: rawMediaReview.mediaNotes || rawMediaReview.media_notes,
    posterUrl: rawMediaReview.posterUrl || rawMediaReview.poster_url,
    tagline: rawMediaReview.tagline,
    uploads: rawMediaReview.uploads,
    websiteUrl: rawMediaReview.websiteUrl || rawMediaReview.website_url,
  }).mediaReview;
}

export const EXPO_MEDIA_REVIEW_REFERENCE_POLICY_TEXT = [
  `Images: ${EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS.join(', ')}`,
  `Videos: ${EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}`,
  'Direct public HTTPS references only',
].join('. ');
