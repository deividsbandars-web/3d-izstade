import { conversionTracker } from './conversionTracker.js';
import { offerGenerator } from './offerGenerator.js';
import { revenueProspectingService } from './prospecting/revenueProspectingService.js';
import type { RevenueProspectingRequest, RevenueProspectingResult } from './prospecting/prospectingTypes.js';
import { salesSequence } from './salesSequence.js';

export interface RevenueConversionEventInput {
  prospectId: string;
  offerId?: string;
  eventType: 'email_open' | 'link_click' | 'stripe_session_started' | 'purchase_completed';
  metadata?: any;
}

export type { RevenueProspectingRequest, RevenueProspectingResult } from './prospecting/prospectingTypes.js';

export const revenueApplicationService = {
  async findProspectsForRevenue(request: RevenueProspectingRequest): Promise<RevenueProspectingResult> {
    return revenueProspectingService.findProspects(request);
  },

  async generateOfferForProspect(
    prospectId: string,
    offerType: 'ai_website' | 'ai_marketing' | 'ai_lead_gen',
  ) {
    return offerGenerator.generateOffer(prospectId, offerType);
  },

  async startProspectOutreach(prospectId: string, offerId: string) {
    return salesSequence.startOutreach(prospectId, offerId);
  },

  async trackRevenueConversion(input: RevenueConversionEventInput) {
    return conversionTracker.trackEvent(input);
  },
};
