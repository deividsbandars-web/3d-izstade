import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolveExpoTextureCandidateUrls } from '../../lib/expoTexturePipeline';

const GENERATED_BILLBOARD_PREFIX = 'generated-billboard:';

type GeneratedBillboardPayload = {
  accentColor?: string;
  aspect?: number;
  chip?: string;
  label?: string;
  subtitle?: string;
  tier?: string;
  tierAccent?: string;
};

export function buildGeneratedBillboardTextureUrl(payload: GeneratedBillboardPayload) {
  return `${GENERATED_BILLBOARD_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

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

function configureExpoTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = Math.max(texture.anisotropy || 1, 8);
  texture.needsUpdate = true;
  return texture;
}

function resolveGeneratedBillboardCanvasSize(aspect: number | undefined) {
  const normalizedAspect = Number.isFinite(aspect) && aspect ? Math.max(0.35, Math.min(4.5, aspect)) : 0.7;

  if (normalizedAspect >= 2.15) {
    return { height: 512, width: 2048 };
  }

  if (normalizedAspect >= 1.12) {
    return { height: 1024, width: 2048 };
  }

  if (normalizedAspect >= 0.86) {
    return { height: 1024, width: 1024 };
  }

  return { height: 2048, width: 1024 };
}

function createGeneratedBillboardTexture(url: string) {
  const payload = parseGeneratedBillboardPayload(url);
  if (!payload || typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  const canvasSize = resolveGeneratedBillboardCanvasSize(payload.aspect);
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const accentColor = payload.accentColor || '#2563eb';
  const tierAccent = payload.tierAccent || '#93c5fd';
  const width = canvas.width;
  const height = canvas.height;
  const shortSide = Math.min(width, height);
  const pad = Math.max(34, shortSide * 0.068);
  const isLandscape = width > height * 1.08;
  const isUltraWide = width > height * 2.4;
  const font = (weight: number, size: number) => `${weight} ${Math.round(size)}px Verdana, Arial, sans-serif`;

  context.fillStyle = '#07101b';
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 0.86;
  context.fillStyle = accentColor;
  context.fillRect(0, 0, width, height);
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(7, 16, 27, 0.34)';
  context.beginPath();
  context.roundRect(pad * 0.48, pad * 0.48, width - pad * 0.96, height - pad * 0.96, Math.max(18, shortSide * 0.028));
  context.fill();

  if (isLandscape) {
    const contentTop = height * (isUltraWide ? 0.26 : 0.3);
    const titleSize = height * (isUltraWide ? 0.28 : 0.24);
    const chipSize = height * (isUltraWide ? 0.09 : 0.075);
    const tierSize = height * (isUltraWide ? 0.105 : 0.082);
    const subtitleSize = height * (isUltraWide ? 0.08 : 0.066);

    context.fillStyle = 'rgba(248, 250, 252, 0.17)';
    context.beginPath();
    context.roundRect(pad, height * 0.14, width - pad * 2, height * (isUltraWide ? 0.54 : 0.48), Math.max(18, shortSide * 0.035));
    context.fill();

    drawBillboardText(context, payload.chip || 'DISTRICT ARRAY', pad * 1.22, height * 0.08, width - pad * 2.44, font(800, chipSize), tierAccent);
    drawBillboardText(context, payload.label || 'EXPO PARTNER', pad * 1.22, contentTop, width - pad * 2.44, font(900, titleSize), '#ffffff');
    drawBillboardText(context, `${payload.tier || 'PREMIUM'} PARTNER`, pad * 1.22, contentTop + titleSize * 0.92, width * 0.52, font(800, tierSize), '#dbeafe');
    drawBillboardText(context, payload.subtitle || 'EXPO SPONSOR FRONTAGE', width * 0.52, height * 0.8, width * 0.36, font(700, subtitleSize), '#e2e8f0');

    return configureExpoTexture(new THREE.CanvasTexture(canvas));
  }

  context.fillStyle = 'rgba(248, 250, 252, 0.18)';
  context.beginPath();
  context.roundRect(pad, height * 0.1, width - pad * 2, height * 0.24, Math.max(16, shortSide * 0.024));
  context.fill();

  drawBillboardText(context, payload.chip || 'DISTRICT ARRAY', pad * 1.18, height * 0.084, width - pad * 2.36, font(800, height * 0.033), tierAccent);
  drawBillboardText(context, payload.label || 'EXPO PARTNER', pad * 1.18, height * 0.428, width - pad * 2.36, font(900, height * 0.076), '#ffffff');
  drawBillboardText(context, `${payload.tier || 'PREMIUM'} PARTNER`, pad * 1.18, height * 0.502, width - pad * 2.7, font(800, height * 0.034), '#dbeafe');
  drawBillboardText(context, payload.subtitle || 'EXPO SPONSOR FRONTAGE', pad * 1.18, height * 0.876, width - pad * 2.5, font(700, height * 0.028), '#e2e8f0');

  return configureExpoTexture(new THREE.CanvasTexture(canvas));
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

function resolveGeneratedBillboardTextureSync(url: string) {
  if (!url.startsWith(GENERATED_BILLBOARD_PREFIX)) {
    return null;
  }

  const cachedTexture = EXPO_TEXTURE_CACHE.get(url);
  if (cachedTexture !== undefined) {
    return cachedTexture;
  }

  const generatedTexture = createGeneratedBillboardTexture(url);
  if (generatedTexture) {
    EXPO_TEXTURE_CACHE.set(url, generatedTexture);
    return generatedTexture;
  }

  return null;
}

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
      EXPO_TEXTURE_CACHE.set(url, configureExpoTexture(texture));
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
  doubleSided = false,
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  url,
}: {
  depthWrite?: boolean;
  doubleSided?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  url: string;
}) {
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(() => resolveGeneratedBillboardTextureSync(url));
  const isGeneratedBillboard = url.startsWith(GENERATED_BILLBOARD_PREFIX);
  const side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

  useEffect(() => {
    if (isGeneratedBillboard) {
      setMappedTexture(resolveGeneratedBillboardTextureSync(url));
      return;
    }

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
  }, [isGeneratedBillboard, url]);

  if (mappedTexture) {
    return (
      <meshBasicMaterial
        depthWrite={depthWrite ?? opacity >= 0.999}
        map={mappedTexture}
        polygonOffset
        polygonOffsetFactor={-5}
        polygonOffsetUnits={-5}
        transparent={opacity < 0.999}
        opacity={opacity}
        side={side}
        toneMapped={false}
      />
    );
  }

  return (
    <meshStandardMaterial
      color={mappedTexture ? '#ffffff' : fallbackColor}
      depthWrite={depthWrite ?? opacity >= 0.999}
      emissive={emissiveColor ?? '#000000'}
      emissiveIntensity={mappedTexture ? emissiveIntensity : Math.min(emissiveIntensity, 0.12)}
      map={mappedTexture ?? undefined}
      metalness={0.02}
      polygonOffset
      polygonOffsetFactor={-5}
      polygonOffsetUnits={-5}
      roughness={0.42}
      side={side}
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

  return <meshBasicMaterial color={mappedTexture ? '#ffffff' : fallbackColor} map={mappedTexture ?? undefined} toneMapped={false} />;
}
