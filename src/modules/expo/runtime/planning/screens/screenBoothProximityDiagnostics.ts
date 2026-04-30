import type { ExpoBoothLocalFootprint } from '../../../../../shared/expo/lib/boothLocalFootprint';
import type { ExpoBoothPlacement } from '../../../../../shared/expo/layoutEngine';
import type { CityScreenSurface } from '../types';
import {
  hasFinitePositiveSizeTuple,
  hasFiniteTuple3,
  resolveYawAwareScreenSurfaceBounds,
} from './screenSurfaceFootprintBounds';

export type ScreenBoothProximityScreenCandidate = Pick<CityScreenSurface, 'id' | 'position' | 'role' | 'rotation' | 'size'>;
export type ScreenBoothProximityBoothCandidate = Pick<ExpoBoothPlacement, 'id' | 'localFootprint' | 'nodeType'>;

export type ScreenBoothProximityDiagnosticCode =
  | 'screen-booth-overlap'
  | 'screen-booth-proximity';

export type ScreenBoothProximityDiagnostic = {
  boothId: string;
  code: ScreenBoothProximityDiagnosticCode;
  details: {
    booth: string;
    distance: number;
    gapX: number;
    gapZ: number;
    screen: string;
  };
  message: string;
  screenId: string;
};

type XzBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

const PROXIMITY_THRESHOLD_XZ = 14;

function isWallFamilySurface(surface: ScreenBoothProximityScreenCandidate) {
  return surface.role === 'hero-wall' || surface.role === 'support-wall';
}

function resolveScreenBounds(surface: ScreenBoothProximityScreenCandidate) {
  if (!hasFiniteTuple3(surface.position) || !hasFiniteTuple3(surface.rotation) || !hasFinitePositiveSizeTuple(surface.size)) {
    return null;
  }

  return resolveYawAwareScreenSurfaceBounds(surface);
}

function resolveBoothBounds(localFootprint: ExpoBoothLocalFootprint | null | undefined): XzBounds | null {
  if (!localFootprint) {
    return null;
  }

  return localFootprint.worldBounds;
}

function measureAabbGap(a: XzBounds, b: XzBounds) {
  const gapX = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const gapZ = Math.max(0, Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ));

  return {
    distance: Math.hypot(gapX, gapZ),
    gapX,
    gapZ,
    overlaps: gapX === 0 && gapZ === 0,
    withinThreshold: gapX <= PROXIMITY_THRESHOLD_XZ && gapZ <= PROXIMITY_THRESHOLD_XZ,
  };
}

export function diagnoseScreenBoothProximity(args: {
  boothPlacements: readonly ScreenBoothProximityBoothCandidate[];
  screenSurfaces: readonly ScreenBoothProximityScreenCandidate[];
}): ScreenBoothProximityDiagnostic[] {
  const diagnostics: ScreenBoothProximityDiagnostic[] = [];

  args.screenSurfaces.forEach((surface) => {
    if (!isWallFamilySurface(surface)) {
      return;
    }

    const screenBounds = resolveScreenBounds(surface);
    if (!screenBounds) {
      return;
    }

    args.boothPlacements.forEach((booth) => {
      const boothBounds = resolveBoothBounds(booth.localFootprint);
      if (!boothBounds) {
        return;
      }

      const gap = measureAabbGap(screenBounds, boothBounds);
      if (!gap.overlaps && !gap.withinThreshold) {
        return;
      }

      diagnostics.push({
        boothId: booth.id,
        code: gap.overlaps ? 'screen-booth-overlap' : 'screen-booth-proximity',
        details: {
          booth: booth.id,
          distance: gap.distance,
          gapX: gap.gapX,
          gapZ: gap.gapZ,
          screen: surface.id,
        },
        message: gap.overlaps
          ? `Screen ${surface.id} overlaps booth ${booth.id} in conservative X/Z bounds.`
          : `Screen ${surface.id} is within ${PROXIMITY_THRESHOLD_XZ} units of booth ${booth.id} in conservative X/Z bounds.`,
        screenId: surface.id,
      });
    });
  });

  return diagnostics;
}
