import { supabase } from '../core/supabase';
import {
  CALCULATOR_CATEGORY_DEFINITIONS,
  type CalculatorCategoryId,
} from '../core/calculator';
import {
  EXPO_SCENE_CANONICAL_DISTRICTS,
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
} from '../modules/expo/types/scene';

export interface Sector {
  id: string;
  name: string;
  description: string;
  color_theme: string;
  map_position: { x: number; y: number; z: number };
}

export interface Company {
  id: string;
  sector_id: string;
  name: string;
  description: string;
  logo_url: string;
  website: string;
  location: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  booth?: Booth;
}

export interface Booth {
  id: string;
  company_id: string;
  video_url: string;
  images: string[];
  services: any[];
  products: any[];
}

export interface ExpoCanonicalDistrictDefinition {
  id: (typeof EXPO_SCENE_CANONICAL_DISTRICTS)[number];
  name: string;
  icon: string;
  color: string;
  description: string;
  calculatorCategories: readonly CalculatorCategoryId[];
}

export interface ExpoBusinessSceneAdapterSector extends Sector {
  canonicalDistrictId: ExpoCanonicalDistrictDefinition['id'];
  calculatorCategories: readonly CalculatorCategoryId[];
}

export interface ExpoBusinessSceneAdapterCompany extends Company {
  booth: Booth | undefined;
  canonicalDistrictId: ExpoCanonicalDistrictDefinition['id'];
  calculatorCategories: readonly CalculatorCategoryId[];
}

export interface ExpoBusinessSceneAdapterPayload {
  calculatorCategories: readonly CalculatorCategoryId[];
  companies: ExpoBusinessSceneAdapterCompany[];
  contractVersion: typeof EXPO_SCENE_CONTRACT_VERSION;
  districts: readonly ExpoCanonicalDistrictDefinition[];
  releaseMode: typeof EXPO_SCENE_RELEASE_MODE;
  sectors: ExpoBusinessSceneAdapterSector[];
}

export const EXPO_CANONICAL_DISTRICT_CATALOG: readonly ExpoCanonicalDistrictDefinition[] = [
  {
    id: 'architecture',
    name: 'Architecture & Spatial Design',
    icon: '🏛️',
    color: '#8b5cf6',
    description: 'Architecti, interior, design systems, planning, premium concept studios.',
    calculatorCategories: ['designer', 'interior', 'visuals', 'digital_art']
  },
  {
    id: 'construction',
    name: 'Construction & Build',
    icon: '🏗️',
    color: '#eab308',
    description: 'Builders, renovation, foundations, roofs, windows, site delivery.',
    calculatorCategories: ['renovation', 'roof', 'foundation', 'timber_house', 'windows']
  },
  {
    id: 'materials',
    name: 'Materials & Engineering',
    icon: '🧱',
    color: '#f97316',
    description: 'Building materials, plumbing, heating, technical systems and fit-out supply.',
    calculatorCategories: ['heating', 'plumbing']
  },
  {
    id: 'design',
    name: 'Creative Media & Brand',
    icon: '🎨',
    color: '#ec4899',
    description: 'Creative studios, presentation media, campaigns, visual identity and content.',
    calculatorCategories: ['digital_art', 'visuals', 'designer']
  },
  {
    id: 'real_estate',
    name: 'Real Estate & Property',
    icon: '🏢',
    color: '#10b981',
    description: 'Property, valuation, housing, development, brokerage and commercial space.',
    calculatorCategories: ['housing', 'renovation', 'interior']
  },
  {
    id: 'tech',
    name: 'Technology & Automation',
    icon: '💻',
    color: '#3b82f6',
    description: 'Automation, smart systems, AI-enabled operations and service technology.',
    calculatorCategories: ['heating', 'quick_fix', 'designer']
  },
  {
    id: 'logistics',
    name: 'Logistics & Field Services',
    icon: '🚚',
    color: '#06b6d4',
    description: 'Logistics, cleaning, autoservice, maintenance and rapid-response field work.',
    calculatorCategories: ['logistics', 'cleaning', 'autoservice', 'quick_fix']
  }
] as const;

const DISTRICT_NAME_KEYWORDS: Record<ExpoCanonicalDistrictDefinition['id'], string[]> = {
  architecture: ['architecture', 'architect', 'spatial', 'design', 'interior'],
  construction: ['construction', 'build', 'renovation', 'roof', 'window', 'foundation'],
  materials: ['material', 'heating', 'plumbing', 'engineering', 'supply'],
  design: ['media', 'brand', 'creative', 'art', 'visual'],
  real_estate: ['real estate', 'property', 'housing', 'estate'],
  tech: ['tech', 'technology', 'automation', 'ai', 'smart'],
  logistics: ['logistics', 'transport', 'cleaning', 'maintenance', 'auto', 'service']
};

function getFallbackDistrictCatalogEntry(index: number) {
  return EXPO_CANONICAL_DISTRICT_CATALOG[index % EXPO_CANONICAL_DISTRICT_CATALOG.length];
}

export function resolveCanonicalDistrictDefinition(input: { id?: string | null; name?: string | null }, fallbackIndex = 0) {
  const normalizedId = String(input.id || '').trim().toLowerCase();
  const normalizedName = String(input.name || '').trim().toLowerCase();

  const exactById = EXPO_CANONICAL_DISTRICT_CATALOG.find((district) => district.id === normalizedId);
  if (exactById) {
    return exactById;
  }

  const keywordMatch = EXPO_CANONICAL_DISTRICT_CATALOG.find((district) => {
    const keywords = DISTRICT_NAME_KEYWORDS[district.id];
    return keywords.some((keyword) => normalizedId.includes(keyword) || normalizedName.includes(keyword));
  });

  return keywordMatch ?? getFallbackDistrictCatalogEntry(fallbackIndex);
}

function toAdapterSector(sector: Sector, index: number): ExpoBusinessSceneAdapterSector {
  const district = resolveCanonicalDistrictDefinition({ id: sector.id, name: sector.name }, index);
  return {
    ...sector,
    canonicalDistrictId: district.id,
    calculatorCategories: district.calculatorCategories,
  };
}

function toAdapterCompany(company: Company & { booth?: Booth }, fallbackSector: ExpoCanonicalDistrictDefinition): ExpoBusinessSceneAdapterCompany {
  const district = resolveCanonicalDistrictDefinition(
    { id: company.sector_id, name: company.location || company.description || company.name },
    EXPO_CANONICAL_DISTRICT_CATALOG.findIndex((entry) => entry.id === fallbackSector.id),
  );

  return {
    ...company,
    booth: company.booth,
    canonicalDistrictId: district.id,
    calculatorCategories: district.calculatorCategories,
  };
}

export const EXPO_SCENE_SERVICE_META = {
  canonicalDistricts: [...EXPO_SCENE_CANONICAL_DISTRICTS],
  contractVersion: EXPO_SCENE_CONTRACT_VERSION,
  releaseMode: EXPO_SCENE_RELEASE_MODE,
} as const;

export const expoService = {
  // Iegūt visus sektorus
  async getSectors() {
    const { data, error } = await supabase
      .from('sectors')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as Sector[];
  },

  // Iegūt visus uzņēmumus ar to stendu datiem
  async getCompaniesWithBooths() {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        booth:booths(*)
      `)
      .eq('is_active', true);
    
    if (error) throw error;
    return data as (Company & { booth: Booth })[];
  },

  async getSceneAdapterPayload(): Promise<ExpoBusinessSceneAdapterPayload> {
    const [sectors, companies] = await Promise.all([
      this.getSectors(),
      this.getCompaniesWithBooths(),
    ]);

    const adapterSectors = (sectors || []).map((sector, index) => toAdapterSector(sector, index));
    const sectorById = new Map(adapterSectors.map((sector) => [sector.id, sector]));

    const adapterCompanies = (companies || []).map((company) => {
      const fallbackSector = sectorById.get(company.sector_id) ?? adapterSectors[0] ?? getFallbackDistrictCatalogEntry(0);
      return toAdapterCompany(company, resolveCanonicalDistrictDefinition({ id: fallbackSector?.canonicalDistrictId, name: fallbackSector?.name }));
    });

    return {
      calculatorCategories: CALCULATOR_CATEGORY_DEFINITIONS.map((entry) => entry.id),
      companies: adapterCompanies,
      contractVersion: EXPO_SCENE_CONTRACT_VERSION,
      districts: EXPO_CANONICAL_DISTRICT_CATALOG,
      releaseMode: EXPO_SCENE_RELEASE_MODE,
      sectors: adapterSectors,
    };
  },

  // Nosūtīt pakalpojuma pieprasījumu (Lead)
  async sendRequest(request: { company_id: string; service_name: string; client_name: string; client_email: string; message: string }) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request]);
    
    if (error) throw error;
    return data;
  },

  // MARKETPLACE
  async getMarketplaceServices(category?: string) {
    let query = supabase.from('marketplace_services').select('*, company:companies(name)');
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    const { data, error } = await query.eq('is_active', true);
    if (error) throw error;
    return data;
  },

  // REAL-TIME CHAT
  async getMessages(limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data.reverse();
  },

  async sendMessage(content: string, isAi = false) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ content, is_ai: isAi }]);
    if (error) throw error;
    return data;
  },

  subscribeToChat(callback: (payload: any) => void) {
    return supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, callback)
      .subscribe();
  },

  // Iegūt visus pieprasījumus konkrētam uzņēmumam
  async getServiceRequests(companyId: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * REĢISTRĒ AI ĢENERĒTU BIZNESU EXPO PILSĒTĀ
   */
  async registerAiBusiness(businessData: { 
    name: string; 
    description: string; 
    category: string;
    products: any[];
    campaign: any;
  }) {
    try {
      // 1. Noteikt kategoriju priekš 3D interjera
      const niche = businessData.category.toLowerCase();
      let internalCategory = 'tech';
      if (niche.includes('build') || niche.includes('construction') || niche.includes('eco')) internalCategory = 'building';
      if (niche.includes('design') || niche.includes('art') || niche.includes('furniture')) internalCategory = 'design';
      if (niche.includes('sos') || niche.includes('emergency') || niche.includes('repair')) internalCategory = 'emergency';

      // 2. Atrodam atbilstošo sektoru
      const sectors = await this.getSectors();
      const sector = sectors?.find(s => 
        niche.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(niche)
      ) || sectors?.find(s => s.name === 'Tech Zone');

      // 3. Izveidojam uzņēmuma profilu
      const { data: company, error: compError } = await supabase
        .from('companies')
        .insert([{
          name: businessData.name,
          description: businessData.description,
          sector_id: sector?.id,
          tier: 'pro',
          location: 'AI District, Warpala City',
          is_active: true,
          contact_email: `contact@${businessData.name.toLowerCase().replace(/\s+/g, '')}.ai`
        }])
        .select()
        .single();

      if (compError) throw compError;

      // 4. Izveidojam stendu (Booth)
      const { error: boothError } = await supabase
        .from('booths')
        .insert([{
          company_id: company.id,
          video_url: 'https://vjs.zencdn.net/v/oceans.mp4',
          products: businessData.products,
          services: businessData.campaign.assets,
          // Šeit mēs saglabājam kategoriju priekš BoothRoom.tsx
          images: [internalCategory] // Pagaidām izmantojam pirmo bildi kā kategorijas identifikatoru vai pievienojam jaunu kolonnu nākotnē
        }]);

      if (boothError) throw boothError;

      return { success: true, companyId: company.id };
    } catch (error) {
      console.error('Failed to register AI business in Expo:', error);
      return { success: false, error };
    }
  }
};
