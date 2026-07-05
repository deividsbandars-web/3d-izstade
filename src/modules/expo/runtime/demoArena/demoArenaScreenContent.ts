import type { CityScreenAssignment, CityScreenSocket } from '../planning/types';
import {
  DEMO_ARENA_SCREEN_TARGETS,
  getActiveDemoArenaEvent,
  getDemoArenaScreenTargets,
} from './demoArenaConfig';
import type { DemoArenaEvent, DemoArenaScreenTarget } from './demoArenaTypes';

type DemoArenaPreviewPurpose = DemoArenaScreenTarget['purpose'];

export type DemoArenaPreviewScreenContent = {
  accentColor: string;
  activeEventId: string;
  chip: string;
  label: string;
  purpose: DemoArenaPreviewPurpose;
  screenId: string;
  subtitle: string;
  targetId: string;
  textureUrl: string;
  tierAccent: string;
  tierLabel: string;
};

export type DemoArenaPreviewAssignmentResult = {
  assignment: CityScreenAssignment;
  content: DemoArenaPreviewScreenContent;
  target: DemoArenaScreenTarget;
};

export type DemoArenaPreviewRuntimeSummary = {
  activeEventId: string | null;
  activeScreenIds: string[];
  enabled: boolean;
  eventTitle: string | null;
  mappedScreenCount: number;
  skippedScreenIds: string[];
  totalTargets: number;
};

const DEMO_ARENA_PREVIEW_COLORS = {
  accent: '#5eead4',
  agenda: '#38bdf8',
  leaderboard: '#fbbf24',
  sponsor: '#f8fafc',
  tierAccent: '#0f172a',
} as const;

const DEMO_ARENA_PREVIEW_ROLE_CHIPS = {
  agenda: 'AGENDA',
  countdown: 'STATUS',
  leaderboard: 'VOTING PREVIEW',
  participantFeature: 'DEMO',
  recap: 'RECAP',
  sponsorBanner: 'SPONSOR',
} as const;

const DEMO_ARENA_PREVIEW_TIER_LABELS = {
  agenda: 'AGENDA',
  countdown: 'STATUS',
  leaderboard: 'VOTE',
  participantFeature: 'DEMO',
  recap: 'RECAP',
  sponsorBanner: 'SPONSOR',
  stage: 'STAGE',
} as const;

function getDemoArenaPreviewValueTier(target: DemoArenaScreenTarget): NonNullable<CityScreenAssignment['commercial']>['valueTier'] {
  switch (target.purpose) {
    case 'mainStage':
      return 'landmark';
    case 'leaderboard':
      return 'hero';
    case 'sponsorBanner':
      return 'premium';
    default:
      return 'standard';
  }
}

let runtimeSummary: DemoArenaPreviewRuntimeSummary = createDisabledDemoArenaPreviewRuntimeSummary();

function createDisabledDemoArenaPreviewRuntimeSummary(): DemoArenaPreviewRuntimeSummary {
  return {
    activeEventId: null,
    activeScreenIds: [],
    enabled: false,
    eventTitle: null,
    mappedScreenCount: 0,
    skippedScreenIds: [],
    totalTargets: DEMO_ARENA_SCREEN_TARGETS.length,
  };
}

function truncateScreenText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function findTargetForAssignment(
  assignment: CityScreenAssignment,
  socket: CityScreenSocket,
): DemoArenaScreenTarget | null {
  return (
    DEMO_ARENA_SCREEN_TARGETS.find((target) => {
      if (!target.existingScreenId) {
        return false;
      }

      if (target.existingScreenId === socket.surfaceId) {
        return true;
      }

      if (`${target.existingScreenId}-socket` === assignment.socketId) {
        return true;
      }

      if (`${target.existingScreenId}-socket-assignment` === assignment.id) {
        return true;
      }

      return false;
    }) ?? null
  );
}

function buildAgendaSummary(event: DemoArenaEvent): string {
  const agenda = event.agendaItems.slice(0, 3).map((item) => `${item.timeLabel} ${item.title}`);
  return truncateScreenText(agenda.join(' - '), 72);
}

function buildParticipantSummary(event: DemoArenaEvent): { label: string; subtitle: string } {
  const participant = event.participants[0];

  if (!participant) {
    return {
      label: 'Featured Demo',
      subtitle: 'Startup pitch slot reserved',
    };
  }

  return {
    label: participant.name,
    subtitle: truncateScreenText(participant.tagline, 72),
  };
}

function getDemoArenaTargetScreenId(target: DemoArenaScreenTarget): string {
  return target.existingScreenId ?? target.assignmentId ?? target.id;
}

function buildSponsorSummary(event: DemoArenaEvent): { label: string; subtitle: string } {
  const sponsorInventory = event.sponsorInventory[0];

  return {
    label: 'Stage Sponsor Slot',
    subtitle: sponsorInventory?.ctaLabel ?? 'Available for partners',
  };
}

function getCardTextForPurpose(
  event: DemoArenaEvent,
  purpose: DemoArenaPreviewPurpose,
): Pick<DemoArenaPreviewScreenContent, 'accentColor' | 'chip' | 'label' | 'subtitle' | 'tierAccent' | 'tierLabel'> {
  const titleParts = event.title.split(':');
  const shortTitle = titleParts[0]?.trim() || 'AI Demo Battle';
  const eventTheme = titleParts.slice(1).join(':').trim() || event.title;
  const demoCount = event.participants.length;
  const participant = buildParticipantSummary(event);
  const sponsor = buildSponsorSummary(event);

  switch (purpose) {
    case 'agenda':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.agenda,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.agenda,
        label: 'Tonight in the Arena',
        subtitle: buildAgendaSummary(event),
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.agenda,
      };
    case 'countdown':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.accent,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.countdown,
        label: 'Monthly Showcase',
        subtitle: `${event.dateLabel} - preview mode`,
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.countdown,
      };
    case 'leaderboard':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.leaderboard,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.leaderboard,
        label: 'Voting Preview',
        subtitle: 'Opens during live event - no voting UI',
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.leaderboard,
      };
    case 'participantFeature':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.accent,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.participantFeature,
        label: truncateScreenText(participant.label, 34),
        subtitle: participant.subtitle,
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.participantFeature,
      };
    case 'recap':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.accent,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.recap,
        label: 'Winner Recap',
        subtitle: 'Highlights and sponsor CTAs after the event',
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.recap,
      };
    case 'sponsorBanner':
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.sponsor,
        chip: DEMO_ARENA_PREVIEW_ROLE_CHIPS.sponsorBanner,
        label: truncateScreenText(sponsor.label, 34),
        subtitle: sponsor.subtitle,
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.sponsorBanner,
      };
    case 'mainStage':
    default:
      return {
        accentColor: DEMO_ARENA_PREVIEW_COLORS.accent,
        chip: shortTitle.toUpperCase(),
        label: truncateScreenText(eventTheme, 34),
        subtitle: `${demoCount} demos - live judging later - sponsor slot open`,
        tierAccent: DEMO_ARENA_PREVIEW_COLORS.tierAccent,
        tierLabel: DEMO_ARENA_PREVIEW_TIER_LABELS.stage,
      };
  }
}

export function buildDemoArenaStaticScreenCard(
  event: DemoArenaEvent,
  target: DemoArenaScreenTarget,
  aspect: number,
): DemoArenaPreviewScreenContent {
  const cardText = getCardTextForPurpose(event, target.purpose);
  const payload = {
    accentColor: cardText.accentColor,
    aspect,
    chip: cardText.chip,
    label: cardText.label,
    subtitle: cardText.subtitle,
    tier: cardText.tierLabel,
    tierAccent: cardText.tierAccent,
  };

  return {
    ...cardText,
    activeEventId: event.id,
    purpose: target.purpose,
    screenId: getDemoArenaTargetScreenId(target),
    targetId: target.id,
    textureUrl: `generated-billboard:${encodeURIComponent(JSON.stringify(payload))}`,
  };
}

export function getDemoArenaPreviewScreenContent(
  event: DemoArenaEvent,
  target: DemoArenaScreenTarget,
  aspect = 1.78,
): DemoArenaPreviewScreenContent {
  return buildDemoArenaStaticScreenCard(event, target, aspect);
}

export function buildDemoArenaPreviewAssignment(
  assignment: CityScreenAssignment,
  socket: CityScreenSocket,
): DemoArenaPreviewAssignmentResult | null {
  const target = findTargetForAssignment(assignment, socket);
  const event = getActiveDemoArenaEvent();

  if (!target || !event) {
    return null;
  }

  const frameWidth = assignment.renderIntent?.frameWidth ?? socket.frameSize[0];
  const frameHeight = assignment.renderIntent?.frameHeight ?? socket.frameSize[1];
  const aspect = Number((frameWidth / Math.max(0.1, frameHeight)).toFixed(3));
  const content = getDemoArenaPreviewScreenContent(event, target, aspect);
  const baseRenderIntent = assignment.renderIntent ?? {
    bodyPanelWidth: frameWidth * 0.97,
    chipColor: content.accentColor,
    detailDistance: 700,
    edgeGlowOpacity: 0.16,
    footerHeight: frameHeight * 0.18,
    frameHeight,
    frameWidth,
    fullBleed: true,
    headerHeight: frameHeight * 0.18,
    maxDistance: 980,
    panelOpacityFar: 0.44,
    panelOpacityMid: 0.58,
    panelOpacityNear: 0.72,
    semanticChip: content.chip,
    semanticMode: 'signal',
    showCenterTitleDistance: 700,
    subtitleDistance: 480,
    tierAccent: content.tierAccent,
    topStripWidth: frameWidth * 0.66,
  } satisfies NonNullable<CityScreenAssignment['renderIntent']>;

  return {
    assignment: {
      ...assignment,
      accentColor: content.accentColor,
      commercial: {
        fallbackImageUrl: content.textureUrl,
        mediaMode: 'generated-card',
        mediaUrl: content.textureUrl,
        ownerId: event.id,
        ownerKind: 'event',
        ownerLabel: event.title,
        priority: 1000,
        qualityTierBehavior: 'static-billboard',
        screenSlotId: target.id,
        source: 'demo-preview',
        valueTier: getDemoArenaPreviewValueTier(target),
      },
      imageUrl: content.textureUrl,
      label: content.label,
      renderIntent: {
        ...baseRenderIntent,
        primitives: [
          {
            fallbackColor: '#06111f',
            kind: 'texture-plane',
            opacity: 1,
            position: [0, 0, 1.16],
            size: [frameWidth * 0.992, frameHeight * 0.992],
            url: content.textureUrl,
          },
        ],
      },
      subtitle: content.subtitle,
    },
    content,
    target,
  };
}

export function buildDemoArenaPreviewRuntimeSummary(
  assignments: CityScreenAssignment[],
  sockets: CityScreenSocket[],
  enabled: boolean,
): DemoArenaPreviewRuntimeSummary {
  if (!enabled) {
    return createDisabledDemoArenaPreviewRuntimeSummary();
  }

  const event = getActiveDemoArenaEvent();
  const socketById = new Map(sockets.map((socket) => [socket.id, socket]));
  const activeScreenIds = new Set<string>();
  const screenTargets = getDemoArenaScreenTargets();

  for (const assignment of assignments) {
    const socket = socketById.get(assignment.socketId);

    if (!socket) {
      continue;
    }

    const target = findTargetForAssignment(assignment, socket);

    if (target?.existingScreenId) {
      activeScreenIds.add(target.existingScreenId);
    }
  }

  const skippedScreenIds = screenTargets
    .flatMap((target) => (target.existingScreenId ? [target.existingScreenId] : []))
    .filter((screenId) => !activeScreenIds.has(screenId));

  return {
    activeEventId: event?.id ?? null,
    activeScreenIds: Array.from(activeScreenIds).sort(),
    enabled: true,
    eventTitle: event?.title ?? null,
    mappedScreenCount: activeScreenIds.size,
    skippedScreenIds,
    totalTargets: screenTargets.length,
  };
}

export function publishDemoArenaPreviewRuntimeSummary(summary: DemoArenaPreviewRuntimeSummary): void {
  if (
    summary.enabled
    && runtimeSummary.enabled
    && runtimeSummary.mappedScreenCount > summary.mappedScreenCount
  ) {
    return;
  }

  runtimeSummary = summary;
}

export function getDemoArenaPreviewRuntimeSummary(): DemoArenaPreviewRuntimeSummary {
  return runtimeSummary;
}
