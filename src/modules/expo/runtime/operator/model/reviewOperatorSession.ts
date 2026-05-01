import type { ExpoStartView } from '../../../world-contract';
import type { WorldObjectLayer } from '../../world/inspection/worldObjectRegistry';

type ReviewOperatorZoneCamera = {
  lookAtOffset?: [number, number, number];
  positionOffset: [number, number, number];
  targetIds: string[];
};

export const DEFAULT_REVIEW_OPERATOR_ZONE_ID = 'arrival-gate';

const CITY_REVIEW_FORBIDDEN_LAYERS: WorldObjectLayer[] = [
  'stadium-screen-assignment',
  'stadium-screen-feed',
  'stadium-screen-socket',
  'stadium-screen-surface',
];

const STADIUM_REVIEW_FORBIDDEN_LAYERS: WorldObjectLayer[] = [
  'city-screen-assignment',
  'city-screen-socket',
  'city-screen-surface',
];

const STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS = [
  'rear-campus-axis-terminal-left-feed-surface',
  'rear-campus-axis-terminal-right-feed-surface',
  'rear-campus-axis-kiosk-left-feed-surface',
  'rear-campus-axis-kiosk-right-feed-surface',
];

export type ReviewOperatorZone = {
  camera?: ReviewOperatorZoneCamera;
  expectedKeyObjectIds: string[];
  expectedVisibleLayers: WorldObjectLayer[];
  forbiddenKeyObjectIds?: string[];
  forbiddenVisibleLayers?: WorldObjectLayer[];
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
  const zones: ReviewOperatorZone[] = [
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
        'mega-landmark-arrival',
        'screen-spine-0',
      ],
      expectedVisibleLayers: ['mega-landmark', 'city-screen-surface', 'city-screen-assignment'],
      id: 'arrival-civic-axis',
      intent: 'arrival-civic-axis-review',
      label: 'Arrival Civic Axis',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [0, 132, 408],
        targetIds: ['screen-spine-0'],
      },
      startView: {
        lookAt: [0, 88, 8],
        position: [0, 168, 332],
        source: 'arrival-main',
      },
      watchItems: [
        'arrival-to-spine continuity',
        'first impression skyline read',
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
        'screen-marquee-left-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'left-marquee-close',
      intent: 'left-screen-marquee-close-review',
      label: 'Left Marquee Close',
      camera: {
        lookAtOffset: [0, 16, 0],
        positionOffset: [178, 74, 204],
        targetIds: ['screen-marquee-left-0'],
      },
      startView: {
        lookAt: [-622, 124, -284],
        position: [-790, 198, -62],
        source: 'arrival-main',
      },
      watchItems: [
        'screen mounting quality',
        'left marquee bezel proportion',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-left-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'left-edge-far',
      intent: 'left-edge-far-review',
      label: 'Left Edge Far',
      startView: {
        lookAt: [-1460, 92, -1180],
        position: [-1820, 188, -860],
        source: 'arrival-main',
      },
      watchItems: [
        'far-left skyline/media coverage',
        'outer-left placement sanity',
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
        'mega-landmark-showcase',
        'screen-spine-0',
      ],
      expectedVisibleLayers: ['mega-landmark', 'city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'mid-start-deep',
      intent: 'mid-start-deep-review',
      label: 'Mid Start Deep',
      startView: {
        lookAt: [0, 92, -520],
        position: [0, 172, -128],
        source: 'arrival-main',
      },
      watchItems: [
        'mid-axis continuity',
        'start-to-center visual transition',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-spine-0',
        'screen-spine-1',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'center-spine-side',
      intent: 'center-civic-spine-side-review',
      label: 'Center Spine Side',
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [248, 84, 158],
        targetIds: ['screen-spine-0', 'screen-spine-1'],
      },
      startView: {
        lookAt: [116, 94, -258],
        position: [324, 188, -86],
        source: 'arrival-main',
      },
      watchItems: [
        'center spine lateral read',
        'screen-to-structure fit',
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
        'screen-marquee-right-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'right-marquee-close',
      intent: 'right-screen-marquee-close-review',
      label: 'Right Marquee Close',
      camera: {
        lookAtOffset: [0, 16, 0],
        positionOffset: [-178, 74, 204],
        targetIds: ['screen-marquee-right-0'],
      },
      startView: {
        lookAt: [622, 124, -308],
        position: [790, 198, -84],
        source: 'arrival-main',
      },
      watchItems: [
        'screen mounting quality',
        'right marquee bezel proportion',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-right-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'right-edge-far',
      intent: 'right-edge-far-review',
      label: 'Right Edge Far',
      startView: {
        lookAt: [1460, 92, -1180],
        position: [1820, 188, -860],
        source: 'arrival-main',
      },
      watchItems: [
        'far-right skyline/media coverage',
        'outer-right placement sanity',
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
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [228, 92, 252],
        targetIds: ['arrival-core-hero-tower-right-tower-ribbon'],
      },
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
        'arrival-core-hero-tower-right-tower-ribbon',
      ],
      expectedVisibleLayers: ['city-tower', 'city-screen-surface', 'city-screen-assignment'],
      id: 'tower-cluster-reverse',
      intent: 'tower-cluster-reverse-review',
      label: 'Tower Cluster Reverse',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [-242, 104, -214],
        targetIds: ['arrival-core-hero-tower-right-tower-ribbon'],
      },
      startView: {
        lookAt: [612, 124, -504],
        position: [372, 210, -758],
        source: 'arrival-main',
      },
      watchItems: [
        'tower media skyline hierarchy',
        'reverse-side tower fit',
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
        'screen-array-left-0',
        'screen-array-right-0',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-screen-assignment', 'city-mass'],
      id: 'array-band-south',
      intent: 'array-band-south-review',
      label: 'Array Band South',
      camera: {
        lookAtOffset: [0, 12, 0],
        positionOffset: [0, 76, 256],
        targetIds: ['screen-array-left-0', 'screen-array-right-0'],
      },
      startView: {
        lookAt: [0, 72, -496],
        position: [0, 154, -242],
        source: 'arrival-main',
      },
      watchItems: [
        'array screen spacing',
        'district continuity from south axis',
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
        'immersive-fabric-labs',
      ],
      expectedVisibleLayers: ['booth', 'city-screen-assignment'],
      id: 'sponsor-boulevard-left-close',
      intent: 'left-sponsor-boulevard-close-review',
      label: 'Sponsor Boulevard Left Close',
      camera: {
        lookAtOffset: [0, 14, 0],
        positionOffset: [38, 16, 42],
        targetIds: ['immersive-fabric-labs'],
      },
      startView: {
        lookAt: [-474, 18, -1328],
        position: [-396, 88, -1266],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage material read',
        'left sponsor screen integration',
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
        'sponsor-concierge',
      ],
      expectedVisibleLayers: ['booth', 'city-screen-assignment'],
      id: 'sponsor-boulevard-right-close',
      intent: 'right-sponsor-boulevard-close-review',
      label: 'Sponsor Boulevard Right Close',
      camera: {
        lookAtOffset: [-2, 12, 2],
        positionOffset: [18, 14, 28],
        targetIds: ['sponsor-concierge'],
      },
      startView: {
        lookAt: [116, 16, -786],
        position: [176, 78, -740],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage material read',
        'right sponsor screen integration',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-bowl-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-structure'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-approach',
      intent: 'stadium-approach-review',
      label: 'Stadium Approach',
      camera: {
        lookAtOffset: [0, 24, 0],
        positionOffset: [0, 124, 624],
        targetIds: ['rear-campus-bowl-feed-surface'],
      },
      startView: {
        lookAt: [0, 112, -2810],
        position: [0, 236, -2190],
        source: 'arrival-main',
      },
      watchItems: [
        'stadium entrance composition',
        'floating plate detection',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-bowl-feed-surface',
        'stadium-bowl',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-structure'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-left-flank',
      intent: 'stadium-left-flank-review',
      label: 'Stadium Left Flank',
      startView: {
        lookAt: [-1160, 124, -3080],
        position: [-1640, 236, -2580],
        source: 'arrival-main',
      },
      watchItems: [
        'left stadium edge continuity',
        'left flank screen mounting',
      ],
    },
    {
      expectedKeyObjectIds: [
        'stadium-bowl',
        'rear-campus-center-event-island',
      ],
      expectedVisibleLayers: ['stadium-structure', 'stadium-screen-feed'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
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
        'rear-campus-bowl-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-structure'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-feed-axis',
      intent: 'rear-campus-feed-axis-review',
      label: 'Stadium Feed Axis',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [0, 88, 338],
        targetIds: ['rear-campus-bowl-feed-surface'],
      },
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
    {
      expectedKeyObjectIds: [
        'rear-campus-bowl-feed-surface',
        'stadium-bowl',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-structure'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-right-flank',
      intent: 'stadium-right-flank-review',
      label: 'Stadium Right Flank',
      startView: {
        lookAt: [1160, 124, -3080],
        position: [1640, 236, -2580],
        source: 'arrival-main',
      },
      watchItems: [
        'right stadium edge continuity',
        'right flank screen mounting',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-mega-civic-hall-host-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-structure'],
      id: 'rear-campus-mega-hall',
      intent: 'rear-campus-mega-hall-review',
      label: 'Rear Campus Mega Hall',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [264, 92, 318],
        targetIds: ['rear-campus-mega-civic-hall-host-surface'],
      },
      startView: {
        lookAt: [-2490, 152, -3518],
        position: [-2218, 244, -3198],
        source: 'arrival-main',
      },
      watchItems: [
        'mega hall screen mounting',
        'rear-campus mega host scale read',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-needle-crown-skyscraper-host-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface', 'stadium-screen-assignment', 'stadium-tower'],
      id: 'rear-campus-needle-crown',
      intent: 'rear-campus-needle-crown-review',
      label: 'Rear Campus Needle Crown',
      camera: {
        lookAtOffset: [0, 14, 0],
        positionOffset: [182, 112, 184],
        targetIds: ['rear-campus-needle-crown-skyscraper-host-surface'],
      },
      startView: {
        lookAt: [892, 396, -549],
        position: [1086, 512, -364],
        source: 'arrival-main',
      },
      watchItems: [
        'needle crown host fit',
        'rear-campus tower media hierarchy',
      ],
    },
  ];

  return zones.map((zone) => {
    const isStadiumZone =
      zone.id.startsWith('stadium-')
      || zone.id.startsWith('rear-campus-');

    return {
      ...zone,
      forbiddenVisibleLayers: zone.forbiddenVisibleLayers
        ?? (isStadiumZone ? STADIUM_REVIEW_FORBIDDEN_LAYERS : CITY_REVIEW_FORBIDDEN_LAYERS),
    };
  });
}
