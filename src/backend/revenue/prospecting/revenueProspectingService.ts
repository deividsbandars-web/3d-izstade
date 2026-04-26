import { logger } from '../../logging/logger.js';
import { supabaseClient } from '../../../lib/supabaseClient.js';
import { prospectingAdapters } from './prospectingAdapters.js';
import type { RevenueProspectingRequest, RevenueProspectingResult, StoredProspect } from './prospectingTypes.js';

export const revenueProspectingService = {
  async findProspects(request: RevenueProspectingRequest): Promise<RevenueProspectingResult> {
    try {
      const { niche, location, limit = 10 } = request;
      logger.info('RevenueProspectingService', `Finding prospects for: ${niche} in ${location}`);

      const leads = await prospectingAdapters.findProspectLeads(niche, location, limit);
      if (leads.error || !leads.data) {
        throw new Error(leads.error || 'Failed to fetch prospect data');
      }

      const storedProspects = [];

      for (const lead of leads.data) {
        const payload: StoredProspect = {
          company_name: lead.company_name,
          website: lead.website || '',
          email: lead.email || '',
          industry: niche,
          location: lead.location || location,
          status: 'new',
        };

        const { data, error } = await supabaseClient
          .from('prospects')
          .insert([payload])
          .select()
          .single();

        if (error) {
          logger.warn('RevenueProspectingService', `Failed to store prospect: ${error.message}`);
          continue;
        }

        storedProspects.push(data);
      }

      logger.info('RevenueProspectingService', `Successfully discovered and stored ${storedProspects.length} prospects`);
      return { data: storedProspects, error: null };
    } catch (error) {
      logger.error('RevenueProspectingService', 'Prospecting failed', error);
      return { data: null, error: String(error) };
    }
  },
};
