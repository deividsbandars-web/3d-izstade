import { supabaseClient } from '../../lib/supabaseClient.js';
import { leadEngine } from './engine/leadEngine.js';

type LeadPayload = Record<string, unknown>;

export const leadsApplicationService = {
  async getLeadsForUser(userId?: string) {
    const { data, error } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('user_id', userId ?? null)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async generateLeads(industry: string, location: string, userId?: string) {
    return leadEngine.processAndStoreLeads(industry, location, userId);
  },

  async captureInboundLead(email: string, sourcePageId: string, metadata?: Record<string, unknown>) {
    const { leadCapture } = await import('../growth/leadCapture.js');
    return leadCapture.captureLead(email, sourcePageId, metadata);
  },

  async createLeadForUser(userId: string | undefined, payload: LeadPayload) {
    const { data, error } = await supabaseClient
      .from('leads')
      .insert([{ ...payload, user_id: userId ?? null }])
      .select()
      .single();

    return { data, error };
  },

  async updateLeadForUser(userId: string | undefined, leadId: string, payload: LeadPayload) {
    const { data, error } = await supabaseClient
      .from('leads')
      .update(payload)
      .eq('id', leadId)
      .eq('user_id', userId ?? null)
      .select()
      .single();

    return { data, error };
  },

  async getLeadsBySourceForUser(userId: string | undefined, source: string) {
    const { data, error } = await supabaseClient
      .from('leads')
      .select('*')
      .eq('user_id', userId ?? null)
      .ilike('source', `%${source}%`)
      .order('created_at', { ascending: false });

    return { data, error };
  },
};
