import { supabaseClient } from '../lib/supabaseClient.js';
import { serverApiGet, serverApiPatch, serverApiPost } from './serverApi.js';

export const LeadsAPI = {
  createCalculatorLead: async (payload: unknown) => serverApiPost('/api/calculator/lead', payload),
  createLead: async (payload: unknown) => serverApiPost('/api/leads', payload),
  getCalculatorLeads: async () => serverApiGet('/api/calculator/leads'),
  updateCalculatorLead: async (leadId: string, payload: unknown) => serverApiPatch(`/api/calculator/leads/${leadId}`, payload),
  updateLead: async (leadId: string, payload: unknown) => serverApiPatch(`/api/leads/${leadId}`, payload),
  getLeadsBySource: async (source: string) => serverApiPost('/api/leads/by-source', { source }),

  async getLeads() {
    try {
      const { data, error } = await supabaseClient.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching leads:', error);
      return { data: null, error: String(error) };
    }
  },

  generateLeads: async (industry: string, location: string) =>
    serverApiPost('/api/leads/generate', { industry, location }),

  async updateLeadStatus(leadId: string, status: string, contacted: boolean = false) {
    try {
      const { data, error } = await supabaseClient
        .from('leads')
        .update({ status, contacted })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating lead status:', error);
      return { data: null, error: String(error) };
    }
  },
};
