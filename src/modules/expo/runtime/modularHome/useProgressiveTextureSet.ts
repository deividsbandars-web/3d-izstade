import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as THREE from 'three';

type TextureSetEntry = {
  failed: boolean;
  listeners: Set<() => void>;
  promise: Promise<void> | null;
  textures: THREE.Texture[] | null;
};

const textureLoader = new THREE.TextureLoader();
const textureSetCache = new Map<string, TextureSetEntry>();

function getTextureSetEntry(paths: readonly string[]) {
  const key = paths.join('\u0000');
  let entry = textureSetCache.get(key);

  if (!entry) {
    entry = {
      failed: false,
      listeners: new Set(),
      promise: null,
      textures: null,
    };
    textureSetCache.set(key, entry);
  }

  return { entry, key };
}

function notify(entry: TextureSetEntry) {
  entry.listeners.forEach((listener) => listener());
}

function loadTextureSet(entry: TextureSetEntry, paths: readonly string[]) {
  if (entry.promise || entry.textures || entry.failed) {
    return;
  }

  entry.promise = Promise.all(paths.map((path) => textureLoader.loadAsync(path)))
    .then((textures) => {
      entry.textures = textures;
      notify(entry);
    })
    .catch((error: unknown) => {
      entry.failed = true;
      console.warn('[gala-textures] Progressive texture set failed; keeping material fallback.', error);
      notify(entry);
    })
    .finally(() => {
      entry.promise = null;
    });
}

export function useProgressiveTextureSet(paths: readonly string[]) {
  const { entry, key } = getTextureSetEntry(paths);
  const subscribe = useCallback((listener: () => void) => {
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
    };
  }, [entry]);
  const getSnapshot = useCallback(() => entry.textures, [entry]);
  const textures = useSyncExternalStore(subscribe, getSnapshot, () => null);

  useEffect(() => {
    const current = getTextureSetEntry(paths).entry;
    loadTextureSet(current, paths);
  }, [key, paths]);

  return textures;
}
