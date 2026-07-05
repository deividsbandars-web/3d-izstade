import type {
  ExpoMediaReviewUploadAdminAction,
  ExpoMediaReviewUploadKind,
  ExpoMediaReviewUploadPromoteTarget,
} from '../shared/expo/mediaReviewUpload.js';
import { serverApiGet, serverApiPatch, serverApiPost, serverApiUploadBinary } from './serverApi.js';

export const ExpoDataAPI = {
  createBooth: async (payload: unknown) => serverApiPost('/api/expo/booths', payload),
  createExpoLead: async (payload: unknown) => serverApiPost('/api/expo/lead', payload),
  updateBooth: async (boothId: string, payload: unknown) => serverApiPatch(`/api/expo/booths/${boothId}`, payload),
  uploadBoothMediaReviewAsset: async (boothId: string, kind: ExpoMediaReviewUploadKind, file: File) =>
    serverApiUploadBinary(`/api/expo/booths/${boothId}/media-review-upload`, file, {
      contentType: file.type || 'application/octet-stream',
      headers: {
        'X-Media-Kind': kind,
        'X-Upload-Filename': file.name,
      },
    }),
  reviewBoothMediaReviewAsset: async (
    boothId: string,
    payload: {
      action: ExpoMediaReviewUploadAdminAction;
      path: string;
      promoteTarget?: ExpoMediaReviewUploadPromoteTarget;
    },
  ) => serverApiPatch(`/api/expo/booths/${boothId}/media-review-uploads`, payload),
  getManagedBooths: async () => serverApiGet('/api/expo/booths/managed'),
  getBooth: async (boothId: string) => serverApiGet(`/api/expo/booths/${boothId}`),
  getBooths: async () => serverApiGet('/api/expo/booths'),
  getReviewBooth: async (boothId: string) => serverApiGet(`/api/expo/review/booths/${boothId}`),
  getSponsorLeadInbox: async (companySlug: string, limit = 50) =>
    serverApiGet(`/api/expo/lead-inbox/${encodeURIComponent(companySlug)}?limit=${encodeURIComponent(String(limit))}`),
  updateSponsorLeadInboxStatus: async (companySlug: string, leadId: string, status: string) =>
    serverApiPatch(`/api/expo/lead-inbox/${encodeURIComponent(companySlug)}/leads/${encodeURIComponent(leadId)}`, { status }),
  updateSponsorLeadInboxOps: async (
    companySlug: string,
    leadId: string,
    payload: { followUpAt?: string | null; opsNotes?: string | null },
  ) => serverApiPatch(`/api/expo/lead-inbox/${encodeURIComponent(companySlug)}/leads/${encodeURIComponent(leadId)}/ops`, payload),
  updateReviewLeadStatus: async (boothId: string, leadId: string, status: string) =>
    serverApiPatch(`/api/expo/review/booths/${boothId}/leads/${leadId}`, { status }),
  updateReviewLeadOps: async (
    boothId: string,
    leadId: string,
    payload: { followUpAt?: string | null; opsNotes?: string | null },
  ) => serverApiPatch(`/api/expo/review/booths/${boothId}/leads/${leadId}/ops`, payload),
  getBoothStats: async (boothId: string): Promise<{ data: any; error: null }> => ({
    data: await serverApiGet(`/api/expo/analytics/booths/${boothId}`),
    error: null,
  }),
  getBoothById: async (boothId: string) => serverApiGet(`/api/expo/booths/${boothId}`),
};

export const CityMapAPI = {
  getExpoCity: async () => serverApiGet('/api/expo/city'),
  getDistricts: async () => serverApiGet('/api/expo/city/districts'),
  assignBoothToDistrict: async (boothId: string, districtName: string) =>
    serverApiPatch(`/api/expo/city/booths/${boothId}/district`, { districtName }),
};

export const UnrealEngineAPI = {
  getSceneData: async () => serverApiGet('/api/expo/scene'),
  getBoothScene: async (boothId: string) => serverApiGet(`/api/expo/scenes/booth/${boothId}`),
  getCityMap: async () => serverApiGet('/api/expo/scenes/city'),
};
