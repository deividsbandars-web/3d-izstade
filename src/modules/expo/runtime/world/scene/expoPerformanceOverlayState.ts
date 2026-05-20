export type ExpoPerformanceOverlayMetrics = {
  devicePixelRatio: number | null;
  drawCalls: number | null;
  fps: number | null;
  frameMs: number | null;
  geometries: number | null;
  rendererDpr: number | null;
  textures: number | null;
  triangles: number | null;
};

function normalizeBooleanFlag(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function shouldEnableExpoPerformanceOverlay() {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  if (normalizeBooleanFlag(params.get('perf'))) {
    return true;
  }

  try {
    return normalizeBooleanFlag(window.localStorage.getItem('warpala.expoPerfOverlay'));
  } catch {
    return false;
  }
}
