import {
  EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
  EXPO_SCREEN_CONTENT_MAX_URL_LENGTH,
  EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
  validateExpoScreenMediaUrl,
} from './screenContentMedia.js';

export type ExpoSponsorPackageTier = 'standard' | 'premium' | 'landmarkZone';

export type ExpoSponsorAssetPackInput = {
  brochureUrl?: unknown;
  ctaPrimary?: unknown;
  ctaSecondary?: unknown;
  demoVideoUrl?: unknown;
  headline?: unknown;
  heroImageUrl?: unknown;
  logoUrl?: unknown;
  packageTier?: unknown;
  productImageUrls?: unknown;
  shortPitch?: unknown;
  websiteUrl?: unknown;
};

export type ExpoSponsorAssetPackIssue = {
  field:
    | 'brochureUrl'
    | 'ctaPrimary'
    | 'ctaSecondary'
    | 'demoVideoUrl'
    | 'headline'
    | 'heroImageUrl'
    | 'logoUrl'
    | 'packageTier'
    | 'productImageUrls'
    | 'shortPitch'
    | 'websiteUrl';
  message: string;
};

export type ExpoSponsorAssetPackSavePayload = {
  brochureUrl: string;
  ctaPrimary: string;
  ctaSecondary: string;
  demoVideoUrl: string;
  headline: string;
  heroImageUrl: string;
  logoUrl: string;
  packageTier: ExpoSponsorPackageTier;
  productImageUrls: string[];
  shortPitch: string;
  websiteUrl: string;
};

export type ExpoSponsorAssetPackReadiness = {
  clientFriendlyReady: boolean;
  hasBrochure: boolean;
  hasDemoVideo: boolean;
  hasHeroImage: boolean;
  hasLogo: boolean;
  hasWebsite: boolean;
  issueCount: number;
  packageTier: ExpoSponsorPackageTier;
  productImageCount: number;
  readyAssetCount: number;
};

export const EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT = 6;
export const EXPO_SPONSOR_ASSET_PACK_BROCHURE_EXTENSIONS = ['.pdf'] as const;

const LOCAL_HOSTNAMES = new Set(['localhost', '0.0.0.0']);
const VALID_PACKAGE_TIERS = new Set<ExpoSponsorPackageTier>(['standard', 'premium', 'landmarkZone']);

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

function normalizeSponsorPackageTier(value: unknown): ExpoSponsorPackageTier {
  const normalized = asString(value);
  return VALID_PACKAGE_TIERS.has(normalized as ExpoSponsorPackageTier)
    ? normalized as ExpoSponsorPackageTier
    : 'standard';
}

function splitProductImageUrls(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value
    : asString(value).split(/[\n,]+/);

  return rawValues
    .map((entry) => asString(entry))
    .filter(Boolean);
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

export function normalizeExpoSponsorAssetPackForSave(input: ExpoSponsorAssetPackInput = {}) {
  const issues: ExpoSponsorAssetPackIssue[] = [];
  const packageTier = normalizeSponsorPackageTier(input.packageTier);
  const logoResult = validateExpoScreenMediaUrl(input.logoUrl, 'image');
  const heroImageResult = validateExpoScreenMediaUrl(input.heroImageUrl, 'image');
  const demoVideoResult = validateExpoScreenMediaUrl(input.demoVideoUrl, 'video');
  const brochureResult = validateHttpsUrl(input.brochureUrl, 'brochure PDF', EXPO_SPONSOR_ASSET_PACK_BROCHURE_EXTENSIONS);
  const websiteResult = validateHttpsUrl(input.websiteUrl, 'website');
  const productImageInputs = splitProductImageUrls(input.productImageUrls);
  const productImageUrls: string[] = [];

  if (!logoResult.ok) {
    issues.push({ field: 'logoUrl', message: logoResult.reason });
  }

  if (!heroImageResult.ok) {
    issues.push({ field: 'heroImageUrl', message: heroImageResult.reason });
  }

  if (!demoVideoResult.ok) {
    issues.push({ field: 'demoVideoUrl', message: demoVideoResult.reason });
  }

  if (!brochureResult.ok) {
    issues.push({ field: 'brochureUrl', message: brochureResult.reason });
  }

  if (!websiteResult.ok) {
    issues.push({ field: 'websiteUrl', message: websiteResult.reason });
  }

  if (productImageInputs.length > EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT) {
    issues.push({
      field: 'productImageUrls',
      message: `Use up to ${EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT} product image URLs in one sponsor asset pack.`,
    });
  }

  productImageInputs.slice(0, EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT).forEach((url, index) => {
    const result = validateExpoScreenMediaUrl(url, 'image');
    if (!result.ok) {
      issues.push({ field: 'productImageUrls', message: `Product image ${index + 1}: ${result.reason}` });
      return;
    }

    if (result.url && !productImageUrls.includes(result.url)) {
      productImageUrls.push(result.url);
    }
  });

  return {
    assetPack: {
      brochureUrl: brochureResult.ok ? brochureResult.url : '',
      ctaPrimary: trimForSave(input.ctaPrimary, 32),
      ctaSecondary: trimForSave(input.ctaSecondary, 32),
      demoVideoUrl: demoVideoResult.ok ? demoVideoResult.url : '',
      headline: trimForSave(input.headline, 80),
      heroImageUrl: heroImageResult.ok ? heroImageResult.url : '',
      logoUrl: logoResult.ok ? logoResult.url : '',
      packageTier,
      productImageUrls,
      shortPitch: trimForSave(input.shortPitch, 220),
      websiteUrl: websiteResult.ok ? websiteResult.url : '',
    } satisfies ExpoSponsorAssetPackSavePayload,
    issues,
    ok: issues.length === 0,
  };
}

export function readExpoSponsorAssetPackFromAssets(assets3d: unknown) {
  const assets = asRecord(assets3d);
  const rawAssetPack = asRecord(assets.sponsor_asset_pack || assets.sponsorAssetPack);
  return normalizeExpoSponsorAssetPackForSave({
    brochureUrl: rawAssetPack.brochureUrl || rawAssetPack.brochure_url,
    ctaPrimary: rawAssetPack.ctaPrimary || rawAssetPack.cta_primary,
    ctaSecondary: rawAssetPack.ctaSecondary || rawAssetPack.cta_secondary,
    demoVideoUrl: rawAssetPack.demoVideoUrl || rawAssetPack.demo_video_url,
    headline: rawAssetPack.headline,
    heroImageUrl: rawAssetPack.heroImageUrl || rawAssetPack.hero_image_url,
    logoUrl: rawAssetPack.logoUrl || rawAssetPack.logo_url,
    packageTier: rawAssetPack.packageTier || rawAssetPack.package_tier,
    productImageUrls: rawAssetPack.productImageUrls || rawAssetPack.product_image_urls,
    shortPitch: rawAssetPack.shortPitch || rawAssetPack.short_pitch,
    websiteUrl: rawAssetPack.websiteUrl || rawAssetPack.website_url,
  }).assetPack;
}

export function getExpoSponsorAssetPackReadiness(input: ExpoSponsorAssetPackInput = {}): ExpoSponsorAssetPackReadiness {
  const result = normalizeExpoSponsorAssetPackForSave(input);
  const { assetPack } = result;
  const readyAssetCount = [
    assetPack.logoUrl,
    assetPack.heroImageUrl,
    assetPack.demoVideoUrl,
    assetPack.brochureUrl,
    assetPack.websiteUrl,
    ...assetPack.productImageUrls,
  ].filter(Boolean).length;

  return {
    clientFriendlyReady: result.ok && readyAssetCount > 0 && Boolean(assetPack.headline || assetPack.shortPitch),
    hasBrochure: Boolean(assetPack.brochureUrl),
    hasDemoVideo: Boolean(assetPack.demoVideoUrl),
    hasHeroImage: Boolean(assetPack.heroImageUrl),
    hasLogo: Boolean(assetPack.logoUrl),
    hasWebsite: Boolean(assetPack.websiteUrl),
    issueCount: result.issues.length,
    packageTier: assetPack.packageTier,
    productImageCount: assetPack.productImageUrls.length,
    readyAssetCount,
  };
}

export const EXPO_SPONSOR_ASSET_PACK_MEDIA_POLICY_TEXT = [
  `Images: ${EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS.join(', ')}`,
  `Videos: ${EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}`,
  `Brochure: ${EXPO_SPONSOR_ASSET_PACK_BROCHURE_EXTENSIONS.join(', ')}`,
  'Direct public HTTPS URLs only',
].join('. ');
