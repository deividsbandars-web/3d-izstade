import { googleMapsLeadSource } from '../../leads/sources/googleMapsLeadSource.js';
import type { ProspectLead } from './prospectingTypes.js';

export const prospectingGoogleMapsAdapter = {
  async findProspectLeads(
    niche: string,
    location: string,
    limit: number,
  ): Promise<{ data: ProspectLead[] | null; error: string | null }> {
    const result = await googleMapsLeadSource.fetchLeads(niche, location, limit);

    return {
      data: (result.data as ProspectLead[] | null) ?? null,
      error: result.error ?? null,
    };
  },
};
