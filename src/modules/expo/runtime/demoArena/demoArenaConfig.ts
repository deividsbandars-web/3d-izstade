import type {
  DemoArenaEvent,
  DemoArenaScreenTarget,
  DemoArenaSponsorInventory,
} from './demoArenaTypes';

export const DEMO_ARENA_SCREEN_TARGETS: DemoArenaScreenTarget[] = [
  {
    existingScreenId: 'rear-campus-stage-monolith-canopy-host-surface',
    id: 'demo-arena-main-stage',
    operatorZoneId: 'rear-campus-center',
    purpose: 'mainStage',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-bowl-feed-surface',
    id: 'demo-arena-bowl-feed',
    operatorZoneId: 'stadium-feed-axis',
    purpose: 'participantFeature',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-orbital-scoregate-host-surface',
    id: 'demo-arena-scoregate',
    operatorZoneId: 'rear-campus-orbital-scoregate',
    purpose: 'leaderboard',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-event-pavilion-left-feed-surface',
    id: 'demo-arena-left-sponsor-feed',
    operatorZoneId: 'stadium-left-flank',
    purpose: 'sponsorBanner',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-event-pavilion-right-feed-surface',
    id: 'demo-arena-right-sponsor-feed',
    operatorZoneId: 'stadium-right-flank',
    purpose: 'sponsorBanner',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-mega-civic-hall-host-surface',
    id: 'demo-arena-recap-hall',
    operatorZoneId: 'rear-campus-mega-hall',
    purpose: 'recap',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-sky-slab-tower-host-surface',
    id: 'demo-arena-sky-slab-agenda',
    operatorZoneId: 'rear-campus-sky-slab-feed',
    purpose: 'agenda',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
  {
    existingScreenId: 'rear-campus-needle-crown-skyscraper-host-surface',
    id: 'demo-arena-needle-countdown',
    operatorZoneId: 'rear-campus-needle-crown',
    purpose: 'countdown',
    safeForFutureContentMapping: true,
    zoneId: 'demoArena',
  },
];

const DEMO_ARENA_SAMPLE_SPONSOR_INVENTORY: DemoArenaSponsorInventory[] = [
  {
    analyticsId: 'demo-arena-automation-tools-stage-naming',
    ctaLabel: 'Explore automation stack',
    id: 'demo-arena-stage-naming-slot',
    placementType: 'stageNaming',
    screenTargetId: 'demo-arena-main-stage',
    sponsorId: 'mock-sponsor-automation-cloud',
  },
  {
    analyticsId: 'demo-arena-automation-tools-hero-screen',
    ctaLabel: 'Book a workflow review',
    id: 'demo-arena-hero-screen-slot',
    placementType: 'heroScreen',
    screenTargetId: 'demo-arena-bowl-feed',
    sponsorId: 'mock-sponsor-workflow-labs',
  },
  {
    analyticsId: 'demo-arena-automation-tools-voting-sponsor',
    ctaLabel: 'Sponsor the vote',
    id: 'demo-arena-voting-sponsor-slot',
    placementType: 'votingSponsor',
    screenTargetId: 'demo-arena-scoregate',
    sponsorId: 'mock-sponsor-signal-metrics',
  },
  {
    analyticsId: 'demo-arena-automation-tools-recap-sponsor',
    ctaLabel: 'Download recap kit',
    id: 'demo-arena-recap-sponsor-slot',
    placementType: 'recapSponsor',
    screenTargetId: 'demo-arena-recap-hall',
    sponsorId: 'mock-sponsor-recap-ai',
  },
];

export const DEMO_ARENA_EVENTS: DemoArenaEvent[] = [
  {
    agendaItems: [
      {
        id: 'automation-tools-welcome',
        speaker: 'AI Expo City host',
        timeLabel: '00:00',
        title: 'Arena welcome and sponsor context',
        type: 'keynote',
      },
      {
        id: 'automation-tools-demo-flowforge',
        participantId: 'flowforge-ai',
        speaker: 'FlowForge AI founder',
        timeLabel: '00:08',
        title: 'FlowForge AI live workflow build',
        type: 'demo',
      },
      {
        id: 'automation-tools-demo-promptgrid',
        participantId: 'promptgrid',
        speaker: 'PromptGrid product lead',
        timeLabel: '00:18',
        title: 'PromptGrid enterprise prompt ops',
        type: 'demo',
      },
      {
        id: 'automation-tools-panel',
        speaker: 'Founder panel',
        timeLabel: '00:30',
        title: 'What buyers expect from AI automation tools',
        type: 'panel',
      },
      {
        id: 'automation-tools-voting',
        speaker: 'Audience',
        timeLabel: '00:42',
        title: 'Audience voting window',
        type: 'voting',
      },
      {
        id: 'automation-tools-recap',
        speaker: 'AI Expo City host',
        timeLabel: '00:50',
        title: 'Winner recap and sponsor CTAs',
        type: 'sponsorSpotlight',
      },
    ],
    analyticsId: 'demo-arena-event-automation-tools',
    dateLabel: 'Monthly showcase',
    eventType: 'AI_DEMO_BATTLE',
    id: 'ai-demo-battle-automation-tools',
    participants: [
      {
        category: 'Workflow automation',
        ctaLabel: 'View workflow demo',
        ctaUrl: '#demo-arena-placeholder-flowforge-ai',
        id: 'flowforge-ai',
        logoKey: 'mock-flowforge-ai',
        name: 'FlowForge AI',
        pitchSlot: 'Slot 01',
        tagline: 'Turns messy operations into governed AI workflows.',
      },
      {
        category: 'Prompt operations',
        ctaLabel: 'Open prompt ops brief',
        ctaUrl: '#demo-arena-placeholder-promptgrid',
        id: 'promptgrid',
        logoKey: 'mock-promptgrid',
        name: 'PromptGrid',
        pitchSlot: 'Slot 02',
        tagline: 'Versioned prompt control for revenue and support teams.',
      },
      {
        category: 'Sales automation',
        ctaLabel: 'Review sales assistant',
        ctaUrl: '#demo-arena-placeholder-signalpilot',
        id: 'signalpilot',
        logoKey: 'mock-signalpilot',
        name: 'SignalPilot',
        pitchSlot: 'Slot 03',
        tagline: 'AI account research and follow-up orchestration.',
      },
      {
        category: 'Back-office agents',
        ctaLabel: 'See agent playbook',
        ctaUrl: '#demo-arena-placeholder-backoffice-copilot',
        id: 'backoffice-copilot',
        logoKey: 'mock-backoffice-copilot',
        name: 'BackOffice Copilot',
        pitchSlot: 'Slot 04',
        tagline: 'Agent-assisted finance and admin workflows for SMBs.',
      },
      {
        category: 'Analytics automation',
        ctaLabel: 'Open analytics sandbox',
        ctaUrl: '#demo-arena-placeholder-metricmesh',
        id: 'metricmesh',
        logoKey: 'mock-metricmesh',
        name: 'MetricMesh',
        pitchSlot: 'Slot 05',
        tagline: 'Automated KPI narration from warehouse to executive recap.',
      },
    ],
    primaryCta: 'Reserve a demo battle slot',
    screenTargetIds: DEMO_ARENA_SCREEN_TARGETS.map((target) => target.id),
    secondaryCta: 'Sponsor a monthly showcase',
    sponsorIds: [
      'mock-sponsor-automation-cloud',
      'mock-sponsor-workflow-labs',
      'mock-sponsor-signal-metrics',
      'mock-sponsor-recap-ai',
    ],
    sponsorInventory: DEMO_ARENA_SAMPLE_SPONSOR_INVENTORY,
    stageZoneId: 'demoArena',
    status: 'upcoming',
    title: 'AI Demo Battle: Automation Tools',
  },
];

export function getDemoArenaEventById(eventId: string) {
  return DEMO_ARENA_EVENTS.find((event) => event.id === eventId) ?? null;
}

export function getActiveDemoArenaEvent(events: readonly DemoArenaEvent[] = DEMO_ARENA_EVENTS) {
  return events.find((event) => event.status === 'live')
    ?? events.find((event) => event.status === 'upcoming')
    ?? events[0]
    ?? null;
}

export function getDemoArenaScreenTargets() {
  return DEMO_ARENA_SCREEN_TARGETS;
}

export function getDemoArenaSponsorInventory(eventId?: string) {
  const event = eventId ? getDemoArenaEventById(eventId) : getActiveDemoArenaEvent();
  return event?.sponsorInventory ?? [];
}
