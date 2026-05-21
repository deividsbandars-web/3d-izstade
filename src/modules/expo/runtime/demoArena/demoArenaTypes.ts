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
