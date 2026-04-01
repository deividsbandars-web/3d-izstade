import type { ExpoSceneBooth, ExpoSceneCompany, SponsorTier } from '../types/scene';

export type SponsorBoothTemplate =
  | 'hero_gallery'
  | 'hero_forum'
  | 'premium_portal'
  | 'premium_spine'
  | 'standard_arcade'
  | 'standard_studio';
export type SponsorCtaKind = 'website' | 'booking' | 'demo_room';

export type SponsorCta = {
  disabled?: boolean;
  kind: SponsorCtaKind;
  label: string;
  url?: string | null;
};

export type SponsorCtaIntent =
  | { type: 'navigate'; target: string }
  | { type: 'external'; target: string }
  | null;

export type SponsorBoothPresentation = {
  actions: SponsorCta[];
  badgeLabel: string;
  bookingUrl: string | null;
  customInsertUrl: string | null;
  demoRoomPath: string;
  displayName: string;
  fallbackIdentity: {
    eyebrow: string;
    headline: string;
    monogram: string;
    supportLine: string;
  };
  hasBrandAssets: boolean;
  logoUrl: string | null;
  posterUrl: string | null;
  sponsorTier: SponsorTier;
  tagline: string | null;
  template: SponsorBoothTemplate;
  videoUrl: string | null;
  website: string | null;
};

function normalizeUrl(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isPlaceholderMediaUrl(value: string | null) {
  if (!value) {
    return false;
  }

  return /big[\s_-]*buck[\s_-]*bunny|test-videos\.co\.uk|sample-videos\.com|samplelib\.com|via\.placeholder\.com|placehold\.co|dummyimage\.com/i.test(value);
}

function normalizeReleaseUrl(value: unknown) {
  const normalized = normalizeUrl(value);
  if (!normalized || isPlaceholderMediaUrl(normalized)) {
    return null;
  }

  return normalized;
}

export function truncateSponsorText(value: string | null | undefined, maxLength = 24) {
  const normalized = String(value || '').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getSponsorNameFontSize(name: string) {
  if (name.length > 26) {
    return 1.05;
  }
  if (name.length > 18) {
    return 1.2;
  }
  return 1.35;
}

function buildMonogram(name: string) {
  const parts = name
    .split(/[\s&/+-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'SP';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function buildFallbackIdentity(
  company: ExpoSceneCompany,
  booth: ExpoSceneBooth | null,
  displayName: string
) {
  const companyRecord = company as unknown as Record<string, unknown>;
  const boothRecord = booth as unknown as Record<string, unknown> | null;
  const sectorLine = truncateSponsorText(String(companyRecord.sectorName || boothRecord?.sectorName || 'Expo District'), 28) || 'Expo District';
  const tierLine = String(company.sponsorTier || 'standard').toUpperCase();
  const sourceTagline = truncateSponsorText(company.tagline || String(boothRecord?.tagline || '') || 'Live demos and guided product sessions.', 44);

  return {
    eyebrow: `${tierLine} • ${sectorLine}`.toUpperCase(),
    headline: truncateSponsorText(displayName, 24).toUpperCase(),
    monogram: buildMonogram(displayName),
    supportLine: sourceTagline || 'LIVE DEMOS • TEAM MEETUPS • PRODUCT STORIES',
  };
}

export function pickSponsorBoothTemplate({
  boothType,
  districtThemeId,
  nodeType,
  sponsorTier,
}: {
  boothType?: string | null;
  districtThemeId?: string | null;
  nodeType?: string | null;
  sponsorTier?: SponsorTier | null;
}): SponsorBoothTemplate {
  const normalizedTheme = String(districtThemeId || '').trim().toLowerCase();
  if (nodeType === 'hero_left' || nodeType === 'hero_right' || sponsorTier === 'hero' || boothType === 'hero') {
    return normalizedTheme.includes('meeting') ? 'hero_forum' : 'hero_gallery';
  }

  if (nodeType === 'endcap' || boothType === 'premium' || sponsorTier === 'platinum' || sponsorTier === 'gold') {
    return normalizedTheme.includes('design') || normalizedTheme.includes('platform') ? 'premium_spine' : 'premium_portal';
  }

  return normalizedTheme.includes('platform') || normalizedTheme.includes('meeting') ? 'standard_arcade' : 'standard_studio';
}

export function buildSponsorCtas(company: ExpoSceneCompany): SponsorCta[] {
  const actions: SponsorCta[] = [];
  const website = normalizeUrl(company.website);
  const booking = normalizeUrl(company.bookingUrl);

  actions.push(website
    ? { kind: 'website', label: 'Visit', url: website }
    : { kind: 'website', label: 'Visit', disabled: true, url: null });

  actions.push(booking
    ? { kind: 'booking', label: company.ctaLabel || 'Meet', url: booking }
    : { kind: 'booking', label: 'Meet', disabled: true, url: null });

  actions.push({ kind: 'demo_room', label: 'Enter' });
  return actions;
}

export function resolveSponsorCtaIntent(
  action: SponsorCta,
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath'>
): SponsorCtaIntent {
  if (action.disabled) {
    return null;
  }

  if (action.kind === 'demo_room') {
    return { type: 'navigate', target: presentation.demoRoomPath };
  }

  if ((action.kind === 'website' || action.kind === 'booking') && normalizeUrl(action.url)) {
    return { type: 'external', target: normalizeUrl(action.url)! };
  }

  return null;
}

function pickCustomInsertUrl(company: ExpoSceneCompany, booth: ExpoSceneBooth | null) {
  const preferred = normalizeReleaseUrl(booth?.model_url) || normalizeReleaseUrl(company.heroAssetUrl) || normalizeReleaseUrl(booth?.heroAssetUrl);
  if (!preferred || !preferred.toLowerCase().endsWith('.glb')) {
    return null;
  }

  return preferred;
}

export function buildSponsorBoothPresentation(
  company: ExpoSceneCompany,
  booth: ExpoSceneBooth | null,
  nodeType?: string | null,
  context?: {
    districtThemeId?: string | null;
  }
): SponsorBoothPresentation {
  const displayName = truncateSponsorText(company.name, 26);
  const slugOrId = company.slug || company.id;
  const logoUrl = normalizeReleaseUrl(company.logo_url);
  const posterUrl = normalizeReleaseUrl(company.posterUrl) || normalizeReleaseUrl(booth?.posterUrl);
  const videoUrl = normalizeReleaseUrl(booth?.video_url);
  const customInsertUrl = pickCustomInsertUrl(company, booth);
  const fallbackIdentity = buildFallbackIdentity(company, booth, displayName);
  const hasBrandAssets = Boolean(logoUrl || posterUrl || videoUrl || customInsertUrl);

  return {
    actions: buildSponsorCtas(company),
    badgeLabel: company.sponsorTier.toUpperCase(),
    bookingUrl: normalizeUrl(company.bookingUrl),
    customInsertUrl,
    demoRoomPath: `/expo/booth/${slugOrId}`,
    displayName,
    fallbackIdentity,
    hasBrandAssets,
    logoUrl,
    posterUrl,
    sponsorTier: company.sponsorTier,
    tagline: truncateSponsorText(company.tagline || fallbackIdentity.supportLine || 'Meet the team. Explore the offer.', 30),
    template: pickSponsorBoothTemplate({
      boothType: company.boothType || booth?.boothType || null,
      districtThemeId: context?.districtThemeId || null,
      nodeType,
      sponsorTier: company.sponsorTier,
    }),
    videoUrl,
    website: normalizeUrl(company.website),
  };
}
