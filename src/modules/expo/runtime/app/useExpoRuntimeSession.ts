import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExpoMode } from '../../state/expoRuntime';
import { resolveExpoOperatorSession } from '../operator';
import { isSalesDemoEnabled } from '../salesDemo/salesDemoFlags';

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
  const [mode, setModeState] = useState<ExpoMode>(() => (operatorSession.enabled || salesDemoEnabled ? 'fly' : 'menu'));
  const [mobileMoveIntent, setMobileMoveIntent] = useState<ExpoMobileMoveIntent>(EXPO_MOBILE_MOVE_IDLE);
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice());
  const setMode = useCallback((nextMode: ExpoMode) => {
    setMobileMoveIntent(EXPO_MOBILE_MOVE_IDLE);
    setModeState(nextMode);
  }, []);

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
