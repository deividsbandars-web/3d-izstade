import { MarketplaceAPI } from '../../services/marketplace';
import { clientLogger as logger } from '../../lib/clientLogger';

export const marketplaceDashboardService = {
  /**
   * Gets available agents for the UI marketplace listing
   */
  async getMarketplaceAgents() {
    try {
      logger.info('MarketplaceDashboardService', 'Fetching marketplace agents for UI');
      return await MarketplaceAPI.getAgents();
    } catch (error) {
      logger.error('MarketplaceDashboardService', 'Failed to fetch agents', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Proxies agent installation from the UI
   */
  async installAgent(userId: string, agentId: string) {
    try {
      logger.info('MarketplaceDashboardService', `User ${userId} installing agent ${agentId}`);
      return await MarketplaceAPI.installAgent(userId, agentId);
    } catch (error) {
      logger.error('MarketplaceDashboardService', 'Failed to install agent', error);
      return { success: false, data: null, error: String(error) };
    }
  },

  /**
   * Gets available workflows for the UI marketplace listing
   */
  async getMarketplaceWorkflows() {
    try {
      logger.info('MarketplaceDashboardService', 'Fetching marketplace workflows for UI');
      return await MarketplaceAPI.getWorkflows();
    } catch (error) {
      logger.error('MarketplaceDashboardService', 'Failed to fetch workflows', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Proxies workflow installation from the UI
   */
  async installWorkflow(userId: string, workflowId: string) {
    try {
      logger.info('MarketplaceDashboardService', `User ${userId} installing workflow ${workflowId}`);
      return await MarketplaceAPI.installWorkflow(userId, workflowId);
    } catch (error) {
      logger.error('MarketplaceDashboardService', 'Failed to install workflow', error);
      return { success: false, data: null, error: String(error) };
    }
  }
};
