import { useEffect, useSyncExternalStore } from 'react';

type ActiveVideoScreenListener = () => void;

const activeVideoScreenIds = new Set<string>();
const listeners = new Set<ActiveVideoScreenListener>();

function emitActiveVideoScreenChange() {
  listeners.forEach((listener) => listener());
}

function subscribeActiveVideoScreens(listener: ActiveVideoScreenListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getExpoActiveVideoScreensCount() {
  return activeVideoScreenIds.size;
}

export function setExpoVideoScreenPlaybackActive(screenId: string, isActive: boolean) {
  const normalizedId = screenId.trim();
  if (!normalizedId) {
    return;
  }

  const hadScreen = activeVideoScreenIds.has(normalizedId);
  if (isActive && !hadScreen) {
    activeVideoScreenIds.add(normalizedId);
    emitActiveVideoScreenChange();
    return;
  }

  if (!isActive && hadScreen) {
    activeVideoScreenIds.delete(normalizedId);
    emitActiveVideoScreenChange();
  }
}

export function useExpoActiveVideoScreensCount() {
  return useSyncExternalStore(
    subscribeActiveVideoScreens,
    getExpoActiveVideoScreensCount,
    getExpoActiveVideoScreensCount,
  );
}

export function useExpoVideoScreenPlaybackRegistration(screenId: string, isActive: boolean) {
  useEffect(() => {
    setExpoVideoScreenPlaybackActive(screenId, isActive);

    return () => {
      setExpoVideoScreenPlaybackActive(screenId, false);
    };
  }, [isActive, screenId]);
}
