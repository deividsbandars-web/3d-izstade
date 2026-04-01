import type { AssetType, ProcessedAssetBatch } from '../../utils/proAssetPipeline.js';
import type { ExpoBoothPlacement } from './layout-engine.js';
import type { Zone, ZoneSystem } from '../city/ZoneSystem.js';

export const DISTRICT_BOOTH_ZONE_PREFIX = 'district-booth-';

export type ExpoWorldDiagnostics = {
  assetUrlCount: number;
  boothPlacementCount: number;
  placementSkippedReasonCounts: Record<string, number>;
  processedModuleCount: number;
  rawModelCount: number;
  rejectedReasonCounts: Record<string, number>;
  status: 'ready' | 'no-valid-modules';
  zoneReplacementCount: number;
};

export type CuratedCityPlacement = {
  id: string;
  category: AssetType;
  grid: { x: number; z: number };
  role: 'road' | 'structure' | 'nature';
  rotationY: number;
  primitive: 'building' | 'landmark' | 'road' | 'lamp';
  sourceName?: string;
};

export type CuratedCityPlan = {
  placements: CuratedCityPlacement[];
  visibleCore: {
    plannedCoreCells: Array<{
      key: string;
      x: number;
      z: number;
      role: 'road' | 'structure';
      preferredType: AssetType;
      preferredSourceName?: string;
    }>;
    committedCoreCells: Array<{
      key: string;
      x: number;
      z: number;
      role: 'road' | 'structure';
      targetType: AssetType;
      sourceName: string;
    }>;
    failedCoreCells: Array<{
      key: string;
      x: number;
      z: number;
      role: 'road' | 'structure';
      targetType?: AssetType;
      reason: string;
    }>;
    failedReasonsByCell: Record<string, string>;
    failedReasonsByReason: Record<string, number>;
    completedBeforeBroadFill: boolean;
    executedBeforeBroadFill: boolean;
  };
  placementSummary: {
    placed: number;
    skipped: number;
    placedByCategory: Record<AssetType, number>;
    skippedByReason: Record<string, number>;
    visibleCore: CuratedCityPlan['visibleCore'];
  };
};

export function buildExpoGenerationSignature({
  assetUrls,
  boothPlacements,
  gridSize,
  qualityTier,
  spacing,
}: {
  assetUrls: string[];
  boothPlacements: ExpoBoothPlacement[];
  gridSize: number;
  qualityTier: string;
  spacing: number;
}) {
  return JSON.stringify({
    assetUrls,
    boothPlacements: boothPlacements.map((placement) => ({
      color: placement.color,
      id: placement.id,
      position: placement.position,
      rotation: placement.rotation,
    })),
    gridSize,
    qualityTier,
    spacing,
  });
}

export function createDistrictBoothZone(placement: ExpoBoothPlacement): Zone {
  return {
    id: `${DISTRICT_BOOTH_ZONE_PREFIX}${placement.id}`,
    type: 'web',
    position: placement.position,
    radius: 14,
  };
}

function createPlacementCounter(): Record<AssetType, number> {
  return {
    building: 0,
    booth: 0,
    landmark: 0,
    nature: 0,
    road: 0,
  };
}

function createCoreRecord(role: 'road' | 'structure', x: number, z: number, preferredType: AssetType, preferredSourceName?: string) {
  return {
    key: `${x}_${z}`,
    x,
    z,
    role,
    preferredType,
    preferredSourceName,
  };
}

export function buildCuratedCityPlan(): CuratedCityPlan {
  const placements: CuratedCityPlacement[] = [];
  const placedByCategory = createPlacementCounter();
  const coreCells = [
    createCoreRecord('road', 0, -1, 'road', 'primitive-road'),
    createCoreRecord('road', 0, -2, 'road', 'primitive-road'),
    createCoreRecord('road', 0, -3, 'road', 'primitive-road'),
    createCoreRecord('road', -3, -3, 'road', 'primitive-road'),
    createCoreRecord('road', 3, -3, 'road', 'primitive-road'),
    createCoreRecord('structure', 2, -2, 'building', 'primitive-building'),
    createCoreRecord('structure', -2, -2, 'building', 'primitive-building'),
  ];

  const pushPlacement = (
    role: CuratedCityPlacement['role'],
    category: AssetType,
    primitive: CuratedCityPlacement['primitive'],
    x: number,
    z: number,
    rotationY = 0,
    sourceName?: string
  ) => {
    placements.push({
      id: `${primitive}-${x}-${z}-${placements.length}`,
      category,
      grid: { x, z },
      role,
      rotationY,
      primitive,
      sourceName,
    });
    placedByCategory[category] += 1;
  };

  const roadGrid = new Set<string>();
  const addRoad = (x: number, z: number, rotationY = 0) => {
    const key = `${x}_${z}`;
    if (roadGrid.has(key)) {
      return;
    }
    roadGrid.add(key);
    pushPlacement('road', 'road', 'road', x, z, rotationY, 'primitive-road');
  };

  const avenueColumns = [-3, 0, 3];
  avenueColumns.forEach((x) => {
    for (let z = 1; z <= 8; z += 1) {
      addRoad(x, -z, 0);
    }
  });

  [-3, -6].forEach((z) => {
    for (let x = -6; x <= 6; x += 1) {
      addRoad(x, z, Math.PI / 2);
    }
  });

  const buildingSlots = [
    { x: -6, z: -1 }, { x: -5, z: -1 }, { x: -2, z: -1 }, { x: 2, z: -1 }, { x: 5, z: -1 }, { x: 6, z: -1 },
    { x: -6, z: -4 }, { x: -5, z: -5 }, { x: -2, z: -5 }, { x: 2, z: -5 }, { x: 5, z: -5 }, { x: 6, z: -4 },
    { x: -6, z: -7 }, { x: -5, z: -8 }, { x: -2, z: -8 }, { x: 2, z: -8 }, { x: 5, z: -8 }, { x: 6, z: -7 },
  ];
  buildingSlots.forEach((slot, index) => {
    pushPlacement('structure', 'building', 'building', slot.x, slot.z, index % 2 === 0 ? 0 : Math.PI, 'primitive-building');
  });

  const landmarkSlots: Array<{ x: number; z: number }> = [
    { x: -8, z: -9 },
    { x: 8, z: -9 },
    { x: 0, z: -10 },
  ];
  landmarkSlots.forEach((slot, index) => {
    pushPlacement('structure', 'landmark', 'landmark', slot.x, slot.z, (index % 4) * (Math.PI / 2), 'primitive-landmark');
  });

  const natureSlots = [
    { x: -4, z: -2 }, { x: 4, z: -2 },
    { x: -1, z: -2 }, { x: 1, z: -2 },
    { x: -4, z: -4 }, { x: 4, z: -4 },
    { x: -1, z: -4 }, { x: 1, z: -4 },
    { x: -4, z: -7 }, { x: 4, z: -7 },
    { x: -1, z: -7 }, { x: 1, z: -7 },
    { x: -7, z: -3 }, { x: 7, z: -3 },
    { x: -7, z: -6 }, { x: 7, z: -6 },
  ];
  natureSlots.forEach((slot, index) => {
    pushPlacement('nature', 'nature', 'lamp', slot.x, slot.z, (index % 4) * (Math.PI / 2), 'primitive-lamp');
  });

  const committedCoreCells = coreCells.flatMap((cell) => {
    const matchingPlacement = placements.find((placement) => placement.grid.x === cell.x && placement.grid.z === cell.z);
    if (!matchingPlacement) {
      return [];
    }

    return [{
      key: cell.key,
      x: cell.x,
      z: cell.z,
      role: cell.role,
      targetType: matchingPlacement.category,
      sourceName: matchingPlacement.sourceName || matchingPlacement.primitive,
    }];
  });

  const failedCoreCells: CuratedCityPlan['visibleCore']['failedCoreCells'] = [];
  const failedReasonsByCell = Object.fromEntries(failedCoreCells.map((cell) => [cell.key, cell.reason]));
  const failedReasonsByReason = failedCoreCells.reduce<Record<string, number>>((acc, cell) => {
    acc[cell.reason] = (acc[cell.reason] || 0) + 1;
    return acc;
  }, {});

  const visibleCore = {
    plannedCoreCells: coreCells,
    committedCoreCells,
    failedCoreCells,
    failedReasonsByCell,
    failedReasonsByReason,
    completedBeforeBroadFill: committedCoreCells.filter((cell) => cell.role === 'road').length >= 3
      && committedCoreCells.some((cell) => cell.role === 'structure'),
    executedBeforeBroadFill: true,
  };

  return {
    placements,
    visibleCore,
    placementSummary: {
      placed: placements.length,
      skipped: 0,
      placedByCategory,
      skippedByReason: {},
      visibleCore,
    },
  };
}

export function replaceDistrictBoothZones(
  zoneSystem: Pick<ZoneSystem, 'getZones' | 'replaceZonesByPrefix'> | null | undefined,
  boothPlacements: ExpoBoothPlacement[]
) {
  if (!zoneSystem || typeof zoneSystem.replaceZonesByPrefix !== 'function') {
    return {
      registeredZoneCount: 0,
      replaced: false,
      zoneIds: [] as string[],
    };
  }

  const nextZones = boothPlacements.map(createDistrictBoothZone);
  zoneSystem.replaceZonesByPrefix(DISTRICT_BOOTH_ZONE_PREFIX, nextZones);

  const registeredZoneCount = typeof zoneSystem.getZones === 'function'
    ? zoneSystem.getZones().filter((zone) => String(zone.id).startsWith(DISTRICT_BOOTH_ZONE_PREFIX)).length
    : nextZones.length;

  return {
    registeredZoneCount,
    replaced: true,
    zoneIds: nextZones.map((zone) => zone.id),
  };
}

export function buildExpoWorldDiagnostics({
  assetUrls,
  boothPlacements,
  placementSummary,
  processed,
  rawModelCount,
}: {
  assetUrls: string[];
  boothPlacements: ExpoBoothPlacement[];
  placementSummary?: { skippedByReason?: Record<string, number> } | null;
  processed: ProcessedAssetBatch;
  rawModelCount: number;
}) {
  const processedModuleCount = processed.modules.length;
  const renderedPlacementCount = Number((placementSummary as { placed?: number } | null | undefined)?.placed ?? 0);

  return {
    assetUrlCount: assetUrls.length,
    boothPlacementCount: boothPlacements.length,
    placementSkippedReasonCounts: placementSummary?.skippedByReason ?? {},
    processedModuleCount,
    rawModelCount,
    rejectedReasonCounts: processed.summary.rejectedByReason,
    status: processedModuleCount > 0 || renderedPlacementCount > 0 ? 'ready' : 'no-valid-modules',
    zoneReplacementCount: boothPlacements.length,
  };
}
