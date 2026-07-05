import { supabaseClient } from '../lib/supabaseClient.js';
import { serverApiPost } from './serverApi.js';

export const BusinessSystemAPI = {
  generateBusiness: async (payload: unknown) => serverApiPost('/api/business/generate', payload),

  async getGeneratedBusinesses() {
    try {
      const { data, error } = await supabaseClient
        .from('projects')
        .select('*')
        .contains('metadata', { generated_by: 'ai_system' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching generated businesses', error);
      return { data: null, error: String(error) };
    }
  },
};
