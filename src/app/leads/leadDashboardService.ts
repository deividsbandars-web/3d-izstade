import { LeadsAPI } from '../../services/leads';
import { clientLogger as logger } from '../../lib/clientLogger';
import { supabaseClient } from '../../lib/supabaseClient';

export const leadDashboardService = {
  /**
   * Retrieves leads, optionally filtering by status
   */
  async getLeads(statusFilter?: string) {
    try {
      logger.info('LeadDashboardService', 'Fetching leads for dashboard UI');
      const response = await LeadsAPI.getLeads();
      
      if (response.error) throw new Error(response.error);
      
      const leads = response.data || [];
      if (statusFilter) {
        return { data: leads.filter(l => l.status === statusFilter), error: null };
      }
      return { data: leads, error: null };
    } catch (error) {
      logger.error('LeadDashboardService', 'Failed to fetch leads', error);
      return { data: [], error: String(error) };
    }
  },

  /**
   * Gets specific statistics for the leads panel
   */
  async getLeadStats() {
    try {
      logger.info('LeadDashboardService', 'Fetching lead stats');
      const { data: leads, error } = await supabaseClient.from('leads').select('status, score, contacted');
      if (error) throw error;

      const stats = {
        total: leads?.length || 0,
        contacted: leads?.filter(l => l.contacted).length || 0,
        highValue: leads?.filter(l => (l.score || 0) >= 80).length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      logger.error('LeadDashboardService', 'Failed to fetch lead stats', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Manually triggers the lead generation engine
   */
  async runLeadGeneration(industry: string, location: string) {
    try {
      logger.info('LeadDashboardService', `Triggering manual lead generation for ${industry}`);
      return await LeadsAPI.generateLeads(industry, location);
    } catch (error) {
      logger.error('LeadDashboardService', 'Failed to run lead generation', error);
      return { data: null, error: String(error) };
    }
  }
};
