import type {
  BoothType,
  ExpoSceneBooth,
  ExpoSceneCompany,
  ExpoSceneContract,
  ExpoSceneData,
  ExpoSceneSector,
  SponsorTier,
} from '../../types/scene';

export function normalizeNullableString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function isPlaceholderMediaUrl(value: string | null) {
  if (!value) {
    return false;
  }

  return /big[\s_-]*buck[\s_-]*bunny|test-videos\.co\.uk|sample-videos\.com|samplelib\.com|via\.placeholder\.com|placehold\.co|dummyimage\.com/i.test(value);
}

export function normalizeReleaseMediaUrl(value: unknown) {
  const normalized = normalizeNullableString(value);
  if (!normalized || isPlaceholderMediaUrl(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizePriority(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeSponsorTier(value: unknown): SponsorTier {
  switch (String(value || '').trim().toLowerCase()) {
    case 'hero':
    case 'platinum':
    case 'gold':
    case 'silver':
    case 'bronze':
      return String(value).trim().toLowerCase() as SponsorTier;
    default:
      return 'standard';
  }
}

export function normalizeBoothType(value: unknown, sponsorTier: SponsorTier): BoothType {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'hero' || normalized === 'premium' || normalized === 'standard' || normalized === 'poster') {
    return normalized as BoothType;
  }

  if (sponsorTier === 'hero') {
    return 'hero';
  }

  if (sponsorTier === 'platinum' || sponsorTier === 'gold') {
    return 'premium';
  }

  return 'standard';
}

export function normalizeSlug(value: unknown, fallbackName: unknown) {
  const explicitSlug = normalizeNullableString(value);
  if (explicitSlug) {
    return explicitSlug;
  }

  const normalizedName = String(fallbackName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedName.length > 0 ? normalizedName : null;
}

export function normalizeBooth(rawBooth: any, fallbackCompany: any): ExpoSceneBooth | null {
  if (!rawBooth || typeof rawBooth !== 'object') {
    return null;
  }

  const sponsorTier = normalizeSponsorTier(fallbackCompany?.sponsorTier ?? fallbackCompany?.sponsor_tier);
  const companyId = String(rawBooth.companyId || rawBooth.company_id || fallbackCompany?.id || '');

  if (!companyId) {
    return null;
  }

  return {
    boothType: normalizeBoothType(rawBooth.boothType ?? rawBooth.booth_type ?? fallbackCompany?.boothType ?? fallbackCompany?.booth_type, sponsorTier),
    companyId,
    ctaLabel: normalizeNullableString(rawBooth.ctaLabel ?? rawBooth.cta_label ?? fallbackCompany?.ctaLabel ?? fallbackCompany?.cta_label),
    featuredAssetDescription: normalizeNullableString(rawBooth.featuredAssetDescription ?? rawBooth.featured_asset_description),
    featuredAssetTitle: normalizeNullableString(rawBooth.featuredAssetTitle ?? rawBooth.featured_asset_title),
    featuredAssetType: normalizeNullableString(rawBooth.featuredAssetType ?? rawBooth.featured_asset_type),
    featuredAssetUrl: normalizeReleaseMediaUrl(rawBooth.featuredAssetUrl ?? rawBooth.featured_asset_url),
    heroAssetUrl: normalizeReleaseMediaUrl(rawBooth.heroAssetUrl ?? rawBooth.hero_asset_url ?? fallbackCompany?.heroAssetUrl ?? fallbackCompany?.hero_asset_url),
    heroScreenImageUrl: normalizeReleaseMediaUrl(rawBooth.heroScreenImageUrl ?? rawBooth.hero_screen_image_url),
    heroScreenStatus: normalizeNullableString(rawBooth.heroScreenStatus ?? rawBooth.hero_screen_status),
    heroScreenText: normalizeNullableString(rawBooth.heroScreenText ?? rawBooth.hero_screen_text),
    heroScreenTitle: normalizeNullableString(rawBooth.heroScreenTitle ?? rawBooth.hero_screen_title),
    heroScreenType: normalizeNullableString(rawBooth.heroScreenType ?? rawBooth.hero_screen_type),
    heroScreenVideoUrl: normalizeReleaseMediaUrl(rawBooth.heroScreenVideoUrl ?? rawBooth.hero_screen_video_url),
    id: String(rawBooth.id || `booth_${companyId}`),
    model_url: normalizeReleaseMediaUrl(rawBooth.model_url),
    posterUrl: normalizeReleaseMediaUrl(rawBooth.posterUrl ?? rawBooth.poster_url ?? fallbackCompany?.posterUrl ?? fallbackCompany?.poster_url),
    showroomEnabled: rawBooth.showroomEnabled === true || rawBooth.showroom_enabled === true,
    slug: normalizeSlug(rawBooth.slug, fallbackCompany?.name),
    video_url: normalizeReleaseMediaUrl(rawBooth.video_url),
  };
}

export function normalizeSector(sector: any): ExpoSceneSector {
  return {
    color_theme: normalizeNullableString(sector?.color_theme),
    id: String(sector?.id || ''),
    map_position: sector?.map_position ?? null,
    name: String(sector?.name || ''),
  };
}

export function normalizeCompany(company: any, booth: ExpoSceneBooth | null): ExpoSceneCompany {
  const sponsorTier = normalizeSponsorTier(company?.sponsorTier ?? company?.sponsor_tier);
  const boothType = normalizeBoothType(company?.boothType ?? company?.booth_type ?? booth?.boothType, sponsorTier);

  return {
    activeEmployees: Number(company?.activeEmployees ?? company?.employee_count ?? 0) || 0,
    activityScore: Number(company?.activityScore ?? company?.activity_score ?? 0.5) || 0.5,
    booth,
    boothType,
    bookingUrl: normalizeNullableString(company?.bookingUrl ?? company?.booking_url),
    ctaLabel: normalizeNullableString(company?.ctaLabel ?? company?.cta_label ?? booth?.ctaLabel),
    currentRevenue: Number(company?.currentRevenue ?? company?.current_revenue ?? 0) || 0,
    heroAssetUrl: normalizeReleaseMediaUrl(company?.heroAssetUrl ?? company?.hero_asset_url ?? booth?.heroAssetUrl),
    id: String(company?.id || ''),
    logo_url: normalizeReleaseMediaUrl(company?.logo_url),
    name: String(company?.name || ''),
    posterUrl: normalizeReleaseMediaUrl(company?.posterUrl ?? company?.poster_url ?? booth?.posterUrl),
    priority: normalizePriority(company?.priority),
    sectorId: company?.sectorId ? String(company.sectorId) : (company?.sector_id ? String(company.sector_id) : null),
    sector_id: company?.sector_id ? String(company.sector_id) : (company?.sectorId ? String(company.sectorId) : null),
    slug: normalizeSlug(company?.slug, company?.name),
    sponsorTier,
    tagline: normalizeNullableString(company?.tagline),
    website: normalizeNullableString(company?.website),
  };
}

function ensureUniqueCompanySlugs(companies: ExpoSceneCompany[], boothsByCompanyId: Map<string, ExpoSceneBooth>) {
  const slugCounts = new Map<string, number>();

  return companies.map((company) => {
    const baseSlug = company.slug || normalizeSlug(company.name, company.name) || `company-${company.id}`;
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const uniqueSlug = count === 0 ? baseSlug : `${baseSlug}-${company.id.toLowerCase().slice(0, 8)}`;
    const booth = boothsByCompanyId.get(company.id);

    const normalizedCompany = {
      ...company,
      slug: uniqueSlug,
      booth: booth ? { ...booth, slug: uniqueSlug } : company.booth ? { ...company.booth, slug: uniqueSlug } : null,
    };

    if (booth) {
      boothsByCompanyId.set(company.id, { ...booth, slug: uniqueSlug });
    }

    return normalizedCompany;
  });
}

export function validateExpoSceneContractPayload(payload: Partial<ExpoSceneContract> | null | undefined) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('EXPO_SCENE_INVALID_PAYLOAD');
  }

  if ('companies' in payload && !Array.isArray(payload.companies)) {
    throw new Error('EXPO_SCENE_INVALID_COMPANIES');
  }

  if ('sectors' in payload && !Array.isArray(payload.sectors)) {
    throw new Error('EXPO_SCENE_INVALID_SECTORS');
  }

  if ('booths' in payload && !Array.isArray(payload.booths)) {
    throw new Error('EXPO_SCENE_INVALID_BOOTHS');
  }
}

export function adaptBackendScenePayload(payload: Partial<ExpoSceneContract> | null | undefined): ExpoSceneData {
  validateExpoSceneContractPayload(payload);
  const typedPayload = payload ?? {};
  const boothsByCompanyId = new Map<string, ExpoSceneBooth>();

  if (Array.isArray(typedPayload.booths)) {
    typedPayload.booths.forEach((rawBooth) => {
      const booth = normalizeBooth(rawBooth, null);
      if (booth) {
        boothsByCompanyId.set(booth.companyId, booth);
      }
    });
  }

  const companies = Array.isArray(typedPayload.companies)
    ? typedPayload.companies.map((company) => {
        const booth = boothsByCompanyId.get(String(company.id)) ?? normalizeBooth((company as any).booth ?? (company as any).booths, company);
        return normalizeCompany(company, booth);
      }).filter((company) => company.id.length > 0 && company.name.length > 0)
    : [];
  const normalizedCompanies = ensureUniqueCompanySlugs(companies, boothsByCompanyId);

  const sectors = Array.isArray(typedPayload.sectors)
    ? typedPayload.sectors.map(normalizeSector).filter((sector) => sector.id.length > 0)
    : [];

  return {
    authPolicy: typeof typedPayload.authPolicy === 'string' ? typedPayload.authPolicy : undefined,
    cityInfo: typedPayload.cityInfo && typeof typedPayload.cityInfo === 'object'
      ? {
          globalLocation: typedPayload.cityInfo.globalLocation ?? null,
          id: String(typedPayload.cityInfo.id || ''),
          name: String(typedPayload.cityInfo.name || ''),
          style: Number(typedPayload.cityInfo.style ?? 0) || 0,
        }
      : null,
    companies: normalizedCompanies,
    generatedAt: typeof typedPayload.generatedAt === 'string' ? typedPayload.generatedAt : null,
    releaseMode: typedPayload.releaseMode === 'sponsor-boulevard' ? typedPayload.releaseMode : 'sponsor-boulevard',
    sceneVersion: typeof typedPayload.sceneVersion === 'string' ? typedPayload.sceneVersion : 'expo-scene-backend-unavailable',
    sectors,
  };
}
