import { logger } from '../logging/logger.js';
import { serpApiSearchService } from './serpApiSearchService.js';

export const googleSearchService = {
  /**
   * Performs an actual Google search to gather market data using SerpAPI.
   */
  async search(query: string, limit: number = 5) {
    try {
      logger.info('GoogleSearchService', `Performing REAL search for: ${query}`);
      
      const response = await serpApiSearchService.search({
        engine: "google",
        q: query,
        num: limit
      });

      if (response.error || !response.data) {
        throw new Error(response.error || 'No data received from SerpAPI');
      }

      const results = (response.data.organic_results || []).map((res: any) => ({
        title: res.title,
        url: res.link,
        snippet: res.snippet,
      }));

      return { data: results, error: null };
    } catch (error) {
      logger.error('GoogleSearchService', 'Search failed', error);
      return { data: null, error: String(error) };
    }
  }
};
