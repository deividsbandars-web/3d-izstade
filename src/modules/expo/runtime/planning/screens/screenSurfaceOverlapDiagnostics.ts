import type { CityScreenSurface } from '../types';
import {
  hasFinitePositiveSizeTuple,
  hasFiniteTuple3,
  resolveYawAwareScreenSurfaceBounds,
} from './screenSurfaceFootprintBounds';

export type ScreenSurfaceOverlapCandidate = Pick<CityScreenSurface, 'id' | 'position' | 'rotation' | 'size'>;

export type ScreenSurfaceOverlapDiagnosticCode = 'screen-screen-overlap';

export type ScreenSurfaceOverlapDiagnostic = {
  code: ScreenSurfaceOverlapDiagnosticCode;
  details: {
    overlapX: number;
    overlapZ: number;
    surfaceA: string;
    surfaceB: string;
  };
  message: string;
  surfaceA: string;
  surfaceB: string;
};

type XzBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

function resolveBounds(surface: ScreenSurfaceOverlapCandidate) {
  if (!hasFiniteTuple3(surface.position) || !hasFiniteTuple3(surface.rotation) || !hasFinitePositiveSizeTuple(surface.size)) {
    return null;
  }

  return resolveYawAwareScreenSurfaceBounds(surface);
}

function measurePositiveOverlap(a: XzBounds, b: XzBounds) {
  const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);

  return {
    overlapX,
    overlapZ,
    overlaps: overlapX > 0 && overlapZ > 0,
  };
}

export function diagnoseScreenSurfaceOverlaps(
  surfaces: readonly ScreenSurfaceOverlapCandidate[],
): ScreenSurfaceOverlapDiagnostic[] {
  const diagnostics: ScreenSurfaceOverlapDiagnostic[] = [];

  for (let index = 0; index < surfaces.length; index += 1) {
    const surfaceA = surfaces[index];
    const boundsA = resolveBounds(surfaceA);
    if (!boundsA) {
      continue;
    }

    for (let compareIndex = index + 1; compareIndex < surfaces.length; compareIndex += 1) {
      const surfaceB = surfaces[compareIndex];
      const boundsB = resolveBounds(surfaceB);
      if (!boundsB) {
        continue;
      }

      const overlap = measurePositiveOverlap(boundsA, boundsB);
      if (!overlap.overlaps) {
        continue;
      }

      diagnostics.push({
        code: 'screen-screen-overlap',
        details: {
          overlapX: overlap.overlapX,
          overlapZ: overlap.overlapZ,
          surfaceA: surfaceA.id,
          surfaceB: surfaceB.id,
        },
        message: `Screens ${surfaceA.id} and ${surfaceB.id} overlap in conservative X/Z AABB bounds.`,
        surfaceA: surfaceA.id,
        surfaceB: surfaceB.id,
      });
    }
  }

  return diagnostics;
}
