import type { AssetType, ProcessedAsset } from '../../utils/proAssetPipeline';

export type CityQualityTier = 'safe' | 'balanced' | 'showcase';

export interface CityPerformanceBudget {
  tier: CityQualityTier;
  maxGridSize: number;
  maxPlacedModules: number;
  maxInstancedGroups: number;
  maxVertices: number;
  maxMeshes: number;
  maxMaterials: number;
  maxCategoryCounts: Record<AssetType, number>;
}

export interface CityPerformanceUsage {
  placedModules: number;
  instancedGroups: number;
  vertices: number;
  meshes: number;
  materials: number;
  placedByCategory: Record<AssetType, number>;
}

export interface CityPerformanceBudgetSummary {
  tier: CityQualityTier;
  requestedGridSize: number;
  effectiveGridSize: number;
  spacing: number;
  budget: CityPerformanceBudget;
  usage: CityPerformanceUsage;
  skippedByBudget: Record<string, number>;
}

const CATEGORY_TEMPLATE: Record<AssetType, number> = {
  building: 0,
  booth: 0,
  landmark: 0,
  nature: 0,
  road: 0,
};

const CATEGORY_VERTEX_BUDGET_MULTIPLIER: Record<AssetType, number> = {
  building: 0.72,
  booth: 0.7,
  landmark: 0.82,
  nature: 0.28,
  road: 0.24,
};

const INSTANCED_REPEAT_VERTEX_BUDGET_MULTIPLIER: Record<AssetType, number> = {
  building: 0.38,
  booth: 0.7,
  landmark: 0.5,
  nature: 0.12,
  road: 0.1,
};

const CATEGORY_MESH_BUDGET_MULTIPLIER: Record<AssetType, number> = {
  building: 0.22,
  booth: 0.5,
  landmark: 0.3,
  nature: 0.2,
  road: 0.16,
};

const CATEGORY_MATERIAL_BUDGET_MULTIPLIER: Record<AssetType, number> = {
  building: 0.2,
  booth: 0.45,
  landmark: 0.28,
  nature: 0.18,
  road: 0.14,
};

export const CITY_PERFORMANCE_BUDGETS: Record<CityQualityTier, CityPerformanceBudget> = {
  safe: {
    tier: 'safe',
    maxGridSize: 6,
    maxPlacedModules: 36,
    maxInstancedGroups: 10,
    maxVertices: 180000,
    maxMeshes: 72,
    maxMaterials: 48,
    maxCategoryCounts: {
      building: 10,
      booth: 4,
      landmark: 1,
      nature: 10,
      road: 16,
    },
  },
  balanced: {
    tier: 'balanced',
    maxGridSize: 8,
    maxPlacedModules: 56,
    maxInstancedGroups: 16,
    maxVertices: 360000,
    maxMeshes: 112,
    maxMaterials: 72,
    maxCategoryCounts: {
      building: 18,
      booth: 6,
      landmark: 2,
      nature: 18,
      road: 28,
    },
  },
  showcase: {
    tier: 'showcase',
    maxGridSize: 10,
    maxPlacedModules: 84,
    maxInstancedGroups: 18,
    maxVertices: 520000,
    maxMeshes: 160,
    maxMaterials: 96,
    maxCategoryCounts: {
      building: 28,
      booth: 8,
      landmark: 3,
      nature: 24,
      road: 36,
    },
  },
};

export function getCityPerformanceBudget(tier: CityQualityTier): CityPerformanceBudget {
  return CITY_PERFORMANCE_BUDGETS[tier] || CITY_PERFORMANCE_BUDGETS.balanced;
}

export function createInitialCityPerformanceUsage(): CityPerformanceUsage {
  return {
    placedModules: 0,
    instancedGroups: 0,
    vertices: 0,
    meshes: 0,
    materials: 0,
    placedByCategory: { ...CATEGORY_TEMPLATE },
  };
}

export function getModuleBudgetDelta(module: ProcessedAsset, options?: { reuseGeometry?: boolean }) {
  const reuseGeometry = options?.reuseGeometry === true;
  const vertexMultiplier = reuseGeometry
    ? INSTANCED_REPEAT_VERTEX_BUDGET_MULTIPLIER[module.category]
    : CATEGORY_VERTEX_BUDGET_MULTIPLIER[module.category];

  return {
    vertices: Math.max(1, Math.round(module.budget.vertices * vertexMultiplier)),
    meshes: reuseGeometry ? 0 : Math.max(1, Math.round(module.budget.meshes * CATEGORY_MESH_BUDGET_MULTIPLIER[module.category])),
    materials: reuseGeometry ? 0 : Math.max(1, Math.round(module.budget.materials * CATEGORY_MATERIAL_BUDGET_MULTIPLIER[module.category])),
  };
}
