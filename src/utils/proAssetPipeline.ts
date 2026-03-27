import * as THREE from "three";
import {
  resolveCityAssetManifestEntry,
  type CityAssetPlacementAnchor,
  type CityAssetResidualIssue,
  type CityAssetRotationEuler,
  type ResolvedCityAssetManifestEntry,
} from "../modules/city/cityAssetManifest";
import { validateModel, type ModelValidationReport } from "./modelValidator";
import { quantizeValue, vectorToArray } from "./threeUtils";

export type AssetType = "building" | "booth" | "landmark" | "road" | "nature";
export type AssetSourceKind = "manifest" | "heuristic";

export interface ValidatedCityModule {
  id: string;
  sourceUrl: string;
  sourceName: string;
  sourceKind: AssetSourceKind;
  category: AssetType;
  type: AssetType;
  object: THREE.Object3D;
  pivot: {
    centered: boolean;
    grounded: boolean;
    offset: [number, number, number];
  };
  footprint: {
    width: number;
    depth: number;
  };
  width: number;
  height: number;
  depth: number;
  snap: {
    gridUnit: number;
    alignToGround: boolean;
  };
  allowedRotations: number[];
  collisionStrategy: "footprint" | "relaxed" | "none";
  transform: {
    canonicalYawCandidate: boolean;
    rotationEuler: CityAssetRotationEuler;
    scaleMultiplier: number;
    groundOffsetY: number;
    placementAnchor: CityAssetPlacementAnchor;
    centerXZOnly: boolean;
    snapToGround: boolean;
    canonicalYawOnly: boolean;
    flattenApplied: boolean;
    canonicalUpAxisVerified: boolean;
    placementRoadFlattenPending: boolean;
  };
  placementTags: string[];
  debugLabel?: string;
  notes?: string;
  validation: {
    accepted: true;
    warnings: string[];
    errors: string[];
    flags: string[];
  };
  budget: {
    meshes: number;
    materials: number;
    vertices: number;
  };
  bounds: {
    size: [number, number, number];
    center: [number, number, number];
    min: [number, number, number];
    max: [number, number, number];
  };
}

export interface RejectedCityModule {
  id: string;
  sourceUrl: string;
  sourceName: string;
  sourceKind: AssetSourceKind;
  category: AssetType;
  reasons: string[];
  warnings: string[];
  debugLabel?: string;
  notes?: string;
}

export interface AssetPipelineSummary {
  accepted: number;
  rejected: number;
  acceptedFromManifest: number;
  acceptedFromHeuristics: number;
  disabledByManifest: number;
  rejectedByReason: Record<string, number>;
}

export interface ProcessedAssetBatch {
  modules: ValidatedCityModule[];
  rejected: RejectedCityModule[];
  summary: AssetPipelineSummary;
}

export type ProcessedAsset = ValidatedCityModule;

const FATAL_VALIDATION_ERRORS = new Set([
  "GEO_NO_MESHES",
  "GEO_INVALID_BOUNDS",
  "GEO_ZERO_SIZE",
  "GEO_EXTREME_SCALE",
]);

const ALLOWABLE_RESIDUAL_ISSUES = new Set<CityAssetResidualIssue>([
  "GEO_NOT_CENTERED",
  "GEO_NOT_GROUNDED",
  "GENERATOR_FOOTPRINT_TOO_SMALL",
]);

function classifyOriginal(size: THREE.Vector3, name: string): AssetType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('road') || lowerName.includes('intersect')) return "road";
  if (lowerName.includes('tree') || lowerName.includes('grass') || lowerName.includes('nature') || lowerName.includes('eagle') || lowerName.includes('crow')) return "nature";
  
  // Real world logic: izmantojam oriģinālo Y augstumu
  if (size.y > 30) return "landmark";
  if (size.y > 10) return "building";
  return "booth";
}

function getTargetSize(type: AssetType) {
  if (type === "landmark") return 40;
  if (type === "building") return 20;
  if (type === "booth") return 6;
  if (type === "road") return 12;
  if (type === "nature") return 6;
  return 10;
}

function getSourceName(sourceUrl: string) {
  return sourceUrl.split('/').pop() || sourceUrl;
}

function optimizeMaterials(model: THREE.Object3D, type: AssetType) {
  model.traverse((child: any) => {
    if (child.isMesh) {
      if (type === "building" || type === "landmark" || type === "booth") {
        child.castShadow = true;
      } else {
        child.castShadow = false; 
      }
      
      child.receiveShadow = true;

      if (child.material) {
        // 🚀 BACKFACE CULLING FIX (Testējam DoubleSide, lai pazūd caurspīdīguma kļūdas)
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.side = THREE.DoubleSide);
        } else {
          child.material.side = THREE.DoubleSide;
        }
      }

      if (child.material && !Array.isArray(child.material) && (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial)) {
        child.material.roughness = 0.7;
        child.material.metalness = 0.2;
      } else if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => {
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            m.roughness = 0.7;
            m.metalness = 0.2;
          }
        });
      }
    }
  });
}

function getAllowedRotations(type: AssetType) {
  if (type === "nature") return [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  if (type === "road") return [0, Math.PI / 2];
  return [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
}

function getCollisionStrategy(type: AssetType) {
  if (type === "nature") return "relaxed" as const;
  if (type === "road") return "none" as const;
  return "footprint" as const;
}

function getManifestCategoryOverride(manifestEntry: ResolvedCityAssetManifestEntry | null, fallbackType: AssetType) {
  return manifestEntry?.category || fallbackType;
}

function getManifestTargetSize(manifestEntry: ResolvedCityAssetManifestEntry | null, type: AssetType) {
  return manifestEntry?.targetSize || getTargetSize(type);
}

function getManifestAllowedRotations(manifestEntry: ResolvedCityAssetManifestEntry | null, type: AssetType) {
  return manifestEntry?.allowedRotations || getAllowedRotations(type);
}

function getManifestCollisionStrategy(manifestEntry: ResolvedCityAssetManifestEntry | null, type: AssetType) {
  return manifestEntry?.collisionStrategy || getCollisionStrategy(type);
}

function getManifestSnap(manifestEntry: ResolvedCityAssetManifestEntry | null, type: AssetType) {
  return {
    gridUnit: manifestEntry?.snap?.gridUnit || (type === "road" ? 12 : 6),
    alignToGround: manifestEntry?.snap?.alignToGround ?? true,
  };
}

function getManifestFootprint(manifestEntry: ResolvedCityAssetManifestEntry | null, report: ModelValidationReport) {
  return {
    width: quantizeValue(manifestEntry?.footprint?.width || report.geometry.footprint.width),
    depth: quantizeValue(manifestEntry?.footprint?.depth || report.geometry.footprint.depth),
  };
}

function getManifestTransform(manifestEntry: ResolvedCityAssetManifestEntry | null, type: AssetType) {
  return {
    canonicalYawCandidate: manifestEntry?.canonicalYawOnly ?? false,
    rotationEuler: manifestEntry?.rotationEuler || [0, 0, 0] as CityAssetRotationEuler,
    scaleMultiplier: manifestEntry?.scaleMultiplier ?? 1,
    groundOffsetY: manifestEntry?.groundOffsetY ?? 0,
    placementAnchor: manifestEntry?.placementAnchor || (type === "road" ? "footprint-center" : "base-center"),
    centerXZOnly: manifestEntry?.centerXZOnly ?? true,
    snapToGround: manifestEntry?.snapToGround ?? true,
    canonicalYawOnly: manifestEntry?.canonicalYawOnly ?? false,
    flattenApplied: false,
    canonicalUpAxisVerified: false,
    placementRoadFlattenPending: false,
  };
}

function getRoadPlacementState(model: THREE.Object3D, type: AssetType, manifestTransform: ReturnType<typeof getManifestTransform>) {
  const normalization = model.userData?.normalization;
  const hasNormalizationMetadata = Boolean(normalization && typeof normalization === "object");
  const canonicalYawCandidate = Boolean(
    type === "road" &&
    (
      hasNormalizationMetadata
        ? normalization?.canonicalYawCandidate === true || normalization?.canonicalYawOnly === true
        : manifestTransform.canonicalYawOnly
    )
  );
  const flattenApplied = Boolean(
    canonicalYawCandidate &&
    hasNormalizationMetadata &&
    normalization?.flattenApplied === true
  );
  const canonicalUpAxisVerified = Boolean(
    canonicalYawCandidate &&
    hasNormalizationMetadata &&
    normalization?.canonicalUpAxisVerified === true
  );
  const placementRoadFlattenPending = Boolean(
    canonicalYawCandidate &&
    (
      hasNormalizationMetadata
        ? normalization?.placementRoadFlattenPending === true || !canonicalUpAxisVerified
        : !canonicalUpAxisVerified
    )
  );

  return {
    hasNormalizationMetadata,
    canonicalYawCandidate,
    flattenApplied,
    canonicalUpAxisVerified,
    placementRoadFlattenPending,
    normalization: normalization || null,
  };
}

function isGeneratorSafe(type: AssetType, report: ModelValidationReport, manifestEntry: ResolvedCityAssetManifestEntry | null) {
  const reasons: string[] = [];
  const footprint = manifestEntry?.footprint || report.geometry.footprint;
  const { width, depth } = footprint;
  const height = report.geometry.size.y;

  if (width > 80 || depth > 80 || height > 120) {
    reasons.push("GENERATOR_FOOTPRINT_TOO_LARGE");
  }

  if (type !== "nature" && (width < 0.5 || depth < 0.5 || height < 0.5)) {
    reasons.push("GENERATOR_FOOTPRINT_TOO_SMALL");
  }

  return {
    accepted: reasons.length === 0,
    reasons,
  };
}

function resolveAllowedResidualIssues(manifestEntry: ResolvedCityAssetManifestEntry | null) {
  return new Set(manifestEntry?.allowResidualIssues || []);
}

function getValidationOutcome(
  validationReport: ModelValidationReport,
  generatorSafety: ReturnType<typeof isGeneratorSafe>,
  manifestEntry: ResolvedCityAssetManifestEntry | null,
  type: AssetType,
  roadPlacementState: ReturnType<typeof getRoadPlacementState>
) {
  const allowedResidualIssues = resolveAllowedResidualIssues(manifestEntry);
  const toleratedResidualIssues: string[] = [];
  const rejectionReasons: string[] = [];
  const roadRecoverable = Boolean(
    type === "road" &&
    roadPlacementState.canonicalYawCandidate &&
    (roadPlacementState.canonicalUpAxisVerified || roadPlacementState.placementRoadFlattenPending)
  );

  const registerIssue = (issue: string) => {
    if (FATAL_VALIDATION_ERRORS.has(issue)) {
      rejectionReasons.push(issue);
      return;
    }

    if (
      roadRecoverable &&
      (issue === "GEO_NOT_GROUNDED" || issue === "GEO_NOT_CENTERED")
    ) {
      toleratedResidualIssues.push(issue);
      return;
    }

    if (ALLOWABLE_RESIDUAL_ISSUES.has(issue as CityAssetResidualIssue) && allowedResidualIssues.has(issue as CityAssetResidualIssue)) {
      toleratedResidualIssues.push(issue);
      return;
    }

    rejectionReasons.push(issue);
  };

  validationReport.errors.forEach(registerIssue);
  generatorSafety.reasons.forEach(registerIssue);

  const hasRoadOrientationOverride = Boolean(manifestEntry?.canonicalYawOnly || manifestEntry?.rotationEuler);
  if (type === "road" && validationReport.warnings.includes("GEO_UNBAKED_ROTATION") && !hasRoadOrientationOverride) {
    rejectionReasons.push("GEO_UNBAKED_ROTATION");
  }

  if (type === "road" && roadPlacementState.canonicalYawCandidate && !roadRecoverable) {
    rejectionReasons.push("ROAD_NOT_CANONICAL_AND_NOT_RECOVERABLE");
  }

  return {
    accepted: rejectionReasons.length === 0,
    rejectionReasons: [...new Set(rejectionReasons)],
    toleratedResidualIssues: [...new Set(toleratedResidualIssues)],
  };
}

export function processAssets(models: THREE.Object3D[], names: string[]): ProcessedAssetBatch {
  const modules: ValidatedCityModule[] = [];
  const rejected: RejectedCityModule[] = [];
  let acceptedFromManifest = 0;
  let acceptedFromHeuristics = 0;
  let disabledByManifest = 0;

  models.forEach((model, i) => {
    model.updateWorldMatrix(true, true);
    const origBox = new THREE.Box3().setFromObject(model);
    const origSize = new THREE.Vector3();
    origBox.getSize(origSize);
    const manifestEntry = resolveCityAssetManifestEntry(names[i]);
    const heuristicType = classifyOriginal(origSize, names[i]);
    const type = getManifestCategoryOverride(manifestEntry, heuristicType);
    const sourceName = getSourceName(names[i]);
    const targetSize = getManifestTargetSize(manifestEntry, type);
    const sourceKind: AssetSourceKind = manifestEntry ? "manifest" : "heuristic";
    const manifestTransform = getManifestTransform(manifestEntry, type);

    if (manifestEntry?.disabled) {
      disabledByManifest += 1;
      rejected.push({
        id: `asset_${i}_${type}`,
        sourceUrl: names[i],
        sourceName,
        sourceKind,
        category: type,
        reasons: ["MANIFEST_DISABLED"],
        warnings: [],
        debugLabel: manifestEntry.debugLabel,
        notes: manifestEntry.notes,
      });
      return;
    }

    const validationReport = validateModel(model, {
      autoFix: true,
      targetSize,
      allowExtremeScale: manifestTransform.scaleMultiplier !== 1,
      normalize: {
        targetSize,
        scaleMultiplier: manifestTransform.scaleMultiplier,
        centerXZOnly: manifestTransform.centerXZOnly,
        snapToGround: manifestTransform.snapToGround,
        groundOffsetY: manifestTransform.groundOffsetY,
        canonicalYawOnly: manifestTransform.canonicalYawOnly,
        assetType: type,
      },
    });
    const roadPlacementState = getRoadPlacementState(model, type, manifestTransform);
    const generatorSafety = isGeneratorSafe(type, validationReport, manifestEntry);
    const validationOutcome = getValidationOutcome(validationReport, generatorSafety, manifestEntry, type, roadPlacementState);

    if (!validationOutcome.accepted) {
      if (type === "road") {
        console.warn("[CityAssetPipeline][RoadReject]", {
          source: sourceName,
          rejectionReasons: validationOutcome.rejectionReasons,
          fatalResiduals: validationReport.errors,
          warnings: validationReport.warnings,
          roadPlacementState,
        });
      }
      rejected.push({
        id: `asset_${i}_${type}`,
        sourceUrl: names[i],
        sourceName,
        sourceKind,
        category: type,
        reasons: validationOutcome.rejectionReasons,
        warnings: [...validationReport.warnings, ...validationOutcome.toleratedResidualIssues],
        debugLabel: manifestEntry?.debugLabel,
        notes: manifestEntry?.notes,
      });
      return;
    }

    optimizeMaterials(model, type);
    const { geometry, performance, warnings, errors } = validationReport;
    const footprint = getManifestFootprint(manifestEntry, validationReport);
    const snap = getManifestSnap(manifestEntry, type);
    const allowedRotations = getManifestAllowedRotations(manifestEntry, type);
    const collisionStrategy = getManifestCollisionStrategy(manifestEntry, type);
    const acceptedWarnings = [...warnings, ...validationOutcome.toleratedResidualIssues];
    const acceptedErrors = errors.filter((issue) => !validationOutcome.toleratedResidualIssues.includes(issue));

    if (sourceKind === "manifest") {
      acceptedFromManifest += 1;
    } else {
      acceptedFromHeuristics += 1;
    }

    modules.push({
      id: `asset_${i}_${type}`,
      sourceUrl: names[i],
      sourceName,
      sourceKind,
      category: type,
      type,
      object: model,
      pivot: {
        centered: geometry.centered,
        grounded: geometry.grounded,
        offset: [
          quantizeValue(geometry.center.x),
          quantizeValue(geometry.min.y),
          quantizeValue(geometry.center.z),
        ],
      },
      footprint,
      width: quantizeValue(geometry.size.x),
      height: quantizeValue(geometry.size.y),
      depth: quantizeValue(geometry.size.z),
      snap,
      allowedRotations,
      collisionStrategy,
      transform: manifestTransform,
      placementTags: manifestEntry?.placementTags || [],
      debugLabel: manifestEntry?.debugLabel,
      notes: manifestEntry?.notes,
      validation: {
        accepted: true,
        warnings: [...new Set(acceptedWarnings)],
        errors: acceptedErrors,
        flags: [...new Set([...acceptedWarnings, ...acceptedErrors])],
      },
      budget: {
        meshes: performance.meshes,
        materials: performance.materials,
        vertices: performance.vertices,
      },
      bounds: {
        size: vectorToArray(geometry.size) as [number, number, number],
        center: vectorToArray(geometry.center) as [number, number, number],
        min: vectorToArray(geometry.min) as [number, number, number],
        max: vectorToArray(geometry.max) as [number, number, number],
      },
    });

    modules[modules.length - 1].transform.flattenApplied = roadPlacementState.flattenApplied;
    modules[modules.length - 1].transform.canonicalYawCandidate = roadPlacementState.canonicalYawCandidate;
    modules[modules.length - 1].transform.canonicalUpAxisVerified = roadPlacementState.canonicalUpAxisVerified;
    modules[modules.length - 1].transform.placementRoadFlattenPending = roadPlacementState.placementRoadFlattenPending;
  });

  const rejectedByReason = rejected.reduce<Record<string, number>>((acc, item) => {
    item.reasons.forEach((reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
    });
    return acc;
  }, {});

  const summary: AssetPipelineSummary = {
    accepted: modules.length,
    rejected: rejected.length,
    acceptedFromManifest,
    acceptedFromHeuristics,
    disabledByManifest,
    rejectedByReason,
  };

  if (shouldLogCityAssetPipeline()) {
    console.log("[CityAssetPipeline] Summary", summary);
  }
  const acceptedRoadModules = modules.filter((item) => item.category === "road");
  const rejectedRoadModules = rejected.filter((item) => item.category === "road");
  if (shouldLogCityAssetPipeline()) {
    console.log("[CityAssetPipeline][RoadPool]", {
      acceptedRoadModules: acceptedRoadModules.length,
      canonicalYawCandidate: acceptedRoadModules.filter((item) => item.transform.canonicalYawCandidate).length,
      canonicalUpAxisVerified: acceptedRoadModules.filter((item) => item.transform.canonicalUpAxisVerified).length,
      placementRoadFlattenPending: acceptedRoadModules.filter((item) => item.transform.placementRoadFlattenPending).length,
      rejectedRoadModules: rejectedRoadModules.length,
    });
    if (rejectedRoadModules.length > 0) {
      console.table(rejectedRoadModules.map((item) => ({
        source: item.sourceName,
        reasons: item.reasons.join(", "),
        warnings: item.warnings.join(", "),
      })));
    }
    if (rejected.length > 0) {
      console.table(rejected.map((item) => ({
        source: item.sourceName,
        sourceKind: item.sourceKind,
        category: item.category,
        reasons: item.reasons.join(", "),
        warnings: item.warnings.join(", "),
      })));
    }
  }

  return { modules, rejected, summary };
}
function shouldLogCityAssetPipeline() {
  const runtime = globalThis as typeof globalThis & {
    __CITY_ASSET_PIPELINE_DEBUG__?: boolean;
    process?: { env?: { NODE_ENV?: string } };
  };

  const nodeEnv = runtime.process?.env?.NODE_ENV;
  return runtime.__CITY_ASSET_PIPELINE_DEBUG__ === true || nodeEnv === "test";
}
