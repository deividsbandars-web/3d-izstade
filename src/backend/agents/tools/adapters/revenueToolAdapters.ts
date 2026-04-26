import { revenueApplicationService } from '../../../revenue/revenueApplicationService.js';

export const revenueToolAdapters = {
  async findProspects(niche: string, location: string, limit: number = 10) {
    return revenueApplicationService.findProspectsForRevenue({ niche, location, limit });
  },

  async generateOffer(prospectId: string, offerType: any) {
    const result = await revenueApplicationService.generateOfferForProspect(prospectId, offerType);
    return result.data || 'Failed to generate offer.';
  },

  async contactLead(prospectId: string, offerId: string) {
    const result = await revenueApplicationService.startProspectOutreach(prospectId, offerId);
    return result || 'Failed to contact lead.';
  },

  async trackRevenue(prospectId: string, eventType: any) {
    const result = await revenueApplicationService.trackRevenueConversion({ prospectId, eventType });
    return result.data || 'Failed to track revenue.';
  },
};
