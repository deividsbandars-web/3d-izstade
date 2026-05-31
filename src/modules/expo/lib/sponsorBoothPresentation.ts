import type { ExpoSceneBooth, ExpoSceneCompany, SponsorTier } from '../types/scene';
import { buildExpoBoothRoute } from './expoBoothRoutes';

export type SponsorBoothTemplate =
  | 'hero_gallery'
  | 'hero_forum'
  | 'premium_portal'
  | 'premium_spine'
  | 'standard_arcade'
  | 'standard_studio';
export type SponsorCtaKind = 'website' | 'booking' | 'demo_room' | 'calculators' | 'ai_chat';

export const CALCULATORS_ROUTE = '/calculators';

export type SponsorCta = {
  disabled?: boolean;
  kind: SponsorCtaKind;
  label: string;
  surface?: 'both' | 'feature';
  url?: string | null;
};

export type SponsorManagedScreenMode = 'generated-card' | 'image' | 'video-placeholder';

export type SponsorManagedScreenContent = {
  ctaLabel: string | null;
  imageUrl: string | null;
  mode: SponsorManagedScreenMode;
  screenSlotId: string | null;
  status: 'draft' | 'published';
  subtitle: string | null;
  title: string;
  videoUrl: string | null;
};

export type SponsorCtaIntent =
  | { type: 'navigate'; target: string }
  | { type: 'external'; target: string }
  | { type: 'local'; target: 'global_chat' }
  | null;

export type SponsorBoothPresentation = {
  actions: SponsorCta[];
  adTier: 'elite' | 'premium' | 'standard' | 'support';
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
  managedScreenContent: SponsorManagedScreenContent | null;
  posterUrl: string | null;
  showcaseMode: 'immersive' | 'hero-object' | 'product' | 'support';
  sponsorTier: SponsorTier;
  tagline: string | null;
  template: SponsorBoothTemplate;
  videoUrl: string | null;
  website: string | null;
};

export function isPremiumStreamingTier(adTier: SponsorBoothPresentation['adTier']) {
  return adTier === 'elite' || adTier === 'premium';
}

function buildBoothBadgeLabel(adTier: SponsorBoothPresentation['adTier'], sponsorTier: SponsorTier) {
  if (adTier === 'elite') {
    return 'UNREAL ELITE';
  }
  if (adTier === 'premium') {
    return 'PREMIUM LIVE';
  }
  return sponsorTier.toUpperCase();
}

function buildPresentationTagline(
  adTier: SponsorBoothPresentation['adTier'],
  company: ExpoSceneCompany,
  fallbackIdentity: SponsorBoothPresentation['fallbackIdentity']
) {
  const sourceTagline = truncateSponsorText(company.tagline || fallbackIdentity.supportLine || 'Meet the team. Explore the offer.', 34);
  if (adTier === 'elite') {
    return sourceTagline || 'UNREAL POWERED BUYER SUITE';
  }
  if (adTier === 'premium') {
    return sourceTagline || 'LIVE PREMIUM PRODUCT ROOM';
  }
  return truncateSponsorText(company.tagline || fallbackIdentity.supportLine || 'Meet the team. Explore the offer.', 30);
}

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

function normalizeManagedScreenMode(value: unknown): SponsorManagedScreenMode {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'image') {
    return 'image';
  }

  if (normalized === 'video' || normalized === 'video-placeholder') {
    return 'video-placeholder';
  }

  return 'generated-card';
}

function normalizeManagedScreenStatus(value: unknown): SponsorManagedScreenContent['status'] {
  return String(value || '').trim().toLowerCase() === 'draft' ? 'draft' : 'published';
}

function buildManagedScreenContent(
  booth: ExpoSceneBooth | null,
  fallbackIdentity: SponsorBoothPresentation['fallbackIdentity'],
  displayName: string,
): SponsorManagedScreenContent | null {
  if (!booth) {
    return null;
  }

  const hasManagedScreenContent = Boolean(
    booth.heroScreenTitle
    || booth.heroScreenText
    || booth.heroScreenImageUrl
    || booth.heroScreenVideoUrl
    || booth.heroScreenType
  );
  if (!hasManagedScreenContent) {
    return null;
  }

  return {
    ctaLabel: truncateSponsorText(booth.ctaLabel || null, 26) || null,
    imageUrl: normalizeReleaseUrl(booth.heroScreenImageUrl),
    mode: normalizeManagedScreenMode(booth.heroScreenType),
    screenSlotId: normalizeUrl(booth.heroScreenSlotId),
    status: normalizeManagedScreenStatus(booth.heroScreenStatus),
    subtitle: truncateSponsorText(booth.heroScreenText || fallbackIdentity.supportLine, 74) || null,
    title: truncateSponsorText(booth.heroScreenTitle || displayName, 32) || displayName,
    videoUrl: normalizeReleaseUrl(booth.heroScreenVideoUrl),
  };
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
  const sponsorTier = company.sponsorTier;
  const isTopTier = sponsorTier === 'hero' || sponsorTier === 'platinum' || sponsorTier === 'gold';

  if (website) {
    actions.push({ kind: 'website', label: isTopTier ? 'Open Website' : 'Visit Website', url: website });
  }

  if (booking) {
    actions.push({ kind: 'booking', label: company.ctaLabel || (isTopTier ? 'Book Meeting' : 'Meet Team'), url: booking });
  }

  actions.push({ kind: 'ai_chat', label: 'Ask AI', surface: 'feature' });
  actions.push({ kind: 'calculators', label: isTopTier ? 'Open Calculators' : 'Get Estimate' });
  actions.push({ kind: 'demo_room', label: isTopTier ? 'Launch Premium Room' : 'Open Showroom' });
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

  if (action.kind === 'calculators') {
    return { type: 'navigate', target: CALCULATORS_ROUTE };
  }

  if (action.kind === 'ai_chat') {
    return { type: 'local', target: 'global_chat' };
  }

  if ((action.kind === 'website' || action.kind === 'booking') && normalizeUrl(action.url)) {
    return { type: 'external', target: normalizeUrl(action.url)! };
  }

  return null;
}

export function isSupportedExpoInternalRoute(route: string) {
  if (route === CALCULATORS_ROUTE) {
    return true;
  }

  return /^\/expo\/booth\/[^/]+(?:\/stream)?$/.test(route);
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
  const logoUrl = normalizeReleaseUrl(company.logo_url);
  const posterUrl = normalizeReleaseUrl(company.posterUrl) || normalizeReleaseUrl(booth?.posterUrl);
  const videoUrl = normalizeReleaseUrl(booth?.video_url);
  const customInsertUrl = pickCustomInsertUrl(company, booth);
  const fallbackIdentity = buildFallbackIdentity(company, booth, displayName);
  const managedScreenContent = buildManagedScreenContent(booth, fallbackIdentity, displayName);
  const hasBrandAssets = Boolean(logoUrl || posterUrl || videoUrl || customInsertUrl);
  const template = pickSponsorBoothTemplate({
    boothType: company.boothType || booth?.boothType || null,
    districtThemeId: context?.districtThemeId || null,
    nodeType,
    sponsorTier: company.sponsorTier,
  });
  const sponsorTier = company.sponsorTier;
  const adTier: SponsorBoothPresentation['adTier'] =
    template === 'hero_gallery' || template === 'hero_forum' || sponsorTier === 'platinum'
      ? 'elite'
      : template === 'premium_portal' || template === 'premium_spine'
        ? 'premium'
        : template === 'standard_arcade'
          ? 'standard'
          : 'support';
  const showcaseMode: SponsorBoothPresentation['showcaseMode'] =
    template === 'hero_gallery' || template === 'hero_forum'
      ? 'immersive'
      : template === 'premium_portal' || template === 'premium_spine'
        ? 'hero-object'
        : template === 'standard_arcade'
        ? 'product'
          : 'support';
  const demoRoomPath = buildExpoBoothRoute({
    companyId: company.id,
    companySlug: company.slug,
    stream: isPremiumStreamingTier(adTier),
  }) ?? '/expo/booth/unknown';

  return {
    actions: buildSponsorCtas(company),
    adTier,
    badgeLabel: buildBoothBadgeLabel(adTier, company.sponsorTier),
    bookingUrl: normalizeUrl(company.bookingUrl),
    customInsertUrl,
    demoRoomPath,
    displayName,
    fallbackIdentity,
    hasBrandAssets,
    logoUrl,
    managedScreenContent,
    posterUrl,
    showcaseMode,
    sponsorTier: company.sponsorTier,
    tagline: buildPresentationTagline(adTier, company, fallbackIdentity),
    template,
    videoUrl,
    website: normalizeUrl(company.website),
  };
}
