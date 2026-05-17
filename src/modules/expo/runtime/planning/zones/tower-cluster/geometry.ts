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

export function buildTowerClusterZoneGeometry(context: ExpoZonePlannerContext) {
  const towers = context.geometry.towers.filter(isTowerClusterTower);

  return {
    masses: [
      ...buildTowerPodiumMasses(towers),
      ...buildTowerClusterVerticalPilotMasses(),
      ...buildTowerClusterMegaHighriseMasses(),
    ],
    planes: buildTowerPodiumPlanes(towers),
    towers,
  };
}
