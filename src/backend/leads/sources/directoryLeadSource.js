import { logger } from '../../logging/logger.js';
import { serpApiHelper } from './serpApiHelper.js';
export const directoryLeadSource = {
    /**
     * Fetches real directory leads using SerpAPI (targeting YellowPages/Yelp via Google)
     */
    async fetchLeads(industry, location, limit = 10) {
        try {
            logger.info('DirectoryLeadSource', `Searching directories for: ${industry} in ${location}`);
            // Real strategy: use Google search engine to target business directories
            const response = await serpApiHelper.search({
                engine: "google",
                q: `site:yellowpages.com OR site:yelp.com "${industry}" "${location}"`,
                num: limit
            });
            if (response.error || !response.data) {
                throw new Error(response.error || 'No data received from SerpAPI');
            }
            const results = response.data.organic_results || [];
            const leads = results.map((res) => ({
                company_name: res.title.split(' - ')[0],
                website: res.link || '',
                email: serpApiHelper.guessEmail(res.link, res.title),
                phone: '', // Google organic results don't usually have phone, would need deeper scraping
                location: location,
                source: 'Directory (SerpAPI)'
            }));
            return { data: leads, error: null };
        }
        catch (error) {
            logger.error('DirectoryLeadSource', 'Failed to fetch leads', error);
            return { data: null, error: String(error) };
        }
    }
};
