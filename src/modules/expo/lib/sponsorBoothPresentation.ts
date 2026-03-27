import type { ExpoSceneBooth, ExpoSceneCompany, SponsorTier } from '../types/scene';

export type SponsorBoothTemplate = 'hero_pavilion' | 'standard_corner' | 'compact_kiosk';
export type SponsorCtaKind = 'website' | 'booking' | 'demo_room';

export type SponsorCta = {
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

export function pickSponsorBoothTemplate({
  boothType,
  nodeType,
  sponsorTier,
}: {
  boothType?: string | null;
  nodeType?: string | null;
  sponsorTier?: SponsorTier | null;
}): SponsorBoothTemplate {
  if (nodeType === 'hero_left' || nodeType === 'hero_right' || sponsorTier === 'hero' || boothType === 'hero') {
    return 'hero_pavilion';
  }

  if (nodeType === 'endcap' || boothType === 'premium' || sponsorTier === 'platinum' || sponsorTier === 'gold') {
    return 'standard_corner';
  }

  return 'compact_kiosk';
}

export function buildSponsorCtas(company: ExpoSceneCompany): SponsorCta[] {
  const actions: SponsorCta[] = [];
  const website = normalizeUrl(company.website);
  const booking = normalizeUrl(company.bookingUrl);

  if (website) {
    actions.push({ kind: 'website', label: 'Website', url: website });
  }

  if (booking) {
    actions.push({ kind: 'booking', label: company.ctaLabel || 'Book Meeting', url: booking });
  }

  actions.push({ kind: 'demo_room', label: 'Demo Room' });
  return actions;
}

export function resolveSponsorCtaIntent(
  action: SponsorCta,
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath'>
): SponsorCtaIntent {
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
  nodeType?: string | null
): SponsorBoothPresentation {
  const displayName = truncateSponsorText(company.name, 26);
  const slugOrId = company.slug || company.id;

  return {
    actions: buildSponsorCtas(company),
    badgeLabel: company.sponsorTier.toUpperCase(),
    bookingUrl: normalizeUrl(company.bookingUrl),
    customInsertUrl: pickCustomInsertUrl(company, booth),
    demoRoomPath: `/expo/booth/${slugOrId}`,
    displayName,
    logoUrl: normalizeReleaseUrl(company.logo_url),
    posterUrl: normalizeReleaseUrl(company.posterUrl) || normalizeReleaseUrl(booth?.posterUrl),
    sponsorTier: company.sponsorTier,
    tagline: truncateSponsorText(company.tagline || 'Meet the team. Explore the offer. Book a live demo.', 64),
    template: pickSponsorBoothTemplate({
      boothType: company.boothType || booth?.boothType || null,
      nodeType,
      sponsorTier: company.sponsorTier,
    }),
    videoUrl: normalizeReleaseUrl(booth?.video_url),
    website: normalizeUrl(company.website),
  };
}
