import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import { getPixelStreamingStatus } from '../services/pixelStreamingStatus.js';
import { reservePixelStreamingSession } from '../services/pixelStreamingSessionBroker.js';

export const EXPO_SCENE_AUTH_POLICY = 'public-readonly';
export const EXPO_SCENE_VERSION = 'expo-scene-v2-sponsor';
export const EXPO_SCENE_RELEASE_MODE = 'sponsor-boulevard';

type SponsorTier = 'hero' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard';
type BoothType = 'hero' | 'premium' | 'standard' | 'poster';

type ExpoSceneResponse = {
    authPolicy: typeof EXPO_SCENE_AUTH_POLICY;
    sceneVersion: typeof EXPO_SCENE_VERSION;
    releaseMode: typeof EXPO_SCENE_RELEASE_MODE;
    booths: Array<{
        boothType: BoothType;
        companyId: string;
        ctaLabel: string | null;
        featuredAssetDescription?: string | null;
        featuredAssetTitle?: string | null;
        featuredAssetType?: string | null;
        featuredAssetUrl?: string | null;
        heroAssetUrl: string | null;
        heroScreenImageUrl?: string | null;
        heroScreenStatus?: string | null;
        heroScreenText?: string | null;
        heroScreenTitle?: string | null;
        heroScreenType?: string | null;
        heroScreenVideoUrl?: string | null;
        id: string;
        model_url: string | null;
        posterUrl: string | null;
        showroomEnabled?: boolean;
        slug: string | null;
        video_url: string | null;
    }>;
    cityInfo: {
        globalLocation: unknown;
        id: string;
        name: string;
        style: number;
    };
    companies: Array<{
        activeEmployees: number;
        activityScore: number;
        currentRevenue: number;
        boothType: BoothType;
        bookingUrl: string | null;
        ctaLabel: string | null;
        heroAssetUrl: string | null;
        id: string;
        logo_url: string | null;
        name: string;
        posterUrl: string | null;
        priority: number;
        sectorId: string | null;
        slug: string | null;
        sponsorTier: SponsorTier;
        tagline: string | null;
        website: string | null;
    }>;
    generatedAt: string;
    sectors: Array<{
        color_theme: string | null;
        id: string;
        map_position: unknown;
        name: string;
    }>;
};

// Define architecture styles to match UE5 enum
enum EArchitectureStyle {
    Futuristic = 0,
    Industrial = 1,
    Minimalist = 2,
    Cyberpunk = 3
}

const getStyleEnum = (styleName: string): number => {
    switch (styleName.toLowerCase()) {
        case 'industrial': return EArchitectureStyle.Industrial;
        case 'minimalist': return EArchitectureStyle.Minimalist;
        case 'cyberpunk': return EArchitectureStyle.Cyberpunk;
        default: return EArchitectureStyle.Futuristic;
    }
};

const DEFAULT_CITY_INFO = {
    id: 'default-city',
    name: 'Warpala Expo',
    style: EArchitectureStyle.Futuristic,
    globalLocation: null
};

const normalizeBoothRelation = (value: any) => {
    if (Array.isArray(value)) {
        return value[0] || null;
    }

    if (value && typeof value === 'object') {
        return value;
    }

    return null;
};

const normalizeNullableString = (value: unknown) => {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const isPlaceholderMediaUrl = (value: string | null) => {
    if (!value) {
        return false;
    }

    return /big[\s_-]*buck[\s_-]*bunny|test-videos\.co\.uk|sample-videos\.com|samplelib\.com|via\.placeholder\.com|placehold\.co|dummyimage\.com/i.test(value);
};

const normalizeReleaseMediaUrl = (value: unknown) => {
    const normalized = normalizeNullableString(value);
    if (!normalized || isPlaceholderMediaUrl(normalized)) {
        return null;
    }

    return normalized;
};

const normalizeRecord = (value: unknown): Record<string, unknown> => {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
};

const normalizePriority = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeSponsorTier = (value: unknown): SponsorTier => {
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
};

const normalizeBoothType = (value: unknown, sponsorTier: SponsorTier): BoothType => {
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
};

const normalizeCompanySlug = (company: any) => {
    const explicitSlug = normalizeNullableString(company?.slug);
    if (explicitSlug) {
        return explicitSlug;
    }

    const normalizedName = String(company?.name || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalizedName.length > 0 ? normalizedName : null;
};

const buildUniqueSlugMap = (companies: any[]) => {
    const slugCounts = new Map<string, number>();
    const slugMap = new Map<string, string>();

    companies.forEach((company) => {
        const baseSlug = normalizeCompanySlug(company) || `company-${String(company.id || '').toLowerCase()}`;
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        const uniqueSlug = count === 0 ? baseSlug : `${baseSlug}-${String(company.id || '').toLowerCase().slice(0, 8)}`;
        slugMap.set(String(company.id), uniqueSlug);
    });

    return slugMap;
};

const sponsorTierWeight: Record<SponsorTier, number> = {
    hero: 6,
    platinum: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    standard: 1,
};

const compareCompanies = (left: any, right: any) => {
    const leftTier = normalizeSponsorTier(left?.sponsor_tier);
    const rightTier = normalizeSponsorTier(right?.sponsor_tier);
    const byPriority = normalizePriority(right?.priority) - normalizePriority(left?.priority);
    if (byPriority !== 0) {
        return byPriority;
    }

    const byTier = sponsorTierWeight[rightTier] - sponsorTierWeight[leftTier];
    if (byTier !== 0) {
        return byTier;
    }

    const leftSector = String(left?.sector_id || '');
    const rightSector = String(right?.sector_id || '');
    if (leftSector !== rightSector) {
        return leftSector.localeCompare(rightSector);
    }

    return String(left?.name || '').localeCompare(String(right?.name || ''));
};

const normalizeLookupKey = (value: unknown) => String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getRecord = (value: unknown): Record<string, unknown> => {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
};

const getManagedBoothLookupKeys = (booth: Record<string, unknown>) => {
    const contactInfo = getRecord(booth.contact_info);
    return [
        booth.id,
        booth.company_name,
        booth.title,
        booth.company_id,
        booth.companyId,
        booth.booth_id,
        booth.boothId,
        booth.runtime_booth_id,
        booth.runtimeBoothId,
        contactInfo.company_id,
        contactInfo.companyId,
        contactInfo.booth_id,
        contactInfo.boothId,
        contactInfo.slug,
    ]
        .map(normalizeLookupKey)
        .filter(Boolean);
};

const getSceneBoothLookupKeys = (booth: Record<string, unknown> | null, company: Record<string, unknown>) => [
    booth?.id,
    booth?.company_id,
    booth?.companyId,
    booth?.booth_id,
    booth?.boothId,
    booth?.slug,
    company.id,
    company.name,
    company.slug,
]
    .map(normalizeLookupKey)
    .filter(Boolean);

const buildManagedBoothScreenContentIndex = (managedBooths: Array<Record<string, unknown>>) => {
    const index = new Map<string, Record<string, unknown>>();

    managedBooths.forEach((booth) => {
        const assets3d = normalizeRecord(booth.assets_3d);
        const screenContent = normalizeRecord(assets3d.screen_content);
        if (Object.keys(screenContent).length === 0) {
            return;
        }

        getManagedBoothLookupKeys(booth).forEach((key) => {
            if (!index.has(key)) {
                index.set(key, screenContent);
            }
        });
    });

    return index;
};

const fetchManagedBoothsForScreenContent = async (supabase: ReturnType<typeof getSupabase>) => {
    if (!supabase) {
        return [];
    }

    const pluralResult = await supabase.from('expo_booths').select('*');
    if (!pluralResult.error) {
        return (pluralResult.data || []) as Array<Record<string, unknown>>;
    }

    const errorCode = (pluralResult.error as { code?: string }).code;
    if (errorCode !== 'PGRST205') {
        return [];
    }

    const legacyResult = await supabase.from('expo_booth').select('*');
    if (legacyResult.error) {
        return [];
    }

    return (legacyResult.data || []) as Array<Record<string, unknown>>;
};

const getManagedScreenContentForSceneBooth = (
    screenContentIndex: Map<string, Record<string, unknown>>,
    booth: Record<string, unknown> | null,
    company: Record<string, unknown>,
) => {
    for (const key of getSceneBoothLookupKeys(booth, company)) {
        const screenContent = screenContentIndex.get(key);
        if (screenContent) {
            return screenContent;
        }
    }

    return {};
};

export const validateExpoSceneQuery = (query: Request['query']) => {
    const cityId = query.cityId;
    if (cityId === undefined) {
        return { cityId: undefined };
    }

    if (typeof cityId !== 'string' || cityId.trim().length === 0) {
        throw new Error('INVALID_CITY_ID');
    }

    return { cityId: cityId.trim() };
};

export const buildExpoSceneResponse = ({
    cityInfo,
    companies,
    booths,
    sectors,
}: Omit<ExpoSceneResponse, 'authPolicy' | 'generatedAt' | 'releaseMode' | 'sceneVersion'>): ExpoSceneResponse => ({
    authPolicy: EXPO_SCENE_AUTH_POLICY,
    booths,
    cityInfo,
    companies,
    generatedAt: new Date().toISOString(),
    releaseMode: EXPO_SCENE_RELEASE_MODE,
    sceneVersion: EXPO_SCENE_VERSION,
    sectors,
});

export const getExpoSceneErrorStatus = (error: unknown) => {
    return (error as { message?: string } | null)?.message === 'INVALID_CITY_ID' ? 400 : 500;
};

/**
 * Get list of all available cities in the network from Supabase.
 */
export const getCitiesList = async (req: Request, res: Response) => {
    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured");

        const { data: cities, error } = await supabase
            .from('cities')
            .select('id, name, architecture_style, global_location')
            .eq('is_active', true);

        if (error) throw error;

        const formattedCities = cities.map((c: any) => ({
            id: c.id,
            name: c.name,
            style: getStyleEnum(c.architecture_style),
            globalLocation: c.global_location
        }));

        res.status(200).json({ cities: formattedCities });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get scene data for a specific city from Supabase.
 */
export const createGetExpoScene = (getSupabaseClient: typeof getSupabase) => async (req: Request, res: Response) => {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error("Supabase not configured");

        const { cityId } = validateExpoSceneQuery(req.query);

        // 1. Fetch City Metadata
        let cityQuery = supabase.from('cities').select('*');
        if (cityId) {
            cityQuery = cityQuery.eq('id', cityId);
        } else {
            cityQuery = cityQuery.eq('is_active', true).limit(1);
        }

        const { data: city, error: cityError } = await cityQuery.single();
        const resolvedCity = cityError || !city
            ? DEFAULT_CITY_INFO
            : {
                id: city.id,
                name: city.name,
                style: getStyleEnum(city.architecture_style),
                globalLocation: city.global_location
            };

        // 2. Fetch Sectors. If the city table is empty or disconnected, fall back to all sectors
        // so the public scene contract still returns a useful Web3D payload.
        let sectorQuery = supabase.from('sectors').select('*');
        if (!cityError && city) {
            sectorQuery = sectorQuery.eq('city_id', city.id);
        }

        const { data: initialSectors, error: sectorError } = await sectorQuery;
        let sectors = initialSectors;

        if (sectorError) throw sectorError;
        if (!sectors || sectors.length === 0) {
            const fallbackSectorsResult = await supabase
                .from('sectors')
                .select('*')
                .order('created_at', { ascending: true });

            if (fallbackSectorsResult.error) throw fallbackSectorsResult.error;
            sectors = fallbackSectorsResult.data || [];
        }

        if (!sectors || sectors.length === 0) {
            throw new Error('No sectors found');
        }

        // 3. Fetch Companies & Booths
        const sectorIds = sectors.map((s: any) => s.id);
        let companyQuery = supabase
            .from('companies')
            .select('*, booths(*)')
            .eq('is_active', true);

        if (sectorIds.length > 0) {
            companyQuery = companyQuery.in('sector_id', sectorIds);
        }

        const { data: companies, error: companyError } = await companyQuery;

        if (companyError) throw companyError;
        const managedBooths = await fetchManagedBoothsForScreenContent(supabase);
        const managedScreenContentIndex = buildManagedBoothScreenContentIndex(managedBooths);
        const sortedCompanies = [...(companies || [])].sort(compareCompanies);
        const uniqueSlugMap = buildUniqueSlugMap(sortedCompanies);

        // 4. Format Response for UE5
        const response = buildExpoSceneResponse({
            cityInfo: resolvedCity,
            sectors: sectors
                .map((s: any) => ({
                id: s.id,
                name: s.name,
                color_theme: s.color_theme,
                map_position: s.map_position
                }))
                .sort((left: any, right: any) => String(left.id).localeCompare(String(right.id))),
            companies: sortedCompanies.map((c: any) => {
                const sponsorTier = normalizeSponsorTier(c.sponsor_tier);
                const booth = normalizeBoothRelation(c.booths);
                const boothType = normalizeBoothType(c.booth_type ?? booth?.booth_type, sponsorTier);
                const slug = uniqueSlugMap.get(String(c.id)) || normalizeCompanySlug(c);

                return {
                id: c.id,
                sectorId: c.sector_id,
                name: c.name,
                logo_url: normalizeReleaseMediaUrl(c.logo_url),
                slug,
                tagline: normalizeNullableString(c.tagline),
                website: normalizeNullableString(c.website),
                bookingUrl: normalizeNullableString(c.booking_url),
                sponsorTier,
                priority: normalizePriority(c.priority),
                boothType,
                ctaLabel: normalizeNullableString(c.cta_label ?? booth?.cta_label),
                posterUrl: normalizeReleaseMediaUrl(c.poster_url ?? booth?.poster_url),
                heroAssetUrl: normalizeReleaseMediaUrl(c.hero_asset_url ?? booth?.hero_asset_url),
                currentRevenue: c.current_revenue || 0,
                activityScore: c.activity_score || 0.5,
                activeEmployees: c.employee_count || 0
                };
            }),
            booths: sortedCompanies.map((c: any) => {
                const sponsorTier = normalizeSponsorTier(c.sponsor_tier);
                const booth = normalizeBoothRelation(c.booths);
                const slug = uniqueSlugMap.get(String(c.id)) || normalizeCompanySlug(c);
                const managedScreenContent = getManagedScreenContentForSceneBooth(managedScreenContentIndex, booth, { ...c, slug });
                return {
                id: booth?.id || `booth_${c.id}`,
                companyId: c.id,
                boothType: normalizeBoothType(c.booth_type ?? booth?.booth_type, sponsorTier),
                model_url: normalizeReleaseMediaUrl(booth?.model_url),
                video_url: normalizeReleaseMediaUrl(booth?.video_url),
                posterUrl: normalizeReleaseMediaUrl(c.poster_url ?? booth?.poster_url),
                heroAssetUrl: normalizeReleaseMediaUrl(c.hero_asset_url ?? booth?.hero_asset_url),
                showroomEnabled: booth?.showroom_enabled === true,
                heroScreenType: normalizeNullableString(booth?.hero_screen_type ?? managedScreenContent.mode ?? managedScreenContent.mediaType ?? managedScreenContent.media_type),
                heroScreenImageUrl: normalizeReleaseMediaUrl(booth?.hero_screen_image_url ?? managedScreenContent.imageUrl ?? managedScreenContent.image_url ?? managedScreenContent.assetUrl ?? managedScreenContent.asset_url),
                heroScreenStatus: normalizeNullableString(booth?.hero_screen_status ?? managedScreenContent.status),
                heroScreenVideoUrl: normalizeReleaseMediaUrl(booth?.hero_screen_video_url ?? managedScreenContent.videoUrl ?? managedScreenContent.video_url),
                heroScreenTitle: normalizeNullableString(booth?.hero_screen_title ?? managedScreenContent.title),
                heroScreenText: normalizeNullableString(booth?.hero_screen_text ?? managedScreenContent.subtitle ?? managedScreenContent.text),
                featuredAssetType: normalizeNullableString(booth?.featured_asset_type),
                featuredAssetUrl: normalizeReleaseMediaUrl(booth?.featured_asset_url),
                featuredAssetTitle: normalizeNullableString(booth?.featured_asset_title),
                featuredAssetDescription: normalizeNullableString(booth?.featured_asset_description),
                ctaLabel: normalizeNullableString(c.cta_label ?? booth?.cta_label),
                slug
                };
            })
        });

        res.status(200).json(response);
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.error("ExpoScene Error:", error);
        }
        const statusCode = getExpoSceneErrorStatus(error);
        res.status(statusCode).json({ error: error.message });
    }
};

export const getExpoScene = createGetExpoScene(getSupabase);

export const getPixelStreamingRuntimeStatus = async (req: Request, res: Response) => {
    try {
        const boothId = typeof req.query.boothId === 'string' && req.query.boothId.trim().length > 0
            ? req.query.boothId.trim()
            : null;
        const slug = typeof req.query.slug === 'string' && req.query.slug.trim().length > 0
            ? req.query.slug.trim()
            : null;
        const streamingLevel = typeof req.query.streamingLevel === 'string' && req.query.streamingLevel.trim().length > 0
            ? req.query.streamingLevel.trim()
            : null;

        const status = await getPixelStreamingStatus({
            boothId,
            slug,
            streamingLevel,
        });
        res.status(200).json(status);
    } catch (error: any) {
        console.error("PixelStreamingStatus Error:", error);
        res.status(500).json({
            signaling: 'unknown',
            streamer: 'unknown',
            turn_ice: 'turn_unknown',
            readiness: 'unknown',
            checkedAt: new Date().toISOString(),
            warnings: ['STATUS_ENDPOINT_FAILED'],
            streamerCount: null,
            gatewayReachable: false,
            session: {
                sessionMode: 'single_instance',
                selectionPolicy: 'booth_preferred',
                activeStreamerId: null
            }
        });
    }
};

export const createPixelStreamingSession = async (req: Request, res: Response) => {
    try {
        const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};
        const session = await reservePixelStreamingSession({
            boothId: typeof body.boothId === 'string' && body.boothId.trim().length > 0 ? body.boothId.trim() : null,
            slug: typeof body.slug === 'string' && body.slug.trim().length > 0 ? body.slug.trim() : null,
            streamingLevel: typeof body.streamingLevel === 'string' && body.streamingLevel.trim().length > 0 ? body.streamingLevel.trim() : null,
            sessionId: typeof body.sessionId === 'string' && body.sessionId.trim().length > 0 ? body.sessionId.trim() : null,
            allowSharedFallback: body.allowSharedFallback !== false,
        });

        res.status(session.status === 'ready' ? 200 : 202).json(session);
    } catch (error: any) {
        console.error("PixelStreamingSession Error:", error);
        res.status(500).json({
            error: 'PIXEL_STREAMING_SESSION_FAILED',
        });
    }
};
