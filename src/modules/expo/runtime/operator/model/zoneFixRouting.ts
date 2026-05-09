import type { WorldObjectLayer, WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';
import type { ReviewOperatorZone } from './reviewOperatorSession';
import type { ZoneReviewValidation } from './zoneReviewValidation';

export type ZoneFixRoute = {
  issue: 'forbidden-layer' | 'forbidden-object' | 'missing-layer' | 'missing-object' | 'unknown-expected-object';
  reason: string;
  safeEditSeam: string;
  sourceFile: string;
  target: string;
};

function buildLayerRoute(layer: WorldObjectLayer): Omit<ZoneFixRoute, 'issue' | 'reason' | 'target'> {
  switch (layer) {
    case 'booth':
      return {
        safeEditSeam: 'src/shared/expo/layoutEngine.ts',
        sourceFile: 'src/shared/expo/layoutEngine.ts',
      };
    case 'city-screen-assignment':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      };
    case 'city-screen-socket':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      };
    case 'city-screen-surface':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      };
    case 'city-mass':
    case 'city-plane':
    case 'city-tower':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts',
      };
    case 'ground-base':
    case 'ground-detail':
      return {
        safeEditSeam: 'src/modules/expo/runtime/world/WorldGroundLayout.ts',
        sourceFile: 'src/modules/expo/runtime/world/WorldGroundLayout.ts',
      };
    case 'mega-landmark':
      return {
        safeEditSeam: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
        sourceFile: 'src/modules/expo/runtime/world/WorldCityMegaLandmarks.tsx',
      };
    case 'stadium-screen-feed':
      return {
        safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
        sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
      };
    case 'stadium-screen-assignment':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenAssignmentPlan.ts',
      };
    case 'stadium-screen-socket':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSocketPlan.ts',
      };
    case 'stadium-screen-surface':
      return {
        safeEditSeam: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
        sourceFile: 'src/modules/expo/runtime/planning/screens/buildScreenSurfacePlan.ts',
      };
    case 'stadium-pavilion':
    case 'stadium-plane':
    case 'stadium-structure':
    case 'stadium-tower':
      return {
        safeEditSeam: 'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
        sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
      };
  }
}

export function buildZoneFixRoutes(args: {
  registryById: Record<string, WorldObjectRegistryEntry>;
  validation: ZoneReviewValidation;
  zone: ReviewOperatorZone;
}): ZoneFixRoute[] {
  const routes: ZoneFixRoute[] = [];

  for (const objectId of args.validation.missingExpectedObjectIds) {
    const entry = args.registryById[objectId];
    if (!entry) {
      continue;
    }

    routes.push({
      issue: 'missing-object',
      reason: `Expected object ${objectId} is not present in current zone context`,
      safeEditSeam: entry.safeEditSeam,
      sourceFile: entry.sourceFile,
      target: objectId,
    });
  }

  for (const layer of args.validation.missingExpectedLayers) {
    const route = buildLayerRoute(layer);
    routes.push({
      issue: 'missing-layer',
      reason: `Expected layer ${layer} is not present in current zone context`,
      safeEditSeam: route.safeEditSeam,
      sourceFile: route.sourceFile,
      target: layer,
    });
  }

  for (const objectId of args.validation.unknownExpectedObjectIds) {
    routes.push({
      issue: 'unknown-expected-object',
      reason: `Expected object ${objectId} is not present in registry and may indicate a stale zone recipe`,
      safeEditSeam: 'src/modules/expo/runtime/operator/model/reviewOperatorSession.ts',
      sourceFile: 'src/modules/expo/runtime/operator/model/reviewOperatorSession.ts',
      target: objectId,
    });
  }

  for (const objectId of args.validation.forbiddenObjectIdsPresent) {
    const entry = args.registryById[objectId];
    if (!entry) {
      continue;
    }

    routes.push({
      issue: 'forbidden-object',
      reason: `Object ${objectId} is visible in current zone context but the zone contract forbids it`,
      safeEditSeam: entry.safeEditSeam,
      sourceFile: entry.sourceFile,
      target: objectId,
    });
  }

  for (const layer of args.validation.forbiddenExpectedLayersPresent) {
    const route = buildLayerRoute(layer);
    routes.push({
      issue: 'forbidden-layer',
      reason: `Layer ${layer} is visible in current zone context but the zone contract forbids it`,
      safeEditSeam: route.safeEditSeam,
      sourceFile: route.sourceFile,
      target: layer,
    });
  }

  return routes;
}
