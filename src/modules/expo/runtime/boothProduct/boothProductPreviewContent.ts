import { getBoothProductProfile } from './boothProductConfig';
import { getBoothProductMappingForBooth } from './boothProductMapping';
import { isBoothProductPreviewEnabled } from './boothProductPreviewFlags';
import type { BoothProductPreviewCard, BoothProductPlacementMapping } from './boothProductTypes';

type BoothProductPreviewSearchInput = Parameters<typeof isBoothProductPreviewEnabled>[0];

type BoothProductPreviewCardRequest = {
  boothId?: string | null;
  companyId?: string | null;
  placementId?: string | null;
  runtimeBoothId?: string | null;
  search?: BoothProductPreviewSearchInput;
};

const BOOTH_PRODUCT_PREVIEW_CARDS = {
  'automation-arena-landmark-profile': {
    bullets: [
      'Zone naming rights',
      'Hero screen placement',
      'Demo Arena slot + sponsor report',
    ],
    ctaLabels: ['Sponsor Zone', 'View Package', 'Reserve Slot'],
    statusLabel: 'Preview only \u00b7 sponsorship package concept',
    subtitle: 'Own the highest-visibility zone across demos, booths and event traffic.',
    tierLabel: 'LANDMARK ZONE SPONSOR',
    title: 'AI District Sponsor',
  },
  'immersive-fabric-labs-standard-profile': {
    bullets: [
      'Product profile and pitch',
      'Demo-ready showcase screen',
      'Sponsor package request',
    ],
    ctaLabels: ['View Demo', 'Request Info', 'Get Package'],
    statusLabel: 'Preview only \u00b7 no live capture yet',
    subtitle: 'Showcase an immersive product story and collect sponsor interest.',
    tierLabel: 'STANDARD BOOTH',
    title: 'Immersive Fabric Labs',
  },
  'sponsor-concierge-premium-profile': {
    bullets: [
      'Meeting-ready sponsor package',
      'AI qualification preview',
      'Lead report package',
    ],
    ctaLabels: ['Request Demo', 'Book Meeting', 'Run Diagnostic'],
    statusLabel: 'Preview only \u00b7 no live capture yet',
    subtitle: 'Turn expo traffic into booked meetings and qualified leads.',
    tierLabel: 'PREMIUM BOOTH',
    title: 'Sponsor Concierge',
  },
} as const;

function collectLookupIds(request: BoothProductPreviewCardRequest) {
  return [
    request.boothId,
    request.companyId,
    request.placementId,
    request.runtimeBoothId,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function findPreviewSafeMapping(ids: readonly string[]): BoothProductPlacementMapping | null {
  for (const id of ids) {
    const mapping = getBoothProductMappingForBooth(id);
    if (mapping?.safeForPreview && mapping.mappingStatus === 'exact' && !mapping.safeForDefault) {
      return mapping;
    }
  }

  return null;
}

export function getBoothProductPreviewCardForBooth(request: BoothProductPreviewCardRequest): BoothProductPreviewCard | null {
  if (!isBoothProductPreviewEnabled(request.search)) {
    return null;
  }

  const mapping = findPreviewSafeMapping(collectLookupIds(request));
  const previewCard = mapping ? BOOTH_PRODUCT_PREVIEW_CARDS[mapping.productProfileId as keyof typeof BOOTH_PRODUCT_PREVIEW_CARDS] : null;
  if (!mapping || !previewCard) {
    return null;
  }

  const profile = getBoothProductProfile(mapping.productProfileId);
  if (!profile || profile.boothId !== mapping.boothId) {
    return null;
  }

  return {
    ...previewCard,
    boothId: profile.boothId,
    productProfileId: profile.id,
    runtimeBoothId: mapping.runtimeBoothId ?? null,
  };
}
