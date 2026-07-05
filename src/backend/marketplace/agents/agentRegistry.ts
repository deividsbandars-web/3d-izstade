import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';

export const agentRegistry = {
  /**
   * Retrieves all available agents from the marketplace registry
   */
  async getAvailableAgents() {
    try {
      logger.info('AgentRegistry', 'Fetching available marketplace agents');
      
      const { data, error } = await supabaseClient
        .from('marketplace_agents')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Fallback dummy data if table is empty (for bootstrapping)
      if (!data || data.length === 0) {
         return {
           data: [
             { id: 'mock-1', agent_id: 'seo_agent', name: 'SEO Agent', description: 'Optimizes content for search engines', price: 0, category: 'Marketing', capabilities: ['Keyword Research', 'On-page SEO'] },
             { id: 'mock-2', agent_id: 'lead_finder', name: 'Lead Finder', description: 'Automatically scrapes and qualifies leads', price: 10, category: 'Sales', capabilities: ['Scraping', 'Scoring'] },
             { id: 'mock-3', agent_id: 'sales_closer', name: 'Sales Closer', description: 'Drafts cold emails and handles objections', price: 20, category: 'Sales', capabilities: ['Email drafting', 'CRM Sync'] }
           ],
           error: null
         };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('AgentRegistry', 'Failed to fetch agents', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Registers a new agent into the marketplace
   */
  async registerAgent(payload: any) {
    try {
      logger.info('AgentRegistry', `Registering new agent: ${payload.name}`);
      const { data, error } = await supabaseClient
        .from('marketplace_agents')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('AgentRegistry', 'Failed to register agent', error);
      return { data: null, error: String(error) };
    }
  }
};
