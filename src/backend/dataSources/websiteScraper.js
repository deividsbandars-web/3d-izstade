import { logger } from '../logging/logger.js';
export const websiteScraper = {
    /**
     * Scrapes website content to extract text for AI analysis.
     * In production, this can be upgraded to use Firecrawl or a Puppeteer-based server.
     */
    async scrapeText(url) {
        try {
            logger.info('WebsiteScraper', `Scraping REAL content from: ${url}`);
            // Heuristic: Use a public CORS-friendly markdown extractor or direct fetch if on server
            // For the backend-server, direct fetch works.
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'WarpalaBot/1.0 (AI Business OS)'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch website: ${response.statusText}`);
            }
            const html = await response.text();
            // Clean HTML to get text (Basic implementation)
            const text = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .substring(0, 10000); // Limit to 10k chars for LLM safety
            return { data: text, error: null };
        }
        catch (error) {
            logger.error('WebsiteScraper', `Failed to scrape ${url}`, error);
            // Fallback: If direct fetch fails (CORS in browser), return error
            return { data: null, error: String(error) };
        }
    }
};
