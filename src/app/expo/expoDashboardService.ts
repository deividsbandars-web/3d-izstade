import { CityMapAPI, ExpoDataAPI } from '../../services/expo';
import {
  normalizeExpoScreenContentForSave,
  validateExpoScreenMediaUrl,
} from '../../shared/expo/screenContentMedia';
import {
  normalizeExpoMediaReviewReferencesForSave,
  type ExpoMediaReviewReferencesInput,
} from '../../shared/expo/mediaReviewReferences';
import {
  normalizeExpoSponsorAssetPackForSave,
  type ExpoSponsorAssetPackInput,
} from '../../shared/expo/sponsorAssetPack';
import {
  normalizeExpoBoothPublicationStatus,
  type ExpoBoothPublicationStatus,
} from '../../shared/expo/boothPublicationStatus';

export type ExpoManagedBooth = {
  assets_3d?: Record<string, unknown> | null;
  company_name?: string | null;
  contact_info?: Record<string, unknown> | null;
  district?: string | null;
  id?: string;
  industry_sector?: string | null;
  status?: ExpoBoothPublicationStatus | string | null;
};

export type ExpoManagedBoothScreenContent = {
  ctaLabel?: string;
  imageUrl?: string;
  mode?: 'generated-card' | 'image' | 'video' | 'video-placeholder';
  screenSlotId?: string;
  status?: 'draft' | 'published';
  subtitle?: string;
  title?: string;
  videoUrl?: string;
};

export type ExpoManagedBoothSponsorAssetPack = ExpoSponsorAssetPackInput;
export type ExpoManagedBoothMediaReview = ExpoMediaReviewReferencesInput;

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
    mediaReview,
    screenContent,
    sponsorAssetPack,
    status,
    videoUrl,
  }: {
    boothId?: string;
    companyName: string;
    description: string;
    district: string;
    mediaReview?: ExpoManagedBoothMediaReview;
    screenContent?: ExpoManagedBoothScreenContent;
    sponsorAssetPack?: ExpoManagedBoothSponsorAssetPack;
    status?: ExpoBoothPublicationStatus | string;
    videoUrl: string;
  }) {
    try {
      const screenContentResult = normalizeExpoScreenContentForSave(screenContent);
      if (!screenContentResult.ok) {
        throw new Error(screenContentResult.issues.map((issue) => issue.message).join(' '));
      }

      const sponsorAssetPackResult = normalizeExpoSponsorAssetPackForSave(sponsorAssetPack);
      if (!sponsorAssetPackResult.ok) {
        throw new Error(sponsorAssetPackResult.issues.map((issue) => issue.message).join(' '));
      }

      const mediaReviewResult = normalizeExpoMediaReviewReferencesForSave(mediaReview);
      if (!mediaReviewResult.ok) {
        throw new Error(mediaReviewResult.issues.map((issue) => issue.message).join(' '));
      }

      const boothVideoResult = validateExpoScreenMediaUrl(videoUrl, 'video');
      if (!boothVideoResult.ok) {
        throw new Error(boothVideoResult.reason);
      }

      const payload = {
        assets_3d: {
          media_review: mediaReviewResult.mediaReview,
          screen_content: screenContentResult.screenContent,
          sponsor_asset_pack: sponsorAssetPackResult.assetPack,
          video_url: boothVideoResult.url,
        },
        company_name: companyName,
        contact_info: {
          description,
        },
        district,
        industry_sector: district,
        status: normalizeExpoBoothPublicationStatus(status),
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
