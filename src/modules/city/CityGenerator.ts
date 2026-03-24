import * as THREE from "three";
import type { ProcessedAsset, AssetType } from "../../utils/proAssetPipeline";
import { canonicalizeRoadSubtree } from "../../utils/threeUtils";
import { ZoneSystem } from "./ZoneSystem";
import { InstancedCityLayer } from "./InstancedCityLayer";
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  createInitialCityPerformanceUsage,
  getCityPerformanceBudget,
  getModuleBudgetDelta,
  type CityPerformanceBudget,
  type CityPerformanceBudgetSummary,
  type CityPerformanceUsage,
  type CityQualityTier,
} from "./cityPerformanceBudget";

type CityConfig = {
  gridSize: number;
  spacing: number;
  qualityTier?: CityQualityTier;
};

type PlacementSummary = {
  placed: number;
  skipped: number;
  placedByCategory: Record<AssetType, number>;
  skippedByReason: Record<string, number>;
  visibleCore?: VisibleCoreRuntimeSummary;
};

type PlacementCellRange = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type PlacementCellCandidate = {
  x: number;
  z: number;
  isRoad: boolean;
  visibleCoreRole?: "road" | "structure" | "nature";
  preferredType?: AssetType;
  preferredSourceName?: string;
};

type VisibleCoreRuntimeSummary = {
  plannedCoreCells: Array<{
    key: string;
    x: number;
    z: number;
    role: PlacementCellCandidate["visibleCoreRole"];
    preferredType?: AssetType;
    preferredSourceName?: string;
  }>;
  committedCoreCells: Array<{
    key: string;
    x: number;
    z: number;
    role: PlacementCellCandidate["visibleCoreRole"];
    targetType: AssetType;
    sourceName: string;
  }>;
  failedCoreCells: Array<{
    key: string;
    x: number;
    z: number;
    role: PlacementCellCandidate["visibleCoreRole"];
    targetType?: AssetType;
    reason: string;
  }>;
  failedReasonsByCell: Record<string, string>;
  failedReasonsByReason: Record<string, number>;
  completedBeforeBroadFill: boolean;
  executedBeforeBroadFill: boolean;
};

const CITY_PLACEMENT_DEBUG = {
  disableInstancingForRoads: true,
  disableInstancingForNature: true,
  logPlacedInstances: true,
};

export class CityGenerator {
  scene: THREE.Scene;
  objects: ProcessedAsset[];
  zoneSystem: ZoneSystem | null;
  occupied: Set<string> = new Set();
  activeInstancedGroupIds: Set<string> = new Set();
  roadPoolDiagnosticsLogged = false;
  performanceBudget: CityPerformanceBudget = getCityPerformanceBudget('balanced');
  performanceUsage: CityPerformanceUsage = createInitialCityPerformanceUsage();
  performanceSkippedByBudget: Record<string, number> = {};
  placementSummary: PlacementSummary = {
    placed: 0,
    skipped: 0,
    placedByCategory: {
      building: 0,
      booth: 0,
      landmark: 0,
      nature: 0,
      road: 0,
    },
    skippedByReason: {},
  };
  visibleCoreSummary = {
    road: 0,
    structure: 0,
    nature: 0,
  };

  constructor(scene: THREE.Scene, objects: ProcessedAsset[], zoneSystem: ZoneSystem | null = null) {
    this.scene = scene;
    this.objects = objects;
    this.zoneSystem = zoneSystem;
  }

  private key(x: number, z: number) { return `${x}_${z}`; }
  private isOccupied(x: number, z: number) { return this.occupied.has(this.key(x, z)); }
  private markOccupied(x: number, z: number) { this.occupied.add(this.key(x, z)); }
  private markSkipped(reason: string) {
    this.placementSummary.skipped += 1;
    this.placementSummary.skippedByReason[reason] = (this.placementSummary.skippedByReason[reason] || 0) + 1;
  }
  private markPlaced(type: AssetType) {
    this.placementSummary.placed += 1;
    this.placementSummary.placedByCategory[type] += 1;
  }
  private markBudgetSkip(reason: string) {
    this.markSkipped(reason);
    this.performanceSkippedByBudget[reason] = (this.performanceSkippedByBudget[reason] || 0) + 1;
  }

  private hashCell(x: number, z: number, salt = 0) {
    const value = Math.sin((x + 31) * 12.9898 + (z + 17) * 78.233 + salt * 37.719) * 43758.5453;
    return value - Math.floor(value);
  }

  private getModulesByType(type: AssetType) {
    const filtered = this.objects.filter((object) => object.category === type);
    if (type !== "road") {
      return filtered;
    }

    const eligibleRoadModules = filtered.filter((module) =>
      this.canUseVerifiedCanonicalYaw(module) || this.needsPlacementRoadFlatten(module)
    );

    if (!this.roadPoolDiagnosticsLogged) {
      const excludedRoadModules = filtered.filter((module) => !eligibleRoadModules.includes(module));
      const roadPoolSummary = {
        totalAcceptedRoadModules: filtered.length,
        canonicalYawCandidate: filtered.filter((module) => this.isCanonicalYawCandidate(module)).length,
        canonicalUpAxisVerified: filtered.filter((module) => this.canUseVerifiedCanonicalYaw(module)).length,
        placementRoadFlattenPending: filtered.filter((module) => this.needsPlacementRoadFlatten(module)).length,
        finalEligibleRoadModules: eligibleRoadModules.length,
      };
      this.scene.userData.cityPlacementRoadPool = roadPoolSummary;
      console.log("[CityPlacement][RoadPool]", roadPoolSummary);

      excludedRoadModules.forEach((module) => {
        const normalization = module.object.userData?.normalization || null;
        const roadState = this.getRoadNormalizationState(module);
        console.warn("[CityPlacement][RoadPool][Excluded]", {
          asset: module.sourceName,
          reason:
            !this.isCanonicalYawCandidate(module)
              ? "ROAD_NO_CANONICAL_CANDIDATE"
              : !roadState.canonicalUpAxisVerified && !roadState.placementRoadFlattenPending
                ? "ROAD_NOT_VERIFIED_AND_NO_FLATTEN"
                : "ROAD_UNRECOVERABLE",
          roadState,
          normalization,
        });
      });

      this.roadPoolDiagnosticsLogged = true;
    }

    return eligibleRoadModules;
  }

  private hasAcceptedModules(type: AssetType) {
    return this.getModulesByType(type).length > 0;
  }

  private getVisibleFocusCell(spacing: number) {
    return {
      x: 0,
      z: Math.round(-24 / spacing),
    };
  }

  private buildVisibleCoreCells(spacing: number): PlacementCellCandidate[] {
    const focus = this.getVisibleFocusCell(spacing);
    const structurePlan = this.pickVisibleCoreStructurePlan(spacing);
    const structureCandidates = structurePlan?.cells || [];

    return [
      {
        x: focus.x,
        z: focus.z,
        isRoad: this.isRoadZone(focus.x, focus.z),
        visibleCoreRole: "road",
        preferredType: "road",
        preferredSourceName: "american_road.glb",
      },
      {
        x: focus.x,
        z: focus.z - 1,
        isRoad: this.isRoadZone(focus.x, focus.z - 1),
        visibleCoreRole: "road",
        preferredType: "road",
        preferredSourceName: "american_road.glb",
      },
      {
        x: focus.x,
        z: focus.z - 2,
        isRoad: this.isRoadZone(focus.x, focus.z - 2),
        visibleCoreRole: "road",
        preferredType: "road",
        preferredSourceName: "american_road.glb",
      },
      ...structureCandidates.map((candidate) => ({
        x: candidate.x,
        z: candidate.z,
        isRoad: this.isRoadZone(candidate.x, candidate.z),
        visibleCoreRole: "structure" as const,
        preferredType: structurePlan?.targetType || "building",
        preferredSourceName: structurePlan?.module.sourceName,
      })),
    ];
  }

  private isVisibleCoreSatisfied() {
    return this.visibleCoreSummary.road >= 3 && this.visibleCoreSummary.structure >= 1;
  }

  private createVisibleCoreRuntimeSummary(cells: PlacementCellCandidate[]): VisibleCoreRuntimeSummary {
    return {
      plannedCoreCells: cells.map((cell) => ({
        key: this.key(cell.x, cell.z),
        x: cell.x,
        z: cell.z,
        role: cell.visibleCoreRole,
        preferredType: cell.preferredType,
        preferredSourceName: cell.preferredSourceName,
      })),
      committedCoreCells: [],
      failedCoreCells: [],
      failedReasonsByCell: {},
      failedReasonsByReason: {},
      completedBeforeBroadFill: false,
      executedBeforeBroadFill: true,
    };
  }

  private recordVisibleCorePlacement(cell: PlacementCellCandidate, targetType: AssetType) {
    if (!cell.visibleCoreRole) {
      return;
    }

    if (cell.visibleCoreRole === "road" && targetType === "road") {
      this.visibleCoreSummary.road += 1;
      return;
    }

    if (cell.visibleCoreRole === "structure" && (targetType === "building" || targetType === "landmark")) {
      this.visibleCoreSummary.structure += 1;
      return;
    }

    if (cell.visibleCoreRole === "nature" && targetType === "nature") {
      this.visibleCoreSummary.nature += 1;
    }
  }

  private recordVisibleCoreSuccess(
    summary: VisibleCoreRuntimeSummary,
    cell: PlacementCellCandidate,
    targetType: AssetType,
    sourceName: string
  ) {
    summary.committedCoreCells.push({
      key: this.key(cell.x, cell.z),
      x: cell.x,
      z: cell.z,
      role: cell.visibleCoreRole,
      targetType,
      sourceName,
    });
  }

  private recordVisibleCoreFailure(
    summary: VisibleCoreRuntimeSummary,
    cell: PlacementCellCandidate,
    reason: string,
    targetType?: AssetType
  ) {
    const key = this.key(cell.x, cell.z);
    summary.failedCoreCells.push({
      key,
      x: cell.x,
      z: cell.z,
      role: cell.visibleCoreRole,
      targetType,
      reason,
    });
    summary.failedReasonsByCell[key] = reason;
    summary.failedReasonsByReason[reason] = (summary.failedReasonsByReason[reason] || 0) + 1;
  }

  private getCellVisualPriority(cell: PlacementCellCandidate, spacing: number) {
    const focus = this.getVisibleFocusCell(spacing);
    const dx = Math.abs(cell.x - focus.x);
    const dz = Math.abs(cell.z - focus.z);
    const distance = dx + dz;
    const isFrontageCell = !cell.isRoad && dx <= 2 && dz <= 2;
    const isPrimaryRoadCorridor = cell.isRoad && cell.x === focus.x && cell.z <= focus.z + 2;
    const isSecondaryRoadCorridor = cell.isRoad && dx <= 4 && cell.z <= focus.z + 2;
    const isForwardCell = cell.z <= focus.z + 2;

    const laneScore = isPrimaryRoadCorridor
      ? 0
      : isFrontageCell
        ? 1
        : isSecondaryRoadCorridor
          ? 2
          : isForwardCell
            ? 3
            : 4;

    return {
      laneScore,
      distance,
      absX: Math.abs(cell.x),
      z: cell.z,
    };
  }

  private buildPlacementCells(effectiveGridSize: number, spacing: number) {
    const cells: PlacementCellCandidate[] = [];
    const visibleCoreCells = this.buildVisibleCoreCells(spacing);
    const visibleCoreKeys = new Set(visibleCoreCells.map((cell) => this.key(cell.x, cell.z)));

    for (let x = -effectiveGridSize; x < effectiveGridSize; x++) {
      for (let z = -effectiveGridSize; z < effectiveGridSize; z++) {
        const key = this.key(x, z);
        if (visibleCoreKeys.has(key)) {
          continue;
        }

        cells.push({ x, z, isRoad: this.isRoadZone(x, z) });
      }
    }

    const sortedCells = cells.sort((left, right) => {
      const leftPriority = this.getCellVisualPriority(left, spacing);
      const rightPriority = this.getCellVisualPriority(right, spacing);

      if (leftPriority.laneScore !== rightPriority.laneScore) {
        return leftPriority.laneScore - rightPriority.laneScore;
      }

      if (leftPriority.distance !== rightPriority.distance) {
        return leftPriority.distance - rightPriority.distance;
      }

      if (leftPriority.absX !== rightPriority.absX) {
        return leftPriority.absX - rightPriority.absX;
      }

      return leftPriority.z - rightPriority.z;
    });

    return sortedCells;
  }

  private pickTargetType(cell: PlacementCellCandidate, spacing: number): AssetType {
    const { x, z, isRoad, visibleCoreRole, preferredType } = cell;
    if (isRoad) return "road";

    if (visibleCoreRole === "structure" && !this.isVisibleCoreSatisfied()) {
      if (preferredType === "building" && this.hasAcceptedModules("building")) return "building";
      if (this.hasAcceptedModules("landmark")) return "landmark";
      if (this.hasAcceptedModules("building")) return "building";
      if (this.hasAcceptedModules("nature")) return "nature";
    }

    if (visibleCoreRole === "nature" && this.isVisibleCoreSatisfied() && this.hasAcceptedModules("nature")) {
      return "nature";
    }

    const focus = this.getVisibleFocusCell(spacing);
    const dx = Math.abs(x - focus.x);
    const dz = Math.abs(z - focus.z);
    const isFrontageCell = dx <= 2 && dz <= 2;

    if (isFrontageCell) {
      if (this.hasAcceptedModules("building")) return "building";
      if (this.hasAcceptedModules("landmark")) return "landmark";
      if (this.hasAcceptedModules("nature")) return "nature";
    }

    const roll = this.hashCell(x, z, 1);
    if (roll < 0.5) return "building";
    if (roll < 0.72) {
      if (this.hasAcceptedModules("booth")) return "booth";
      if (this.hasAcceptedModules("nature")) return "nature";
      if (this.hasAcceptedModules("building")) return "building";
      return "landmark";
    }
    if (roll < 0.88) return "nature";
    return "landmark";
  }

  private resolveVisibleCoreTargetType(cell: PlacementCellCandidate) {
    if (cell.visibleCoreRole === "road") {
      if (this.hasAcceptedModules("road")) {
        return { targetType: "road" as const };
      }

      return { reason: "NO_MODULE_ROAD" };
    }

    if (cell.visibleCoreRole === "structure") {
      if (this.hasAcceptedModules("building")) {
        return { targetType: "building" as const };
      }

      if (this.hasAcceptedModules("landmark")) {
        return { targetType: "landmark" as const };
      }

      return { reason: `NO_MODULE_${(cell.preferredType || "building").toUpperCase()}` };
    }

    if (cell.visibleCoreRole === "nature") {
      if (this.hasAcceptedModules("nature")) {
        return { targetType: "nature" as const };
      }

      return { reason: "NO_MODULE_NATURE" };
    }

    return { targetType: cell.preferredType || "building" };
  }

  private getStructuralModulesByType(type: "building" | "landmark") {
    return this.getModulesByType(type)
      .slice()
      .sort((left, right) => {
        const leftFootprint = left.footprint.width * left.footprint.depth;
        const rightFootprint = right.footprint.width * right.footprint.depth;
        if (leftFootprint !== rightFootprint) {
          return leftFootprint - rightFootprint;
        }

        if (left.budget.vertices !== right.budget.vertices) {
          return left.budget.vertices - right.budget.vertices;
        }

        if (left.budget.meshes !== right.budget.meshes) {
          return left.budget.meshes - right.budget.meshes;
        }

        return left.budget.materials - right.budget.materials;
      });
  }

  private buildVisibleCoreStructureSearchCells(spacing: number) {
    const focus = this.getVisibleFocusCell(spacing);
    const xOffsets = [1, -1, 2, -2, 3, -3];
    const zOffsets = [-1, 0, -2, 1, -3];
    const candidates: Array<{ x: number; z: number }> = [];
    const seen = new Set<string>();

    zOffsets.forEach((zOffset) => {
      xOffsets.forEach((xOffset) => {
        const x = focus.x + xOffset;
        const z = focus.z + zOffset;
        const key = this.key(x, z);

        if (seen.has(key) || this.isRoadZone(x, z)) {
          return;
        }

        seen.add(key);
        candidates.push({ x, z });
      });
    });

    return candidates;
  }

  private getVisibleCoreStructurePresentationScore(cell: { x: number; z: number }, spacing: number) {
    const focus = this.getVisibleFocusCell(spacing);
    const preferredStructureZ = focus.z - 1;

    return {
      absX: Math.abs(cell.x - focus.x),
      zDistance: Math.abs(cell.z - preferredStructureZ),
      sideBias: cell.x >= focus.x ? 0 : 1,
      z: cell.z,
    };
  }

  private findVisibleCoreStructureRotation(module: ProcessedAsset, x: number, z: number, spacing: number) {
    const seededRotation = this.pickRotation(module, x, z);
    const rotations = [seededRotation, ...module.allowedRotations.filter((rotation) => rotation !== seededRotation)];

    for (const rotation of rotations) {
      const occupancyRange = this.getCellRange(x, z, module, rotation, spacing, false);
      const reservedRange = this.getCellRange(x, z, module, rotation, spacing, true);

      if (!this.respectsZoning(module, occupancyRange)) {
        continue;
      }

      if (this.rangeOverlapsSpawn(reservedRange, spacing)) {
        continue;
      }

      if (this.isRangeOccupied(reservedRange)) {
        continue;
      }

      return rotation;
    }

    return null;
  }

  private getVisibleCoreStructureFailureReason(module: ProcessedAsset, x: number, z: number, spacing: number) {
    const seededRotation = this.pickRotation(module, x, z);
    const rotations = [seededRotation, ...module.allowedRotations.filter((rotation) => rotation !== seededRotation)];
    let lastReason = `NO_MODULE_${module.category.toUpperCase()}`;

    for (const rotation of rotations) {
      const occupancyRange = this.getCellRange(x, z, module, rotation, spacing, false);
      const reservedRange = this.getCellRange(x, z, module, rotation, spacing, true);

      if (!this.respectsZoning(module, occupancyRange)) {
        lastReason = `ZONING_${module.category.toUpperCase()}`;
        continue;
      }

      if (this.rangeOverlapsSpawn(reservedRange, spacing)) {
        lastReason = "SPAWN_BUFFER";
        continue;
      }

      if (this.isRangeOccupied(reservedRange)) {
        lastReason = `OCCUPIED_${module.collisionStrategy.toUpperCase()}`;
        continue;
      }
    }

    return lastReason;
  }

  private pickVisibleCoreStructurePlan(spacing: number) {
    const candidateCells = this.buildVisibleCoreStructureSearchCells(spacing);
    const structuralPlans = [
      ...this.getStructuralModulesByType("building").map((module) => ({ targetType: "building" as const, module })),
      ...this.getStructuralModulesByType("landmark").map((module) => ({ targetType: "landmark" as const, module })),
    ];

    for (const plan of structuralPlans) {
      const compatibleCells = candidateCells
        .filter((cell) => (
          this.findVisibleCoreStructureRotation(plan.module, cell.x, cell.z, spacing) !== null
        ))
        .sort((left, right) => {
          const leftScore = this.getVisibleCoreStructurePresentationScore(left, spacing);
          const rightScore = this.getVisibleCoreStructurePresentationScore(right, spacing);

          if (leftScore.absX !== rightScore.absX) {
            return leftScore.absX - rightScore.absX;
          }

          if (leftScore.zDistance !== rightScore.zDistance) {
            return leftScore.zDistance - rightScore.zDistance;
          }

          if (leftScore.sideBias !== rightScore.sideBias) {
            return leftScore.sideBias - rightScore.sideBias;
          }

          return leftScore.z - rightScore.z;
        });

      if (compatibleCells.length > 0) {
        return {
          ...plan,
          cells: compatibleCells,
        };
      }
    }

    const fallbackPlan = structuralPlans[0];
    if (!fallbackPlan) {
      return null;
    }

    return {
      ...fallbackPlan,
      cells: candidateCells,
    };
  }

  private executeVisibleCorePass(
    spacing: number,
    instanceGroups: Record<string, any[]>
  ) {
    const visibleCoreCells = this.buildVisibleCoreCells(spacing);
    const runtimeSummary = this.createVisibleCoreRuntimeSummary(visibleCoreCells);
    const structurePlan = this.pickVisibleCoreStructurePlan(spacing);

    for (const cell of visibleCoreCells) {
      if (cell.visibleCoreRole === "structure" && this.visibleCoreSummary.structure >= 1) {
        continue;
      }

      const resolution = this.resolveVisibleCoreTargetType(cell);
      const targetType = "targetType" in resolution ? resolution.targetType : undefined;

      if (!targetType) {
        this.recordVisibleCoreFailure(runtimeSummary, cell, resolution.reason || "NO_VISIBLE_CORE_TARGET");
        continue;
      }

      if (this.isOccupied(cell.x, cell.z)) {
        this.markSkipped("OCCUPIED_FOOTPRINT");
        this.recordVisibleCoreFailure(runtimeSummary, cell, "OCCUPIED_FOOTPRINT", targetType);
        continue;
      }

      if (cell.visibleCoreRole === "structure" && structurePlan) {
        const rotationOverride = this.findVisibleCoreStructureRotation(structurePlan.module, cell.x, cell.z, spacing);
        if (rotationOverride === null) {
          const reason = this.getVisibleCoreStructureFailureReason(structurePlan.module, cell.x, cell.z, spacing);
          this.markSkipped(reason);
          this.recordVisibleCoreFailure(runtimeSummary, cell, reason, structurePlan.targetType);
          continue;
        }

        const placementResult = this.tryPlaceCell(cell, spacing, instanceGroups, {
          targetTypeOverride: structurePlan.targetType,
          recordVisibleCore: true,
          moduleOverride: structurePlan.module,
          rotationOverride,
        });

        if (placementResult.placed) {
          this.recordVisibleCoreSuccess(
            runtimeSummary,
            cell,
            placementResult.targetType,
            placementResult.sourceName || "unknown"
          );
          continue;
        }

        this.recordVisibleCoreFailure(
          runtimeSummary,
          cell,
          placementResult.reason,
          placementResult.targetType
        );
        continue;
      }

      const placementResult = this.tryPlaceCell(cell, spacing, instanceGroups, {
        targetTypeOverride: targetType,
        recordVisibleCore: true,
      });

      if (placementResult.placed) {
        this.recordVisibleCoreSuccess(
          runtimeSummary,
          cell,
          placementResult.targetType,
          placementResult.sourceName || "unknown"
        );
        continue;
      }

      this.recordVisibleCoreFailure(
        runtimeSummary,
        cell,
        placementResult.reason,
        placementResult.targetType
      );
    }

    runtimeSummary.completedBeforeBroadFill = this.isVisibleCoreSatisfied();
    return runtimeSummary;
  }

  private pickModuleForCell(type: AssetType, x: number, z: number, cell?: PlacementCellCandidate): ProcessedAsset | undefined {
    const filtered = this.getModulesByType(type);
    if (filtered.length === 0) return undefined;

    const prioritized = filtered.slice().sort((left, right) => {
      const preferredSourceName = cell?.preferredSourceName?.toLowerCase();
      if (preferredSourceName) {
        const leftPreferred = left.sourceName.toLowerCase() === preferredSourceName ? 1 : 0;
        const rightPreferred = right.sourceName.toLowerCase() === preferredSourceName ? 1 : 0;
        if (leftPreferred !== rightPreferred) {
          return rightPreferred - leftPreferred;
        }
      }

      if (type === "road") {
        const preferIntersection = x % 4 === 0 && z % 4 === 0;
        const leftIntersection = left.sourceName.toLowerCase().includes("intersection") ? 1 : 0;
        const rightIntersection = right.sourceName.toLowerCase().includes("intersection") ? 1 : 0;

        if (leftIntersection !== rightIntersection) {
          return preferIntersection ? rightIntersection - leftIntersection : leftIntersection - rightIntersection;
        }
      }

      return 0;
    });

    const startIndex = Math.floor(this.hashCell(x, z, 2) * prioritized.length);

    for (let offset = 0; offset < prioritized.length; offset++) {
      const candidate = prioritized[(startIndex + offset) % prioritized.length];
      return candidate;
    }

    return undefined;
  }

  private tryPlaceCell(
    cell: PlacementCellCandidate,
    spacing: number,
    instanceGroups: Record<string, any[]>,
    options?: { targetTypeOverride?: AssetType; recordVisibleCore?: boolean; moduleOverride?: ProcessedAsset; rotationOverride?: number }
  ) {
    const { x, z, isRoad } = cell;
    const targetType = options?.targetTypeOverride || this.pickTargetType(cell, spacing);
    const obj = options?.moduleOverride || this.pickModuleForCell(targetType, x, z, cell);

    if (!obj) {
      const reason = `NO_MODULE_${targetType.toUpperCase()}`;
      this.markSkipped(reason);
      if (isRoad) {
        this.markOccupied(x, z);
      }

      return { placed: false as const, reason, targetType };
    }

    const rotY = options?.rotationOverride ?? this.pickRotation(obj, x, z);
    const occupancyRange = this.getCellRange(x, z, obj, rotY, spacing, false);
    const reservedRange = this.getCellRange(x, z, obj, rotY, spacing, true);

    if (!this.respectsZoning(obj, occupancyRange)) {
      const reason = `ZONING_${obj.category.toUpperCase()}`;
      this.markSkipped(reason);
      return { placed: false as const, reason, targetType, sourceName: obj.sourceName };
    }

    if (this.rangeOverlapsSpawn(reservedRange, spacing)) {
      const reason = "SPAWN_BUFFER";
      this.markSkipped(reason);
      return { placed: false as const, reason, targetType, sourceName: obj.sourceName };
    }

    if (this.isRangeOccupied(reservedRange)) {
      const reason = `OCCUPIED_${obj.collisionStrategy.toUpperCase()}`;
      this.markSkipped(reason);
      return { placed: false as const, reason, targetType, sourceName: obj.sourceName };
    }

    const placement = this.buildPlacementTransform(obj, x, z, spacing, rotY);
    const isInstancedCategory = this.shouldUseInstancing(obj);
    const requiresNewInstancedGroup = isInstancedCategory && !instanceGroups[obj.id];
    const budgetDecision = this.canPlaceWithinBudget(obj, requiresNewInstancedGroup);
    if (!budgetDecision.accepted) {
      this.markBudgetSkip(budgetDecision.reason);
      return { placed: false as const, reason: budgetDecision.reason, targetType, sourceName: obj.sourceName };
    }

    if (isInstancedCategory) {
      if (!instanceGroups[obj.id]) instanceGroups[obj.id] = [];

      instanceGroups[obj.id].push({
        position: [placement.position.x, placement.position.y, placement.position.z],
        rotation: placement.rotationEuler.y,
        rotationEuler: [placement.rotationEuler.x, placement.rotationEuler.y, placement.rotationEuler.z],
        scaleVec: placement.scaleVec,
        baseData: obj,
        gridAnchor: [x, z],
        reservedRange,
      });

      this.logPlacement(obj, placement.position, placement.rotationEuler, placement.scaleVec);
      this.markOccupiedRange(reservedRange);
      this.markPlaced(targetType);
      if (options?.recordVisibleCore) {
        this.recordVisibleCorePlacement(cell, targetType);
      }
      this.commitBudgetUsage(obj, requiresNewInstancedGroup);

      return { placed: true as const, targetType, sourceName: obj.sourceName };
    }

    const clone = SkeletonUtils.clone(obj.object);
    let placementRoadNormalization: ReturnType<typeof canonicalizeRoadSubtree> | null = null;

    clone.position.copy(placement.position);
    clone.rotation.copy(placement.rotationEuler);
    clone.scale.copy(placement.scaleVec);

    if (this.needsPlacementRoadFlatten(obj)) {
      placementRoadNormalization = canonicalizeRoadSubtree(clone);
    }

    clone.matrixAutoUpdate = false;
    clone.updateMatrix();
    clone.updateWorldMatrix(true, true);

    this.scene.add(clone);
    this.logPlacement(obj, placement.position, placement.rotationEuler, placement.scaleVec, clone, placementRoadNormalization);
    this.markOccupiedRange(reservedRange);
    this.markPlaced(targetType);
    if (options?.recordVisibleCore) {
      this.recordVisibleCorePlacement(cell, targetType);
    }
    this.commitBudgetUsage(obj, false);

    if (targetType === "booth" && this.zoneSystem) {
      this.zoneSystem.addZone({
        id: `booth_${x}_${z}`,
        type: "pixelstream",
        position: [placement.position.x, placement.position.y, placement.position.z],
        radius: 8,
        streamId: `stream_${x}_${z}`
      });
    }

    return { placed: true as const, targetType, sourceName: obj.sourceName };
  }

  private pickRotation(module: ProcessedAsset, x: number, z: number) {
    const rotations = module.allowedRotations.length > 0 ? module.allowedRotations : [0];
    const index = Math.floor(this.hashCell(x, z, 3) * rotations.length);
    return rotations[index] ?? rotations[0] ?? 0;
  }

  private shouldUseInstancing(module: ProcessedAsset) {
    if (module.category === "road" && CITY_PLACEMENT_DEBUG.disableInstancingForRoads) return false;
    if (module.category === "nature" && CITY_PLACEMENT_DEBUG.disableInstancingForNature) return false;
    return module.category === "building" || module.category === "road" || module.category === "nature";
  }

  private isRoadZone(x: number, z: number) {
    return (x % 4 === 0) || (z % 4 === 0);
  }

  private buildScaleVector(module: ProcessedAsset, x: number, z: number) {
    if (module.category === "nature") {
      const scaleSeed = this.hashCell(x, z, 4);
      const uniformScale = 0.9 + scaleSeed * 0.25;
      return new THREE.Vector3(uniformScale, uniformScale, uniformScale);
    }

    if (module.category === "building") {
      const scaleSeed = this.hashCell(x, z, 5);
      const uniformScale = 0.95 + scaleSeed * 0.1;
      return new THREE.Vector3(uniformScale, uniformScale, uniformScale);
    }

    return new THREE.Vector3(1, 1, 1);
  }

  private getFirstDefinedBoolean(...values: unknown[]) {
    const match = values.find((value) => typeof value === "boolean");
    return typeof match === "boolean" ? match : undefined;
  }

  private getRoadNormalizationState(module: ProcessedAsset) {
    const normalization = module.object.userData?.normalization || {};
    const canonicalYawCandidate = this.getFirstDefinedBoolean(
      normalization.canonicalYawCandidate,
      module.transform.canonicalYawCandidate,
      normalization.canonicalYawOnly,
      module.transform.canonicalYawOnly
    ) ?? false;
    const flattenApplied = this.getFirstDefinedBoolean(
      normalization.flattenApplied,
      module.transform.flattenApplied
    ) ?? false;
    const canonicalUpAxisVerified = this.getFirstDefinedBoolean(
      normalization.canonicalUpAxisVerified,
      module.transform.canonicalUpAxisVerified
    ) ?? false;
    const placementRoadFlattenPending = this.getFirstDefinedBoolean(
      normalization.placementRoadFlattenPending,
      module.transform.placementRoadFlattenPending
    ) ?? false;

    return {
      canonicalYawCandidate,
      flattenApplied,
      canonicalUpAxisVerified,
      placementRoadFlattenPending: Boolean(canonicalYawCandidate && placementRoadFlattenPending),
    };
  }

  private isCanonicalYawCandidate(module: ProcessedAsset) {
    return Boolean(module.category === "road" && this.getRoadNormalizationState(module).canonicalYawCandidate);
  }

  private canUseVerifiedCanonicalYaw(module: ProcessedAsset) {
    const normalizationState = this.getRoadNormalizationState(module);
    return Boolean(module.category === "road" && this.isCanonicalYawCandidate(module) && normalizationState.canonicalUpAxisVerified);
  }

  private needsPlacementRoadFlatten(module: ProcessedAsset) {
    const normalizationState = this.getRoadNormalizationState(module);
    return Boolean(module.category === "road" && this.isCanonicalYawCandidate(module) && normalizationState.placementRoadFlattenPending);
  }

  private composePlacementRotation(module: ProcessedAsset, rotationY: number) {
    if (this.canUseVerifiedCanonicalYaw(module) || this.needsPlacementRoadFlatten(module)) {
      return new THREE.Euler(0, rotationY, 0);
    }

    return new THREE.Euler(
      module.transform.rotationEuler[0],
      module.transform.rotationEuler[1] + rotationY,
      module.transform.rotationEuler[2]
    );
  }

  private getGroundAlignedY(module: ProcessedAsset, scaleVec: THREE.Vector3) {
    if (!module.transform.snapToGround) {
      return module.transform.groundOffsetY;
    }

    return (-module.bounds.min[1] * scaleVec.y) + module.transform.groundOffsetY;
  }

  private getHorizontalPlacementOffset(module: ProcessedAsset, rotationEuler: THREE.Euler, scaleVec: THREE.Vector3) {
    if (!module.transform.centerXZOnly && module.transform.placementAnchor === "center") {
      return new THREE.Vector3(0, 0, 0);
    }

    return new THREE.Vector3(
      -module.bounds.center[0] * scaleVec.x,
      0,
      -module.bounds.center[2] * scaleVec.z
    ).applyEuler(rotationEuler);
  }

  private buildPlacementTransform(module: ProcessedAsset, x: number, z: number, spacing: number, rotationY: number) {
    const scaleVec = this.buildScaleVector(module, x, z);
    let posX = x * spacing;
    let posZ = z * spacing;

    if (module.category !== "road") {
      const jitterX = (this.hashCell(x, z, 6) - 0.5) * Math.min(1.5, spacing * 0.12);
      const jitterZ = (this.hashCell(x, z, 7) - 0.5) * Math.min(1.5, spacing * 0.12);
      posX += jitterX;
      posZ += jitterZ;
    }

    const rotationEuler = this.composePlacementRotation(module, rotationY);
    const roadSurfaceLift = module.category === "road" ? 0.04 : 0;
    const basePosition = new THREE.Vector3(posX, this.getGroundAlignedY(module, scaleVec) + roadSurfaceLift, posZ);
    const horizontalOffset = this.getHorizontalPlacementOffset(module, rotationEuler, scaleVec);

    return {
      position: basePosition.add(horizontalOffset),
      rotationEuler,
      scaleVec,
    };
  }

  private getFirstMeshChild(root: THREE.Object3D): THREE.Object3D | null {
    let firstMesh: THREE.Object3D | null = null;
    root.traverse((child: any) => {
      if (!firstMesh && child.isMesh) {
        firstMesh = child;
      }
    });
    return firstMesh as THREE.Object3D | null;
  }

  private formatTuple(values: number[]) {
    return values.map((value) => value.toFixed(3));
  }

  private logPlacement(
    module: ProcessedAsset,
    position: THREE.Vector3,
    rotationEuler: THREE.Euler,
    scaleVec: THREE.Vector3,
    placedObject?: THREE.Object3D,
    placementRoadNormalization?: ReturnType<typeof canonicalizeRoadSubtree> | null
  ) {
    if (!CITY_PLACEMENT_DEBUG.logPlacedInstances) return;

    const payload: Record<string, unknown> = {
      asset: module.sourceName,
      category: module.category,
      position: this.formatTuple([position.x, position.y, position.z]),
      rotation: this.formatTuple([rotationEuler.x, rotationEuler.y, rotationEuler.z]),
      scale: this.formatTuple([scaleVec.x, scaleVec.y, scaleVec.z]),
      footprint: module.footprint,
      canonicalYawCandidate: this.isCanonicalYawCandidate(module),
      canonicalYawVerified: this.canUseVerifiedCanonicalYaw(module),
      placementRoadFlattenPending: this.needsPlacementRoadFlatten(module),
      roadNormalizationState: this.getRoadNormalizationState(module),
      normalization: module.object.userData?.normalization || null,
      placementRoadNormalization: placementRoadNormalization || null,
    };

    if (placedObject) {
      placedObject.updateWorldMatrix(true, true);
      const rootQuaternion = placedObject.getWorldQuaternion(new THREE.Quaternion());
      const rootEuler = new THREE.Euler().setFromQuaternion(rootQuaternion, "XYZ");
      const worldScale = placedObject.getWorldScale(new THREE.Vector3());

      payload.rootWorldRotation = this.formatTuple([rootEuler.x, rootEuler.y, rootEuler.z]);
      payload.rootWorldQuaternion = this.formatTuple([rootQuaternion.x, rootQuaternion.y, rootQuaternion.z, rootQuaternion.w]);
      payload.finalWorldTransform = {
        position: this.formatTuple([placedObject.position.x, placedObject.position.y, placedObject.position.z]),
        rotation: this.formatTuple([placedObject.rotation.x, placedObject.rotation.y, placedObject.rotation.z]),
        quaternion: this.formatTuple([placedObject.quaternion.x, placedObject.quaternion.y, placedObject.quaternion.z, placedObject.quaternion.w]),
        scale: this.formatTuple([worldScale.x, worldScale.y, worldScale.z]),
      };

      const firstMeshChild = this.getFirstMeshChild(placedObject);
      if (firstMeshChild) {
        const firstMeshQuaternion = firstMeshChild.getWorldQuaternion(new THREE.Quaternion());
        const firstMeshEuler = new THREE.Euler().setFromQuaternion(firstMeshQuaternion, "XYZ");
        payload.firstMeshWorldRotation = this.formatTuple([firstMeshEuler.x, firstMeshEuler.y, firstMeshEuler.z]);
        payload.firstMeshWorldQuaternion = this.formatTuple([firstMeshQuaternion.x, firstMeshQuaternion.y, firstMeshQuaternion.z, firstMeshQuaternion.w]);
      }
    }

    console.log("[CityPlacement][Instance]", payload);
  }

  private getPlacementDimensions(module: ProcessedAsset, rotation: number) {
    const normalizedRotation = Math.abs(rotation % Math.PI);
    const isQuarterTurn = Math.abs(normalizedRotation - Math.PI / 2) < 0.001;

    return isQuarterTurn
      ? { width: module.footprint.depth, depth: module.footprint.width }
      : { width: module.footprint.width, depth: module.footprint.depth };
  }

  private getBufferCells(module: ProcessedAsset, spacing: number) {
    if (module.collisionStrategy === "none") return 0;
    if (module.collisionStrategy === "relaxed") return 0;

    const maxFootprint = Math.max(module.footprint.width, module.footprint.depth);
    if (module.category === "landmark") return 2;
    if (module.category === "building" && maxFootprint > spacing * 1.5) return 2;
    if (module.category === "building") return 1;
    if (module.category === "booth") return 1;
    return 0;
  }

  private getCellRange(centerX: number, centerZ: number, module: ProcessedAsset, rotation: number, spacing: number, includeBuffer = false): PlacementCellRange {
    const dimensions = this.getPlacementDimensions(module, rotation);
    const bufferCells = includeBuffer ? this.getBufferCells(module, spacing) : 0;
    const cellWidth = Math.max(1, Math.ceil(dimensions.width / spacing));
    const cellDepth = Math.max(1, Math.ceil(dimensions.depth / spacing));

    return {
      minX: centerX - Math.floor((cellWidth - 1) / 2) - bufferCells,
      maxX: centerX + Math.ceil((cellWidth - 1) / 2) + bufferCells,
      minZ: centerZ - Math.floor((cellDepth - 1) / 2) - bufferCells,
      maxZ: centerZ + Math.ceil((cellDepth - 1) / 2) + bufferCells,
    };
  }

  private rangeOverlapsSpawn(range: PlacementCellRange, spacing: number) {
    const spawnX = 0;
    const spawnZ = 10;
    const minWorldX = range.minX * spacing;
    const maxWorldX = range.maxX * spacing;
    const minWorldZ = range.minZ * spacing;
    const maxWorldZ = range.maxZ * spacing;

    return spawnX >= minWorldX - 20 &&
      spawnX <= maxWorldX + 20 &&
      spawnZ >= minWorldZ - 20 &&
      spawnZ <= maxWorldZ + 20;
  }

  private isRangeOccupied(range: PlacementCellRange) {
    for (let x = range.minX; x <= range.maxX; x++) {
      for (let z = range.minZ; z <= range.maxZ; z++) {
        if (this.isOccupied(x, z)) return true;
      }
    }
    return false;
  }

  private markOccupiedRange(range: PlacementCellRange) {
    for (let x = range.minX; x <= range.maxX; x++) {
      for (let z = range.minZ; z <= range.maxZ; z++) {
        this.markOccupied(x, z);
      }
    }
  }

  private respectsZoning(module: ProcessedAsset, placementRange: PlacementCellRange) {
    for (let x = placementRange.minX; x <= placementRange.maxX; x++) {
      for (let z = placementRange.minZ; z <= placementRange.maxZ; z++) {
        const roadCell = this.isRoadZone(x, z);
        if (module.category === "road" && !roadCell) return false;
        if (module.category !== "road" && roadCell) return false;
      }
    }

    return true;
  }

  private isStructuralModule(module: ProcessedAsset) {
    return module.category === "building" || module.category === "landmark";
  }

  private pickReservedStructuralModule() {
    const structuralModules = this.objects.filter((object) => this.isStructuralModule(object));
    if (structuralModules.length === 0) {
      return null;
    }

    return structuralModules
      .slice()
      .sort((a, b) => {
        if (a.budget.vertices !== b.budget.vertices) {
          return a.budget.vertices - b.budget.vertices;
        }
        if (a.budget.meshes !== b.budget.meshes) {
          return a.budget.meshes - b.budget.meshes;
        }
        return a.budget.materials - b.budget.materials;
      })[0];
  }

  private projectBudgetState(module: ProcessedAsset, requiresNewInstancedGroup: boolean, reservedStructuralModule?: ProcessedAsset | null) {
    const placedByCategory = { ...this.performanceUsage.placedByCategory };
    const moduleDelta = getModuleBudgetDelta(module);
    let projectedPlacedModules = this.performanceUsage.placedModules + 1;
    let projectedInstancedGroups = this.performanceUsage.instancedGroups + (requiresNewInstancedGroup ? 1 : 0);
    let projectedVertices = this.performanceUsage.vertices + moduleDelta.vertices;
    let projectedMeshes = this.performanceUsage.meshes + moduleDelta.meshes;
    let projectedMaterials = this.performanceUsage.materials + moduleDelta.materials;

    placedByCategory[module.category] += 1;

    if (reservedStructuralModule) {
      const reserveDelta = getModuleBudgetDelta(reservedStructuralModule);
      projectedPlacedModules += 1;
      projectedVertices += reserveDelta.vertices;
      projectedMeshes += reserveDelta.meshes;
      projectedMaterials += reserveDelta.materials;
      placedByCategory[reservedStructuralModule.category] += 1;

      const reserveNeedsInstancedGroup =
        this.shouldUseInstancing(reservedStructuralModule) &&
        !this.activeInstancedGroupIds.has(reservedStructuralModule.id);
      if (reserveNeedsInstancedGroup) {
        projectedInstancedGroups += 1;
      }
    }

    return {
      placedByCategory,
      projectedPlacedModules,
      projectedInstancedGroups,
      projectedVertices,
      projectedMeshes,
      projectedMaterials,
    };
  }

  private getReservedStructuralModule(module: ProcessedAsset) {
    const structuralAlreadyPlaced =
      this.performanceUsage.placedByCategory.building + this.performanceUsage.placedByCategory.landmark > 0;

    if (structuralAlreadyPlaced || this.isStructuralModule(module)) {
      return null;
    }

    return this.pickReservedStructuralModule();
  }

  private canPlaceWithinBudget(module: ProcessedAsset, requiresNewInstancedGroup: boolean) {
    const baseline = this.projectBudgetState(module, requiresNewInstancedGroup);
    const reservedStructuralModule = this.getReservedStructuralModule(module);
    const projected = this.projectBudgetState(module, requiresNewInstancedGroup, reservedStructuralModule);

    if (baseline.projectedPlacedModules > this.performanceBudget.maxPlacedModules) {
      return { accepted: false, reason: "BUDGET_MAX_PLACED_MODULES" };
    }

    for (const [category, count] of Object.entries(baseline.placedByCategory) as Array<[AssetType, number]>) {
      const categoryLimit = this.performanceBudget.maxCategoryCounts[category];
      if (count > categoryLimit) {
        return { accepted: false, reason: `BUDGET_CATEGORY_${category.toUpperCase()}` };
      }
    }

    if (baseline.projectedVertices > this.performanceBudget.maxVertices) {
      return { accepted: false, reason: "BUDGET_MAX_VERTICES" };
    }

    if (baseline.projectedMeshes > this.performanceBudget.maxMeshes) {
      return { accepted: false, reason: "BUDGET_MAX_MESHES" };
    }

    if (baseline.projectedMaterials > this.performanceBudget.maxMaterials) {
      return { accepted: false, reason: "BUDGET_MAX_MATERIALS" };
    }

    if (baseline.projectedInstancedGroups > this.performanceBudget.maxInstancedGroups) {
      return { accepted: false, reason: "BUDGET_MAX_INSTANCED_GROUPS" };
    }

    if (reservedStructuralModule) {
      if (projected.projectedPlacedModules > this.performanceBudget.maxPlacedModules) {
        return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
      }

      for (const [category, count] of Object.entries(projected.placedByCategory) as Array<[AssetType, number]>) {
        const categoryLimit = this.performanceBudget.maxCategoryCounts[category];
        if (count > categoryLimit) {
          return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
        }
      }

      if (projected.projectedVertices > this.performanceBudget.maxVertices) {
        return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
      }

      if (projected.projectedMeshes > this.performanceBudget.maxMeshes) {
        return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
      }

      if (projected.projectedMaterials > this.performanceBudget.maxMaterials) {
        return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
      }

      if (projected.projectedInstancedGroups > this.performanceBudget.maxInstancedGroups) {
        return { accepted: false, reason: "BUDGET_RESERVE_STRUCTURAL" };
      }

      return { accepted: true as const, reservedStructuralCategory: reservedStructuralModule.category };
    }

    return { accepted: true as const };
  }

  private commitBudgetUsage(module: ProcessedAsset, createdNewInstancedGroup: boolean) {
    const delta = getModuleBudgetDelta(module);
    this.performanceUsage.placedModules += 1;
    this.performanceUsage.vertices += delta.vertices;
    this.performanceUsage.meshes += delta.meshes;
    this.performanceUsage.materials += delta.materials;
    this.performanceUsage.placedByCategory[module.category] += 1;

    if (createdNewInstancedGroup) {
      this.performanceUsage.instancedGroups += 1;
      this.activeInstancedGroupIds.add(module.id);
    }
  }

  private buildPerformanceSummary(requestedGridSize: number, effectiveGridSize: number, spacing: number): CityPerformanceBudgetSummary {
    return {
      tier: this.performanceBudget.tier,
      requestedGridSize,
      effectiveGridSize,
      spacing,
      budget: this.performanceBudget,
      usage: {
        placedModules: this.performanceUsage.placedModules,
        instancedGroups: this.performanceUsage.instancedGroups,
        vertices: this.performanceUsage.vertices,
        meshes: this.performanceUsage.meshes,
        materials: this.performanceUsage.materials,
        placedByCategory: { ...this.performanceUsage.placedByCategory },
      },
      skippedByBudget: { ...this.performanceSkippedByBudget },
    };
  }

  generate(config: CityConfig) {
    const { gridSize, spacing, qualityTier = 'balanced' } = config;
    this.performanceBudget = getCityPerformanceBudget(qualityTier);
    this.performanceUsage = createInitialCityPerformanceUsage();
    this.activeInstancedGroupIds = new Set();
    this.roadPoolDiagnosticsLogged = false;
    this.performanceSkippedByBudget = {};
    this.scene.userData.cityVisibleCore = null;
    this.scene.userData.cityPlacementRoadPool = null;
    this.visibleCoreSummary = {
      road: 0,
      structure: 0,
      nature: 0,
    };
    this.placementSummary = {
      placed: 0,
      skipped: 0,
      placedByCategory: {
        building: 0,
        booth: 0,
        landmark: 0,
        nature: 0,
        road: 0,
      },
      skippedByReason: {},
    };

    const effectiveGridSize = Math.min(gridSize, this.performanceBudget.maxGridSize);

    const instanceGroups: Record<string, any[]> = {};
    const visibleCoreRuntime = this.executeVisibleCorePass(spacing, instanceGroups);

    const placementCells = this.buildPlacementCells(effectiveGridSize, spacing);

    for (const cell of placementCells) {
      const { x, z } = cell;
      if (this.isOccupied(x, z)) continue;
      this.tryPlaceCell(cell, spacing, instanceGroups);
    }

    const instancer = new InstancedCityLayer(this.scene);

    Object.entries(instanceGroups).forEach(([key, items]) => {
      const baseObj = this.objects.find(o => o.id === key);
      if (!baseObj) return;

      const meshes: THREE.Mesh[] = [];
      baseObj.object.traverse((child: any) => {
        if (child.isMesh) meshes.push(child);
      });

      if (meshes.length === 0) return;

      meshes.forEach((mesh, meshIndex) => {
        const instanced = instancer.createInstanceGroup(`${key}_${meshIndex}`, mesh, items.length);

        if (baseObj.category === "building" || baseObj.category === "nature" || baseObj.category === "road") {
          instanced.castShadow = false;
        }

        if (baseObj.category === "road") {
          instanced.renderOrder = -1;
        }

        instanced.userData = {
          type: baseObj.category,
          sourceId: key,
          moduleMeta: {
            footprint: baseObj.footprint,
            collisionStrategy: baseObj.collisionStrategy,
            allowedRotations: baseObj.allowedRotations,
            transform: baseObj.transform,
            budget: baseObj.budget,
            validation: baseObj.validation,
          },
          instances: items,
          getInstanceData: (instanceId: number) => items[instanceId]
        };

        items.forEach((item, i) => {
          instancer.setInstance(
            instanced,
            i,
            new THREE.Vector3(...item.position),
            item.rotation,
            item.scaleVec
          );
        });

        instancer.finalize(instanced);
      });
    });

    this.placementSummary.visibleCore = visibleCoreRuntime;
    this.scene.userData.cityVisibleCore = visibleCoreRuntime;
    this.scene.userData.cityPlacement = this.placementSummary;
    this.scene.userData.cityPerformanceBudget = this.buildPerformanceSummary(gridSize, effectiveGridSize, spacing);
    console.log("[CityPlacement][VisibleCore]", visibleCoreRuntime);
    console.log("[CityPlacement] Summary", this.placementSummary);
    console.log("[CityPerformanceBudget] Summary", this.scene.userData.cityPerformanceBudget);
    console.log(`[Instancing] Compressed ${Object.keys(instanceGroups).length} heavy asset groups into multi-mesh draw calls.`);
    return this.placementSummary;
  }
}
