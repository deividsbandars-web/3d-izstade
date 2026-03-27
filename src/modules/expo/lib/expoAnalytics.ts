export type ExpoAnalyticsEventName =
  | 'scene_loaded'
  | 'sector_entered'
  | 'booth_viewed'
  | 'booth_clicked'
  | 'website_opened'
  | 'booking_clicked'
  | 'demo_room_entered';

export type ExpoAnalyticsDetail = {
  boothId?: string | null;
  boothTemplate?: string | null;
  companyId?: string | null;
  companySlug?: string | null;
  eventName: ExpoAnalyticsEventName;
  sectorId?: string | null;
  sectorName?: string | null;
  sponsorTier?: string | null;
} & Record<string, unknown>;

export type ExpoAnalyticsTarget = {
  analyticsTrack?: (eventName: string, payload: Record<string, unknown>) => void;
  createEvent?: (detail: ExpoAnalyticsDetail) => Event;
  dataLayer?: Array<Record<string, unknown>>;
  dispatchEvent?: (event: Event) => boolean;
  gtag?: (command: 'event', eventName: string, payload: Record<string, unknown>) => void;
};

export function createExpoAnalyticsDetail(
  eventName: ExpoAnalyticsEventName,
  company: any,
  meta: Record<string, unknown> = {}
): ExpoAnalyticsDetail {
  return {
    boothId: (meta.boothId as string | undefined) ?? null,
    companyId: company?.id ?? null,
    companySlug: company?.slug ?? null,
    eventName,
    sectorId: (meta.sectorId as string | undefined) ?? company?.sectorId ?? company?.sector_id ?? null,
    sectorName: (meta.sectorName as string | undefined) ?? null,
    sponsorTier: company?.sponsorTier ?? null,
    ...meta,
  };
}

function getBrowserTarget(): ExpoAnalyticsTarget | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const analyticsTrack = typeof (window as any).analytics?.track === 'function'
    ? (window as any).analytics.track.bind((window as any).analytics)
    : undefined;
  const gtag = typeof (window as any).gtag === 'function'
    ? (window as any).gtag.bind(window)
    : undefined;

  return {
    analyticsTrack,
    createEvent: (detail) => new CustomEvent('expo:analytics', { detail }),
    dataLayer: Array.isArray((window as any).dataLayer) ? (window as any).dataLayer : undefined,
    dispatchEvent: (event) => window.dispatchEvent(event),
    gtag,
  };
}

export function trackExpoAnalyticsEvent(
  eventName: ExpoAnalyticsEventName,
  company: any,
  meta: Record<string, unknown> = {},
  target: ExpoAnalyticsTarget | null = getBrowserTarget()
) {
  const detail = createExpoAnalyticsDetail(eventName, company, meta);

  if (target?.dispatchEvent) {
    const event = target.createEvent
      ? target.createEvent(detail)
      : ({ type: 'expo:analytics', detail } as unknown as Event);
    target.dispatchEvent(event);
  }

  if (Array.isArray(target?.dataLayer)) {
    target.dataLayer.push({ event: `expo_${eventName}`, ...detail });
  }

  if (target?.analyticsTrack) {
    target.analyticsTrack(`expo_${eventName}`, detail);
  }

  if (target?.gtag) {
    target.gtag('event', `expo_${eventName}`, detail);
  }

  return detail;
}

export function trackExpoSceneLoaded(meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('scene_loaded', null, meta, target);
}

export function trackExpoSectorEntered(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('sector_entered', company, meta, target);
}

export function trackExpoBoothViewed(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('booth_viewed', company, meta, target);
}

export function trackExpoBoothClicked(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('booth_clicked', company, meta, target);
}

export function trackExpoWebsiteOpened(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('website_opened', company, meta, target);
}

export function trackExpoBookingClicked(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('booking_clicked', company, meta, target);
}

export function trackExpoDemoRoomEntered(company: any, meta: Record<string, unknown> = {}, target?: ExpoAnalyticsTarget | null) {
  return trackExpoAnalyticsEvent('demo_room_entered', company, meta, target);
}

