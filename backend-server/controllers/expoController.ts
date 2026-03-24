import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import { getPixelStreamingStatus } from '../services/pixelStreamingStatus.js';

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
export const getExpoScene = async (req: Request, res: Response) => {
    try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("Supabase not configured");

        const cityId = req.query.cityId as string;

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

        // 4. Format Response for UE5
        const response = {
            cityInfo: resolvedCity,
            sectors: sectors.map((s: any) => ({
                id: s.id,
                name: s.name,
                color_theme: s.color_theme,
                map_position: s.map_position
            })),
            companies: companies.map((c: any) => ({
                id: c.id,
                sectorId: c.sector_id,
                name: c.name,
                logo_url: c.logo_url || "",
                currentRevenue: c.current_revenue || 0,
                activityScore: c.activity_score || 0.5,
                activeEmployees: c.employee_count || 0
            })),
            booths: companies.map((c: any) => ({
                id: normalizeBoothRelation(c.booths)?.id || `booth_${c.id}`,
                companyId: c.id,
                model_url: normalizeBoothRelation(c.booths)?.model_url || "L_Booth_Default",
                video_url: normalizeBoothRelation(c.booths)?.video_url || ""
            }))
        };

        res.status(200).json(response);
    } catch (error: any) {
        console.error("ExpoScene Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getPixelStreamingRuntimeStatus = async (_req: Request, res: Response) => {
    try {
        const status = await getPixelStreamingStatus();
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
                selectionPolicy: 'first_available',
                activeStreamerId: null
            }
        });
    }
};
