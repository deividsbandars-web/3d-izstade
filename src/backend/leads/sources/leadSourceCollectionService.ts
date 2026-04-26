import { logger } from '../../logging/logger.js';
import { googleMapsLeadSource } from './googleMapsLeadSource.js';
import { directoryLeadSource } from './directoryLeadSource.js';
import { linkedinLeadSource } from './linkedinLeadSource.js';

async function pauseBetweenSources() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export const leadSourceCollectionService = {
  async collectLeadsFromSources(industry: string, location: string, limitPerSource: number = 5) {
    try {
      logger.info('LeadSourceCollectionService', `Starting REAL lead collection for ${industry} in ${location}`);

      const maps = await googleMapsLeadSource.fetchLeads(industry, location, limitPerSource);
      await pauseBetweenSources();

      const directory = await directoryLeadSource.fetchLeads(industry, location, limitPerSource);
      await pauseBetweenSources();

      const linkedin = await linkedinLeadSource.fetchLeads(industry, location, limitPerSource);

      const allLeads = [
        ...(maps.data || []),
        ...(directory.data || []),
        ...(linkedin.data || []),
      ];

      logger.info('LeadSourceCollectionService', `Total leads collected: ${allLeads.length}`);
      return { data: allLeads, error: null };
    } catch (error) {
      logger.error('LeadSourceCollectionService', 'Failed to collect leads', error);
      return { data: [], error: String(error) };
    }
  },
};
