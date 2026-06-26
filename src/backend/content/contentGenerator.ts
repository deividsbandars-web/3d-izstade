import { llmService } from '../ai/llmService.js';
import { logger } from '../logging/logger.js';

export const contentGenerator = {
  /**
   * Generates landing page copy and structure based on a business brief
   */
  async generateLandingPage(brief: string) {
    try {
      logger.info('ContentGenerator', 'Generating Landing Page', { brief });
      const prompt = `Create a high-converting landing page structure and copy for the following business: ${brief}. Include Hero, Features, Testimonials, and Call to Action.`;
      
      const { text, error } = await llmService.generateText(prompt);
      if (error) throw new Error(error);

      return { data: text, error: null };
    } catch (error) {
      logger.error('ContentGenerator', 'Failed to generate landing page', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Generates an SEO optimized article
   */
  async generateSEOArticle(topic: string, keywords: string[]) {
    try {
      logger.info('ContentGenerator', 'Generating SEO Article', { topic });
      const prompt = `Write a professional, SEO-optimized blog article about "${topic}". Ensure the following keywords are naturally integrated: ${keywords.join(', ')}.`;
      
      const { text, error } = await llmService.generateText(prompt);
      if (error) throw new Error(error);

      return { data: text, error: null };
    } catch (error) {
      logger.error('ContentGenerator', 'Failed to generate SEO article', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Generates short-form Ad Copy for platforms like Facebook or Google
   */
  async generateAdCopy(product: string, targetAudience: string) {
    try {
      logger.info('ContentGenerator', 'Generating Ad Copy', { product });
      const prompt = `Write 3 variations of punchy, conversion-focused ad copy for a product called "${product}". The target audience is: ${targetAudience}. Provide a Headline, Primary Text, and CTA for each.`;
      
      const { text, error } = await llmService.generateText(prompt);
      if (error) throw new Error(error);

      return { data: text, error: null };
    } catch (error) {
      logger.error('ContentGenerator', 'Failed to generate ad copy', error);
      return { data: null, error: String(error) };
    }
  }
};
