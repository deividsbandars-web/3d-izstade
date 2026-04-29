import type { CityScreenSurface } from '../types';
import {
  hasFinitePositiveSizeTuple,
  hasFiniteTuple3,
  resolveYawAwareScreenSurfaceBounds,
} from './screenSurfaceFootprintBounds';

export type ScreenSurfaceBoundsCandidate = Pick<CityScreenSurface, 'id' | 'position' | 'rotation' | 'size'>;

export type ScreenSurfaceBoundsDiagnosticCode =
  | 'missing-position'
  | 'non-finite-position'
  | 'missing-size'
  | 'non-finite-size'
  | 'non-positive-size'
  | 'missing-rotation'
  | 'non-finite-rotation'
  | 'out-of-bounds-xz';

export type ScreenSurfaceBoundsDiagnostic = {
  code: ScreenSurfaceBoundsDiagnosticCode;
  details?: {
    maxX?: number;
    maxZ?: number;
    minX?: number;
    minZ?: number;
  };
  message: string;
  screenId: string;
};

export type ScreenSurfaceBoundsEnvelope = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

const DEFAULT_SCREEN_SURFACE_BOUNDS_ENVELOPE: ScreenSurfaceBoundsEnvelope = {
  maxX: 2600,
  maxZ: 800,
  minX: -2600,
  minZ: -7600,
};

function hasTuple3(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length >= 3;
}

function hasSizeTuple(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length >= 3;
}

function isOutOfBounds(
  surface: ScreenSurfaceBoundsCandidate,
  envelope: ScreenSurfaceBoundsEnvelope,
) {
  const { minX, maxX, minZ, maxZ } = resolveYawAwareScreenSurfaceBounds(surface);

  return {
    maxX,
    maxZ,
    minX,
    minZ,
    outOfBounds: minX < envelope.minX || maxX > envelope.maxX || minZ < envelope.minZ || maxZ > envelope.maxZ,
  };
}

export function diagnoseScreenSurfaceBounds(
  surfaces: readonly ScreenSurfaceBoundsCandidate[],
  envelope: ScreenSurfaceBoundsEnvelope = DEFAULT_SCREEN_SURFACE_BOUNDS_ENVELOPE,
): ScreenSurfaceBoundsDiagnostic[] {
  const diagnostics: ScreenSurfaceBoundsDiagnostic[] = [];

  surfaces.forEach((surface) => {
    if (!hasTuple3(surface.position)) {
      diagnostics.push({
        code: 'missing-position',
        message: `Screen ${surface.id} is missing a position tuple.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasFiniteTuple3(surface.position)) {
      diagnostics.push({
        code: 'non-finite-position',
        message: `Screen ${surface.id} is missing a finite position tuple.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasSizeTuple(surface.size)) {
      diagnostics.push({
        code: 'missing-size',
        message: `Screen ${surface.id} is missing a size tuple.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasFiniteTuple3(surface.size)) {
      diagnostics.push({
        code: 'non-finite-size',
        message: `Screen ${surface.id} is missing a finite size tuple.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasFinitePositiveSizeTuple(surface.size)) {
      diagnostics.push({
        code: 'non-positive-size',
        message: `Screen ${surface.id} has a non-positive size component.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasTuple3(surface.rotation)) {
      diagnostics.push({
        code: 'missing-rotation',
        message: `Screen ${surface.id} is missing a rotation tuple.`,
        screenId: surface.id,
      });
      return;
    }

    if (!hasFiniteTuple3(surface.rotation)) {
      diagnostics.push({
        code: 'non-finite-rotation',
        message: `Screen ${surface.id} is missing a finite rotation tuple.`,
        screenId: surface.id,
      });
      return;
    }

    const bounds = isOutOfBounds(surface, envelope);
    if (bounds.outOfBounds) {
      diagnostics.push({
        code: 'out-of-bounds-xz',
        details: {
          maxX: bounds.maxX,
          maxZ: bounds.maxZ,
          minX: bounds.minX,
          minZ: bounds.minZ,
        },
        message: `Screen ${surface.id} falls outside the conservative X/Z city envelope.`,
        screenId: surface.id,
      });
    }
  });

  return diagnostics;
}
