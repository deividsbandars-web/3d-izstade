import { logger } from '../../logging/logger.js';
import { serpApiSearchService } from '../../dataSources/serpApiSearchService.js';

export const linkedinLeadSource = {
  /**
   * Fetches real LinkedIn leads using SerpAPI (Google search targeted at LinkedIn)
   */
  async fetchLeads(industry: string, location: string, limit: number = 10) {
    try {
      logger.info('LinkedinLeadSource', `Searching LinkedIn for: ${industry} in ${location}`);
      
      // Target public LinkedIn company pages
      const response = await serpApiSearchService.search({
        engine: "google",
        q: `site:linkedin.com/company "${industry}" "${location}"`,
        num: limit
      });

      if (response.error || !response.data) {
        throw new Error(response.error || 'No data received from SerpAPI');
      }

      const results = response.data.organic_results || [];
      
      const leads = results.map((res: any) => ({
        company_name: res.title.replace(' | LinkedIn', '').split(':')[0],
        website: res.link || '',
        email: '', // Hard to guess from LinkedIn link without visiting
        phone: '',
        location: location,
        source: 'LinkedIn (SerpAPI)'
      }));

      return { data: leads, error: null };
    } catch (error) {
      logger.error('LinkedinLeadSource', 'Failed to fetch leads', error);
      return { data: null, error: String(error) };
    }
  }
};
