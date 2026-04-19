import { serverApiGet, serverApiPatch, serverApiPost } from './serverApi';

export const ExpoDataAPI = {
  createBooth: async (payload: unknown) => serverApiPost('/api/expo/booths', payload),
  updateBooth: async (boothId: string, payload: unknown) => serverApiPatch(`/api/expo/booths/${boothId}`, payload),
  getManagedBooths: async () => serverApiGet('/api/expo/booths/managed'),
  getBooth: async (boothId: string) => serverApiGet(`/api/expo/booths/${boothId}`),
  getBooths: async () => serverApiGet('/api/expo/booths'),
  getReviewBooth: async (boothId: string) => serverApiGet(`/api/expo/review/booths/${boothId}`),
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
