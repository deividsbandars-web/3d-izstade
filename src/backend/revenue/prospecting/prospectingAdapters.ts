import { prospectingGoogleMapsAdapter } from './prospectingGoogleMapsAdapter.js';
import type { ProspectLead } from './prospectingTypes.js';

export const prospectingAdapters = {
  async findProspectLeads(niche: string, location: string, limit: number): Promise<{ data: ProspectLead[] | null; error: string | null }> {
    return prospectingGoogleMapsAdapter.findProspectLeads(niche, location, limit);
  },
};
