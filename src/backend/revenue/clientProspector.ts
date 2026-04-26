import { revenueApplicationService } from './revenueApplicationService.js';

// Compatibility-only surface. Canonical caller-facing prospecting entry is revenueApplicationService.ts.
export const clientProspector = {
  async findProspects(niche: string, location: string, limit: number = 10) {
    return revenueApplicationService.findProspectsForRevenue({ niche, location, limit });
  },
};
