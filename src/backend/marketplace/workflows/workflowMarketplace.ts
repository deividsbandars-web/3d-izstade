import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';

export const workflowMarketplace = {
  /**
   * Retrieves all available workflows from the marketplace
   */
  async getAvailableWorkflows() {
    try {
      logger.info('WorkflowMarketplace', 'Fetching available workflows');
      
      const { data, error } = await supabaseClient
        .from('marketplace_workflows')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Fallback dummy data for bootstrapping
      if (!data || data.length === 0) {
         return {
           data: [
             { id: 'mock-wf-1', workflow_id: 'lead_gen_system', name: 'Lead Generation System', description: 'End-to-end pipeline: Finder -> Scorer -> Closer', price: 50, steps: ['lead_finder', 'sales_closer'] },
             { id: 'mock-wf-2', workflow_id: 'local_biz_marketing', name: 'Local Business Marketing', description: 'Sets up local SEO and Google Maps outreach', price: 30, steps: ['seo_agent', 'marketing_agent'] }
           ],
           error: null
         };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('WorkflowMarketplace', 'Failed to fetch workflows', error);
      return { data: null, error: String(error) };
    }
  }
};
