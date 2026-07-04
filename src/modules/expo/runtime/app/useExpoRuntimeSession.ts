import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExpoMode } from '../../state/expoRuntime';
import { resolveExpoOperatorSession } from '../operator';
import { isSalesDemoEnabled } from '../salesDemo/salesDemoFlags';
import { isBoothProductPreviewEnabled } from '../boothProduct/boothProductPreviewFlags';
import { isHomeDemoEnabled, isHomeStudioEnabled } from '../modularHome/homeDemoFlags';
import { isHomeUploadPreviewEnabled, isHomeUploadPreviewRequested } from '../modularHome/homeUploadPreviewFlags';

export type ExpoMobileMoveIntent = {
  b: boolean;
  f: boolean;
  jump: boolean;
  l: boolean;
  lift: boolean;
  lookX: number;
  lookY: number;
  r: boolean;
  s: boolean;
  turnL: boolean;
  turnR: boolean;
};

export const EXPO_MOBILE_MOVE_IDLE: ExpoMobileMoveIntent = {
  b: false,
  f: false,
  jump: false,
  l: false,
  lift: false,
  lookX: 0,
  lookY: 0,
  r: false,
  s: false,
  turnL: false,
  turnR: false,
};

function detectTouchDevice() {
  if (typeof window === 'undefined') {
    return false;
  }

  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)').matches ?? false;
  const maxTouchPoints = navigator.maxTouchPoints > 0;
  const touchStart = 'ontouchstart' in window;
  const mobileUA = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

  return coarsePointer || noHover || maxTouchPoints || touchStart || mobileUA;
}

export function useExpoRuntimeSession() {
  const operatorSession = useMemo(() => resolveExpoOperatorSession(), []);
  const salesDemoEnabled = useMemo(() => isSalesDemoEnabled(), []);
  const homeDemoEnabled = useMemo(() => isHomeDemoEnabled(), []);
  const homeStudioEnabled = useMemo(() => isHomeStudioEnabled(), []);
  const homeUploadPreviewRequested = useMemo(() => isHomeUploadPreviewRequested(), []);
  const homeUploadPreviewEnabled = useMemo(() => isHomeUploadPreviewEnabled(), []);
  const boothProductPreviewEnabled = useMemo(() => isBoothProductPreviewEnabled(), []);
  const communityQaEnabled = useMemo(() => (
    import.meta.env.DEV
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('communityQa') === '1'
  ), []);
  const previewSessionEnabled = salesDemoEnabled || boothProductPreviewEnabled || homeDemoEnabled || homeUploadPreviewRequested;
  const [mode, setModeState] = useState<ExpoMode>(() => {
    if (operatorSession.enabled) {
      return 'fly';
    }

    if (homeStudioEnabled) {
      return 'walk';
    }

    if (communityQaEnabled) {
      return 'walk';
    }

    if (salesDemoEnabled || homeDemoEnabled || homeUploadPreviewRequested) {
      return 'walk';
    }

    return previewSessionEnabled ? 'fly' : 'menu';
  });
  const [mobileMoveIntent, setMobileMoveIntent] = useState<ExpoMobileMoveIntent>(EXPO_MOBILE_MOVE_IDLE);
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice());
  const setMode = useCallback((nextMode: ExpoMode) => {
    setMobileMoveIntent(EXPO_MOBILE_MOVE_IDLE);
    setModeState(homeStudioEnabled && nextMode === 'fly' ? 'walk' : nextMode);
  }, [homeStudioEnabled]);

  const initialUrlFocus = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('focus');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const refreshTouchDevice = () => setIsTouchDevice(detectTouchDevice());
    refreshTouchDevice();
    window.addEventListener('resize', refreshTouchDevice);

    return () => {
      window.removeEventListener('resize', refreshTouchDevice);
    };
  }, []);

  return {
    initialUrlFocus,
    boothProductPreviewEnabled,
    homeDemoEnabled,
    homeUploadPreviewEnabled,
    homeUploadPreviewRequested,
    isTouchDevice,
    mobileMoveIntent,
    mode,
    operatorSession,
    salesDemoEnabled,
    setIsTouchDevice,
    setMobileMoveIntent,
    setMode,
  };
}
