import type { ExpoStartView } from '../../../world-contract';
import type { WorldObjectLayer } from '../../world/inspection/worldObjectRegistry';

type ReviewOperatorZoneCamera = {
  lookAtOffset?: [number, number, number];
  positionOffset: [number, number, number];
  targetIds: string[];
};

export const DEFAULT_REVIEW_OPERATOR_ZONE_ID = 'arrival-gate';

export type ReviewOperatorZone = {
  camera?: ReviewOperatorZoneCamera;
  expectedKeyObjectIds: string[];
  expectedVisibleLayers: WorldObjectLayer[];
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

export function resolveReviewOperatorZoneStartView(
  zone: ReviewOperatorZone,
  registryById: Map<string, { position: [number, number, number] | number[] }>,
): ExpoStartView {
  if (!zone.camera?.targetIds.length) {
    return zone.startView;
  }

  const targets = zone.camera.targetIds
    .map((id) => registryById.get(id)?.position)
    .filter(Boolean) as number[][];

  if (targets.length === 0) {
    return zone.startView;
  }

  const anchor = targets.reduce<[number, number, number]>(
    (acc, position) => [acc[0] + position[0], acc[1] + position[1], acc[2] + position[2]],
    [0, 0, 0],
  ).map((value) => value / targets.length) as [number, number, number];

  const lookAtOffset = zone.camera.lookAtOffset ?? [0, 0, 0];

  return {
    lookAt: [
      anchor[0] + lookAtOffset[0],
      anchor[1] + lookAtOffset[1],
      anchor[2] + lookAtOffset[2],
    ],
    position: [
      anchor[0] + zone.camera.positionOffset[0],
      anchor[1] + zone.camera.positionOffset[1],
      anchor[2] + zone.camera.positionOffset[2],
    ],
    source: zone.startView.source,
  };
}

export function buildReviewOperatorZones(): ReviewOperatorZone[] {
  return [
    {
      expectedKeyObjectIds: [
        'mega-landmark-arrival',
        'mega-landmark-showcase',
      ],
      expectedVisibleLayers: ['mega-landmark', 'booth'],
      id: 'arrival-gate',
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
      id: 'left-marquee',
      intent: 'left-screen-marquee-review',
      label: 'Left Marquee',
      camera: {
        lookAtOffset: [0, 22, 0],
        positionOffset: [292, 118, 332],
        targetIds: ['screen-marquee-left-0'],
      },
      startView: {
        lookAt: [-708, 148, -296],
        position: [-980, 268, 32],
        source: 'arrival-main',
      },
      watchItems: [
        'screen assignment discoverability',
        'left district marquee ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-spine-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'center-spine',
      intent: 'center-civic-spine-review',
      label: 'Center Spine',
      camera: {
        lookAtOffset: [0, 24, 0],
        positionOffset: [104, 108, 284],
        targetIds: ['screen-spine-0'],
      },
      startView: {
        lookAt: [0, 104, -238],
        position: [0, 252, 120],
        source: 'arrival-main',
      },
      watchItems: [
        'center spine screen prominence',
        'route-click review path',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-right-0',
        'screen-marquee-right-0-socket',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment', 'city-mass'],
      id: 'right-marquee',
      intent: 'right-screen-marquee-review',
      label: 'Right Marquee',
      camera: {
        lookAtOffset: [0, 22, 0],
        positionOffset: [-292, 118, 332],
        targetIds: ['screen-marquee-right-0'],
      },
      startView: {
        lookAt: [708, 144, -328],
        position: [980, 260, -24],
        source: 'arrival-main',
      },
      watchItems: [
        'right marquee CTA clarity',
        'screen/socket registry resolution',
      ],
    },
    {
      expectedKeyObjectIds: [
        'arrival-core-hero-tower-right-tower-ribbon',
      ],
      expectedVisibleLayers: ['city-tower', 'city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'tower-cluster',
      intent: 'tower-cluster-screen-review',
      label: 'Tower Cluster',
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
        'screen-array-left-0',
        'screen-array-right-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-socket', 'city-screen-assignment'],
      id: 'array-band',
      intent: 'array-band-cross-city-review',
      label: 'Array Band',
      startView: {
        lookAt: [0, 88, -214],
        position: [0, 152, 76],
        source: 'arrival-main',
      },
      watchItems: [
        'array-band density review',
        'cross-city assignment continuity',
      ],
    },
    {
      expectedKeyObjectIds: [
        'immersive-fabric-labs',
      ],
      expectedVisibleLayers: ['booth', 'city-screen-assignment'],
      id: 'sponsor-boulevard-left',
      intent: 'left-sponsor-boulevard-frontage-review',
      label: 'Sponsor Boulevard Left',
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [62, 28, 76],
        targetIds: ['immersive-fabric-labs'],
      },
      startView: {
        lookAt: [-526, 22, -1356],
        position: [-344, 148, -1088],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage readability',
        'left sponsor CTA coverage',
      ],
    },
    {
      expectedKeyObjectIds: [
        'sponsor-concierge',
      ],
      expectedVisibleLayers: ['booth', 'city-screen-assignment'],
      id: 'sponsor-boulevard-right',
      intent: 'right-sponsor-boulevard-frontage-review',
      label: 'Sponsor Boulevard Right',
      camera: {
        lookAtOffset: [-3, 14, 4],
        positionOffset: [28, 20, 40],
        targetIds: ['sponsor-concierge'],
      },
      startView: {
        lookAt: [80, 18, -798],
        position: [364, 136, -604],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage readability',
        'right sponsor CTA coverage',
      ],
    },
    {
      expectedKeyObjectIds: [
        'stadium-bowl',
        'rear-campus-center-event-island',
      ],
      expectedVisibleLayers: ['stadium-structure', 'stadium-screen-feed'],
      id: 'rear-campus-center',
      intent: 'rear-campus-center-review',
      label: 'Rear Campus Center',
      startView: {
        lookAt: [0, 136, -4550],
        position: [0, 248, -3920],
        source: 'arrival-main',
      },
      watchItems: [
        'rear-campus ownership split',
        'stadium feed surface coverage',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-bowl-feed-surface-socket-assignment-rear-campus-custom-feed-bowl',
      ],
      expectedVisibleLayers: ['stadium-screen-feed', 'stadium-structure'],
      id: 'stadium-feed-axis',
      intent: 'rear-campus-feed-axis-review',
      label: 'Stadium Feed Axis',
      startView: {
        lookAt: [0, 98, -2820],
        position: [0, 156, -2408],
        source: 'arrival-main',
      },
      watchItems: [
        'rear-campus feed ownership clarity',
        'custom-feed vs screen-system split',
      ],
    },
  ];
}
