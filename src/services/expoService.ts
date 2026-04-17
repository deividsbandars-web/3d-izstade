import { supabase } from '../core/supabase';
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
