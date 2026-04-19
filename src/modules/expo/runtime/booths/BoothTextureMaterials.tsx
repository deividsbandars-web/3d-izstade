import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolveExpoTextureCandidateUrls } from '../../lib/expoTexturePipeline';

function loadTextureWithCandidateUrls(loader: THREE.TextureLoader, urls: string[]) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    const queue = [...urls];

    const tryNext = () => {
      const nextUrl = queue.shift();
      if (!nextUrl) {
        reject(new Error(`Could not load any texture candidate: ${urls.join(', ')}`));
        return;
      }

      loader.load(nextUrl, resolve, undefined, () => {
        tryNext();
      });
    };

    tryNext();
  });
}

const EXPO_TEXTURE_CACHE = new Map<string, THREE.Texture | null>();
const EXPO_TEXTURE_PROMISE_CACHE = new Map<string, Promise<THREE.Texture | null>>();

function loadCachedExpoTexture(url: string) {
  const cachedTexture = EXPO_TEXTURE_CACHE.get(url);
  if (cachedTexture !== undefined) {
    return Promise.resolve(cachedTexture);
  }

  const cachedPromise = EXPO_TEXTURE_PROMISE_CACHE.get(url);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loader = new THREE.TextureLoader();
  const candidateUrls = resolveExpoTextureCandidateUrls(url);
  const promise = loadTextureWithCandidateUrls(loader, candidateUrls)
    .then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      EXPO_TEXTURE_CACHE.set(url, texture);
      EXPO_TEXTURE_PROMISE_CACHE.delete(url);
      return texture;
    })
    .catch(() => {
      EXPO_TEXTURE_CACHE.set(url, null);
      EXPO_TEXTURE_PROMISE_CACHE.delete(url);
      return null;
    });

  EXPO_TEXTURE_PROMISE_CACHE.set(url, promise);
  return promise;
}

export function SponsorTextureSurface({
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  url,
}: {
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  url: string;
}) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    loadCachedExpoTexture(url)
      .then((texture) => {
        if (!isActive) {
          return;
        }
        setMappedTexture(texture);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setMappedTexture(null);
      });

    return () => {
      isActive = false;
    };
  }, [url]);

  return (
    <meshStandardMaterial
      color={fallbackColor}
      emissive={emissiveColor ?? '#000000'}
      emissiveIntensity={mappedTexture ? emissiveIntensity : 0}
      map={mappedTexture ?? undefined}
      metalness={0.02}
      roughness={0.42}
      transparent
      opacity={opacity}
      toneMapped={false}
    />
  );
}

export function ScreenTextureMaterial({ fallbackColor, url }: { fallbackColor: string; url: string }) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let isActive = true;
    loadCachedExpoTexture(url)
      .then((texture) => {
        if (!isActive) {
          return;
        }
        setMappedTexture(texture);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setMappedTexture(null);
      });

    return () => {
      isActive = false;
    };
  }, [url]);

  return <meshBasicMaterial color={fallbackColor} map={mappedTexture ?? undefined} toneMapped={false} />;
}
