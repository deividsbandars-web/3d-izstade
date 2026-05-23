import { BOOTH_PRODUCT_PROFILES } from './boothProductConfig';
import type {
  BoothProductMappingStatus,
  BoothProductMappingSummary,
  BoothProductPlacementMapping,
  BoothProductProfile,
} from './boothProductTypes';

const MAPPED_STATUSES: readonly BoothProductMappingStatus[] = ['exact', 'approximate'];
const RUNTIME_RENDERING_ENABLED = false;
const EXACT_PREVIEW_SAFE_PROFILE_IDS = new Set(['sponsor-concierge-premium-profile']);

const EXACT_PREVIEW_SAFE_MAPPINGS = [
  {
    boothId: 'sponsor-concierge',
    mappingStatus: 'exact',
    notes: 'Verified production-safe runtime booth/company id and booth alias; preview-safe metadata only, with default rendering still disabled.',
    operatorZoneId: 'sponsor-boulevard-right',
    packageTier: 'premium',
    productProfileId: 'sponsor-concierge-premium-profile',
    runtimeBoothId: 'booth-sponsor-concierge',
    runtimeSponsorId: 'sponsor-concierge',
    safeForDefault: false,
    safeForPreview: true,
    sponsorId: 'sponsor-concierge',
    zoneId: 'meetings',
  },
] as const satisfies readonly BoothProductPlacementMapping[];

const DEFERRED_MOCK_PROFILE_MAPPINGS = BOOTH_PRODUCT_PROFILES
  .filter((profile) => !EXACT_PREVIEW_SAFE_PROFILE_IDS.has(profile.id))
  .map((profile) => ({
    boothId: profile.boothId,
    mappingStatus: 'deferred',
    notes: 'Mock boothProduct profile does not match a verified production-safe runtime booth or sponsor id yet.',
    packageTier: profile.packageTier,
    productProfileId: profile.id,
    safeForDefault: false,
    safeForPreview: false,
    ...(profile.sponsorId ? { sponsorId: profile.sponsorId } : {}),
  })) as readonly BoothProductPlacementMapping[];

// Round 26 keeps boothProduct detached from rendering. The one exact mapping is
// preview-safe metadata only; the remaining mock profiles stay deferred.
export const BOOTH_PRODUCT_PLACEMENT_MAPPINGS = [
  ...EXACT_PREVIEW_SAFE_MAPPINGS,
  ...DEFERRED_MOCK_PROFILE_MAPPINGS,
] as const satisfies readonly BoothProductPlacementMapping[];

function normalizeLookupId(value: string) {
  return value.trim();
}

function isMappedStatus(status: BoothProductMappingStatus) {
  return MAPPED_STATUSES.includes(status);
}

export function getBoothProductPlacementMappings() {
  return BOOTH_PRODUCT_PLACEMENT_MAPPINGS;
}

export function getBoothProductMappingForBooth(boothId: string) {
  const normalizedBoothId = normalizeLookupId(boothId);
  return BOOTH_PRODUCT_PLACEMENT_MAPPINGS.find((mapping) => (
    mapping.boothId === normalizedBoothId
    || mapping.runtimeBoothId === normalizedBoothId
    || mapping.runtimeSponsorId === normalizedBoothId
  )) ?? null;
}

export function getBoothProductMappingForProfile(profileId: string) {
  const normalizedProfileId = normalizeLookupId(profileId);
  return BOOTH_PRODUCT_PLACEMENT_MAPPINGS.find((mapping) => (
    mapping.productProfileId === normalizedProfileId
  )) ?? null;
}

export function getMappedBoothProductProfiles(): BoothProductProfile[] {
  return BOOTH_PRODUCT_PROFILES.filter((profile) => {
    const mapping = getBoothProductMappingForProfile(profile.id);
    return mapping ? isMappedStatus(mapping.mappingStatus) : false;
  });
}

export function getUnmappedBoothProductProfiles(): BoothProductProfile[] {
  return BOOTH_PRODUCT_PROFILES.filter((profile) => {
    const mapping = getBoothProductMappingForProfile(profile.id);
    return !mapping || !isMappedStatus(mapping.mappingStatus);
  });
}

export function getPreviewSafeBoothProductMappings() {
  return BOOTH_PRODUCT_PLACEMENT_MAPPINGS.filter((mapping) => mapping.safeForPreview);
}

export function getDefaultSafeBoothProductMappings() {
  return BOOTH_PRODUCT_PLACEMENT_MAPPINGS.filter((mapping) => mapping.safeForDefault);
}

export function getBoothProductMappingSummary(): BoothProductMappingSummary {
  const mappings = BOOTH_PRODUCT_PLACEMENT_MAPPINGS;

  return {
    approximateCount: mappings.filter((mapping) => mapping.mappingStatus === 'approximate').length,
    defaultSafeCount: mappings.filter((mapping) => mapping.safeForDefault).length,
    deferredCount: mappings.filter((mapping) => mapping.mappingStatus === 'deferred').length,
    exactCount: mappings.filter((mapping) => mapping.mappingStatus === 'exact').length,
    mappedCount: mappings.filter((mapping) => isMappedStatus(mapping.mappingStatus)).length,
    missingCount: mappings.filter((mapping) => mapping.mappingStatus === 'missing').length,
    previewSafeCount: mappings.filter((mapping) => mapping.safeForPreview).length,
    profileCount: BOOTH_PRODUCT_PROFILES.length,
    rendered: RUNTIME_RENDERING_ENABLED,
  };
}
