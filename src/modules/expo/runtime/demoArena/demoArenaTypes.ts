import type { ExpoZoneId } from '../world/zones/expoZoneRegistry';

export type DemoArenaEventType =
  | 'AI_DEMO_BATTLE'
  | 'STARTUP_PITCH_NIGHT'
  | 'INVESTOR_DAY'
  | 'SAAS_DEMO_DAY'
  | 'XR_SHOWCASE';

export type DemoArenaEventStatus = 'upcoming' | 'live' | 'replay';

export type DemoArenaAgendaItemType =
  | 'keynote'
  | 'demo'
  | 'pitch'
  | 'panel'
  | 'break'
  | 'voting'
  | 'sponsorSpotlight';

export type DemoArenaSponsorPlacementType =
  | 'stageNaming'
  | 'heroScreen'
  | 'sideScreen'
  | 'votingSponsor'
  | 'recapSponsor'
  | 'zoneSponsor';

export type DemoArenaScreenPurpose =
  | 'mainStage'
  | 'sponsorBanner'
  | 'countdown'
  | 'leaderboard'
  | 'agenda'
  | 'participantFeature'
  | 'recap';

export type DemoArenaCtaType =
  | 'applyToPitch'
  | 'sponsorBattle'
  | 'viewAgenda'
  | 'reserveStageSlot'
  | 'joinLiveEvent'
  | 'watchReplay'
  | 'contactOrganizer'
  | 'learnMore';

export type DemoArenaAnalyticsEventName =
  | 'demo_arena_preview_view'
  | 'demo_arena_screen_view'
  | 'demo_arena_cta_visible'
  | 'demo_arena_cta_click'
  | 'demo_arena_sponsor_slot_view'
  | 'demo_arena_participant_feature_view'
  | 'demo_arena_agenda_view'
  | 'demo_arena_voting_preview_view';

export type DemoArenaParticipant = {
  category: string;
  ctaLabel: string;
  ctaUrl: string;
  id: string;
  logoKey: string;
  name: string;
  pitchSlot: string;
  sponsorId?: string;
  tagline: string;
};

export type DemoArenaAgendaItem = {
  id: string;
  participantId?: string;
  speaker: string;
  timeLabel: string;
  title: string;
  type: DemoArenaAgendaItemType;
};

export type DemoArenaSponsorInventory = {
  analyticsId: string;
  ctaLabel: string;
  id: string;
  placementType: DemoArenaSponsorPlacementType;
  screenTargetId?: string;
  sponsorId: string;
};

export type DemoArenaCtaDefinition = {
  analyticsId: string;
  enabledInPreview: boolean;
  enabledInProduction: boolean;
  id: string;
  isExternal: boolean;
  label: string;
  notes?: string;
  screenTargetId?: string;
  shortLabel: string;
  sponsorInventoryId?: string;
  targetUrl?: string;
  type: DemoArenaCtaType;
};

export type DemoArenaScreenTarget = {
  assignmentId?: string;
  existingScreenId?: string;
  id: string;
  operatorZoneId?: string;
  purpose: DemoArenaScreenPurpose;
  safeForFutureContentMapping: boolean;
  zoneId: ExpoZoneId;
};

export type DemoArenaEvent = {
  agendaItems: DemoArenaAgendaItem[];
  analyticsId: string;
  ctaDefinitions: DemoArenaCtaDefinition[];
  dateLabel: string;
  eventType: DemoArenaEventType;
  id: string;
  participants: DemoArenaParticipant[];
  primaryCta: string;
  screenTargetIds: string[];
  secondaryCta: string;
  sponsorIds: string[];
  sponsorInventory: DemoArenaSponsorInventory[];
  stageZoneId: ExpoZoneId;
  status: DemoArenaEventStatus;
  title: string;
};

export type DemoArenaAnalyticsPayload = {
  analyticsId?: string;
  ctaId?: string;
  eventId: string;
  eventName: DemoArenaAnalyticsEventName;
  metadata?: Record<string, string | number | boolean | null>;
  operatorZoneId?: string | null;
  participantId?: string;
  placementType?: DemoArenaSponsorPlacementType;
  previewEnabled: boolean;
  qualityTier?: string | null;
  screenTargetId?: string;
  sponsorInventoryId?: string;
  timestamp?: string;
};
