import { logger } from '../logging/logger.js';
import { safeFetchText, SafeTextFetchError } from './safeTextFetch.js';

const MAX_SCRAPED_TEXT_CHARACTERS = 10_000;

export function extractWebsiteText(html: string) {
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_SCRAPED_TEXT_CHARACTERS);
}

function getLogHostname(input: string) {
  try {
    return new URL(input).hostname || '<invalid>';
  } catch {
    return '<invalid>';
  }
}

export const websiteScraper = {
  /**
   * Scrapes website content to extract text for AI analysis.
   * In production, this can be upgraded to use Firecrawl or a Puppeteer-based server.
   */
  async scrapeText(url: string) {
    const hostname = getLogHostname(url);
    try {
      logger.info('WebsiteScraper', `Scraping host=${hostname}`);
      const html = await safeFetchText(url);
      const text = extractWebsiteText(html);

      return { data: text, error: null };
    } catch (error) {
      const code = error instanceof SafeTextFetchError ? error.code : 'UNKNOWN_ERROR';
      logger.error('WebsiteScraper', `Scrape failed host=${hostname} code=${code}`);
      return {
        data: null,
        error: error instanceof SafeTextFetchError
          ? `${error.code}: ${error.message}`
          : 'UNKNOWN_ERROR: Website scrape failed',
      };
    }
  }
};
