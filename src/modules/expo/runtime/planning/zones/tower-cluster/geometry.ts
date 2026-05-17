import type { CityGeometryPlanningSource, CityMass, CityPlane, CityTower, ExpoZonePlannerContext } from '../../types';
import {
  EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT,
  createVerticalPlacement,
} from '../../vertical/verticalCitySystem';

const TOWER_CLUSTER_GEOMETRY_SOURCE_FILE = 'src/modules/expo/runtime/planning/zones/tower-cluster/geometry.ts';

function createTowerClusterPlanningSource(
  sourceFunction: string,
  sourceKind: string,
): CityGeometryPlanningSource {
  return {
    safeEditSeam: TOWER_CLUSTER_GEOMETRY_SOURCE_FILE,
    sourceFile: TOWER_CLUSTER_GEOMETRY_SOURCE_FILE,
    sourceFunction,
    sourceKind,
  };
}

function isTowerClusterTower(tower: CityTower) {
  return tower.position[1] >= 52 || Math.abs(tower.position[0]) >= 260;
}

function buildTowerPodiumPlanes(towers: CityTower[]): CityPlane[] {
  return towers.map((tower) => ({
    color: '#dbe6ee',
    id: `${tower.id}-tower-cluster-podium`,
    planningSource: createTowerClusterPlanningSource('buildTowerPodiumPlanes', 'tower-cluster-podium-plane'),
    position: [tower.position[0], 0.022, tower.position[2] + (tower.role === 'hero' ? 24 : 10)],
    role: 'structural' as const,
    size: [
      Math.max(64, tower.baseSize[0] * 2.1),
      Math.max(86, tower.baseSize[2] * 2.6),
    ],
  }));
}

function buildTowerPodiumMasses(towers: CityTower[]): CityMass[] {
  return towers.flatMap((tower) => {
    const plinth: CityMass = {
      color: '#8a99a4',
      id: `${tower.id}-tower-cluster-plinth`,
      planningSource: createTowerClusterPlanningSource('buildTowerPodiumMasses', 'tower-cluster-plinth-mass'),
      position: [tower.position[0], 0, tower.position[2] + (tower.role === 'hero' ? 18 : 8)],
      role: 'structural',
      size: [
        Math.max(32, tower.baseSize[0] * 0.9),
        Math.max(18, tower.baseSize[1] * 0.12),
        Math.max(28, tower.baseSize[2] * 1.15),
      ],
    };

    const beacon = tower.role === 'hero'
      ? {
          color: '#94a4ae',
          id: `${tower.id}-tower-cluster-beacon`,
          planningSource: createTowerClusterPlanningSource('buildTowerPodiumMasses', 'tower-cluster-beacon-mass'),
          position: [tower.position[0], 0, tower.position[2] + 42] as [number, number, number],
          role: 'structural' as const,
          size: [18, 72, 18] as [number, number, number],
        }
      : null;

    return beacon ? [plinth, beacon] : [plinth];
  });
}

function buildTowerClusterVerticalPilotMasses(): CityMass[] {
  const planningSource = createTowerClusterPlanningSource('buildTowerClusterVerticalPilotMasses', 'tower-cluster-vertical-pilot-mass');

  return [
    {
      color: '#8f9ea8',
      id: 'tower-cluster-vertical-pilot-core-left',
      planningSource,
      position: [764, 0, -680],
      role: 'structural',
      size: [26, 252, 26],
      vertical: createVerticalPlacement({
        baseY: 0,
        floorCount: 7,
        floorHeight: 36,
        heightBand: 'high-rise',
        level: 'ground',
        verticalOwner: 'city',
      }),
    },
    {
      color: '#8f9ea8',
      id: 'tower-cluster-vertical-pilot-core-right',
      planningSource,
      position: [1036, 0, -680],
      role: 'structural',
      size: [26, 252, 26],
      vertical: createVerticalPlacement({
        baseY: 0,
        floorCount: 7,
        floorHeight: 36,
        heightBand: 'high-rise',
        level: 'ground',
        verticalOwner: 'city',
      }),
    },
    {
      color: '#a2b0ba',
      id: 'tower-cluster-vertical-pilot-level-1-deck',
      planningSource,
      position: [900, 0, -650],
      role: 'structural',
      size: [228, 18, 46],
      vertical: createVerticalPlacement({
        baseY: 48,
        floorCount: 1,
        floorHeight: 36,
        heightBand: 'low-rise',
        level: 'level-1',
        verticalOwner: 'city',
      }),
    },
    {
      color: '#a2b0ba',
      id: 'tower-cluster-vertical-pilot-level-2-deck',
      planningSource,
      position: [900, 0, -680],
      role: 'structural',
      size: [276, 24, 54],
      vertical: createVerticalPlacement({
        baseY: 96,
        floorCount: 1,
        floorHeight: 36,
        heightBand: 'roof',
        level: 'level-2',
        verticalOwner: 'city',
      }),
    },
    {
      color: '#afbdc7',
      id: 'tower-cluster-vertical-pilot-roof-deck',
      planningSource,
      position: [900, 0, -710],
      role: 'structural',
      size: [340, 22, 64],
      vertical: createVerticalPlacement({
        baseY: 144,
        floorCount: 1,
        floorHeight: 36,
        heightBand: 'roof',
        level: 'roof',
        verticalOwner: 'city',
      }),
    },
    {
      color: '#bcc9d2',
      id: 'tower-cluster-vertical-pilot-tower-deck',
      planningSource,
      position: [900, 0, -650],
      role: 'structural',
      size: [220, 28, 54],
      vertical: createVerticalPlacement({
        baseY: 216,
        floorCount: 1,
        floorHeight: 36,
        heightBand: 'tower',
        level: 'tower',
        verticalOwner: 'city',
      }),
    },
  ];
}

function buildTowerClusterMegaHighriseMasses(): CityMass[] {
  const planningSource = createTowerClusterPlanningSource('buildTowerClusterMegaHighriseMasses', 'tower-cluster-mega-highrise-mass');
  const { companionTowers, core, decks } = EXPO_TOWER_CLUSTER_MEGA_STRUCTURE_LAYOUT;

  return [
    {
      color: '#6f8290',
      decorPolicy: 'signature',
      id: core.id,
      planningSource,
      position: core.position,
      role: 'signature',
      size: core.size,
      vertical: createVerticalPlacement({
        baseY: core.baseY,
        floorCount: core.floorCount,
        floorHeight: core.floorHeight,
        heightBand: core.heightBand,
        level: core.level,
        verticalOwner: 'city',
      }),
    },
    ...companionTowers.map((tower): CityMass => ({
      color: tower.color,
      decorPolicy: 'signature',
      id: tower.id,
      planningSource,
      position: tower.position,
      role: 'signature',
      size: tower.size,
      vertical: createVerticalPlacement({
        baseY: tower.baseY,
        floorCount: tower.floorCount,
        floorHeight: tower.floorHeight,
        heightBand: tower.heightBand,
        level: tower.level,
        verticalOwner: 'city',
      }),
    })),
    ...decks.map((deck): CityMass => ({
      color: deck.color,
      decorPolicy: 'standard',
      id: deck.id,
      planningSource,
      position: deck.position,
      role: 'structural',
      size: deck.size,
      vertical: createVerticalPlacement({
        baseY: deck.baseY,
        floorCount: deck.floorCount,
        floorHeight: deck.floorHeight,
        heightBand: deck.heightBand,
        level: deck.level,
        verticalOwner: 'city',
      }),
    })),
  ];
}

function buildTowerClusterTelevisionTowerMasses(): CityMass[] {
  const planningSource = createTowerClusterPlanningSource('buildTowerClusterTelevisionTowerMasses', 'tower-cluster-television-tower-mass');
  const towerPosition: [number, number, number] = [360, 0, -1240];
  const createMass = ({
    baseY,
    color,
    decorPolicy = 'signature',
    floorCount,
    floorHeight,
    heightBand = 'tower',
    id,
    position = towerPosition,
    role = 'signature',
    size,
  }: {
    baseY: number;
    color: string;
    decorPolicy?: CityMass['decorPolicy'];
    floorCount: number;
    floorHeight: number;
    heightBand?: NonNullable<CityMass['vertical']>['heightBand'];
    id: string;
    position?: [number, number, number];
    role?: NonNullable<CityMass['role']>;
    size: [number, number, number];
  }): CityMass => ({
    color,
    decorPolicy,
    id,
    planningSource,
    position,
    role,
    size,
    vertical: createVerticalPlacement({
      baseY,
      floorCount,
      floorHeight,
      heightBand,
      level: 'tower',
      verticalOwner: 'city',
    }),
  });

  return [
    createMass({
      baseY: 0,
      color: '#80919d',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-base-plinth-west',
      position: [towerPosition[0] - 97, 0, towerPosition[2]],
      role: 'structural',
      size: [92, 34, 260],
    }),
    createMass({
      baseY: 0,
      color: '#8798a3',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-base-plinth-east',
      position: [towerPosition[0] + 97, 0, towerPosition[2]],
      role: 'structural',
      size: [92, 34, 260],
    }),
    createMass({
      baseY: 0,
      color: '#8e9fa9',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-base-plinth-front',
      position: [towerPosition[0], 0, towerPosition[2] + 93],
      role: 'structural',
      size: [70, 34, 84],
    }),
    createMass({
      baseY: 0,
      color: '#788b98',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-base-plinth-rear',
      position: [towerPosition[0], 0, towerPosition[2] - 93],
      role: 'structural',
      size: [70, 34, 84],
    }),
    createMass({
      baseY: 0,
      color: '#627886',
      floorCount: 25,
      floorHeight: 74,
      id: 'tower-cluster-television-tower-lower-shaft',
      size: [86, 1850, 86],
    }),
    createMass({
      baseY: 1850,
      color: '#6f8796',
      floorCount: 25,
      floorHeight: 74,
      id: 'tower-cluster-television-tower-upper-shaft',
      size: [58, 1850, 58],
    }),
    createMass({
      baseY: 1842,
      color: '#a9bbc7',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 86,
      id: 'tower-cluster-television-tower-observation-ring-west',
      position: [towerPosition[0] - 136, 0, towerPosition[2]],
      role: 'structural',
      size: [170, 86, 440],
    }),
    createMass({
      baseY: 1842,
      color: '#b3c5cf',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 86,
      id: 'tower-cluster-television-tower-observation-ring-east',
      position: [towerPosition[0] + 136, 0, towerPosition[2]],
      role: 'structural',
      size: [170, 86, 440],
    }),
    createMass({
      baseY: 1842,
      color: '#beccd5',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 86,
      id: 'tower-cluster-television-tower-observation-ring-front',
      position: [towerPosition[0], 0, towerPosition[2] + 136],
      role: 'structural',
      size: [70, 86, 170],
    }),
    createMass({
      baseY: 1842,
      color: '#9aacb8',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 86,
      id: 'tower-cluster-television-tower-observation-ring-rear',
      position: [towerPosition[0], 0, towerPosition[2] - 136],
      role: 'structural',
      size: [70, 86, 170],
    }),
    createMass({
      baseY: 1938,
      color: '#b9cad4',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-east-signal-ring',
      position: [towerPosition[0] + 191, 0, towerPosition[2]],
      role: 'structural',
      size: [280, 34, 46],
    }),
    createMass({
      baseY: 1938,
      color: '#afc1cc',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 34,
      id: 'tower-cluster-television-tower-west-signal-ring',
      position: [towerPosition[0] - 191, 0, towerPosition[2]],
      role: 'structural',
      size: [280, 34, 46],
    }),
    createMass({
      baseY: 1982,
      color: '#b1c2cd',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 30,
      id: 'tower-cluster-television-tower-front-signal-ring',
      position: [towerPosition[0], 0, towerPosition[2] + 191],
      role: 'structural',
      size: [46, 30, 280],
    }),
    createMass({
      baseY: 1982,
      color: '#a6b8c4',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 30,
      id: 'tower-cluster-television-tower-rear-signal-ring',
      position: [towerPosition[0], 0, towerPosition[2] - 191],
      role: 'structural',
      size: [46, 30, 280],
    }),
    createMass({
      baseY: 3180,
      color: '#9fb2bf',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 62,
      id: 'tower-cluster-television-tower-broadcast-collar-west',
      position: [towerPosition[0] - 87, 0, towerPosition[2]],
      role: 'structural',
      size: [100, 62, 280],
    }),
    createMass({
      baseY: 3180,
      color: '#a8bac6',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 62,
      id: 'tower-cluster-television-tower-broadcast-collar-east',
      position: [towerPosition[0] + 87, 0, towerPosition[2]],
      role: 'structural',
      size: [100, 62, 280],
    }),
    createMass({
      baseY: 3180,
      color: '#b3c4ce',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 62,
      id: 'tower-cluster-television-tower-broadcast-collar-front',
      position: [towerPosition[0], 0, towerPosition[2] + 87],
      role: 'structural',
      size: [70, 62, 100],
    }),
    createMass({
      baseY: 3180,
      color: '#94a8b6',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 62,
      id: 'tower-cluster-television-tower-broadcast-collar-rear',
      position: [towerPosition[0], 0, towerPosition[2] - 87],
      role: 'structural',
      size: [70, 62, 100],
    }),
    createMass({
      baseY: 3700,
      color: '#9bb0bd',
      decorPolicy: 'none',
      floorCount: 1,
      floorHeight: 1500,
      id: 'tower-cluster-television-tower-needle-spire',
      role: 'structural',
      size: [26, 1500, 26],
    }),
    createMass({
      baseY: 5200,
      color: '#d6e7ef',
      decorPolicy: 'standard',
      floorCount: 1,
      floorHeight: 48,
      id: 'tower-cluster-television-tower-top-beacon',
      role: 'structural',
      size: [96, 48, 96],
    }),
  ];
}

export function buildTowerClusterZoneGeometry(context: ExpoZonePlannerContext) {
  const towers = context.geometry.towers.filter(isTowerClusterTower);

  return {
    masses: [
      ...buildTowerPodiumMasses(towers),
      ...buildTowerClusterVerticalPilotMasses(),
      ...buildTowerClusterMegaHighriseMasses(),
      ...buildTowerClusterTelevisionTowerMasses(),
    ],
    planes: buildTowerPodiumPlanes(towers),
    towers,
  };
}
