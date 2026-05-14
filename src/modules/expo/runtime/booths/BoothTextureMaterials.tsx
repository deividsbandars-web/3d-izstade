import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolveExpoTextureCandidateUrls } from '../../lib/expoTexturePipeline';

const GENERATED_BILLBOARD_PREFIX = 'generated-billboard:';

type GeneratedBillboardPayload = {
  accentColor?: string;
  chip?: string;
  label?: string;
  subtitle?: string;
  tier?: string;
  tierAccent?: string;
};

function parseGeneratedBillboardPayload(url: string): GeneratedBillboardPayload | null {
  if (!url.startsWith(GENERATED_BILLBOARD_PREFIX)) {
    return null;
  }

  try {
    const rawPayload = decodeURIComponent(url.slice(GENERATED_BILLBOARD_PREFIX.length));
    return JSON.parse(rawPayload) as GeneratedBillboardPayload;
  } catch {
    return null;
  }
}

function drawBillboardText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: string,
  color: string
) {
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'top';

  let value = text;
  while (value.length > 0 && context.measureText(value).width > maxWidth) {
    value = `${value.slice(0, Math.max(0, value.length - 4)).trim()}...`;
  }

  context.fillText(value, x, y);
}

function createGeneratedBillboardTexture(url: string) {
  const payload = parseGeneratedBillboardPayload(url);
  if (!payload || typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1280;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const accentColor = payload.accentColor || '#2563eb';
  const tierAccent = payload.tierAccent || '#93c5fd';

  context.fillStyle = '#07101b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 0.86;
  context.fillStyle = accentColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(7, 16, 27, 0.34)';
  context.roundRect(34, 34, 832, 1212, 18);
  context.fill();

  context.fillStyle = 'rgba(248, 250, 252, 0.18)';
  context.roundRect(78, 128, 744, 310, 16);
  context.fill();

  context.fillStyle = tierAccent;
  context.globalAlpha = 0.74;
  context.roundRect(78, 846, 540, 30, 15);
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(248, 250, 252, 0.32)';
  context.fillRect(78, 900, 704, 5);
  context.fillStyle = 'rgba(248, 250, 252, 0.22)';
  context.fillRect(78, 932, 612, 5);

  drawBillboardText(context, payload.chip || 'DISTRICT ARRAY', 92, 108, 720, '800 42px Verdana, Arial, sans-serif', tierAccent);
  drawBillboardText(context, payload.label || 'EXPO PARTNER', 92, 548, 720, '900 98px Verdana, Arial, sans-serif', '#ffffff');
  drawBillboardText(context, `${payload.tier || 'PREMIUM'} PARTNER`, 92, 642, 640, '800 44px Verdana, Arial, sans-serif', '#dbeafe');
  drawBillboardText(context, payload.subtitle || 'EXPO SPONSOR FRONTAGE', 92, 1122, 690, '700 36px Verdana, Arial, sans-serif', '#e2e8f0');

  context.globalAlpha = 0.88;
  context.fillStyle = tierAccent;
  context.beginPath();
  context.arc(784, 1084, 52, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.22;
  context.strokeStyle = '#f8fafc';
  context.lineWidth = 8;
  context.beginPath();
  context.arc(784, 1084, 82, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

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

  const generatedTexture = createGeneratedBillboardTexture(url);
  if (generatedTexture) {
    EXPO_TEXTURE_CACHE.set(url, generatedTexture);
    return Promise.resolve(generatedTexture);
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
  depthWrite,
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  url,
}: {
  depthWrite?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  url: string;
}) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);
  const isGeneratedBillboard = url.startsWith(GENERATED_BILLBOARD_PREFIX);

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

  if (mappedTexture && isGeneratedBillboard) {
    return (
      <meshBasicMaterial
        depthWrite={depthWrite ?? opacity >= 0.999}
        map={mappedTexture}
        polygonOffset
        polygonOffsetFactor={-5}
        polygonOffsetUnits={-5}
        transparent={opacity < 0.999}
        opacity={opacity}
        toneMapped={false}
      />
    );
  }

  return (
    <meshStandardMaterial
      color={fallbackColor}
      depthWrite={depthWrite ?? opacity >= 0.999}
      emissive={emissiveColor ?? '#000000'}
      emissiveIntensity={mappedTexture ? emissiveIntensity : Math.min(emissiveIntensity, 0.12)}
      map={mappedTexture ?? undefined}
      metalness={0.02}
      polygonOffset
      polygonOffsetFactor={-5}
      polygonOffsetUnits={-5}
      roughness={0.42}
      transparent={opacity < 0.999}
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
