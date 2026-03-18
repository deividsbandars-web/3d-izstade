import { logger } from '../../logging/logger.js';
import { serpApiHelper } from './serpApiHelper.js';
export const googleMapsLeadSource = {
    /**
     * Fetches real leads from Google Maps using SerpAPI
     */
    async fetchLeads(query, location, limit = 10) {
        try {
            logger.info('GoogleMapsLeadSource', `Fetching real leads for: ${query} in ${location}`);
            const response = await serpApiHelper.search({
                engine: "google_maps",
                q: `${query} in ${location}`,
                type: "search"
            });
            if (response.error || !response.data) {
                throw new Error(response.error || 'No data received from SerpAPI');
            }
            const results = response.data.local_results || [];
            const leads = results.slice(0, limit).map((res) => ({
                company_name: res.title,
                website: res.website || '',
                email: serpApiHelper.guessEmail(res.website, res.title),
                phone: res.phone || '',
                location: res.address || location,
                metadata: {
                    rating: res.rating,
                    reviews: res.reviews,
                    type: res.type,
                    serpapi_id: res.place_id
                }
            }));
            return { data: leads, error: null };
        }
        catch (error) {
            logger.error('GoogleMapsLeadSource', 'Failed to fetch leads', error);
            return { data: null, error: String(error) };
        }
    }
};
