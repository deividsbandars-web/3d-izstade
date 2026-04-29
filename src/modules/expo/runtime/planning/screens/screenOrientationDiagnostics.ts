import type { CityScreenSurface } from '../types';
import { classifyPlanningZone, getZoneRule } from '../zones/shared';

export type ScreenOrientationDiagnosticCategory =
  | 'missing-rotation'
  | 'missing-section-metadata'
  | 'viewer-facing-conflict';

export type ScreenOrientationDiagnostic = {
  category: ScreenOrientationDiagnosticCategory;
  message: string;
  screenId: string;
  viewerFacing: ReturnType<typeof getZoneRule>['viewerFacing'];
  zoneId: ReturnType<typeof classifyPlanningZone>;
};

const LEFT_RIGHT_YAW_TOLERANCE = 0.05;

function normalizeYaw(yaw: number) {
  let normalized = yaw;
  while (normalized <= -Math.PI) {
    normalized += Math.PI * 2;
  }
  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }
  return normalized;
}

function hasFiniteYaw(surface: CityScreenSurface) {
  return Array.isArray(surface.rotation) && Number.isFinite(surface.rotation[1]);
}

function resolveOrientationZone(surface: CityScreenSurface) {
  if (surface.sections?.includes('left')) {
    return 'left-district' as const;
  }

  if (surface.sections?.includes('right')) {
    return 'right-district' as const;
  }

  if (surface.sections?.includes('arrival')) {
    return 'arrival' as const;
  }

  return classifyPlanningZone(surface.position);
}

export function diagnoseScreenOrientation(
  surfaces: CityScreenSurface[],
): ScreenOrientationDiagnostic[] {
  const diagnostics: ScreenOrientationDiagnostic[] = [];

  surfaces.forEach((surface) => {
    const zoneId = resolveOrientationZone(surface);
    const zoneRule = getZoneRule(zoneId);

    if (!hasFiniteYaw(surface)) {
      diagnostics.push({
        category: 'missing-rotation',
        message: `Screen ${surface.id} is missing a finite yaw rotation.`,
        screenId: surface.id,
        viewerFacing: zoneRule.viewerFacing,
        zoneId,
      });
      return;
    }

    if (!surface.sections || surface.sections.length === 0) {
      diagnostics.push({
        category: 'missing-section-metadata',
        message: `Screen ${surface.id} has no section metadata for orientation reasoning.`,
        screenId: surface.id,
        viewerFacing: zoneRule.viewerFacing,
        zoneId,
      });
    }

    const yaw = normalizeYaw(surface.rotation[1] ?? 0);

    if (zoneId === 'left-district' && yaw < -LEFT_RIGHT_YAW_TOLERANCE) {
      diagnostics.push({
        category: 'viewer-facing-conflict',
        message: `Screen ${surface.id} is in left-district but yaw ${yaw.toFixed(2)} turns away from inward-facing expectation.`,
        screenId: surface.id,
        viewerFacing: zoneRule.viewerFacing,
        zoneId,
      });
    }

    if (zoneId === 'right-district' && yaw > LEFT_RIGHT_YAW_TOLERANCE) {
      diagnostics.push({
        category: 'viewer-facing-conflict',
        message: `Screen ${surface.id} is in right-district but yaw ${yaw.toFixed(2)} turns away from inward-facing expectation.`,
        screenId: surface.id,
        viewerFacing: zoneRule.viewerFacing,
        zoneId,
      });
    }
  });

  return diagnostics;
}
