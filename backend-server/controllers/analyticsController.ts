import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';

const EXPO_RELEASE_EVENT_NAMES = [
  'scene_loaded',
  'sector_entered',
  'booth_viewed',
  'booth_clicked',
  'website_opened',
  'booking_clicked',
  'demo_room_entered',
] as const;

type ExpoReleaseEventName = typeof EXPO_RELEASE_EVENT_NAMES[number];

type ExpoAnalyticsRequestBody = {
  payload?: Record<string, unknown>;
};

export type ValidExpoAnalyticsPayload = {
  boothId: string | null;
  boothTemplate: string | null;
  companyId: string | null;
  companySlug: string | null;
  eventName: ExpoReleaseEventName;
  sectorId: string | null;
  sectorName: string | null;
  sessionId: string | null;
  sponsorTier: string | null;
} & Record<string, unknown>;

function normalizeNullableString(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized : null;
}

export function validateExpoAnalyticsPayload(payload: Record<string, unknown> | undefined): ValidExpoAnalyticsPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('EXPO_ANALYTICS_PAYLOAD_REQUIRED');
  }

  const eventName = normalizeNullableString(payload.eventName);
  if (!eventName || !EXPO_RELEASE_EVENT_NAMES.includes(eventName as ExpoReleaseEventName)) {
    throw new Error('EXPO_ANALYTICS_EVENT_INVALID');
  }

  return {
    ...payload,
    boothId: normalizeNullableString(payload.boothId),
    boothTemplate: normalizeNullableString(payload.boothTemplate),
    companyId: normalizeNullableString(payload.companyId),
    companySlug: normalizeNullableString(payload.companySlug),
    eventName: eventName as ExpoReleaseEventName,
    sectorId: normalizeNullableString(payload.sectorId),
    sectorName: normalizeNullableString(payload.sectorName),
    sessionId: normalizeNullableString(payload.sessionId),
    sponsorTier: normalizeNullableString(payload.sponsorTier),
  };
}

export async function trackAnalytics(req: Request, res: Response) {
  try {
    const payload = validateExpoAnalyticsPayload((req.body as ExpoAnalyticsRequestBody)?.payload);
    const supabase = getSupabase();
    const { error } = await supabase
      .from('expo_release_analytics')
      .insert([{
        booth_id: payload.boothId,
        booth_template: payload.boothTemplate,
        company_id: payload.companyId,
        company_slug: payload.companySlug,
        event_name: payload.eventName,
        metadata: payload,
        sector_id: payload.sectorId,
        sector_name: payload.sectorName,
        session_id: payload.sessionId,
        sponsor_tier: payload.sponsorTier,
      }]);

    if (error) {
      throw error;
    }

    res.status(202).json({ success: true });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_ANALYTICS_UNKNOWN');
    const status = code.startsWith('EXPO_ANALYTICS_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
