import { ExpoDataAPI } from '../../services/expo';

export type SponsorLeadInboxLead = {
  client_email?: string | null;
  client_name?: string | null;
  created_at?: string | null;
  follow_up_at?: string | null;
  id?: string | null;
  message?: string | null;
  ops_notes?: string | null;
  ops_updated_at?: string | null;
  service_name?: string | null;
  status?: string | null;
};

export type SponsorLeadInboxSummary = {
  closed: number;
  contacted: number;
  latestInboundAt: string | null;
  needsAction: number;
  pending: number;
  rejected: number;
  total: number;
};

export type SponsorLeadInboxResponse = {
  leads: SponsorLeadInboxLead[];
  sponsor: {
    companyId: string | null;
    displayName: string;
    slug: string;
  };
  summary: SponsorLeadInboxSummary;
};

export async function getSponsorLeadInbox(companySlug = 'sponsor-concierge') {
  return await ExpoDataAPI.getSponsorLeadInbox(companySlug, 50) as SponsorLeadInboxResponse;
}
