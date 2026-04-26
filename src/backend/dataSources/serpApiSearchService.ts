import { logger } from '../logging/logger.js';

const getSerpApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.SERPAPI_KEY) {
    return process.env.SERPAPI_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SERPAPI_KEY) {
    return import.meta.env.VITE_SERPAPI_KEY;
  }
  return '';
};

export const serpApiSearchService = {
  async search(params: Record<string, any>) {
    const apiKey = getSerpApiKey();
    if (!apiKey) {
      logger.error('SerpAPI', 'Missing SERPAPI_KEY');
      return { data: null, error: 'SERPAPI_KEY is missing' };
    }

    try {
      const searchParams = new URLSearchParams({
        ...params,
        api_key: apiKey,
      });

      const response = await fetch(`https://serpapi.com/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      logger.error('SerpAPI', 'Search failed', error);
      return { data: null, error: String(error) };
    }
  },
};
