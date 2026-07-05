import { getFrontendRuntimeEnv } from '../../config/runtimeEnv.js';
import {
  serverApiGet,
  serverApiPatch,
  serverApiPost,
  serverApiUploadBinary,
} from '../../services/serverApi.js';
import type {
  ExpoCommunityAuditEvent,
  ExpoCommunityEntry,
  ExpoCommunityEntryStatus,
  ExpoCommunityGraffiti,
  ExpoCommunityReportReason,
  ExpoCommunitySprayPlacement,
} from '../../shared/expo/communityContent.js';

export type ExpoCommunityResponse = {
  entries: ExpoCommunityEntry[];
  graffiti: ExpoCommunityGraffiti[];
  limits: {
    graffitiPerHour: number;
    voiceBytes: number;
    voiceSeconds: number;
  };
  persistence: string;
};

export type ExpoCommunityModerationResponse = {
  audit: ExpoCommunityAuditEvent[];
  entries: ExpoCommunityEntry[];
  graffiti: ExpoCommunityGraffiti[];
};

function resolveApiAssetUrl(value: string | undefined) {
  if (!value) return undefined;
  if (/^https:\/\//i.test(value)) return value;
  return `${getFrontendRuntimeEnv().apiBaseUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function normalizeResponse(response: ExpoCommunityResponse): ExpoCommunityResponse {
  return {
    ...response,
    entries: response.entries.map((entry) => ({ ...entry, audioUrl: resolveApiAssetUrl(entry.audioUrl) })),
  };
}

export const expoCommunityService = {
  async getPublic() {
    return normalizeResponse(await serverApiGet<ExpoCommunityResponse>('/api/expo/community'));
  },
  async submitEntry(input: { body: string; kind: 'advert' | 'message'; title: string }) {
    return serverApiPost<{ entry: ExpoCommunityEntry; remaining: number }>('/api/expo/community/entries', input);
  },
  async submitGraffiti(input: { color: string; logoUrl?: string; markText: string; placement?: ExpoCommunitySprayPlacement }) {
    return serverApiPost<{ graffiti: ExpoCommunityGraffiti; remaining: number }>('/api/expo/community/graffiti', input);
  },
  async submitVoice(blob: Blob, title: string) {
    return serverApiUploadBinary<{ entry: ExpoCommunityEntry; remaining: number }>('/api/expo/community/voice', blob, {
      contentType: blob.type || 'audio/webm',
      headers: { 'X-Community-Title': title },
    });
  },
  async getModeration() {
    const response = await serverApiGet<ExpoCommunityModerationResponse>('/api/expo/community/moderation');
    return {
      ...response,
      entries: response.entries.map((entry) => ({ ...entry, audioUrl: resolveApiAssetUrl(entry.audioUrl) })),
    };
  },
  async moderate(id: string, status: Extract<ExpoCommunityEntryStatus, 'approved' | 'rejected' | 'removed'>, note = '') {
    return serverApiPatch<{ item: ExpoCommunityEntry | ExpoCommunityGraffiti }>(`/api/expo/community/moderation/${encodeURIComponent(id)}`, { note, status });
  },
  async report(id: string, reason: ExpoCommunityReportReason = 'other', detail = '') {
    return serverApiPost<{ item: ExpoCommunityEntry | ExpoCommunityGraffiti; remaining: number }>(`/api/expo/community/report/${encodeURIComponent(id)}`, { detail, reason });
  },
};
