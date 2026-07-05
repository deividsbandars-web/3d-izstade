import { createSystemLlmMetering, llmService } from '../ai/llmService.js';
import { websiteScraper } from '../dataSources/websiteScraper.js';
import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';

export const offerGenerator = {
  /**
   * Scrapes a prospect's website and generates a hyper-personalized AI service offer.
   */
  async generateOffer(prospectId: string, offerType: 'ai_website' | 'ai_marketing' | 'ai_lead_gen') {
    try {
      logger.info('OfferGenerator', `Generating ${offerType} offer for prospect ${prospectId}`);

      // 1. Fetch prospect details
      const { data: prospect, error: fetchError } = await supabaseClient
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (fetchError || !prospect) throw new Error('Prospect not found');

      // 2. Scrape website if available
      let websiteContext = 'No website provided.';
      if (prospect.website) {
        const scrapeResult = await websiteScraper.scrapeText(prospect.website);
        websiteContext = scrapeResult.data || 'Failed to extract content from website.';
      }

      // 3. Generate personalized copy using LLM
      const prompt = `You are a high-ticket AI SaaS Sales Closer.
Prospect: "${prospect.company_name}"
Website Content: ${websiteContext.substring(0, 3000)}
Requested Offer Type: ${offerType}

Task: Write a personalized sales pitch for this business. 
Reference specific details from their website to prove we've done our research.
Highlight how our "${offerType}" service will specifically solve a problem they likely have or scale their growth.

Respond with a JSON object:
{
  "subject": "Personalized email subject",
  "pitch_copy": "The full sales copy",
  "monetization_hook": "Specific value proposition"
}`;

      const { text, error: llmError } = await llmService.generateText(prompt, {
        metering: createSystemLlmMetering('offer-generator', 'generate-personalized-offer'),
        temperature: 0.6,
      });
      if (llmError || !text) throw new Error(llmError || 'LLM failed to generate offer');

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const offerData = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: 'Partnership', pitch_copy: text };

      // 4. Generate a mock Stripe link (integration with Phase 23)
      const mockStripeUrl = `https://checkout.stripe.com/pay/offer_${prospectId.substring(0,8)}?prefilled_email=${encodeURIComponent(prospect.email || '')}`;

      // 5. Store in database
      const { data, error: dbError } = await supabaseClient
        .from('personalized_offers')
        .insert([{
          prospect_id: prospectId,
          offer_type: offerType,
          analysis_context: websiteContext.substring(0, 1000),
          personalized_copy: offerData.pitch_copy,
          stripe_checkout_url: mockStripeUrl,
          status: 'draft'
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Update prospect status
      await supabaseClient.from('prospects').update({ status: 'offer_generated' }).eq('id', prospectId);

      return { data, error: null };
    } catch (error) {
      logger.error('OfferGenerator', 'Failed to generate offer', error);
      return { data: null, error: String(error) };
    }
  }
};
