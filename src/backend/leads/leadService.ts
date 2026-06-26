import { supabaseClient, handleSupabaseError } from '../../lib/supabaseClient.js';

export interface Lead {
  id?: string;
  source: string;
  contact_info: Record<string, any>;
  status?: string;
  value?: number;
  score?: number;
  contacted?: boolean;
  user_id?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const leadService = {
  /**
   * Creates a new lead in the database
   */
  async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'createLead');
    }
  },

  /**
   * Persists a collected lead produced by leadEngine without changing its payload shape.
   */
  async persistCollectedLead(lead: Record<string, any>, score: number, userId?: string) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .insert([{
          source: lead.source || 'LeadEngine (SerpAPI)',
          contact_info: lead,
          status: 'new',
          score,
          contacted: false,
          user_id: userId || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'persistCollectedLead');
    }
  },

  /**
   * Updates an existing lead
   */
  async updateLead(id: string, updates: Partial<Lead>) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'updateLead');
    }
  },

  /**
   * Retrieves leads filtered by their source
   */
  async getLeadsBySource(source: string) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('source', source)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'getLeadsBySource');
    }
  }
};
