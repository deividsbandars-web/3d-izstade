import { logger } from '../../logging/logger.js';
import { serpApiHelper } from '../../leads/sources/serpApiHelper.js';
import { websiteScraper } from '../../dataSources/websiteScraper.js';
import { businessGenerator } from '../../business/businessGenerator.js';
import { leadEngine } from '../../leads/engine/leadEngine.js';
import { salesSequence } from '../../revenue/salesSequence.js';
import { offerGenerator } from '../../revenue/offerGenerator.js';
import { trafficAutomation } from '../../growth/trafficAutomation.js';
import { conversionTracker } from '../../revenue/conversionTracker.js';
export const agentTools = {
    search_web: {
        name: 'search_web',
        description: 'Searches the web using SerpAPI. Arguments: { "query": "search term" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing search_web for: ${args.query}`);
            const result = await serpApiHelper.search({ q: args.query, engine: 'google' });
            return result.data?.organic_results?.slice(0, 5) || 'No results found.';
        }
    },
    scrape_website: {
        name: 'scrape_website',
        description: 'Scrapes text content from a URL. Arguments: { "url": "https://..." }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing scrape_website for: ${args.url}`);
            const result = await websiteScraper.scrapeText(args.url);
            return result.data || 'Failed to scrape website.';
        }
    },
    create_business: {
        name: 'create_business',
        description: 'Generates a new business project. Arguments: { "niche": "Target niche" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing create_business for: ${args.niche}`);
            const result = await businessGenerator.launchBusinessWorkflow(args.niche);
            return result.data || 'Failed to create business.';
        }
    },
    find_leads: {
        name: 'find_leads',
        description: 'Scrapes and scores leads. Arguments: { "industry": "Industry", "location": "City/Country" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing find_leads for: ${args.industry} in ${args.location}`);
            const result = await leadEngine.processAndStoreLeads(args.industry, args.location);
            return result.data || 'Failed to find leads.';
        }
    },
    generate_offer: {
        name: 'generate_offer',
        description: 'Analyzes a prospect website and creates an offer. Arguments: { "prospectId": "uuid", "offerType": "ai_website" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing generate_offer for prospect: ${args.prospectId}`);
            const result = await offerGenerator.generateOffer(args.prospectId, args.offerType);
            return result.data || 'Failed to generate offer.';
        }
    },
    contact_lead: {
        name: 'contact_lead',
        description: 'Starts an outreach email sequence for a prospect. Arguments: { "prospectId": "uuid", "offerId": "uuid" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing contact_lead for prospect: ${args.prospectId}`);
            const result = await salesSequence.startOutreach(args.prospectId, args.offerId);
            return result || 'Failed to contact lead.';
        }
    },
    save_to_memory: {
        name: 'save_to_memory',
        description: 'Saves extracted information. Arguments: { "context": "Data to remember" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing save_to_memory`);
            return { success: true, saved_context: args.context };
        }
    },
    generate_marketing: {
        name: 'generate_marketing',
        description: 'Generates promotional content. Arguments: { "context": "Product info", "platform": "twitter|linkedin|reddit" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing generate_marketing for platform: ${args.platform}`);
            const result = await trafficAutomation.generateSocialContent(args.context, args.platform);
            return result.data || 'Failed to generate marketing.';
        }
    },
    track_revenue: {
        name: 'track_revenue',
        description: 'Tracks revenue conversions. Arguments: { "prospectId": "uuid", "eventType": "purchase_completed" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing track_revenue for prospect: ${args.prospectId}`);
            const result = await conversionTracker.trackEvent({ prospectId: args.prospectId, eventType: args.eventType });
            return result.data || 'Failed to track revenue.';
        }
    },
    generate_product: {
        name: 'generate_product',
        description: 'Generates product designs based on niche. Arguments: { "businessName": "Name", "niche": "Niche" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing generate_product for: ${args.businessName}`);
            // Simulate product generation logic
            return { success: true, products: [`Starter ${args.niche} Pack`, `Pro ${args.niche} Solution`] };
        }
    },
    optimize_marketing: {
        name: 'optimize_marketing',
        description: 'Analyzes performance data and optimizes campaigns. Arguments: { "campaignId": "uuid", "performanceData": "json" }',
        execute: async (args) => {
            logger.info('AgentTools', `Executing optimize_marketing for campaign: ${args.campaignId}`);
            return { success: true, adjustment: 'Increased spend on LinkedIn, adjusted copy for Reddit.' };
        }
    }
};
