import type { AssetType, ProcessedAssetBatch } from '../../utils/proAssetPipeline.js';
import {
  buildSponsorBoulevardPlan,
  EXPO_BOULEVARD_LAYOUT,
  type ExpoPlacementNodeType,
  type SponsorBoulevardPlan,
} from './lib/boulevardLayout.js';
import {
  buildDistrictThemeMap,
  resolveDistrictThemeBySectorId,
  type ExpoDistrictTheme,
  type DistrictThemeId,
} from './lib/districtTheme.js';
import type { ExpoSceneCompany, ExpoSceneSector } from './types/scene.js';
import type { Zone, ZoneSystem } from '../city/ZoneSystem.js';

export const DISTRICT_BOOTH_ZONE_PREFIX = 'district-booth-';

export type ExpoBoothPlacement = {
  id: string;
  company: any;
  color: string;
  clusterIndex?: number;
  districtTheme: ExpoDistrictTheme;
  districtThemeId: DistrictThemeId;
  layoutFootprint?: SponsorBoulevardPlan['footprint'];
  nodeType?: ExpoPlacementNodeType;
  position: [number, number, number];
  priority?: number;
  rotation: [number, number, number];
  sectorId?: string;
  sectorName?: string;
  sponsorTier?: string;
  boothType?: string;
};

export type ExpoSectorMarker = {
  id: string;
  label: string;
  color: string;
  clusterIndex?: number;
  districtTheme: ExpoDistrictTheme;
  districtThemeId: DistrictThemeId;
  nodeType?: ExpoPlacementNodeType;
  position: [number, number, number];
  side: 'left' | 'right';
  sectorId?: string | null;
};

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

export type ExpoPlayBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type ExpoWalkRegion = {
  id: string;
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
  type: 'arrival' | 'spine' | 'promenade' | 'booth-pocket' | 'sector-pocket';
};

export type ExpoStartView = {
  lookAt: [number, number, number];
  position: [number, number, number];
  source: 'arrival-main';
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

function getNormalizedBooth(company: any) {
  const rawBooth = company?.booth ?? company?.booths ?? null;

  if (Array.isArray(rawBooth)) {
    return rawBooth[0] || null;
  }

  if (rawBooth && typeof rawBooth === 'object') {
    return rawBooth;
  }

  return null;
}

function getSceneCompanies(data: any): ExpoSceneCompany[] {
  return Array.isArray(data?.companies) ? data.companies : [];
}

function getSceneSectors(data: any): ExpoSceneSector[] {
  return Array.isArray(data?.sectors) ? data.sectors : [];
}

export function buildSponsorBoulevardLayout(data: any): SponsorBoulevardPlan {
  return buildSponsorBoulevardPlan(getSceneCompanies(data), getSceneSectors(data));
}

export function buildExpoDistrictThemes(data: any) {
  return buildDistrictThemeMap(getSceneSectors(data));
}

export function buildBoothPlacements(data: any): ExpoBoothPlacement[] {
  const plan = buildSponsorBoulevardLayout(data);
  const companiesById = new Map(getSceneCompanies(data).map((company) => [String(company.id), company]));
  const districtThemes = buildExpoDistrictThemes(data);

  const placements = plan.nodes
    .filter((node) => node.companyId)
    .map((node) => {
      const company = companiesById.get(String(node.companyId)) ?? { id: node.companyId };
      const districtTheme = resolveDistrictThemeBySectorId(node.sectorId, districtThemes);
      const normalizedCompany = {
        ...company,
        booth: getNormalizedBooth(company),
      } as ExpoSceneCompany & { booth: unknown };

      return {
        boothType: normalizedCompany.boothType,
        clusterIndex: node.clusterIndex,
        color: node.color,
        company: normalizedCompany,
        districtTheme,
        districtThemeId: districtTheme.id,
        id: String(node.companyId),
        layoutFootprint: plan.footprint,
        nodeType: node.nodeType,
        position: node.position,
        priority: node.priority,
        rotation: node.rotation,
        sectorId: node.sectorId ?? undefined,
        sectorName: node.sectorLabel,
        sponsorTier: node.sponsorTier,
      };
    });

  return Object.assign(placements, { footprint: plan.footprint });
}

export function buildExpoSectorMarkers(data: any): ExpoSectorMarker[] {
  const districtThemes = buildExpoDistrictThemes(data);
  return buildSponsorBoulevardLayout(data).sectorGateways.map((node) => {
    const districtTheme = resolveDistrictThemeBySectorId(node.sectorId, districtThemes);
    return {
      clusterIndex: node.clusterIndex,
      color: node.color,
      districtTheme,
      districtThemeId: districtTheme.id,
      id: node.id,
      label: node.sectorLabel,
      nodeType: node.nodeType,
      position: node.position,
      sectorId: node.sectorId,
      side: node.position[0] < 0 ? 'left' : 'right',
    };
  });
}

export function buildExpoPlayBounds(boothPlacements: ExpoBoothPlacement[]): ExpoPlayBounds {
  const boothXs = boothPlacements.map((placement) => placement.position[0]);
  const boothZs = boothPlacements.map((placement) => placement.position[2]);
  const footprint = boothPlacements[0]?.layoutFootprint
    ?? (boothPlacements as ExpoBoothPlacement[] & { footprint?: SponsorBoulevardPlan['footprint'] }).footprint
    ?? {
      maxX: EXPO_BOULEVARD_LAYOUT.standardX + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
      maxZ: EXPO_BOULEVARD_LAYOUT.arrivalZ + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
      minX: -EXPO_BOULEVARD_LAYOUT.standardX - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
      minZ: -EXPO_BOULEVARD_LAYOUT.standardZStartOffset - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
    };
  const allXs = boothXs.length > 0 ? [...boothXs, footprint.minX, footprint.maxX] : [footprint.minX, footprint.maxX];
  const allZs = boothZs.length > 0 ? [...boothZs, footprint.minZ, footprint.maxZ] : [footprint.minZ, footprint.maxZ];

  return {
    minX: Math.min(...allXs),
    maxX: Math.max(...allXs),
    minZ: Math.min(...allZs),
    maxZ: Math.max(...allZs),
  };
}

export function buildExpoSponsorStartView(plan: Pick<SponsorBoulevardPlan, 'arrivalNode' | 'footprint'>): ExpoStartView {
  const centerX = (plan.footprint.minX + plan.footprint.maxX) * 0.5;
  const arrivalZ = plan.arrivalNode.position[2];

  return {
    lookAt: [centerX, 3.6, arrivalZ - 22],
    position: [centerX, 5, arrivalZ + 30],
    source: 'arrival-main',
  };
}

function buildBoothPocketRegion(placement: ExpoBoothPlacement, index: number): ExpoWalkRegion {
  const side = placement.position[0] < 0 ? -1 : 1;
  const depth = placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right' ? 30 : 24;
  const outerEdge = side < 0
    ? Math.max(-54, placement.position[0] - 6)
    : Math.min(54, placement.position[0] + 6);
  const innerEdge = side < 0 ? -14 : 14;

  return {
    id: `booth-pocket-${placement.id}-${index}`,
    maxX: Math.max(innerEdge, outerEdge),
    maxZ: placement.position[2] + 14,
    minX: Math.min(innerEdge, outerEdge),
    minZ: placement.position[2] - depth,
    type: 'booth-pocket',
  };
}

export function buildExpoWalkRegions(boothPlacements: ExpoBoothPlacement[]): ExpoWalkRegion[] {
  const footprint = boothPlacements[0]?.layoutFootprint
    ?? (boothPlacements as ExpoBoothPlacement[] & { footprint?: SponsorBoulevardPlan['footprint'] }).footprint
    ?? {
      maxX: EXPO_BOULEVARD_LAYOUT.standardX + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
      maxZ: EXPO_BOULEVARD_LAYOUT.arrivalZ + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
      minX: -EXPO_BOULEVARD_LAYOUT.standardX - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingX,
      minZ: -EXPO_BOULEVARD_LAYOUT.standardZStartOffset - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
    };

  const arrivalRegion: ExpoWalkRegion = {
      id: 'arrival-zone',
      maxX: 64,
      maxZ: footprint.maxZ,
      minX: -64,
      minZ: EXPO_BOULEVARD_LAYOUT.arrivalZ - 28,
      type: 'arrival',
    };
  
  const spineRegion: ExpoWalkRegion = {
      id: 'central-spine',
      maxX: 46,
      maxZ: footprint.maxZ - 8,
      minX: -46,
      minZ: footprint.minZ + 10,
      type: 'spine',
    };

  const leftPromenadeRegion: ExpoWalkRegion = {
    id: 'left-promenade',
    maxX: -10,
    maxZ: footprint.maxZ - 6,
    minX: Math.max(footprint.minX + 8, -58),
    minZ: footprint.minZ + 16,
    type: 'promenade',
  };

  const rightPromenadeRegion: ExpoWalkRegion = {
    id: 'right-promenade',
    maxX: Math.min(footprint.maxX - 8, 58),
    maxZ: footprint.maxZ - 6,
    minX: 10,
    minZ: footprint.minZ + 16,
    type: 'promenade',
  };

  const sectorPocketByCluster = new Map<number, ExpoWalkRegion>();
  boothPlacements.forEach((placement) => {
    const clusterIndex = Number(placement.clusterIndex ?? -1);
    if (clusterIndex < 0) {
      return;
    }

    const existing = sectorPocketByCluster.get(clusterIndex);
      const next: ExpoWalkRegion = existing ?? {
        id: `sector-pocket-${clusterIndex}`,
        maxX: 58,
        maxZ: placement.position[2] + 22,
        minX: -58,
        minZ: placement.position[2] - 42,
        type: 'sector-pocket',
      };
  
      next.maxZ = Math.max(next.maxZ, placement.position[2] + 22);
      next.minZ = Math.min(next.minZ, placement.position[2] - 42);
      sectorPocketByCluster.set(clusterIndex, next);
    });
  
  return [
      arrivalRegion,
      spineRegion,
      leftPromenadeRegion,
      rightPromenadeRegion,
      ...Array.from(sectorPocketByCluster.values()),
      ...boothPlacements.map(buildBoothPocketRegion),
    ];
}

export function isPointWithinExpoWalkRegions(
  point: { x: number; z: number } | [number, number],
  regions: ExpoWalkRegion[]
) {
  const x = Array.isArray(point) ? point[0] : point.x;
  const z = Array.isArray(point) ? point[1] : point.z;

  return regions.some((region) => x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ);
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
}): ExpoWorldDiagnostics {
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
