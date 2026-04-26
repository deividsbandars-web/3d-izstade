import { useEffect, useMemo, useState } from 'react';
import type { ExpoMode } from '../../state/expoRuntime';
import { resolveExpoOperatorSession } from '../operator';

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
  const [mode, setMode] = useState<ExpoMode>(() => (operatorSession.enabled ? 'fly' : 'menu'));
  const [mobileMoveIntent, setMobileMoveIntent] = useState({ f: false, b: false, l: false, r: false, s: false });
  const [isTouchDevice, setIsTouchDevice] = useState(() => detectTouchDevice());

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
    setIsTouchDevice,
    setMobileMoveIntent,
    setMode,
  };
}
