import { llmService } from '../ai/llmService.js';
import { serpApiSearchService } from '../dataSources/serpApiSearchService.js';
import { logger } from '../logging/logger.js';

export const nicheDiscovery = {
  /**
   * Discovers profitable niches using SerpAPI trends and LLM analysis.
   */
  async findProfitableNiches(baseIndustry: string): Promise<{ data: any | null, error: string | null }> {
    try {
      logger.info('NicheDiscovery', `Analyzing niches for industry: ${baseIndustry}`);

      // 1. Gather raw data from search engine to see what people are searching for
      const searchData = await serpApiSearchService.search({
        engine: 'google',
        q: `top emerging trends in ${baseIndustry} 2026`,
        num: 5
      });

      const searchContext = searchData.data?.organic_results?.map((r: any) => r.title + " - " + r.snippet).join('\n') || 'No clear trend data found.';

      // 2. Ask LLM to analyze the data and generate structured niches
      const prompt = `You are an expert Business Strategist and AI Growth Engine.
Analyze the following recent search trends for the industry: "${baseIndustry}".

Search Context:
${searchContext}

Based on this data, identify 3 highly profitable and underserved niches.
Respond ONLY with a valid JSON array of objects. Each object must have:
- "niche_name": string
- "description": string
- "competition_score": number (1-100, 100 being highly competitive)
- "demand_score": number (1-100, 100 being extreme demand)
- "suggested_angle": string (How to position the product)`;

      const { text, error } = await llmService.generateText(prompt, { temperature: 0.7 });
      if (error || !text) throw new Error(error || 'Failed to generate niches');

      // Extract JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('LLM did not return a valid JSON array');

      const niches = JSON.parse(jsonMatch[0]);

      logger.info('NicheDiscovery', `Successfully discovered ${niches.length} niches`);
      return { data: niches, error: null };
    } catch (error) {
      logger.error('NicheDiscovery', 'Failed to discover niches', error);
      return { data: null, error: String(error) };
    }
  }
};
