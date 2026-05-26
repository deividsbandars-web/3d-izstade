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

const SPONSOR_CONCIERGE_PREVIEW_CARD = {
  bullets: [
    'Meeting-ready sponsor package',
    'AI qualification preview',
    'Lead report package',
  ],
  ctaLabels: ['Request Demo', 'Book Meeting', 'Run Diagnostic'],
  statusLabel: 'Preview only · no live capture yet',
  subtitle: 'Turn expo traffic into booked meetings and qualified leads.',
  tierLabel: 'PREMIUM BOOTH',
  title: 'Sponsor Concierge',
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
  if (!mapping || mapping.productProfileId !== 'sponsor-concierge-premium-profile') {
    return null;
  }

  const profile = getBoothProductProfile(mapping.productProfileId);
  if (!profile || profile.boothId !== 'sponsor-concierge') {
    return null;
  }

  return {
    ...SPONSOR_CONCIERGE_PREVIEW_CARD,
    boothId: profile.boothId,
    productProfileId: profile.id,
    runtimeBoothId: mapping.runtimeBoothId ?? null,
  };
}
