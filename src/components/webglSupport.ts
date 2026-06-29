import { useMemo } from 'react';

export type WebGLSupportResult = {
  available: boolean;
  mode: 'webgl2' | 'webgl1' | null;
  reason: string | null;
};

function shouldForceWebGLUnsupported() {
  if (typeof window === 'undefined') {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('forceWebGLUnsupported') === '1' || params.get('webgl') === '0';
}

function tryGetWebGLContext(canvas: HTMLCanvasElement, type: 'webgl2' | 'webgl' | 'experimental-webgl') {
  try {
    return canvas.getContext(type);
  } catch {
    return null;
  }
}

export function detectWebGLSupport(): WebGLSupportResult {
  if (shouldForceWebGLUnsupported()) {
    return { available: false, mode: null, reason: 'WebGL fallback was requested for this session.' };
  }

  if (typeof document === 'undefined') {
    return { available: false, mode: null, reason: 'Browser rendering is not available.' };
  }

  const canvas = document.createElement('canvas');
  const webgl2 = tryGetWebGLContext(canvas, 'webgl2');
  if (webgl2) {
    return { available: true, mode: 'webgl2', reason: null };
  }

  const webgl1 = tryGetWebGLContext(canvas, 'webgl') || tryGetWebGLContext(canvas, 'experimental-webgl');
  if (webgl1) {
    return { available: true, mode: 'webgl1', reason: null };
  }

  return {
    available: false,
    mode: null,
    reason: 'WebGL is disabled or unavailable on this browser/device.',
  };
}

export function useWebGLSupport(): WebGLSupportResult {
  return useMemo(() => detectWebGLSupport(), []);
}
