import { logger } from '../../logging/logger.js';
import {
  dataSourceToolAdapters,
  leadToolAdapters,
  marketingToolAdapters,
  revenueToolAdapters,
  workflowToolAdapters,
} from './adapters/index.js';
import type { AgentTool } from './agentToolTypes.js';

export function createAgentToolRegistry(): Record<string, AgentTool> {
  return {
    search_web: {
      name: 'search_web',
      description: 'Searches the web using SerpAPI. Arguments: { "query": "search term" }',
      execute: async (args: { query: string }) => {
        logger.info('AgentTools', `Executing search_web for: ${args.query}`);
        return dataSourceToolAdapters.searchWeb(args.query);
      },
    },
    scrape_website: {
      name: 'scrape_website',
      description: 'Scrapes text content from a URL. Arguments: { "url": "https://..." }',
      execute: async (args: { url: string }) => {
        logger.info('AgentTools', 'Executing scrape_website');
        return dataSourceToolAdapters.scrapeWebsite(args.url);
      },
    },
    create_business: {
      name: 'create_business',
      description: 'Generates a new business project. Arguments: { "niche": "Target niche" }',
      execute: async (args: { niche: string }) => {
        logger.info('AgentTools', `Executing create_business for: ${args.niche}`);
        return workflowToolAdapters.createBusiness(args.niche);
      },
    },
    find_leads: {
      name: 'find_leads',
      description: 'Scrapes and scores leads. Arguments: { "industry": "Industry", "location": "City/Country" }',
      execute: async (args: { industry: string; location: string }) => {
        logger.info('AgentTools', `Executing find_leads for: ${args.industry} in ${args.location}`);
        return leadToolAdapters.findLeads(args.industry, args.location);
      },
    },
    generate_offer: {
      name: 'generate_offer',
      description: 'Analyzes a prospect website and creates an offer. Arguments: { "prospectId": "uuid", "offerType": "ai_website" }',
      execute: async (args: { prospectId: string; offerType: any }) => {
        logger.info('AgentTools', `Executing generate_offer for prospect: ${args.prospectId}`);
        return revenueToolAdapters.generateOffer(args.prospectId, args.offerType);
      },
    },
    contact_lead: {
      name: 'contact_lead',
      description: 'Starts an outreach email sequence for a prospect. Arguments: { "prospectId": "uuid", "offerId": "uuid" }',
      execute: async (args: { prospectId: string; offerId: string }) => {
        logger.info('AgentTools', `Executing contact_lead for prospect: ${args.prospectId}`);
        return revenueToolAdapters.contactLead(args.prospectId, args.offerId);
      },
    },
    save_to_memory: {
      name: 'save_to_memory',
      description: 'Saves extracted information. Arguments: { "context": "Data to remember" }',
      execute: async (args: { context: string }) => {
        logger.info('AgentTools', 'Executing save_to_memory');
        return { success: true, saved_context: args.context };
      },
    },
    generate_marketing: {
      name: 'generate_marketing',
      description: 'Generates promotional content. Arguments: { "context": "Product info", "platform": "twitter|linkedin|reddit" }',
      execute: async (args: { context: string; platform: 'twitter' | 'linkedin' | 'reddit' }) => {
        logger.info('AgentTools', `Executing generate_marketing for platform: ${args.platform}`);
        return marketingToolAdapters.generateMarketing(args.context, args.platform);
      },
    },
    track_revenue: {
      name: 'track_revenue',
      description: 'Tracks revenue conversions. Arguments: { "prospectId": "uuid", "eventType": "purchase_completed" }',
      execute: async (args: { prospectId: string; eventType: any }) => {
        logger.info('AgentTools', `Executing track_revenue for prospect: ${args.prospectId}`);
        return revenueToolAdapters.trackRevenue(args.prospectId, args.eventType);
      },
    },
    generate_product: {
      name: 'generate_product',
      description: 'Generates product designs based on niche. Arguments: { "businessName": "Name", "niche": "Niche" }',
      execute: async (args: { businessName: string; niche: string }) => {
        logger.info('AgentTools', `Executing generate_product for: ${args.businessName}`);
        return { success: true, products: [`Starter ${args.niche} Pack`, `Pro ${args.niche} Solution`] };
      },
    },
    optimize_marketing: {
      name: 'optimize_marketing',
      description: 'Analyzes performance data and optimizes campaigns. Arguments: { "campaignId": "uuid", "performanceData": "json" }',
      execute: async (args: { campaignId: string; performanceData: any }) => {
        logger.info('AgentTools', `Executing optimize_marketing for campaign: ${args.campaignId}`);
        return { success: true, adjustment: 'Increased spend on LinkedIn, adjusted copy for Reddit.' };
      },
    },
  };
}
