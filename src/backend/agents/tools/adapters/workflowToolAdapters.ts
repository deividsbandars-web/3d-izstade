import { businessGenerator } from '../../../business/businessGenerator.js';

export const workflowToolAdapters = {
  async createBusiness(niche: string) {
    const result = await businessGenerator.launchBusinessWorkflow(niche);
    return result.data || 'Failed to create business.';
  },
};

