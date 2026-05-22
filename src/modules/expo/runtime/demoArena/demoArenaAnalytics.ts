import { getActiveDemoArenaEvent } from './demoArenaConfig';
import type {
  DemoArenaAnalyticsEventName,
  DemoArenaAnalyticsPayload,
  DemoArenaCtaDefinition,
  DemoArenaEvent,
  DemoArenaScreenTarget,
  DemoArenaSponsorInventory,
} from './demoArenaTypes';

export type DemoArenaAnalyticsContext = {
  operatorZoneId?: string | null;
  qualityTier?: string | null;
  timestamp?: string;
};

export type DemoArenaCtaAnalyticsSummary = {
  analyticsEventNames: DemoArenaAnalyticsEventName[];
  ctaCount: number;
  enabled: boolean;
  hasBackend: false;
  previewEnabledCtaCount: number;
  screenCtaMap: Record<string, string[]>;
};

export const DEMO_ARENA_ANALYTICS_EVENT_NAMES: DemoArenaAnalyticsEventName[] = [
  'demo_arena_preview_view',
  'demo_arena_screen_view',
  'demo_arena_cta_visible',
  'demo_arena_cta_click',
  'demo_arena_sponsor_slot_view',
  'demo_arena_participant_feature_view',
  'demo_arena_agenda_view',
  'demo_arena_voting_preview_view',
];

function resolveTimestamp(context?: DemoArenaAnalyticsContext) {
  return context?.timestamp ?? new Date(0).toISOString();
}

function getSponsorInventoryById(
  event: DemoArenaEvent,
  sponsorInventoryId?: string,
): DemoArenaSponsorInventory | null {
  if (!sponsorInventoryId) {
    return null;
  }

  return event.sponsorInventory.find((entry) => entry.id === sponsorInventoryId) ?? null;
}

export function getDemoArenaCtasForScreen(
  event: DemoArenaEvent,
  screenTargetId: string,
  previewOnly = true,
): DemoArenaCtaDefinition[] {
  return event.ctaDefinitions.filter((cta) => {
    if (cta.screenTargetId !== screenTargetId) {
      return false;
    }

    return previewOnly ? cta.enabledInPreview : true;
  });
}

export function buildDemoArenaPreviewViewPayload(
  event: DemoArenaEvent,
  context?: DemoArenaAnalyticsContext,
): DemoArenaAnalyticsPayload {
  return {
    analyticsId: event.analyticsId,
    eventId: event.id,
    eventName: 'demo_arena_preview_view',
    operatorZoneId: context?.operatorZoneId ?? null,
    previewEnabled: true,
    qualityTier: context?.qualityTier ?? null,
    timestamp: resolveTimestamp(context),
  };
}

export function buildDemoArenaScreenViewPayload(
  event: DemoArenaEvent,
  target: DemoArenaScreenTarget,
  context?: DemoArenaAnalyticsContext,
): DemoArenaAnalyticsPayload {
  return {
    analyticsId: event.analyticsId,
    eventId: event.id,
    eventName: 'demo_arena_screen_view',
    metadata: {
      purpose: target.purpose,
    },
    operatorZoneId: context?.operatorZoneId ?? target.operatorZoneId ?? null,
    previewEnabled: true,
    qualityTier: context?.qualityTier ?? null,
    screenTargetId: target.id,
    timestamp: resolveTimestamp(context),
  };
}

export function buildDemoArenaCtaVisiblePayload(
  event: DemoArenaEvent,
  cta: DemoArenaCtaDefinition,
  context?: DemoArenaAnalyticsContext,
): DemoArenaAnalyticsPayload {
  const sponsorInventory = getSponsorInventoryById(event, cta.sponsorInventoryId);

  return {
    analyticsId: cta.analyticsId,
    ctaId: cta.id,
    eventId: event.id,
    eventName: 'demo_arena_cta_visible',
    metadata: {
      ctaType: cta.type,
      enabledInProduction: cta.enabledInProduction,
      isExternal: cta.isExternal,
    },
    operatorZoneId: context?.operatorZoneId ?? null,
    placementType: sponsorInventory?.placementType,
    previewEnabled: true,
    qualityTier: context?.qualityTier ?? null,
    screenTargetId: cta.screenTargetId,
    sponsorInventoryId: cta.sponsorInventoryId,
    timestamp: resolveTimestamp(context),
  };
}

export function getDemoArenaAnalyticsSummary(
  event: DemoArenaEvent | null = getActiveDemoArenaEvent(),
  enabled = true,
): DemoArenaCtaAnalyticsSummary {
  const ctas = event?.ctaDefinitions ?? [];
  const screenCtaMap = ctas.reduce<Record<string, string[]>>((accumulator, cta) => {
    if (!cta.screenTargetId || !cta.enabledInPreview) {
      return accumulator;
    }

    accumulator[cta.screenTargetId] = [...(accumulator[cta.screenTargetId] ?? []), cta.id];
    return accumulator;
  }, {});

  return {
    analyticsEventNames: DEMO_ARENA_ANALYTICS_EVENT_NAMES,
    ctaCount: ctas.length,
    enabled,
    hasBackend: false,
    previewEnabledCtaCount: ctas.filter((cta) => cta.enabledInPreview).length,
    screenCtaMap,
  };
}
