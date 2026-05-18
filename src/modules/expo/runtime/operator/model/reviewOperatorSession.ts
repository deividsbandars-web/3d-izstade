import type { ExpoStartView } from '../../../world-contract';
import type { WorldObjectLayer } from '../../world/inspection/worldObjectRegistry';

type ReviewOperatorZoneCamera = {
  lookAtOffset?: [number, number, number];
  positionOffset: [number, number, number];
  targetDepth?: 'frontmost' | 'rearmost';
  targetIds: string[];
  targetLayer?: WorldObjectLayer;
  targetSide?: 'center' | 'left' | 'right';
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
      reason: 'dev' | 'local-review' | 'staging-review';
    };

export function resolveExpoOperatorSession(): ExpoOperatorSession {
  if (typeof window === 'undefined') {
    return { enabled: false, reason: 'disabled' };
  }

  const params = new URLSearchParams(window.location.search);
  const wantsOperator = params.get('operator') === '1';
  const isLocalReviewHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname);
  const isStagingHost = /(^|\.)staging\.30sek24\.com$/i.test(window.location.hostname);
  const isVercelPreviewHost = /\.vercel\.app$/i.test(window.location.hostname) || /\.vercel\.dev$/i.test(window.location.hostname);

  if (!wantsOperator) {
    return { enabled: false, reason: 'disabled' };
  }

  if (import.meta.env.DEV) {
    return { enabled: true, reason: 'dev' };
  }

  // Production-mode Docker builds still need local operator review without exposing it on public production hosts.
  if (isLocalReviewHost) {
    return { enabled: true, reason: 'local-review' };
  }

  if (isStagingHost) {
    return { enabled: true, reason: 'staging-review' };
  }

  // Allow operator tooling on Vercel preview deployments for QA without requiring staging DNS.
  if (isVercelPreviewHost) {
    return { enabled: true, reason: 'staging-review' };
  }

  return { enabled: false, reason: 'disabled' };
}

export function resolveReviewOperatorZoneStartView(
  zone: ReviewOperatorZone,
  registryById: Map<string, { id?: string; layer?: WorldObjectLayer; position: [number, number, number] | number[] }>,
): ExpoStartView {
  if (!zone.camera?.targetIds.length && !zone.camera?.targetLayer) {
    return zone.startView;
  }

  const selectorTargets = resolveCameraSelectorTargets(zone.camera, registryById);
  const explicitTargets = zone.camera.targetIds
    .map((id) => registryById.get(id)?.position)
    .filter(Boolean) as number[][];
  const targets = selectorTargets.length > 0 ? selectorTargets : explicitTargets;

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

function resolveCameraSelectorTargets(
  camera: ReviewOperatorZoneCamera,
  registryById: Map<string, { id?: string; layer?: WorldObjectLayer; position: [number, number, number] | number[] }>,
) {
  if (!camera.targetLayer) {
    return [];
  }

  const entriesById = new Map<string, { id?: string; layer?: WorldObjectLayer; position: [number, number, number] | number[] }>();
  for (const entry of registryById.values()) {
    const position = entry.position;
    if (!Array.isArray(position) || position.length < 3 || !position.slice(0, 3).every(Number.isFinite)) {
      continue;
    }
    if (entry.layer !== camera.targetLayer) {
      continue;
    }

    const id = entry.id ?? position.join(':');
    entriesById.set(id, entry);
  }

  const sideFiltered = Array.from(entriesById.values()).filter((entry) => {
    const x = entry.position[0] ?? 0;
    switch (camera.targetSide) {
      case 'left':
        return x < -24;
      case 'right':
        return x > 24;
      case 'center':
        return Math.abs(x) <= 160;
      default:
        return true;
    }
  });

  const sorted = sideFiltered.sort((left, right) => {
    if (camera.targetDepth === 'frontmost') {
      return (right.position[2] ?? 0) - (left.position[2] ?? 0);
    }
    if (camera.targetDepth === 'rearmost') {
      return (left.position[2] ?? 0) - (right.position[2] ?? 0);
    }
    return Math.abs(left.position[0] ?? 0) - Math.abs(right.position[0] ?? 0);
  });

  return sorted.slice(0, 1).map((entry) => entry.position);
}

export function buildReviewOperatorZones(): ReviewOperatorZone[] {
  const zones: ReviewOperatorZone[] = [
    {
      expectedKeyObjectIds: [
        'mega-landmark-arrival',
      ],
      expectedVisibleLayers: ['mega-landmark'],
      id: 'arrival-gate',
      intent: 'arrival-gateway-hierarchy',
      label: 'Arrival Gate',
      camera: {
        lookAtOffset: [0, 144, 0],
        positionOffset: [0, 260, 700],
        targetIds: ['mega-landmark-arrival'],
      },
      startView: {
        lookAt: [0, 170, 220],
        position: [0, 420, 1460],
        source: 'arrival-main',
      },
      watchItems: [
        'arrival hierarchy readability',
        'gateway landmark ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-spine-primary-0',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'arrival-civic-axis',
      intent: 'arrival-civic-axis-review',
      label: 'Arrival Civic Axis',
      camera: {
        lookAtOffset: [0, 80, 0],
        positionOffset: [180, 90, 180],
        targetIds: ['screen-spine-primary-0'],
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
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'left-marquee',
      intent: 'left-screen-marquee-review',
      label: 'Left Marquee',
      camera: {
        lookAtOffset: [0, 40, 0],
        positionOffset: [300, 80, 220],
        targetIds: ['screen-marquee-left-0'],
      },
      startView: {
        lookAt: [-836, 188, -244],
        position: [-536, 228, -24],
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
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'left-marquee-close',
      intent: 'left-screen-marquee-close-review',
      label: 'Left Marquee Close',
      camera: {
        lookAtOffset: [0, 32, 0],
        positionOffset: [450, 70, -20],
        targetIds: ['screen-marquee-left-1'],
      },
      startView: {
        lookAt: [-1128, 180, -916],
        position: [-678, 218, -936],
        source: 'arrival-main',
      },
      watchItems: [
        'screen mounting quality',
        'left marquee bezel proportion',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-left-2',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'left-edge-far',
      intent: 'left-edge-far-review',
      label: 'Left Edge Far',
      camera: {
        lookAtOffset: [0, 58, 0],
        positionOffset: [300, 12, 200],
        targetIds: ['screen-array-left-2'],
      },
      startView: {
        lookAt: [-1204, 156, -1142],
        position: [-904, 110, -942],
        source: 'arrival-main',
      },
      watchItems: [
        'far-left skyline/media coverage',
        'outer-left placement sanity',
      ],
    },
    {
      expectedKeyObjectIds: [
        'city-perimeter-left-front-corner',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'city-left-front-corner',
      intent: 'city-left-front-perimeter-corner-review',
      label: 'City Left Front Corner',
      camera: {
        lookAtOffset: [0, 0, 0],
        positionOffset: [-60, 25, 65],
        targetIds: ['city-perimeter-left-front-corner'],
      },
      startView: {
        lookAt: [-1710, 35, 770],
        position: [-1770, 60, 835],
        source: 'arrival-main',
      },
      watchItems: [
        'city front-left perimeter cap coverage',
        'front wall to side wall gap closure',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-left-upper-3',
        'screen-array-left-upper-3-host',
      ],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'left-civilization-monument',
      intent: 'left-civilization-monument-review',
      label: 'Left Civilization Monument',
      camera: {
        lookAtOffset: [0, 80, 0],
        positionOffset: [3300, -480, -5200],
        targetIds: [
          'screen-array-left-upper-3',
        ],
      },
      startView: {
        lookAt: [-900, 1400, 268.2],
        position: [2400, 840, -4931.8],
        source: 'arrival-main',
      },
      watchItems: [
        'giant high screen readability',
        'previous civilization portal silhouette',
        'screen host embedded in upper relic frame',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-spine-primary-1',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'center-spine',
      intent: 'center-civic-spine-review',
      label: 'Center Spine',
      camera: {
        lookAtOffset: [0, 54, 0],
        positionOffset: [180, 100, 220],
        targetIds: ['screen-spine-primary-1'],
      },
      startView: {
        lookAt: [-184, 162, -796],
        position: [-4, 208, -576],
        source: 'arrival-main',
      },
      watchItems: [
        'center spine screen prominence',
        'route-click review path',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-spine-primary-2',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'mid-start-deep',
      intent: 'mid-start-deep-review',
      label: 'Mid Start Deep',
      camera: {
        lookAtOffset: [0, 96, 0],
        positionOffset: [360, 100, 220],
        targetIds: ['screen-spine-primary-2'],
      },
      startView: {
        lookAt: [-184, 156, -1344],
        position: [246, 150, -1114],
        source: 'arrival-main',
      },
      watchItems: [
        'mid-axis continuity',
        'start-to-center visual transition',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'center-spine-side',
      intent: 'center-civic-spine-side-review',
      label: 'Center Spine Side',
      camera: {
        lookAtOffset: [0, 82, 0],
        positionOffset: [220, 95, 120],
        targetIds: ['screen-spine-primary-0'],
      },
      startView: {
        lookAt: [-184, 154, -248],
        position: [236, 194, -108],
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
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'right-marquee',
      intent: 'right-screen-marquee-review',
      label: 'Right Marquee',
      camera: {
        lookAtOffset: [0, -14, 0],
        positionOffset: [-420, 150, 360],
        targetIds: ['screen-marquee-right-0'],
      },
      startView: {
        lookAt: [836, 130, -380],
        position: [416, 294, -20],
        source: 'arrival-main',
      },
      watchItems: [
        'right marquee CTA clarity',
        'screen/socket registry resolution',
      ],
    },
    {
      expectedKeyObjectIds: [
        'mega-landmark-right-skybridge-beacon',
      ],
      expectedVisibleLayers: ['mega-landmark'],
      id: 'right-skybridge-landmark',
      intent: 'right-skybridge-landmark-review',
      label: 'Right Skybridge Landmark',
      camera: {
        lookAtOffset: [0, 86, 0],
        positionOffset: [0, 136, 300],
        targetIds: ['mega-landmark-right-skybridge-beacon'],
      },
      startView: {
        lookAt: [580, 220, 30],
        position: [580, 270, 330],
        source: 'arrival-main',
      },
      watchItems: [
        'right skybridge direct evidence',
        'right-district landmark spacing',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-marquee-right-1',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'right-marquee-close',
      intent: 'right-screen-marquee-close-review',
      label: 'Right Marquee Close',
      camera: {
        lookAtOffset: [0, 14, 0],
        positionOffset: [-528, 216, 294],
        targetIds: ['screen-marquee-right-1'],
      },
      startView: {
        lookAt: [760, 188, -332],
        position: [1980, 760, 980],
        source: 'arrival-main',
      },
      watchItems: [
        'screen mounting quality',
        'right marquee bezel proportion',
      ],
    },
    {
      expectedKeyObjectIds: [
        'screen-array-right-2',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'right-edge-far',
      intent: 'right-edge-far-review',
      label: 'Right Edge Far',
      camera: {
        lookAtOffset: [0, 56, 0],
        positionOffset: [-300, 150, 460],
        targetIds: ['screen-array-right-2'],
      },
      startView: {
        lookAt: [1204, 150, -1224],
        position: [904, 244, -764],
        source: 'arrival-main',
      },
      watchItems: [
        'far-right skyline/media coverage',
        'outer-right placement sanity',
      ],
    },
    {
      expectedKeyObjectIds: [
        'celestial-archive-gate-sky-bridge',
        'screen-array-right-upper-3',
        'screen-array-right-upper-3-host',
      ],
      expectedVisibleLayers: ['city-mass', 'city-screen-surface'],
      id: 'right-celestial-archive-gate',
      intent: 'right-celestial-archive-gate-review',
      label: 'Right Celestial Archive Gate',
      camera: {
        lookAtOffset: [0, 120, 0],
        positionOffset: [-620, 340, -760],
        targetIds: ['screen-array-right-upper-3'],
      },
      startView: {
        lookAt: [890, 2370, 300],
        position: [270, 2590, -460],
        source: 'arrival-main',
      },
      watchItems: [
        'new separate 5x landmark silhouette',
        'large high screen facing the city',
        'screen host embedded in archive gate frame',
      ],
    },
    {
      expectedKeyObjectIds: [
        'arrival-core-hero-tower-right-tower-ribbon',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'tower-cluster',
      intent: 'tower-cluster-screen-review',
      label: 'Tower Cluster',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [-260, 112, 360],
        targetIds: ['arrival-core-hero-tower-right-tower-ribbon'],
      },
      startView: {
        lookAt: [518.8230613285318, 155.04, -518.881157475684],
        position: [766.8230613285318, 239.04, -190.88115747568395],
        source: 'arrival-main',
      },
      watchItems: [
        'tower ribbon visibility',
        'tower-adjacent screen ownership',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-vertical-pilot-tower-deck',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-vertical-pilot',
      intent: 'tower-cluster-vertical-system-review',
      label: 'Tower Cluster Vertical Pilot',
      camera: {
        lookAtOffset: [0, 32, 0],
        positionOffset: [420, 228, -300],
        targetIds: [
          'tower-cluster-vertical-pilot-core-left',
          'tower-cluster-vertical-pilot-core-right',
          'tower-cluster-vertical-pilot-level-1-deck',
          'tower-cluster-vertical-pilot-level-2-deck',
          'tower-cluster-vertical-pilot-roof-deck',
          'tower-cluster-vertical-pilot-tower-deck',
        ],
      },
      startView: {
        lookAt: [900, 166, -675],
        position: [1320, 362, -975],
        source: 'arrival-main',
      },
      watchItems: [
        'vertical pilot deck readability',
        'roof and tower deck height readability',
        'multi-floor core spacing',
        'level metadata traceability',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-mega-highrise-crown-skydeck',
      ],
      expectedVisibleLayers: ['city-mass', 'vertical-access-node'],
      id: 'tower-cluster-mega-highrise',
      intent: 'tower-cluster-mega-highrise-review',
      label: 'Tower Cluster Mega Highrise',
      camera: {
        lookAtOffset: [0, 45, 0],
        positionOffset: [420, 360, -520],
        targetIds: [
          'tower-cluster-mega-highrise-crown-skydeck',
        ],
      },
      startView: {
        lookAt: [-450, 1597, -1250],
        position: [-30, 1912, -1770],
        source: 'arrival-main',
      },
      watchItems: [
        '2.5x mega highrise skyline read',
        'skybridge and crown deck separation',
        'skydeck lift node accessibility',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-mega-highrise-core',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-mega-skyline',
      intent: 'tower-cluster-mega-skyline-review',
      label: 'Tower Cluster Mega Skyline',
      camera: {
        lookAtOffset: [0, 300, 0],
        positionOffset: [-2400, 1000, 2600],
        targetIds: [
          'tower-cluster-mega-highrise-core',
          'tower-cluster-mega-highrise-east-needle',
          'tower-cluster-mega-highrise-rear-needle',
          'tower-cluster-mega-highrise-crown-skydeck',
        ],
      },
      startView: {
        lookAt: [-452.5, 1339, -1335],
        position: [-2852.5, 2039, 1265],
        source: 'arrival-main',
      },
      watchItems: [
        'full mega tower height read',
        'needle/core/crown hierarchy',
        'distant skyline silhouette',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-television-tower',
      intent: 'tower-cluster-television-tower-review',
      label: 'Tower Cluster Television Tower',
      startView: {
        lookAt: [360, 3566.6666666666665, -1240],
        position: [-3440, 4316.666666666666, 4360],
        source: 'arrival-main',
      },
      watchItems: [
        '5x television tower full-height read',
        'observation deck and signal-ring silhouette',
        'mega-highrise separation from broadcast tower',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-television-tower-top-beacon',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-television-tower-crown',
      intent: 'tower-cluster-television-tower-crown-review',
      label: 'Tower Cluster Television Tower Crown',
      camera: {
        lookAtOffset: [0, 450, 0],
        positionOffset: [-1600, 900, 2600],
        targetIds: [
          'tower-cluster-television-tower-top-beacon',
          'tower-cluster-television-tower-needle-spire',
          'tower-cluster-television-tower-broadcast-collar-west',
          'tower-cluster-television-tower-broadcast-collar-east',
          'tower-cluster-television-tower-broadcast-collar-front',
          'tower-cluster-television-tower-broadcast-collar-rear',
        ],
      },
      startView: {
        lookAt: [360, 4203, -1240],
        position: [-1240, 4653, 1360],
        source: 'arrival-main',
      },
      watchItems: [
        'top beacon visibility',
        'broadcast collar separation',
        'upper needle silhouette',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-mega-highrise-east-needle',
        'tower-cluster-mega-highrise-east-needle-landing',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-east-needle',
      intent: 'tower-cluster-east-needle-review',
      label: 'Tower Cluster East Needle',
      camera: {
        lookAtOffset: [0, 110, 0],
        positionOffset: [-380, 220, 460],
        targetIds: [
          'tower-cluster-mega-highrise-east-needle-landing',
        ],
      },
      startView: {
        lookAt: [-360, 961, -1292],
        position: [-740, 1071, -832],
        source: 'arrival-main',
      },
      watchItems: [
        'east needle front read',
        'east needle landing access',
        'right perimeter setback',
      ],
    },
    {
      expectedKeyObjectIds: [
        'tower-cluster-mega-highrise-rear-needle',
        'tower-cluster-mega-highrise-rear-needle-landing',
      ],
      expectedVisibleLayers: ['city-mass'],
      id: 'tower-cluster-rear-needle',
      intent: 'tower-cluster-rear-needle-review',
      label: 'Tower Cluster Rear Needle',
      camera: {
        lookAtOffset: [0, 130, 0],
        positionOffset: [-480, 300, 520],
        targetIds: [
          'tower-cluster-mega-highrise-rear-needle-landing',
        ],
      },
      startView: {
        lookAt: [-550, 790, -1474],
        position: [-1030, 960, -954],
        source: 'arrival-main',
      },
      watchItems: [
        'rear needle skyline depth',
        'rear needle landing access',
        'rear screen-host clearance',
      ],
    },
    {
      expectedKeyObjectIds: [
        'arrival-core-hero-tower-right-tower-ribbon',
      ],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'tower-cluster-reverse-wide',
      intent: 'tower-cluster-reverse-wide-review',
      label: 'Tower Cluster Reverse Wide',
      camera: {
        lookAtOffset: [0, 28, 0],
        positionOffset: [-460, 190, 560],
        targetIds: ['arrival-core-hero-tower-right-tower-ribbon'],
      },
      startView: {
        lookAt: [708, 200, -700],
        position: [-2280, 1120, -2620],
        source: 'arrival-main',
      },
      watchItems: [
        'tower media skyline hierarchy',
        'reverse-side tower fit',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'array-band',
      intent: 'array-band-cross-city-review',
      label: 'Array Band',
      camera: {
        lookAtOffset: [0, 44, 0],
        positionOffset: [0, 180, 560],
        targetIds: ['screen-array-left-0', 'screen-array-right-0'],
      },
      startView: {
        lookAt: [0, 140, -119],
        position: [0, 276, 441],
        source: 'arrival-main',
      },
      watchItems: [
        'array-band density review',
        'cross-city assignment continuity',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['city-screen-surface'],
      id: 'array-band-south',
      intent: 'array-band-south-review',
      label: 'Array Band South',
      camera: {
        lookAtOffset: [0, 44, 0],
        positionOffset: [0, 310, 1240],
        targetIds: ['screen-array-left-upper-1', 'screen-array-right-upper-1'],
      },
      startView: {
        lookAt: [0, 102, -548],
        position: [0, 244, 28],
        source: 'arrival-main',
      },
      watchItems: [
        'array screen spacing',
        'district continuity from south axis',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-left-0', 'screen-array-left-0-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-left-near-direct',
      intent: 'left-near-array-direct-hit-review',
      label: 'Array Left Near Direct',
      camera: {
        lookAtOffset: [0, 50, 0],
        positionOffset: [320, 110, 360],
        targetIds: ['screen-array-left-0'],
      },
      startView: {
        lookAt: [-1204, 198, -46],
        position: [-884, 258, 314],
        source: 'arrival-main',
      },
      watchItems: [
        'left near array direct target hit',
        'near array screen host attachment',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-right-0', 'screen-array-right-0-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-right-near-direct',
      intent: 'right-near-array-direct-hit-review',
      label: 'Array Right Near Direct',
      camera: {
        lookAtOffset: [0, 50, 0],
        positionOffset: [-320, 110, 360],
        targetIds: ['screen-array-right-0'],
      },
      startView: {
        lookAt: [1204, 196, -114],
        position: [884, 256, 246],
        source: 'arrival-main',
      },
      watchItems: [
        'right near array direct target hit',
        'near array screen host attachment',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-left-upper-0', 'screen-array-left-upper-0-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-upper-left-direct',
      intent: 'left-upper-array-direct-hit-review',
      label: 'Array Upper Left Direct',
      camera: {
        lookAtOffset: [0, 50, 0],
        positionOffset: [320, 110, 360],
        targetIds: ['screen-array-left-upper-0'],
      },
      startView: {
        lookAt: [-1470, 268, -216],
        position: [-1226, 328, 144],
        source: 'arrival-main',
      },
      watchItems: [
        'left upper array direct target hit',
        'outer screen host separation',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-right-upper-0', 'screen-array-right-upper-0-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-upper-right-direct',
      intent: 'right-upper-array-direct-hit-review',
      label: 'Array Upper Right Direct',
      camera: {
        lookAtOffset: [0, 50, 0],
        positionOffset: [-320, 110, 360],
        targetIds: ['screen-array-right-upper-0'],
      },
      startView: {
        lookAt: [1470, 266, -258],
        position: [1226, 326, 102],
        source: 'arrival-main',
      },
      watchItems: [
        'right upper array direct target hit',
        'outer screen host separation',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-left-upper-1', 'screen-array-left-upper-1-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-upper-left-1-direct',
      intent: 'left-upper-array-1-direct-hit-review',
      label: 'Array Upper Left 1 Direct',
      camera: {
        lookAtOffset: [0, 54, 0],
        positionOffset: [330, 120, 420],
        targetIds: ['screen-array-left-upper-1'],
      },
      startView: {
        lookAt: [-1546, 288, -910],
        position: [-1216, 354, -490],
        source: 'arrival-main',
      },
      watchItems: [
        'left upper array 1 direct target hit',
        'second-row array host attachment',
      ],
    },
    {
      expectedKeyObjectIds: ['screen-array-right-upper-1', 'screen-array-right-upper-1-host'],
      expectedVisibleLayers: ['city-screen-surface', 'city-mass'],
      id: 'array-upper-right-1-direct',
      intent: 'right-upper-array-1-direct-hit-review',
      label: 'Array Upper Right 1 Direct',
      camera: {
        lookAtOffset: [0, 54, 0],
        positionOffset: [-330, 120, 420],
        targetIds: ['screen-array-right-upper-1'],
      },
      startView: {
        lookAt: [1546, 286, -806],
        position: [1216, 352, -386],
        source: 'arrival-main',
      },
      watchItems: [
        'right upper array 1 direct target hit',
        'second-row array host attachment',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['booth'],
      id: 'sponsor-boulevard-left',
      intent: 'left-sponsor-boulevard-frontage-review',
      label: 'Sponsor Boulevard Left',
      camera: {
        lookAtOffset: [0, 72, 0],
        positionOffset: [150, 80, 86],
        targetDepth: 'frontmost',
        targetIds: [],
        targetLayer: 'booth',
        targetSide: 'left',
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
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['booth'],
      id: 'sponsor-boulevard-left-close',
      intent: 'left-sponsor-boulevard-close-review',
      label: 'Sponsor Boulevard Left Close',
      camera: {
        lookAtOffset: [0, 24, 0],
        positionOffset: [46, 24, 18],
        targetDepth: 'rearmost',
        targetIds: [],
        targetLayer: 'booth',
        targetSide: 'left',
      },
      startView: {
        lookAt: [-526, 38, -1356],
        position: [-486, 64, -1308],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage material read',
        'left sponsor screen integration',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['booth'],
      id: 'sponsor-boulevard-right',
      intent: 'right-sponsor-boulevard-frontage-review',
      label: 'Sponsor Boulevard Right',
      camera: {
        lookAtOffset: [-2, 20, 2],
        positionOffset: [-32, 22, 18],
        targetDepth: 'frontmost',
        targetIds: [],
        targetLayer: 'booth',
        targetSide: 'right',
      },
      startView: {
        lookAt: [80, 80, -798],
        position: [364, 136, -604],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage readability',
        'right sponsor CTA coverage',
      ],
    },
    {
      expectedKeyObjectIds: [],
      expectedVisibleLayers: ['booth'],
      id: 'sponsor-boulevard-right-medium',
      intent: 'right-sponsor-boulevard-medium-review',
      label: 'Sponsor Boulevard Right Medium',
      camera: {
        lookAtOffset: [-2, 24, 2],
        positionOffset: [-48, 26, 20],
        targetDepth: 'rearmost',
        targetIds: [],
        targetLayer: 'booth',
        targetSide: 'right',
      },
      startView: {
        lookAt: [248, 80, -980],
        position: [186, 228, -682],
        source: 'arrival-main',
      },
      watchItems: [
        'booth frontage material read',
        'right sponsor screen integration',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-event-pavilion-left-feed-surface',
        'rear-campus-event-pavilion-right-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-approach',
      intent: 'stadium-approach-review',
      label: 'Stadium Approach',
      camera: {
        lookAtOffset: [0, 74, 0],
        positionOffset: [0, 24, 240],
        targetIds: ['rear-campus-event-pavilion-left-feed-surface', 'rear-campus-event-pavilion-right-feed-surface'],
      },
      startView: {
        lookAt: [0, 160, -1923.3],
        position: [0, 239.68, -1493.3],
        source: 'arrival-main',
      },
      watchItems: [
        'stadium entrance composition',
        'floating plate detection',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-event-pavilion-left-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      camera: {
        lookAtOffset: [0, 44, 0],
        positionOffset: [-240, 18, 220],
        targetIds: ['rear-campus-event-pavilion-left-feed-surface'],
      },
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-left-flank',
      intent: 'stadium-left-flank-review',
      label: 'Stadium Left Flank',
      startView: {
        lookAt: [-720, 108, -1648],
        position: [-1028, 164, -1428],
        source: 'arrival-main',
      },
      watchItems: [
        'left stadium edge continuity',
        'left flank screen mounting',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-stage-monolith-canopy-host-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'rear-campus-center',
      intent: 'rear-campus-center-review',
      label: 'Rear Campus Center',
      camera: {
        lookAtOffset: [0, 86, 0],
        positionOffset: [0, 170, 540],
        targetIds: ['rear-campus-stage-monolith-canopy-host-surface'],
      },
      startView: {
        lookAt: [47, 212, -3250],
        position: [47, 296, -2710],
        source: 'arrival-main',
      },
      watchItems: [
        'rear-campus central media read',
        'stadium screen surface coverage',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-bowl-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-feed-axis',
      intent: 'rear-campus-feed-axis-review',
      label: 'Stadium Feed Axis',
      camera: {
        lookAtOffset: [0, 136, 108],
        positionOffset: [980, 380, 1320],
        targetIds: ['rear-campus-bowl-center-deck-screen-host-shell'],
      },
      startView: {
        lookAt: [0, 348, -4084],
        position: [980, 592, -2872],
        source: 'arrival-main',
      },
      watchItems: [
        'rear-campus feed ownership clarity',
        'custom-feed vs screen-system split',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-event-pavilion-right-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      camera: {
        lookAtOffset: [0, 62, -8],
        positionOffset: [250, 150, -380],
        targetIds: ['rear-campus-event-pavilion-right-feed-surface'],
      },
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'stadium-right-flank',
      intent: 'stadium-right-flank-review',
      label: 'Stadium Right Flank',
      startView: {
        lookAt: [720, 116, -1939],
        position: [1040, 276, -2459],
        source: 'arrival-main',
      },
      watchItems: [
        'right stadium edge continuity',
        'right flank screen mounting',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-landmark-right-rear-campus-feed-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      camera: {
        lookAtOffset: [0, 44, 0],
        positionOffset: [-150, 24, 360],
        targetIds: ['rear-campus-landmark-right-rear-campus-feed-surface'],
      },
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'rear-campus-right-landmark-feed',
      intent: 'rear-campus-right-landmark-feed-review',
      label: 'Rear Campus Right Landmark Feed',
      startView: {
        lookAt: [920, 456, -2877],
        position: [770, 436, -2517],
        source: 'arrival-main',
      },
      watchItems: [
        'right landmark feed direct screen visibility',
        'right tower screen occlusion by stadium mass',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-sky-slab-tower-host-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [-220, 42, 520],
        targetIds: ['rear-campus-sky-slab-tower-host-surface'],
      },
      forbiddenKeyObjectIds: STADIUM_TRANSITION_FORBIDDEN_OBJECT_IDS,
      forbiddenVisibleLayers: [...STADIUM_REVIEW_FORBIDDEN_LAYERS, 'stadium-screen-feed'],
      id: 'rear-campus-sky-slab-feed',
      intent: 'rear-campus-sky-slab-feed-review',
      label: 'Rear Campus Sky Slab Feed',
      startView: {
        lookAt: [1087, 458, -1602],
        position: [867, 480, -1082],
        source: 'arrival-main',
      },
      watchItems: [
        'sky slab feed direct screen visibility',
        'sky slab host attachment context',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-front-left-connector',
        'rear-campus-front-right-connector',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'ground-seam-transition',
      intent: 'city-stadium-ground-transition-review',
      label: 'Ground Seam Transition',
      camera: {
        lookAtOffset: [0, 60, -20],
        positionOffset: [0, 120, 500],
        targetIds: ['rear-campus-front-left-connector', 'rear-campus-front-right-connector'],
      },
      startView: {
        lookAt: [0, 58, -760],
        position: [0, 132, -240],
        source: 'arrival-main',
      },
      watchItems: [
        'ground plane continuity',
        'connector to city seam',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-front-left-connector',
        'rear-campus-front-right-connector',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'ground-seam-overhead',
      intent: 'city-stadium-overhead-ground-review',
      label: 'Ground Seam Overhead',
      camera: {
        lookAtOffset: [0, 88, -30],
        positionOffset: [0, 210, 480],
        targetIds: ['rear-campus-front-left-connector', 'rear-campus-front-right-connector'],
      },
      startView: {
        lookAt: [0, 64, -760],
        position: [0, 420, -360],
        source: 'arrival-main',
      },
      watchItems: [
        'z-fight detection',
        'layer split visibility',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-perimeter-left-rear-corner',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'rear-campus-left-rear-corner',
      intent: 'rear-campus-left-rear-perimeter-corner-review',
      label: 'Rear Campus Left Rear Corner',
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [140, 90, 160],
        targetIds: ['rear-campus-perimeter-left-rear-corner'],
      },
      startView: {
        lookAt: [-3050, 62, -5334],
        position: [-2910, 132, -5174],
        source: 'arrival-main',
      },
      watchItems: [
        'left rear perimeter miter',
        'rear wall to side wall cleanup',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-perimeter-right-rear-corner',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'rear-campus-right-rear-corner',
      intent: 'rear-campus-right-rear-perimeter-corner-review',
      label: 'Rear Campus Right Rear Corner',
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [-140, 90, 160],
        targetIds: ['rear-campus-perimeter-right-rear-corner'],
      },
      startView: {
        lookAt: [3050, 62, -5334],
        position: [2910, 132, -5174],
        source: 'arrival-main',
      },
      watchItems: [
        'right rear perimeter miter',
        'rear wall to side wall cleanup',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-perimeter-left-front-corner',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'rear-campus-left-front-corner',
      intent: 'rear-campus-left-front-perimeter-corner-review',
      label: 'Rear Campus Left Front Corner',
      camera: {
        lookAtOffset: [0, 20, 0],
        positionOffset: [420, 154, -500],
        targetIds: ['rear-campus-perimeter-left-front-corner'],
      },
      startView: {
        lookAt: [-3050, 62, -1074],
        position: [-2630, 196, -1574],
        source: 'arrival-main',
      },
      watchItems: [
        'left front perimeter miter',
        'front connector to side wall cleanup',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-perimeter-right-front-corner',
      ],
      expectedVisibleLayers: ['stadium-structure'],
      forbiddenVisibleLayers: STADIUM_REVIEW_FORBIDDEN_LAYERS,
      id: 'rear-campus-right-front-corner',
      intent: 'rear-campus-right-front-perimeter-corner-review',
      label: 'Rear Campus Right Front Corner',
      camera: {
        lookAtOffset: [0, 18, 0],
        positionOffset: [-420, 154, -500],
        targetIds: ['rear-campus-perimeter-right-front-corner'],
      },
      startView: {
        lookAt: [3050, 46, -750],
        position: [2630, 170, -1250],
        source: 'arrival-main',
      },
      watchItems: [
        'right front perimeter miter',
        'front connector to side wall cleanup',
      ],
    },
    {
      expectedKeyObjectIds: [
        'rear-campus-mega-civic-hall-host-surface',
      ],
      expectedVisibleLayers: ['stadium-screen-surface'],
      id: 'rear-campus-mega-hall',
      intent: 'rear-campus-mega-hall-review',
      label: 'Rear Campus Mega Hall',
      camera: {
        lookAtOffset: [80, 98, 0],
        positionOffset: [780, 340, 980],
        targetIds: ['rear-campus-mega-civic-hall-host-surface'],
      },
      startView: {
        lookAt: [-2410, 266, -3828],
        position: [-1710, 508, -2848],
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
      expectedVisibleLayers: ['stadium-screen-surface'],
      id: 'rear-campus-needle-crown',
      intent: 'rear-campus-needle-crown-review',
      label: 'Rear Campus Needle Crown',
      camera: {
        lookAtOffset: [-28, 100, 0],
        positionOffset: [180, 135, 117],
        targetIds: [
          'rear-campus-needle-crown-skyscraper-host-surface',
          'rear-campus-needle-crown-skyscraper-screen-host-shell',
        ],
      },
      startView: {
        lookAt: [1512, 421.66, -1612.25],
        position: [1720, 456.66, -1495.25],
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
