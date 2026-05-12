import type { CityGeometryPlanningSource, CityMass, CityPlane, CityTower, ExpoZonePlannerContext } from '../../types';

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

export function buildTowerClusterZoneGeometry(context: ExpoZonePlannerContext) {
  const towers = context.geometry.towers.filter(isTowerClusterTower);

  return {
    masses: buildTowerPodiumMasses(towers),
    planes: buildTowerPodiumPlanes(towers),
    towers,
  };
}
