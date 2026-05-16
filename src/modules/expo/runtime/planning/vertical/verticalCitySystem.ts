export type ExpoVerticalLevelId =
  | 'ground'
  | 'level-1'
  | 'level-2'
  | 'roof'
  | 'tower';

export type ExpoVerticalHeightBand =
  | 'ground'
  | 'low-rise'
  | 'mid-rise'
  | 'high-rise'
  | 'roof'
  | 'tower';

export type ExpoVerticalOwner =
  | 'booth'
  | 'city'
  | 'stadium'
  | 'system';

export type ExpoVerticalAccessMode =
  | 'jump-pad'
  | 'ladder'
  | 'lift'
  | 'ramp'
  | 'stair';

export type ExpoVerticalPlacement = {
  baseY: number;
  floorCount: number;
  floorHeight: number;
  heightBand: ExpoVerticalHeightBand;
  level: ExpoVerticalLevelId;
  verticalOwner: ExpoVerticalOwner;
};

export type ExpoVerticalLevelDefinition = {
  baseY: number;
  floorHeight: number;
  id: ExpoVerticalLevelId;
  label: string;
};

export type ExpoVerticalAccessNode = {
  autoActivate?: boolean;
  id: string;
  label: string;
  level: ExpoVerticalLevelId;
  mode: ExpoVerticalAccessMode;
  position: [number, number, number];
  radius: number;
  targetLevel: ExpoVerticalLevelId;
  targetPosition: [number, number, number];
  zoneId: string;
};

export type ExpoVerticalWalkableRegion = {
  id: string;
  level: ExpoVerticalLevelId;
  playerY: number;
  position: [number, number, number];
  size: [number, number];
  zoneId: string;
};

export type ExpoVerticalCitySystemPlan = {
  accessNodes: ExpoVerticalAccessNode[];
  defaultFloorHeight: number;
  levels: ExpoVerticalLevelDefinition[];
  pilotZoneId: 'tower-cluster';
  walkableRegions: ExpoVerticalWalkableRegion[];
};

export const EXPO_VERTICAL_CITY_SYSTEM: ExpoVerticalCitySystemPlan = {
  accessNodes: [
    {
      id: 'tower-cluster-vertical-pilot-lift-ground',
      label: 'Vertical Pilot Ground Lift',
      level: 'ground',
      mode: 'lift',
      position: [900, 0.25, -620],
      radius: 42,
      targetLevel: 'level-2',
      targetPosition: [900, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-ground-to-level-1',
      label: 'Vertical Pilot Level 1 Lift',
      level: 'ground',
      mode: 'lift',
      position: [820, 0.25, -620],
      radius: 28,
      targetLevel: 'level-1',
      targetPosition: [820, 70, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-1-to-ground',
      label: 'Vertical Pilot Ground Return',
      level: 'level-1',
      mode: 'lift',
      position: [820, 67, -650],
      radius: 28,
      targetLevel: 'ground',
      targetPosition: [820, 5, -620],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-1-to-level-2',
      label: 'Vertical Pilot Level 2 Transfer',
      level: 'level-1',
      mode: 'lift',
      position: [980, 67, -650],
      radius: 28,
      targetLevel: 'level-2',
      targetPosition: [980, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2',
      label: 'Vertical Pilot Level 2 Lift',
      level: 'level-2',
      mode: 'lift',
      position: [900, 121, -680],
      radius: 42,
      targetLevel: 'ground',
      targetPosition: [900, 5, -620],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2-to-level-1',
      label: 'Vertical Pilot Level 1 Return',
      level: 'level-2',
      mode: 'lift',
      position: [980, 121, -680],
      radius: 28,
      targetLevel: 'level-1',
      targetPosition: [980, 70, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-level-2-to-roof',
      label: 'Vertical Pilot Roof Lift',
      level: 'level-2',
      mode: 'lift',
      position: [760, 121, -690],
      radius: 30,
      targetLevel: 'roof',
      targetPosition: [900, 170, -710],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-roof-to-level-2',
      label: 'Vertical Pilot Level 2 Return',
      level: 'roof',
      mode: 'lift',
      position: [760, 167, -710],
      radius: 30,
      targetLevel: 'level-2',
      targetPosition: [900, 124, -680],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-roof-to-tower',
      label: 'Vertical Pilot Tower Lift',
      level: 'roof',
      mode: 'lift',
      position: [900, 167, -710],
      radius: 34,
      targetLevel: 'tower',
      targetPosition: [900, 248, -650],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-lift-tower-to-roof',
      label: 'Vertical Pilot Roof Return',
      level: 'tower',
      mode: 'lift',
      position: [900, 245, -650],
      radius: 34,
      targetLevel: 'roof',
      targetPosition: [900, 170, -710],
      zoneId: 'tower-cluster',
    },
  ],
  defaultFloorHeight: 36,
  levels: [
    { baseY: 0, floorHeight: 36, id: 'ground', label: 'Ground' },
    { baseY: 48, floorHeight: 36, id: 'level-1', label: 'Level 1' },
    { baseY: 96, floorHeight: 36, id: 'level-2', label: 'Level 2' },
    { baseY: 144, floorHeight: 36, id: 'roof', label: 'Roof' },
    { baseY: 216, floorHeight: 48, id: 'tower', label: 'Tower' },
  ],
  pilotZoneId: 'tower-cluster',
  walkableRegions: [
    {
      id: 'tower-cluster-vertical-pilot-level-1-walkable-deck',
      level: 'level-1',
      playerY: 70,
      position: [900, 70, -650],
      size: [228, 46],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-level-2-walkable-deck',
      level: 'level-2',
      playerY: 124,
      position: [900, 124, -680],
      size: [276, 54],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-roof-walkable-deck',
      level: 'roof',
      playerY: 170,
      position: [900, 170, -710],
      size: [340, 64],
      zoneId: 'tower-cluster',
    },
    {
      id: 'tower-cluster-vertical-pilot-tower-walkable-deck',
      level: 'tower',
      playerY: 248,
      position: [900, 248, -650],
      size: [220, 54],
      zoneId: 'tower-cluster',
    },
  ],
};

export function createVerticalPlacement(
  placement: ExpoVerticalPlacement,
): ExpoVerticalPlacement {
  return placement;
}

export function getVerticalAccessNodesForLevel(
  plan: ExpoVerticalCitySystemPlan,
  level: ExpoVerticalLevelId,
): ExpoVerticalAccessNode[] {
  return plan.accessNodes.filter((node) => node.level === level);
}

export function getVerticalWalkableRegionsForLevel(
  plan: ExpoVerticalCitySystemPlan,
  level: ExpoVerticalLevelId,
): ExpoVerticalWalkableRegion[] {
  return plan.walkableRegions.filter((region) => region.level === level);
}
