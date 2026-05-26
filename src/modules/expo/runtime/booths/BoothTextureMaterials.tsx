import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { resolveExpoTextureCandidateUrls } from '../../lib/expoTexturePipeline';
import {
  isGeneratedBillboardTextureUrl,
  parseGeneratedBillboardPayload,
} from './generatedBillboardTextureUrl';
import type { ExpoScreenTextureQualityHint } from '../world/quality/expoScreenRuntimePolicy';
import {
  DEFAULT_TEXTURE_CACHE_LIMIT,
  recordExpoGeneratedBillboardCacheEviction,
  recordExpoGeneratedBillboardCacheHit,
  recordExpoGeneratedBillboardCacheMiss,
  recordExpoGeneratedBillboardTextureCreated,
  resolveExpoGeneratedBillboardQualityConfig,
  updateExpoTextureCacheRuntimeStats,
} from '../world/quality/expoScreenTextureRuntimeStats';

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

type ExpoCachedTextureKind = 'generated-billboard' | 'image' | 'missing';

type ExpoCachedTextureEntry = {
  kind: ExpoCachedTextureKind;
  lastUsedAt: number;
  texture: THREE.Texture | null;
};

function configureExpoTexture(texture: THREE.Texture, textureQualityHint: ExpoScreenTextureQualityHint) {
  const qualityConfig = resolveExpoGeneratedBillboardQualityConfig(textureQualityHint);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = qualityConfig.generateMipmaps;
  texture.minFilter = qualityConfig.generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = qualityConfig.anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function capGeneratedBillboardCanvasSize(
  size: { height: number; width: number },
  textureQualityHint: ExpoScreenTextureQualityHint,
) {
  const qualityConfig = resolveExpoGeneratedBillboardQualityConfig(textureQualityHint);
  const longSide = Math.max(size.width, size.height);
  const shortSide = Math.min(size.width, size.height);
  const scale = Math.min(
    1,
    qualityConfig.maxLongSide / Math.max(1, longSide),
    qualityConfig.maxShortSide / Math.max(1, shortSide),
  );

  return {
    height: Math.max(128, Math.round(size.height * scale)),
    width: Math.max(128, Math.round(size.width * scale)),
  };
}

function resolveGeneratedBillboardCanvasSize(
  aspect: number | undefined,
  textureQualityHint: ExpoScreenTextureQualityHint,
) {
  const normalizedAspect = Number.isFinite(aspect) && aspect ? Math.max(0.35, Math.min(4.5, aspect)) : 0.7;
  const baseSize = (() => {
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
  })();

  return capGeneratedBillboardCanvasSize(baseSize, textureQualityHint);
}

function normalizeGeneratedBillboardLines(lines: readonly string[] | undefined, limit: number) {
  return Array.isArray(lines)
    ? lines
      .map((line) => String(line || '').trim())
      .filter(Boolean)
      .slice(0, limit)
    : [];
}

function drawBoothProductPreviewBillboard(args: {
  accentColor: string;
  context: CanvasRenderingContext2D;
  font: (weight: number, size: number) => string;
  height: number;
  pad: number;
  payload: NonNullable<ReturnType<typeof parseGeneratedBillboardPayload>>;
  shortSide: number;
  tierAccent: string;
  width: number;
}) {
  const {
    accentColor,
    context,
    font,
    height,
    pad,
    payload,
    shortSide,
    tierAccent,
    width,
  } = args;
  const isLandscape = width > height * 1.08;
  const bullets = normalizeGeneratedBillboardLines(payload.bullets, 3);
  const ctaLabels = normalizeGeneratedBillboardLines(payload.ctaLabels, 3);
  const title = payload.label || 'Sponsor Concierge';
  const tier = payload.tier || 'Premium Booth';
  const subtitle = payload.subtitle || 'Turn expo traffic into booked meetings and qualified leads.';
  const statusLabel = payload.statusLabel || 'Preview only - no live lead capture yet';
  const titleSize = isLandscape ? height * 0.12 : height * 0.052;
  const tierSize = isLandscape ? height * 0.056 : height * 0.026;
  const subtitleSize = isLandscape ? height * 0.049 : height * 0.024;
  const bodySize = isLandscape ? height * 0.045 : height * 0.022;
  const ctaSize = isLandscape ? height * 0.04 : height * 0.018;
  const statusSize = isLandscape ? height * 0.033 : height * 0.017;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#07101b');
  gradient.addColorStop(0.42, '#0e2032');
  gradient.addColorStop(1, '#08111c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = accentColor;
  context.globalAlpha = 0.7;
  context.fillRect(0, 0, Math.max(10, width * 0.024), height);
  context.fillRect(0, 0, width, Math.max(8, height * 0.02));
  context.globalAlpha = 1;

  context.fillStyle = 'rgba(248, 250, 252, 0.08)';
  context.beginPath();
  context.roundRect(pad * 0.7, pad * 0.7, width - pad * 1.4, height - pad * 1.4, Math.max(18, shortSide * 0.03));
  context.fill();

  context.fillStyle = 'rgba(14, 32, 50, 0.9)';
  context.beginPath();
  context.roundRect(pad, pad, width - pad * 2, height - pad * 2, Math.max(14, shortSide * 0.024));
  context.fill();

  const left = pad * 1.32;
  const maxTextWidth = width - left - pad * 1.32;
  const tierWidth = Math.min(width * (isLandscape ? 0.32 : 0.54), Math.max(270, tier.length * tierSize * 0.72));
  const tierHeight = tierSize * 1.6;
  const tierY = isLandscape ? height * 0.105 : height * 0.085;

  context.fillStyle = 'rgba(45, 212, 191, 0.2)';
  context.beginPath();
  context.roundRect(left, tierY, tierWidth, tierHeight, tierHeight * 0.5);
  context.fill();
  drawBillboardText(context, tier.toUpperCase(), left + tierHeight * 0.55, tierY + tierHeight * 0.22, tierWidth - tierHeight, font(900, tierSize), tierAccent);

  const titleY = isLandscape ? height * 0.245 : height * 0.18;
  drawBillboardText(context, title, left, titleY, maxTextWidth, font(900, titleSize), '#ffffff');
  drawBillboardText(context, subtitle, left, titleY + titleSize * (isLandscape ? 1.08 : 1.28), maxTextWidth, font(750, subtitleSize), '#dbeafe');

  const bulletStartY = titleY + titleSize * (isLandscape ? 1.82 : 2.45);
  const bulletGap = bodySize * (isLandscape ? 1.5 : 1.62);
  bullets.forEach((line, index) => {
    const y = bulletStartY + bulletGap * index;
    context.fillStyle = accentColor;
    context.beginPath();
    context.arc(left + bodySize * 0.32, y + bodySize * 0.48, Math.max(4, bodySize * 0.18), 0, Math.PI * 2);
    context.fill();
    drawBillboardText(context, line, left + bodySize * 0.9, y, maxTextWidth - bodySize, font(700, bodySize), '#f8fafc');
  });

  const ctaY = isLandscape ? height * 0.705 : height * 0.72;
  const ctaGap = isLandscape ? width * 0.242 : 0;
  const ctaWidth = isLandscape ? width * 0.205 : maxTextWidth;
  const ctaHeight = ctaSize * 2.2;
  ctaLabels.forEach((label, index) => {
    const x = isLandscape ? left + ctaGap * index : left;
    const y = isLandscape ? ctaY : ctaY + index * ctaHeight * 1.22;
    context.fillStyle = index === 0 ? accentColor : 'rgba(30, 41, 59, 0.82)';
    context.beginPath();
    context.roundRect(x, y, ctaWidth, ctaHeight, Math.max(12, ctaHeight * 0.45));
    context.fill();
    context.strokeStyle = index === 0 ? 'rgba(204, 251, 241, 0.88)' : 'rgba(148, 163, 184, 0.5)';
    context.lineWidth = Math.max(3, shortSide * 0.004);
    context.stroke();
    drawBillboardText(context, label.toUpperCase(), x + ctaHeight * 0.55, y + ctaHeight * 0.28, ctaWidth - ctaHeight, font(900, ctaSize), '#ffffff');
  });

  drawBillboardText(
    context,
    statusLabel,
    left,
    height - pad * 1.36,
    maxTextWidth,
    font(700, statusSize),
    '#93a4b8',
  );
}

function createGeneratedBillboardTexture(url: string, textureQualityHint: ExpoScreenTextureQualityHint) {
  const payload = parseGeneratedBillboardPayload(url);
  if (!payload || typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  const canvasSize = resolveGeneratedBillboardCanvasSize(payload.aspect, textureQualityHint);
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

  if (payload.layout === 'booth-product-preview') {
    drawBoothProductPreviewBillboard({
      accentColor,
      context,
      font,
      height,
      pad,
      payload,
      shortSide,
      tierAccent,
      width,
    });

    recordExpoGeneratedBillboardTextureCreated({
      height: canvas.height,
      qualityHint: textureQualityHint,
      width: canvas.width,
    });
    return configureExpoTexture(new THREE.CanvasTexture(canvas), textureQualityHint);
  }

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

    recordExpoGeneratedBillboardTextureCreated({
      height: canvas.height,
      qualityHint: textureQualityHint,
      width: canvas.width,
    });
    return configureExpoTexture(new THREE.CanvasTexture(canvas), textureQualityHint);
  }

  context.fillStyle = 'rgba(248, 250, 252, 0.18)';
  context.beginPath();
  context.roundRect(pad, height * 0.1, width - pad * 2, height * 0.24, Math.max(16, shortSide * 0.024));
  context.fill();

  drawBillboardText(context, payload.chip || 'DISTRICT ARRAY', pad * 1.18, height * 0.084, width - pad * 2.36, font(800, height * 0.033), tierAccent);
  drawBillboardText(context, payload.label || 'EXPO PARTNER', pad * 1.18, height * 0.428, width - pad * 2.36, font(900, height * 0.076), '#ffffff');
  drawBillboardText(context, `${payload.tier || 'PREMIUM'} PARTNER`, pad * 1.18, height * 0.502, width - pad * 2.7, font(800, height * 0.034), '#dbeafe');
  drawBillboardText(context, payload.subtitle || 'EXPO SPONSOR FRONTAGE', pad * 1.18, height * 0.876, width - pad * 2.5, font(700, height * 0.028), '#e2e8f0');

  recordExpoGeneratedBillboardTextureCreated({
    height: canvas.height,
    qualityHint: textureQualityHint,
    width: canvas.width,
  });
  return configureExpoTexture(new THREE.CanvasTexture(canvas), textureQualityHint);
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

const EXPO_TEXTURE_CACHE = new Map<string, ExpoCachedTextureEntry>();
const EXPO_TEXTURE_PROMISE_CACHE = new Map<string, Promise<THREE.Texture | null>>();
const EXPO_TEXTURE_REF_COUNTS = new Map<string, number>();
let expoTextureCacheClock = 0;

function normalizeTextureQualityHint(
  textureQualityHint: ExpoScreenTextureQualityHint | null | undefined,
): ExpoScreenTextureQualityHint {
  return textureQualityHint ?? 'medium';
}

function resolveExpoTextureCacheKey(url: string, textureQualityHint: ExpoScreenTextureQualityHint) {
  return `${url}::texture-quality=${textureQualityHint}`;
}

function countGeneratedBillboardCacheEntries() {
  let count = 0;
  EXPO_TEXTURE_CACHE.forEach((entry) => {
    if (entry.kind === 'generated-billboard') {
      count += 1;
    }
  });
  return count;
}

function syncExpoTextureCacheStats() {
  updateExpoTextureCacheRuntimeStats({
    generatedBillboardCacheSize: countGeneratedBillboardCacheEntries(),
    textureCacheLimit: DEFAULT_TEXTURE_CACHE_LIMIT,
    textureCacheSize: EXPO_TEXTURE_CACHE.size,
  });
}

function retainExpoTextureCacheKey(cacheKey: string) {
  EXPO_TEXTURE_REF_COUNTS.set(cacheKey, (EXPO_TEXTURE_REF_COUNTS.get(cacheKey) ?? 0) + 1);
}

function releaseExpoTextureCacheKey(cacheKey: string) {
  const nextCount = Math.max(0, (EXPO_TEXTURE_REF_COUNTS.get(cacheKey) ?? 0) - 1);
  if (nextCount <= 0) {
    EXPO_TEXTURE_REF_COUNTS.delete(cacheKey);
    pruneExpoTextureCache();
    return;
  }

  EXPO_TEXTURE_REF_COUNTS.set(cacheKey, nextCount);
}

function pruneExpoTextureCache() {
  while (EXPO_TEXTURE_CACHE.size > DEFAULT_TEXTURE_CACHE_LIMIT) {
    let candidateKey: string | null = null;
    let candidateLastUsedAt = Number.POSITIVE_INFINITY;

    EXPO_TEXTURE_CACHE.forEach((entry, cacheKey) => {
      if ((EXPO_TEXTURE_REF_COUNTS.get(cacheKey) ?? 0) > 0) {
        return;
      }

      if (entry.lastUsedAt < candidateLastUsedAt) {
        candidateKey = cacheKey;
        candidateLastUsedAt = entry.lastUsedAt;
      }
    });

    if (!candidateKey) {
      break;
    }

    const candidateEntry = EXPO_TEXTURE_CACHE.get(candidateKey);
    if (candidateEntry?.texture) {
      candidateEntry.texture.dispose();
    }

    if (candidateEntry?.kind === 'generated-billboard') {
      recordExpoGeneratedBillboardCacheEviction();
    }

    EXPO_TEXTURE_CACHE.delete(candidateKey);
    EXPO_TEXTURE_PROMISE_CACHE.delete(candidateKey);
  }

  syncExpoTextureCacheStats();
}

function readExpoTextureCache(cacheKey: string, kind: ExpoCachedTextureKind) {
  const cachedEntry = EXPO_TEXTURE_CACHE.get(cacheKey);
  if (cachedEntry === undefined) {
    if (kind === 'generated-billboard') {
      recordExpoGeneratedBillboardCacheMiss();
    }
    return undefined;
  }

  cachedEntry.lastUsedAt = ++expoTextureCacheClock;
  if (kind === 'generated-billboard') {
    recordExpoGeneratedBillboardCacheHit();
  }
  syncExpoTextureCacheStats();
  return cachedEntry.texture;
}

function writeExpoTextureCache(
  cacheKey: string,
  texture: THREE.Texture | null,
  kind: ExpoCachedTextureKind,
) {
  EXPO_TEXTURE_CACHE.set(cacheKey, {
    kind,
    lastUsedAt: ++expoTextureCacheClock,
    texture,
  });
  syncExpoTextureCacheStats();
  pruneExpoTextureCache();
  return texture;
}

function resolveGeneratedBillboardTextureSync(
  url: string,
  textureQualityHint: ExpoScreenTextureQualityHint,
) {
  if (!isGeneratedBillboardTextureUrl(url)) {
    return null;
  }

  const cacheKey = resolveExpoTextureCacheKey(url, textureQualityHint);
  const cachedTexture = readExpoTextureCache(cacheKey, 'generated-billboard');
  if (cachedTexture !== undefined) {
    return cachedTexture;
  }

  const generatedTexture = createGeneratedBillboardTexture(url, textureQualityHint);
  if (generatedTexture) {
    return writeExpoTextureCache(cacheKey, generatedTexture, 'generated-billboard');
  }

  return null;
}

function loadCachedExpoTexture(url: string, textureQualityHint: ExpoScreenTextureQualityHint) {
  const isGeneratedBillboard = isGeneratedBillboardTextureUrl(url);
  const cacheKind: ExpoCachedTextureKind = isGeneratedBillboard ? 'generated-billboard' : 'image';
  const cacheKey = resolveExpoTextureCacheKey(url, textureQualityHint);
  const cachedTexture = readExpoTextureCache(cacheKey, cacheKind);
  if (cachedTexture !== undefined) {
    return Promise.resolve(cachedTexture);
  }

  const generatedTexture = isGeneratedBillboard ? createGeneratedBillboardTexture(url, textureQualityHint) : null;
  if (generatedTexture) {
    return Promise.resolve(writeExpoTextureCache(cacheKey, generatedTexture, 'generated-billboard'));
  }

  if (isGeneratedBillboard) {
    return Promise.resolve(null);
  }

  const cachedPromise = EXPO_TEXTURE_PROMISE_CACHE.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const loader = new THREE.TextureLoader();
  const candidateUrls = resolveExpoTextureCandidateUrls(url);
  const promise = loadTextureWithCandidateUrls(loader, candidateUrls)
    .then((texture) => {
      const configuredTexture = configureExpoTexture(texture, textureQualityHint);
      writeExpoTextureCache(cacheKey, configuredTexture, 'image');
      EXPO_TEXTURE_PROMISE_CACHE.delete(cacheKey);
      return configuredTexture;
    })
    .catch(() => {
      writeExpoTextureCache(cacheKey, null, 'missing');
      EXPO_TEXTURE_PROMISE_CACHE.delete(cacheKey);
      return null;
    });

  EXPO_TEXTURE_PROMISE_CACHE.set(cacheKey, promise);
  return promise;
}

export function SponsorTextureSurface({
  depthWrite,
  doubleSided = false,
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  textureQualityHint,
  url,
}: {
  depthWrite?: boolean;
  doubleSided?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  textureQualityHint?: ExpoScreenTextureQualityHint;
  url: string;
}) {
  const normalizedTextureQualityHint = normalizeTextureQualityHint(textureQualityHint);
  const textureCacheKey = resolveExpoTextureCacheKey(url, normalizedTextureQualityHint);
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(() => (
    resolveGeneratedBillboardTextureSync(url, normalizedTextureQualityHint)
  ));
  const isGeneratedBillboard = isGeneratedBillboardTextureUrl(url);
  const side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

  useEffect(() => {
    retainExpoTextureCacheKey(textureCacheKey);
    let isActive = true;
    loadCachedExpoTexture(url, normalizedTextureQualityHint)
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
      releaseExpoTextureCacheKey(textureCacheKey);
    };
  }, [normalizedTextureQualityHint, textureCacheKey, url]);

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
        side={side}
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
      side={side}
      transparent={opacity < 0.999}
      opacity={opacity}
      toneMapped={false}
    />
  );
}

export function ScreenTextureMaterial({
  fallbackColor,
  textureQualityHint,
  url,
}: {
  fallbackColor: string;
  textureQualityHint?: ExpoScreenTextureQualityHint;
  url: string;
}) {
  const normalizedTextureQualityHint = normalizeTextureQualityHint(textureQualityHint);
  const textureCacheKey = resolveExpoTextureCacheKey(url, normalizedTextureQualityHint);
  const [mappedTexture, setMappedTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    retainExpoTextureCacheKey(textureCacheKey);
    let isActive = true;
    loadCachedExpoTexture(url, normalizedTextureQualityHint)
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
      releaseExpoTextureCacheKey(textureCacheKey);
    };
  }, [normalizedTextureQualityHint, textureCacheKey, url]);

  return <meshBasicMaterial color={fallbackColor} map={mappedTexture ?? undefined} toneMapped={false} />;
}
