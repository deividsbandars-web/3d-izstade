export interface ProspectLead {
  company_name: string;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  metadata?: Record<string, unknown>;
}

export interface RevenueProspect {
  company_name: string;
  website: string;
  email: string;
  industry: string;
  location: string;
  status: 'new';
}

export interface RevenueProspectingRequest {
  niche: string;
  location: string;
  limit?: number;
}

export interface RevenueProspectingResult {
  data: RevenueProspect[] | null;
  error: string | null;
}

export type StoredProspect = RevenueProspect;
