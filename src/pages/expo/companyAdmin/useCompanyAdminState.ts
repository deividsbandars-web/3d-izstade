import { useCallback, useEffect, useState } from 'react';
import { supabaseClient } from '../../../lib/supabaseClient';
import { companyAdminService } from '../../../modules/expo/services/companyAdminService';

type AdminAccessState =
  | 'checking-auth'
  | 'ready'
  | 'signed-out'
  | 'access-denied'
  | 'backend-unavailable'
  | 'unavailable';

type ManagedBoothSummary = {
  company_name?: string | null;
  district?: string | null;
  id?: string;
};

type ManagedLeadOpsDraft = {
  followUpAt: string;
  opsNotes: string;
};

type UseCompanyAdminStateOptions<TCompany, TLead> = {
  defaultCompany: TCompany;
  defaultDistricts: string[];
  formatRequestError: (error: unknown) => string;
  getLeadDraftKey: (lead: TLead) => string;
  getLeadFollowUpAt: (lead: TLead) => string | null;
  getLeadOpsNotes: (lead: TLead) => string;
  readCompanyFromBoothPayload: (payload: unknown, fallbackId?: string) => TCompany;
  readLeadInbox: (payload: unknown) => TLead[];
  readRoomRouteId: (payload: unknown, fallbackId: string) => string;
  resolveAccessStateFromError: (errorText: string) => Exclude<AdminAccessState, 'checking-auth' | 'ready'>;
};

export function useCompanyAdminState<TCompany, TAnalytics, TLead>({
  defaultCompany,
  defaultDistricts,
  formatRequestError,
  getLeadDraftKey,
  getLeadFollowUpAt,
  getLeadOpsNotes,
  readCompanyFromBoothPayload,
  readLeadInbox,
  readRoomRouteId,
  resolveAccessStateFromError,
}: UseCompanyAdminStateOptions<TCompany, TLead>) {
  const [loading, setLoading] = useState(true);
  const [adminAccessState, setAdminAccessState] = useState<AdminAccessState>('checking-auth');
  const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
  const [isOperatorAdmin, setIsOperatorAdmin] = useState(false);
  const [districts, setDistricts] = useState<string[]>(defaultDistricts);
  const [managedBooths, setManagedBooths] = useState<ManagedBoothSummary[]>([]);
  const [analytics, setAnalytics] = useState<TAnalytics | null>(null);
  const [leads, setLeads] = useState<TLead[]>([]);
  const [activeLeadAction, setActiveLeadAction] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<'all' | 'needs_action' | 'pending' | 'contacted' | 'closed' | 'rejected'>('needs_action');
  const [leadOpsDrafts, setLeadOpsDrafts] = useState<Record<string, ManagedLeadOpsDraft>>({});
  const [activeLeadOpsSave, setActiveLeadOpsSave] = useState<string | null>(null);
  const [roomRouteId, setRoomRouteId] = useState('');
  const [company, setCompany] = useState<TCompany>(defaultCompany);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSponsorAssetUpload, setActiveSponsorAssetUpload] = useState<string | null>(null);
  const [sponsorAssetUploadStatus, setSponsorAssetUploadStatus] = useState<Record<string, string>>({});
  const [activeMediaReviewUpload, setActiveMediaReviewUpload] = useState<string | null>(null);
  const [mediaReviewUploadStatus, setMediaReviewUploadStatus] = useState<Record<string, string>>({});
  const [activeMediaReviewAction, setActiveMediaReviewAction] = useState<string | null>(null);

  const refreshBoothReview = useCallback(async (boothId: string) => {
    const [boothResult, analyticsResult] = await Promise.all([
      companyAdminService.getManagedBoothReview(boothId),
      companyAdminService.getBoothAnalytics(boothId),
    ]);

    const booth = (boothResult.data as { booth?: unknown } | null)?.booth;
    if (booth) {
      setCompany(readCompanyFromBoothPayload(booth, boothId));
    }

    setAnalytics((analyticsResult.data as TAnalytics) ?? null);
    setLeads(readLeadInbox(boothResult.data));
    setRoomRouteId(readRoomRouteId(boothResult.data, boothId));
  }, [readCompanyFromBoothPayload, readLeadInbox, readRoomRouteId]);

  useEffect(() => {
    async function init() {
      try {
        setAdminAccessState('checking-auth');
        setAdminAccessError(null);
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session?.access_token) {
          setIsOperatorAdmin(false);
          setAdminAccessState('signed-out');
          return;
        }
        setIsOperatorAdmin(sessionData.session.user.app_metadata?.role === 'admin');

        const [districtResult, boothsResult] = await Promise.all([
          companyAdminService.getDistricts(),
          companyAdminService.getManagedBooths(),
        ]);

        setAdminAccessState('ready');

        if (Array.isArray(districtResult.data) && districtResult.data.length > 0) {
          setDistricts(districtResult.data.map((entry) => String(entry)));
        }

        if (boothsResult.data && boothsResult.data.length > 0) {
          setManagedBooths(boothsResult.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
          const first = boothsResult.data[0] as { id?: string };
          setCompany(readCompanyFromBoothPayload(first));
          if (first.id) {
            await refreshBoothReview(String(first.id));
          }
        }
      } catch (error) {
        const errorText = formatRequestError(error);
        setAdminAccessError(errorText);
        setAdminAccessState(resolveAccessStateFromError(errorText));
        console.warn('EXPO_ADMIN_INIT_UNAVAILABLE', error);
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, [formatRequestError, readCompanyFromBoothPayload, refreshBoothReview, resolveAccessStateFromError]);

  useEffect(() => {
    setLeadOpsDrafts((current) => {
      const next = { ...current };
      leads.forEach((lead) => {
        const key = getLeadDraftKey(lead);
        if (!key || next[key]) {
          return;
        }

        const followUpAt = getLeadFollowUpAt(lead);
        next[key] = {
          followUpAt: followUpAt ? new Date(followUpAt).toISOString().slice(0, 16) : '',
          opsNotes: getLeadOpsNotes(lead),
        };
      });
      return next;
    });
  }, [getLeadDraftKey, getLeadFollowUpAt, getLeadOpsNotes, leads]);

  async function handleManagedBoothSelect(boothId: string) {
    setLoading(true);
    try {
      await refreshBoothReview(boothId);
    } finally {
      setLoading(false);
    }
  }

  return {
    activeLeadAction,
    activeLeadOpsSave,
    activeMediaReviewAction,
    activeMediaReviewUpload,
    activeSponsorAssetUpload,
    adminAccessError,
    adminAccessState,
    analytics,
    company,
    districts,
    handleManagedBoothSelect,
    isOperatorAdmin,
    leadFilter,
    leadOpsDrafts,
    leads,
    loading,
    managedBooths,
    mediaReviewUploadStatus,
    message,
    roomRouteId,
    setActiveLeadAction,
    setActiveLeadOpsSave,
    setActiveMediaReviewAction,
    setActiveMediaReviewUpload,
    setActiveSponsorAssetUpload,
    setAdminAccessError,
    setAdminAccessState,
    setAnalytics,
    setCompany,
    setLeadFilter,
    setLeadOpsDrafts,
    setLeads,
    setLoading,
    setManagedBooths,
    setMediaReviewUploadStatus,
    setMessage,
    setRoomRouteId,
    setSponsorAssetUploadStatus,
    sponsorAssetUploadStatus,
  };
}
