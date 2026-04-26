import { leadEngine } from '../../../leads/engine/leadEngine.js';

export const leadToolAdapters = {
  async findLeads(industry: string, location: string) {
    const result = await leadEngine.processAndStoreLeads(industry, location);
    return result.data || 'Failed to find leads.';
  },
};

