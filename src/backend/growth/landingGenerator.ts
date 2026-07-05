import { createSystemLlmMetering, llmService, type LlmMeteringContext } from '../ai/llmService.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import { eventPublisher } from '../events/eventPublisher.js';
import { PlatformEvent } from '../events/eventTypes.js';

export const landingGenerator = {
  /**
   * Generates a complete landing page copy and structure, then stores it in Supabase.
   */
  async generateLandingPage(
    projectId: string,
    niche: string,
    productAngle: string,
    metering: LlmMeteringContext = createSystemLlmMetering('landing-generator', 'generate-landing-page'),
  ) {
    try {
      logger.info('LandingGenerator', `Generating landing page for niche: ${niche}`);

      const prompt = `You are an elite Copywriter and Conversion Rate Optimization (CRO) expert.
Create a high-converting landing page for a new product targeting the niche: "${niche}".
Product Angle/Value Proposition: "${productAngle}"

Return ONLY a valid JSON object with the following structure:
{
  "title": "Catchy page title",
  "seo_metadata": {
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  },
  "content_html": "<div class='hero'><h1>Main Headline</h1><p>Subheadline...</p></div><div class='features'>...</div>"
}
Ensure the HTML is semantic, uses modern classes, and includes a clear Call To Action (CTA) form section.`;

      const { text, error } = await llmService.generateText(prompt, { metering, temperature: 0.4 });
      if (error || !text) throw new Error(error || 'Failed to generate landing page');

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('LLM did not return valid JSON');

      const pageData = JSON.parse(jsonMatch[0]);

      // Store in Supabase
      const { data, error: dbError } = await supabaseClient
        .from('landing_pages')
        .insert([{
          project_id: projectId,
          niche: niche,
          title: pageData.title,
          seo_metadata: pageData.seo_metadata,
          content_html: pageData.content_html,
          status: 'draft'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      logger.info('LandingGenerator', `Landing page generated and saved with ID: ${data.id}`);
      
      // Publish event
      await eventPublisher.publish(PlatformEvent.LANDING_CREATED, { landingPageId: data.id, projectId, niche });

      return { data, error: null };
    } catch (error) {
      logger.error('LandingGenerator', 'Failed to generate landing page', error);
      return { data: null, error: String(error) };
    }
  }
};
