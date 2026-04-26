import { logger } from '../../logging/logger.js';
import { leadSourceCollectionService } from '../sources/leadSourceCollectionService.js';
import { leadValidationService } from '../validation/leadValidationService.js';
import { leadScoring } from '../leadScoring.js';
import { leadService } from '../leadService.js';
import { leadEventService } from '../events/leadEventService.js';
import { leadAgentSchedulingService } from '../agents/leadAgentSchedulingService.js';

export const leadEngine = {
  /**
   * 1. Collect leads from multiple REAL sources
   */
  async collectLeads(industry: string, location: string, limitPerSource: number = 5) {
    return leadSourceCollectionService.collectLeadsFromSources(industry, location, limitPerSource);
  },

  /**
   * 3. Process (Collect -> Validate -> Score -> Store)
   */
  async processAndStoreLeads(industry: string, location: string, userId?: string) {
    try {
      logger.info('LeadEngine', `Processing and storing REAL leads for ${industry}`);
      const collection = await this.collectLeads(industry, location);
      const leads = collection.data || [];

      const validLeads = leads.filter((lead) => leadValidationService.validateLead(lead));
      const storedLeads = [];

      for (const lead of validLeads) {
        const score = leadScoring.scoreLead(lead);
        const { data, error } = await leadService.persistCollectedLead(lead, score, userId);

        if (!error && data) {
          storedLeads.push(data);
          await leadEventService.publishLeadCreated(data.id, score, industry);
        } else if (error) {
          logger.warn('LeadEngine', `Failed to store lead: ${error.message}`);
        }
      }

      logger.info('LeadEngine', `Successfully processed ${storedLeads.length} valid leads`);
      return { data: storedLeads, error: null };
    } catch (error) {
      logger.error('LeadEngine', 'Failed to process leads', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * 4. Assign a lead to a sales agent by creating a task
   */
  async assignLead(leadId: string, salesAgentId: string) {
    try {
      logger.info('LeadEngine', `Assigning lead ${leadId} to agent ${salesAgentId}`);
      const taskResult = await leadAgentSchedulingService.scheduleLeadOutreach(leadId, salesAgentId);

      return { data: taskResult.data, error: null };
    } catch (error) {
      logger.error('LeadEngine', 'Failed to assign lead', error);
      return { data: null, error: String(error) };
    }
  }
};
