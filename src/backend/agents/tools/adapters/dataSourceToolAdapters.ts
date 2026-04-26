import { serpApiHelper } from '../../../leads/sources/serpApiHelper.js';
import { websiteScraper } from '../../../dataSources/websiteScraper.js';

export const dataSourceToolAdapters = {
  async searchWeb(query: string) {
    const result = await serpApiHelper.search({ q: query, engine: 'google' });
    return result.data?.organic_results?.slice(0, 5) || 'No results found.';
  },

  async scrapeWebsite(url: string) {
    const result = await websiteScraper.scrapeText(url);
    return result.data || 'Failed to scrape website.';
  },
};

