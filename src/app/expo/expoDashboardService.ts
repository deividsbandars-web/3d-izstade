import { CityMapAPI, ExpoDataAPI } from '../../services/expo';

export type ExpoManagedBooth = {
  assets_3d?: Record<string, unknown> | null;
  company_name?: string | null;
  contact_info?: Record<string, unknown> | null;
  district?: string | null;
  id?: string;
  industry_sector?: string | null;
  status?: string | null;
};

export type ExpoManagedBoothScreenContent = {
  ctaLabel?: string;
  imageUrl?: string;
  mode?: 'generated-card' | 'image' | 'video-placeholder';
  status?: 'draft' | 'published';
  subtitle?: string;
  title?: string;
  videoUrl?: string;
};

export const expoDashboardService = {
  /**
   * Fetches the macro city layout
   */
  async getCityMap() {
    try {
      return { data: await CityMapAPI.getExpoCity(), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async getDistricts() {
    try {
      return { data: await CityMapAPI.getDistricts(), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async getManagedBooths(_userId?: string) {
    try {
      const booths = await ExpoDataAPI.getManagedBooths();
      return { data: Array.isArray(booths) ? booths as ExpoManagedBooth[] : [], error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async getBoothAnalytics(boothId: string) {
    try {
      return await ExpoDataAPI.getBoothStats(boothId);
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async getManagedBoothReview(boothId: string) {
    try {
      return { data: await ExpoDataAPI.getReviewBooth(boothId), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async updateManagedLeadStatus(boothId: string, leadId: string, status: string) {
    try {
      return { data: await ExpoDataAPI.updateReviewLeadStatus(boothId, leadId, status), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async updateManagedLeadOps(
    boothId: string,
    leadId: string,
    payload: { followUpAt?: string | null; opsNotes?: string | null },
  ) {
    try {
      return { data: await ExpoDataAPI.updateReviewLeadOps(boothId, leadId, payload), error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },

  async saveManagedBooth({
    boothId,
    companyName,
    description,
    district,
    screenContent,
    videoUrl,
  }: {
    boothId?: string;
    companyName: string;
    description: string;
    district: string;
    screenContent?: ExpoManagedBoothScreenContent;
    videoUrl: string;
  }) {
    try {
      const normalizedScreenContent = screenContent
        ? {
            ctaLabel: String(screenContent.ctaLabel || '').trim(),
            imageUrl: String(screenContent.imageUrl || '').trim(),
            mode: screenContent.mode || 'generated-card',
            status: screenContent.status || 'draft',
            subtitle: String(screenContent.subtitle || '').trim(),
            title: String(screenContent.title || '').trim(),
            videoUrl: String(screenContent.videoUrl || '').trim(),
          }
        : undefined;

      const payload = {
        assets_3d: {
          ...(normalizedScreenContent ? { screen_content: normalizedScreenContent } : {}),
          video_url: videoUrl,
        },
        company_name: companyName,
        contact_info: {
          description,
        },
        district,
        industry_sector: district,
        status: 'active',
      };

      const booth = boothId
        ? await ExpoDataAPI.updateBooth(boothId, payload)
        : await ExpoDataAPI.createBooth(payload);

      const resolvedBoothId = String((booth as { id?: string } | null)?.id || boothId || '');
      if (resolvedBoothId && district) {
        await CityMapAPI.assignBoothToDistrict(resolvedBoothId, district);
      }

      return { data: booth, error: null };
    } catch (error) {
      return { data: null, error: String(error) };
    }
  },
};
