import { diagnoseScreenOrientation } from '../../planning/screens/screenOrientationDiagnostics';
import { diagnoseScreenBoothProximity } from '../../planning/screens/screenBoothProximityDiagnostics';
import { diagnoseScreenSurfaceBounds } from '../../planning/screens/screenSurfaceBoundsDiagnostics';
import { diagnoseScreenSurfaceOverlaps } from '../../planning/screens/screenSurfaceOverlapDiagnostics';
import type { CanonicalWorldPlan, CityScreenSurface } from '../../planning/types';
import {
  diagnoseBoothFrontality,
  type BoothFrontalityPlacement,
} from '../../../../../shared/expo/lib/boothFrontalityDiagnostics';
import type { ExpoBoothPlacement } from '../../../../../shared/expo/layoutEngine';

export type WorldDiagnosticReport = ReturnType<typeof buildWorldDiagnosticReport>;

export function buildWorldDiagnosticReport(args: {
  boothPlacements: Array<BoothFrontalityPlacement & Pick<ExpoBoothPlacement, 'localFootprint'>>;
  screenSurfaces: CityScreenSurface[];
}) {
  const screenOrientation = diagnoseScreenOrientation(args.screenSurfaces);
  const screenBounds = diagnoseScreenSurfaceBounds(args.screenSurfaces);
  const screenOverlaps = diagnoseScreenSurfaceOverlaps(args.screenSurfaces);
  const screenBoothProximity = diagnoseScreenBoothProximity({
    boothPlacements: args.boothPlacements,
    screenSurfaces: args.screenSurfaces,
  });
  const boothFrontality = diagnoseBoothFrontality(args.boothPlacements);

  const allWarnings = [
    ...screenOrientation.map((entry) => ({ code: entry.category, family: 'screen-orientation' as const, id: entry.screenId, message: entry.message })),
    ...screenBounds.map((entry) => ({ code: entry.code, family: 'screen-bounds' as const, id: entry.screenId, message: entry.message })),
    ...screenOverlaps.map((entry) => ({ code: entry.code, family: 'screen-overlap' as const, id: `${entry.surfaceA}:${entry.surfaceB}`, message: entry.message })),
    ...screenBoothProximity.map((entry) => ({ code: entry.code, family: 'screen-booth-proximity' as const, id: `${entry.screenId}:${entry.boothId}`, message: entry.message })),
    ...boothFrontality.map((entry) => ({ code: entry.code, family: 'booth-frontality' as const, id: entry.boothId, message: entry.message })),
  ];

  return {
    booths: {
      frontality: boothFrontality,
      frontalityCount: boothFrontality.length,
    },
    screens: {
      bounds: screenBounds,
      boundsCount: screenBounds.length,
      boothProximity: screenBoothProximity,
      boothProximityCount: screenBoothProximity.length,
      orientation: screenOrientation,
      orientationCount: screenOrientation.length,
      overlapCount: screenOverlaps.length,
      overlaps: screenOverlaps,
    },
    summary: {
      familiesWithWarnings: [
        screenOrientation.length > 0 ? 'screen-orientation' : null,
        screenBounds.length > 0 ? 'screen-bounds' : null,
        screenOverlaps.length > 0 ? 'screen-overlap' : null,
        screenBoothProximity.length > 0 ? 'screen-booth-proximity' : null,
        boothFrontality.length > 0 ? 'booth-frontality' : null,
      ].filter(Boolean),
      totalWarnings: allWarnings.length,
      warnings: allWarnings,
    },
  };
}

export function buildWorldDiagnosticReportFromPlan(args: {
  boothPlacements: Array<BoothFrontalityPlacement & Pick<ExpoBoothPlacement, 'localFootprint'>>;
  plan: Pick<CanonicalWorldPlan, 'filteredScreenSurfaces'>;
}) {
  return buildWorldDiagnosticReport({
    boothPlacements: args.boothPlacements,
    screenSurfaces: args.plan.filteredScreenSurfaces,
  });
}
