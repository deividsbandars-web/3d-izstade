import type { ExpoStartView } from '../../../world-contract';

export type ReviewOperatorZone = {
  expectedKeyObjectIds: string[];
  expectedVisibleLayers: string[];
  id: string;
  intent: string;
  label: string;
  startView: ExpoStartView;
  watchItems: string[];
};

export type ExpoOperatorSession =
  | {
      enabled: false;
      reason: 'disabled';
    }
  | {
      enabled: true;
      reason: 'dev' | 'staging-review';
    };

export function resolveExpoOperatorSession(): ExpoOperatorSession {
  if (typeof window === 'undefined') {
    return { enabled: false, reason: 'disabled' };
  }

  const params = new URLSearchParams(window.location.search);
  const wantsOperator = params.get('operator') === '1';
  const isStagingHost = /(^|\.)staging\.30sek24\.com$/i.test(window.location.hostname);

  if (!wantsOperator) {
    return { enabled: false, reason: 'disabled' };
  }

  if (import.meta.env.DEV) {
    return { enabled: true, reason: 'dev' };
  }

  if (isStagingHost) {
    return { enabled: true, reason: 'staging-review' };
  }

  return { enabled: false, reason: 'disabled' };
}

export function buildReviewOperatorZones(): ReviewOperatorZone[] {
  return [
    {
      expectedKeyObjectIds: [
        'mega-landmark-arrival',
        'mega-landmark-showcase',
      ],
      expectedVisibleLayers: ['city-plane', 'mega-landmark', 'booth'],
      id: 'arrival',
      intent: 'arrival-gateway-hierarchy',
      label: 'Arrival Gate',
      startView: {
        lookAt: [0, 42, 256],
        position: [0, 128, 468],
        source: 'arrival-main',
      },
      watchItems: [
        'arrival hierarchy readability',
        'gateway landmark ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-left-0',
        'screen-marquee-left-0-socket',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-mass'],
      id: 'left-marquee-a',
      intent: 'left-screen-marquee-district-a',
      label: 'Left Marquee A',
      startView: {
        lookAt: [-482, 142, -300],
        position: [-768, 178, -42],
        source: 'arrival-main',
      },
      watchItems: [
        'screen assignment discoverability',
        'left district marquee ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-left-1',
        'screen-marquee-left-1-socket',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-mass'],
      id: 'left-marquee-b',
      intent: 'left-screen-marquee-district-b',
      label: 'Left Marquee B',
      startView: {
        lookAt: [-482, 142, -848],
        position: [-774, 184, -582],
        source: 'arrival-main',
      },
      watchItems: [
        'district-b screen continuity',
        'assignment/socket ownership trace',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-hero-center-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-plane'],
      id: 'center-spine-a',
      intent: 'center-civic-spine-district-a',
      label: 'Center Spine A',
      startView: {
        lookAt: [0, 96, -232],
        position: [0, 164, 92],
        source: 'arrival-main',
      },
      watchItems: [
        'center spine screen prominence',
        'route-click review path',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-hero-center-1',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-plane'],
      id: 'center-spine-b',
      intent: 'center-civic-spine-district-b',
      label: 'Center Spine B',
      startView: {
        lookAt: [0, 96, -780],
        position: [0, 168, -468],
        source: 'arrival-main',
      },
      watchItems: [
        'district-b center spine continuity',
        'screen ownership traceability',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-right-0',
        'screen-marquee-right-0-socket',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-mass'],
      id: 'right-marquee-a',
      intent: 'right-screen-marquee-district-a',
      label: 'Right Marquee A',
      startView: {
        lookAt: [486, 136, -330],
        position: [782, 184, -60],
        source: 'arrival-main',
      },
      watchItems: [
        'right marquee CTA clarity',
        'screen/socket registry resolution',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-right-1',
        'screen-marquee-right-1-socket',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-mass'],
      id: 'right-marquee-b',
      intent: 'right-screen-marquee-district-b',
      label: 'Right Marquee B',
      startView: {
        lookAt: [486, 136, -878],
        position: [794, 188, -602],
        source: 'arrival-main',
      },
      watchItems: [
        'district-b right marquee continuity',
        'hover/click regression review',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-hero-right-0',
      ],
      expectedVisibleLayers: ['city-tower', 'city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'tower-cluster-a',
      intent: 'hero-and-mid-tower-ribbons-district-a',
      label: 'Tower Cluster A',
      startView: {
        lookAt: [548, 122, -562],
        position: [812, 196, -208],
        source: 'arrival-main',
      },
      watchItems: [
        'tower ribbon visibility',
        'tower-adjacent screen ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-hero-right-1',
      ],
      expectedVisibleLayers: ['city-tower', 'city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'tower-cluster-b',
      intent: 'hero-and-mid-tower-ribbons-district-b',
      label: 'Tower Cluster B',
      startView: {
        lookAt: [548, 122, -1110],
        position: [822, 198, -742],
        source: 'arrival-main',
      },
      watchItems: [
        'district-b tower screen continuity',
        'tower cluster registry accuracy',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-left-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'left-array-a',
      intent: 'left-district-array-band-a',
      label: 'Left Array A',
      startView: {
        lookAt: [-462, 88, -196],
        position: [-712, 148, 22],
        source: 'arrival-main',
      },
      watchItems: [
        'array-band density review',
        'assignment presence in registry',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-right-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'right-array-a',
      intent: 'right-district-array-band-a',
      label: 'Right Array A',
      startView: {
        lookAt: [462, 86, -210],
        position: [708, 150, 8],
        source: 'arrival-main',
      },
      watchItems: [
        'array-band continuity',
        'right district ownership review',
      ],
    },
    {
      expectedKeyObjectIds: [
        'stadium-bowl',
        'rear-campus-center-event-island',
      ],
      expectedVisibleLayers: ['stadium-structure', 'stadium-plane', 'stadium-pavilion', 'stadium-screen-assignment'],
      id: 'rear',
      intent: 'stadium-campus-continuity',
      label: 'Rear Campus',
      startView: {
        lookAt: [0, 136, -3312],
        position: [0, 248, -2636],
        source: 'arrival-main',
      },
      watchItems: [
        'rear-campus ownership split',
        'stadium feed surface coverage',
      ],
    },
  ];
}
