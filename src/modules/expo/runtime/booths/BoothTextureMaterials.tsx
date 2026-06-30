import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveExpoTextureCandidateUrls } from '../../lib/expoTexturePipeline';
import {
  isGeneratedBillboardTextureUrl,
  parseGeneratedBillboardPayload,
} from './generatedBillboardTextureUrl';
import type { ExpoScreenTextureQualityHint } from '../world/quality/expoScreenRuntimePolicy';
import { useExpoVideoScreenPlaybackRegistration } from '../world/quality/expoActiveVideoScreenRegistry';
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

const EXPO_CITY_CAMERA_LOOP_FRAME_URLS = [
  '/expo/media/city-camera-loop/01-arrival-gate.png',
  '/expo/media/city-camera-loop/02-arrival-civic-axis.png',
  '/expo/media/city-camera-loop/03-center-spine.png',
  '/expo/media/city-camera-loop/04-center-spine-side.png',
  '/expo/media/city-camera-loop/05-mid-start-deep.png',
  '/expo/media/city-camera-loop/06-left-marquee.png',
  '/expo/media/city-camera-loop/07-left-marquee-close.png',
  '/expo/media/city-camera-loop/08-left-edge-far.png',
  '/expo/media/city-camera-loop/09-right-marquee.png',
  '/expo/media/city-camera-loop/10-right-marquee-close.png',
  '/expo/media/city-camera-loop/11-right-edge-far.png',
  '/expo/media/city-camera-loop/12-sponsor-boulevard-left.png',
  '/expo/media/city-camera-loop/13-sponsor-boulevard-left-close.png',
  '/expo/media/city-camera-loop/14-sponsor-boulevard-right.png',
  '/expo/media/city-camera-loop/15-sponsor-boulevard-right-medium.png',
  '/expo/media/city-camera-loop/16-array-band.png',
  '/expo/media/city-camera-loop/17-array-band-south.png',
  '/expo/media/city-camera-loop/18-sky-market-spine.png',
  '/expo/media/city-camera-loop/19-sky-market-spine-access.png',
  '/expo/media/city-camera-loop/20-tower-cluster.png',
  '/expo/media/city-camera-loop/21-tower-cluster-mega-skyline.png',
  '/expo/media/city-camera-loop/22-tower-cluster-television-tower-crown.png',
  '/expo/media/city-camera-loop/23-ai-reactor-core.png',
  '/expo/media/city-camera-loop/24-ai-oracle-chamber.png',
  '/expo/media/city-camera-loop/25-center-sky-compass.png',
  '/expo/media/city-camera-loop/26-stadium-approach.png',
  '/expo/media/city-camera-loop/27-rear-campus-entry-pulse-arches.png',
  '/expo/media/city-camera-loop/28-rear-campus-center.png',
  '/expo/media/city-camera-loop/29-stadium-feed-axis.png',
  '/expo/media/city-camera-loop/30-rear-campus-orbital-scoregate.png',
  '/expo/media/city-camera-loop/31-rear-campus-mega-hall.png',
] as const;

let expoCityCameraLoopFrames: HTMLImageElement[] | null = null;
let expoCityCameraLoopFramesPromise: Promise<HTMLImageElement[]> | null = null;

function loadExpoCityCameraLoopFrames() {
  if (typeof Image === 'undefined') {
    return Promise.resolve([]);
  }

  if (expoCityCameraLoopFrames) {
    return Promise.resolve(expoCityCameraLoopFrames);
  }

  if (!expoCityCameraLoopFramesPromise) {
    const loadFrame = (sourceUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = sourceUrl;
    });

    expoCityCameraLoopFramesPromise = Promise.all(EXPO_CITY_CAMERA_LOOP_FRAME_URLS.map(loadFrame))
      .then((frames) => {
        expoCityCameraLoopFrames = frames;
        return frames;
      })
      .catch(() => {
        expoCityCameraLoopFrames = [];
        return [];
      });
  }

  return expoCityCameraLoopFramesPromise;
}

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
  const tier = payload.tier || 'Booth Profile';
  const subtitle = payload.subtitle || 'Turn expo traffic into booked meetings and qualified leads.';
  const statusLabel = payload.statusLabel || 'Preview only - no live lead capture yet';
  const isStandardBooth = tier.toUpperCase().includes('STANDARD');
  const isPremiumBooth = tier.toUpperCase().includes('PREMIUM');
  const isLandmarkZone = tier.toUpperCase().includes('LANDMARK');
  const titleSize = isLandscape ? height * 0.12 : height * 0.052;
  const tierSize = isLandscape ? height * 0.056 : height * 0.026;
  const subtitleSize = isLandscape ? height * 0.049 : height * 0.024;
  const bodySize = isLandscape ? height * 0.045 : height * 0.022;
  const ctaSize = isLandscape ? height * 0.04 : height * 0.018;
  const statusSize = isLandscape ? height * 0.033 : height * 0.017;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, isLandmarkZone ? '#11100a' : isStandardBooth ? '#06131b' : '#07101b');
  gradient.addColorStop(0.42, isLandmarkZone ? '#2b2410' : isStandardBooth ? '#102637' : '#0e2032');
  gradient.addColorStop(1, isLandmarkZone ? '#0b1520' : isStandardBooth ? '#071923' : '#08111c');
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
  let maxTextWidth = width - left - pad * 1.32;
  const tierWidth = Math.min(width * (isLandscape ? 0.32 : 0.54), Math.max(270, tier.length * tierSize * 0.72));
  const tierHeight = tierSize * 1.6;
  const tierY = isLandscape ? height * 0.105 : height * 0.085;

  if (isStandardBooth && isLandscape) {
    const showcasePanelWidth = width * 0.22;
    const showcasePanelX = width - pad * 1.18 - showcasePanelWidth;
    const showcasePanelY = height * 0.185;
    const showcasePanelHeight = height * 0.43;
    maxTextWidth = showcasePanelX - left - pad * 0.55;

    context.fillStyle = 'rgba(15, 35, 50, 0.92)';
    context.beginPath();
    context.roundRect(showcasePanelX, showcasePanelY, showcasePanelWidth, showcasePanelHeight, Math.max(14, shortSide * 0.024));
    context.fill();
    context.strokeStyle = 'rgba(125, 211, 252, 0.36)';
    context.lineWidth = Math.max(2, shortSide * 0.0032);
    context.stroke();

    drawBillboardText(context, 'PRODUCT SHOWCASE', showcasePanelX + showcasePanelWidth * 0.1, showcasePanelY + showcasePanelHeight * 0.12, showcasePanelWidth * 0.8, font(900, bodySize * 0.82), tierAccent);
    ['Profile', 'Demo screen', 'Package request'].forEach((label, index) => {
      const itemY = showcasePanelY + showcasePanelHeight * (0.34 + index * 0.19);
      context.fillStyle = index === 0 ? accentColor : 'rgba(148, 163, 184, 0.34)';
      context.beginPath();
      context.roundRect(showcasePanelX + showcasePanelWidth * 0.1, itemY, showcasePanelWidth * 0.08, bodySize * 0.5, Math.max(4, bodySize * 0.18));
      context.fill();
      drawBillboardText(context, label, showcasePanelX + showcasePanelWidth * 0.22, itemY - bodySize * 0.18, showcasePanelWidth * 0.66, font(760, bodySize * 0.78), '#eaf4fb');
    });
  }

  if (isPremiumBooth && isLandscape) {
    const conversionPanelWidth = width * 0.23;
    const conversionPanelX = width - pad * 1.18 - conversionPanelWidth;
    const conversionPanelY = height * 0.18;
    const conversionPanelHeight = height * 0.45;
    maxTextWidth = conversionPanelX - left - pad * 0.55;

    context.fillStyle = 'rgba(8, 23, 38, 0.94)';
    context.beginPath();
    context.roundRect(conversionPanelX, conversionPanelY, conversionPanelWidth, conversionPanelHeight, Math.max(14, shortSide * 0.024));
    context.fill();
    context.strokeStyle = 'rgba(45, 212, 191, 0.42)';
    context.lineWidth = Math.max(2, shortSide * 0.0032);
    context.stroke();

    drawBillboardText(context, 'CONVERSION FLOW', conversionPanelX + conversionPanelWidth * 0.1, conversionPanelY + conversionPanelHeight * 0.12, conversionPanelWidth * 0.8, font(900, bodySize * 0.82), tierAccent);
    ['Booked meeting', 'AI diagnostic', 'Lead report'].forEach((label, index) => {
      const itemY = conversionPanelY + conversionPanelHeight * (0.34 + index * 0.19);
      context.fillStyle = index === 0 ? accentColor : 'rgba(45, 212, 191, 0.22)';
      context.beginPath();
      context.arc(conversionPanelX + conversionPanelWidth * 0.14, itemY + bodySize * 0.16, Math.max(5, bodySize * 0.18), 0, Math.PI * 2);
      context.fill();
      drawBillboardText(context, label, conversionPanelX + conversionPanelWidth * 0.24, itemY - bodySize * 0.18, conversionPanelWidth * 0.64, font(760, bodySize * 0.78), '#e7f8f6');
    });
  }

  if (isLandmarkZone && isLandscape) {
    const ownershipPanelWidth = width * 0.25;
    const ownershipPanelX = width - pad * 1.18 - ownershipPanelWidth;
    const ownershipPanelY = height * 0.165;
    const ownershipPanelHeight = height * 0.49;
    maxTextWidth = ownershipPanelX - left - pad * 0.55;

    context.fillStyle = 'rgba(18, 16, 10, 0.94)';
    context.beginPath();
    context.roundRect(ownershipPanelX, ownershipPanelY, ownershipPanelWidth, ownershipPanelHeight, Math.max(14, shortSide * 0.024));
    context.fill();
    context.strokeStyle = 'rgba(250, 204, 21, 0.44)';
    context.lineWidth = Math.max(2, shortSide * 0.0032);
    context.stroke();

    drawBillboardText(context, 'ZONE OWNERSHIP', ownershipPanelX + ownershipPanelWidth * 0.1, ownershipPanelY + ownershipPanelHeight * 0.11, ownershipPanelWidth * 0.8, font(900, bodySize * 0.82), '#fde68a');
    ['Naming rights', 'Hero presence', 'Arena slot', 'Sponsor report'].forEach((label, index) => {
      const itemY = ownershipPanelY + ownershipPanelHeight * (0.3 + index * 0.155);
      context.fillStyle = index === 0 ? '#facc15' : 'rgba(250, 204, 21, 0.24)';
      context.beginPath();
      context.roundRect(ownershipPanelX + ownershipPanelWidth * 0.1, itemY, ownershipPanelWidth * 0.08, bodySize * 0.5, Math.max(4, bodySize * 0.18));
      context.fill();
      drawBillboardText(context, label, ownershipPanelX + ownershipPanelWidth * 0.22, itemY - bodySize * 0.18, ownershipPanelWidth * 0.66, font(760, bodySize * 0.74), '#fff7d6');
    });
  }

  context.fillStyle = isLandmarkZone
    ? 'rgba(250, 204, 21, 0.2)'
    : isStandardBooth ? 'rgba(125, 211, 252, 0.2)' : 'rgba(45, 212, 191, 0.2)';
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

function drawCameraFeedLoopBillboard(args: {
  accentColor: string;
  context: CanvasRenderingContext2D;
  cameraFrames?: CanvasImageSource[];
  font: (weight: number, size: number) => string;
  height: number;
  payload: NonNullable<ReturnType<typeof parseGeneratedBillboardPayload>>;
  tierAccent: string;
  timeSeconds: number;
  width: number;
}) {
  const {
    accentColor,
    context,
    cameraFrames = [],
    font,
    height,
    payload,
    tierAccent,
    timeSeconds,
    width,
  } = args;
  const shortSide = Math.min(width, height);
  const pad = Math.max(18, shortSide * 0.034);
  const smallSize = height * 0.032;
  const label = payload.label || 'Expo City Camera';

  if (cameraFrames.length > 0) {
    const frameDuration = 1.65;
    const rawIndex = timeSeconds / frameDuration;
    const frameIndex = Math.floor(rawIndex) % cameraFrames.length;
    const nextFrameIndex = (frameIndex + 1) % cameraFrames.length;
    const fade = Math.max(0, Math.min(1, ((rawIndex % 1) - 0.72) / 0.28));
    const drawCoverFrame = (frame: CanvasImageSource, alpha: number) => {
      const sourceWidth = Number('naturalWidth' in frame ? frame.naturalWidth : 'videoWidth' in frame ? frame.videoWidth : width) || width;
      const sourceHeight = Number('naturalHeight' in frame ? frame.naturalHeight : 'videoHeight' in frame ? frame.videoHeight : height) || height;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      context.globalAlpha = alpha;
      context.drawImage(frame, (width - drawWidth) * 0.5, (height - drawHeight) * 0.5, drawWidth, drawHeight);
      context.globalAlpha = 1;
    };
    drawCoverFrame(cameraFrames[frameIndex], 1);
    if (fade > 0) {
      drawCoverFrame(cameraFrames[nextFrameIndex], fade);
    }
    const cameraGradient = context.createLinearGradient(0, 0, 0, height);
    cameraGradient.addColorStop(0, 'rgba(3, 7, 18, 0.08)');
    cameraGradient.addColorStop(0.62, 'rgba(3, 7, 18, 0.04)');
    cameraGradient.addColorStop(1, 'rgba(3, 7, 18, 0.28)');
    context.fillStyle = cameraGradient;
    context.fillRect(0, 0, width, height);
  } else {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#03111c');
    gradient.addColorStop(0.44, '#0b2435');
    gradient.addColorStop(1, '#031827');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  const badgeX = pad;
  const badgeY = pad;
  const badgeHeight = Math.max(28, smallSize * 1.38);
  const badgeWidth = Math.min(width * 0.44, Math.max(250, label.length * smallSize * 0.48));
  context.fillStyle = 'rgba(2, 8, 18, 0.58)';
  context.beginPath();
  context.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeHeight * 0.5);
  context.fill();
  context.strokeStyle = 'rgba(125, 211, 252, 0.26)';
  context.lineWidth = Math.max(1, shortSide * 0.0018);
  context.stroke();

  const liveDotX = badgeX + badgeHeight * 0.55;
  const liveDotY = badgeY + badgeHeight * 0.5;
  context.fillStyle = Math.sin(timeSeconds * 5.6) > 0 ? '#22c55e' : '#86efac';
  context.beginPath();
  context.arc(liveDotX, liveDotY, Math.max(5, smallSize * 0.18), 0, Math.PI * 2);
  context.fill();
  drawBillboardText(context, `LIVE CITY CAMERA - ${label}`, liveDotX + smallSize * 0.55, liveDotY - smallSize * 0.42, badgeWidth - badgeHeight, font(900, smallSize * 0.86), tierAccent);

  context.strokeStyle = accentColor;
  context.globalAlpha = 0.36;
  context.lineWidth = Math.max(2, shortSide * 0.003);
  context.strokeRect(0, 0, width, height);
  context.globalAlpha = 1;
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

function isCameraFeedLoopTextureUrl(url: string) {
  const payload = parseGeneratedBillboardPayload(url);
  return payload?.layout === 'camera-feed-loop';
}

function isVideoTextureUrl(url: string) {
  return /\.(mp4|webm)(?:[?#].*)?$/i.test(url.trim());
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

function AnimatedCameraFeedSurface({
  depthWrite,
  doubleSided,
  fallbackColor,
  emissiveColor,
  emissiveIntensity,
  opacity,
  textureQualityHint,
  url,
}: {
  depthWrite?: boolean;
  doubleSided: boolean;
  emissiveColor?: string;
  emissiveIntensity: number;
  fallbackColor: string;
  opacity: number;
  textureQualityHint: ExpoScreenTextureQualityHint;
  url: string;
}) {
  const payload = useMemo(() => parseGeneratedBillboardPayload(url), [url]);
  const canvasSize = resolveGeneratedBillboardCanvasSize(payload?.aspect, textureQualityHint);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const cameraFramesRef = useRef<HTMLImageElement[]>([]);
  const lastFrameTimeRef = useRef(-1);
  const side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;

  useEffect(() => {
    let isActive = true;

    loadExpoCityCameraLoopFrames()
      .then((frames) => {
        if (isActive) {
          cameraFramesRef.current = frames;
        }
      });

    return () => {
      isActive = false;
      cameraFramesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || !payload) {
      return undefined;
    }

    let isActive = true;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    const nextTexture = configureExpoTexture(new THREE.CanvasTexture(canvas), textureQualityHint) as THREE.CanvasTexture;
    drawCameraFeedLoopBillboard({
      accentColor: payload.accentColor || emissiveColor || '#38bdf8',
      context,
      cameraFrames: cameraFramesRef.current,
      font: (weight, size) => `${weight} ${Math.round(size)}px Verdana, Arial, sans-serif`,
      height: canvas.height,
      payload,
      tierAccent: payload.tierAccent || '#bae6fd',
      timeSeconds: 0,
      width: canvas.width,
    });
    nextTexture.needsUpdate = true;
    recordExpoGeneratedBillboardTextureCreated({
      height: canvas.height,
      qualityHint: textureQualityHint,
      width: canvas.width,
    });
    textureRef.current = nextTexture;
    queueMicrotask(() => {
      if (isActive) {
        setTexture(nextTexture);
      }
    });

    return () => {
      isActive = false;
      textureRef.current = null;
      nextTexture.dispose();
    };
  }, [canvasSize.height, canvasSize.width, emissiveColor, payload, textureQualityHint]);

  useFrame(({ clock }) => {
    const activeTexture = textureRef.current;
    if (!activeTexture || !payload || !(activeTexture.image instanceof HTMLCanvasElement)) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    if (elapsed - lastFrameTimeRef.current < 0.1) {
      return;
    }

    lastFrameTimeRef.current = elapsed;
    const canvas = activeTexture.image;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    drawCameraFeedLoopBillboard({
      accentColor: payload.accentColor || emissiveColor || '#38bdf8',
      context,
      cameraFrames: cameraFramesRef.current,
      font: (weight, size) => `${weight} ${Math.round(size)}px Verdana, Arial, sans-serif`,
      height: canvas.height,
      payload,
      tierAccent: payload.tierAccent || '#bae6fd',
      timeSeconds: elapsed,
      width: canvas.width,
    });
    activeTexture.needsUpdate = true;
  });

  if (texture) {
    return (
      <meshBasicMaterial
        depthWrite={depthWrite ?? opacity >= 0.999}
        map={texture}
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
      emissiveIntensity={Math.min(emissiveIntensity, 0.12)}
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

function VideoSponsorTextureSurface({
  allowVideoPlayback = true,
  depthWrite,
  doubleSided = false,
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  posterUrl,
  textureQualityHint,
  url,
}: {
  allowVideoPlayback?: boolean;
  depthWrite?: boolean;
  doubleSided?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  posterUrl?: string | null;
  textureQualityHint: ExpoScreenTextureQualityHint;
  url: string;
}) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  const playbackId = useMemo(() => `booth-video:${url}`, [url]);
  useExpoVideoScreenPlaybackRegistration(playbackId, allowVideoPlayback && Boolean(videoTexture));

  useEffect(() => {
    if (!allowVideoPlayback) {
      queueMicrotask(() => setVideoTexture(null));
      return undefined;
    }

    if (typeof document === 'undefined') {
      return undefined;
    }

    let isActive = true;
    const video = document.createElement('video');
    video.autoplay = true;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;

    const nextTexture = configureExpoTexture(new THREE.VideoTexture(video), textureQualityHint) as THREE.VideoTexture;
    nextTexture.generateMipmaps = false;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;

    const activate = () => {
      if (!isActive) {
        return;
      }

      void video.play().catch(() => undefined);
      setVideoTexture(nextTexture);
    };

    video.addEventListener('loadeddata', activate);
    video.addEventListener('canplay', activate);
    video.load();
    void video.play().catch(() => undefined);

    return () => {
      isActive = false;
      video.pause();
      video.removeEventListener('loadeddata', activate);
      video.removeEventListener('canplay', activate);
      video.removeAttribute('src');
      video.load();
      nextTexture.dispose();
    };
  }, [allowVideoPlayback, textureQualityHint, url]);

  if (allowVideoPlayback && videoTexture) {
    return (
      <meshBasicMaterial
        depthWrite={depthWrite ?? opacity >= 0.999}
        map={videoTexture}
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

  if (posterUrl) {
    return (
      <StaticSponsorTextureSurface
        depthWrite={depthWrite}
        doubleSided={doubleSided}
        fallbackColor={fallbackColor}
        emissiveColor={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        textureQualityHint={textureQualityHint}
        url={posterUrl}
      />
    );
  }

  return (
    <meshStandardMaterial
      color={fallbackColor}
      depthWrite={depthWrite ?? opacity >= 0.999}
      emissive={emissiveColor ?? '#000000'}
      emissiveIntensity={Math.min(emissiveIntensity, 0.12)}
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

function StaticSponsorTextureSurface({
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

export function SponsorTextureSurface({
  allowVideoPlayback,
  depthWrite,
  doubleSided = false,
  fallbackColor,
  emissiveColor,
  emissiveIntensity = 0,
  opacity = 1,
  posterUrl,
  textureQualityHint,
  url,
}: {
  allowVideoPlayback?: boolean;
  depthWrite?: boolean;
  doubleSided?: boolean;
  emissiveColor?: string;
  emissiveIntensity?: number;
  fallbackColor: string;
  opacity?: number;
  posterUrl?: string | null;
  textureQualityHint?: ExpoScreenTextureQualityHint;
  url: string;
}) {
  const normalizedTextureQualityHint = normalizeTextureQualityHint(textureQualityHint);

  if (isCameraFeedLoopTextureUrl(url)) {
    return (
      <AnimatedCameraFeedSurface
        key={`${url}::${normalizedTextureQualityHint}`}
        depthWrite={depthWrite}
        doubleSided={doubleSided}
        fallbackColor={fallbackColor}
        emissiveColor={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        textureQualityHint={normalizedTextureQualityHint}
        url={url}
      />
    );
  }

  if (isVideoTextureUrl(url)) {
    return (
      <VideoSponsorTextureSurface
        allowVideoPlayback={allowVideoPlayback ?? true}
        depthWrite={depthWrite}
        doubleSided={doubleSided}
        fallbackColor={fallbackColor}
        emissiveColor={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        opacity={opacity}
        posterUrl={posterUrl}
        textureQualityHint={normalizedTextureQualityHint}
        url={url}
      />
    );
  }

  return (
    <StaticSponsorTextureSurface
      depthWrite={depthWrite}
      doubleSided={doubleSided}
      fallbackColor={fallbackColor}
      emissiveColor={emissiveColor}
      emissiveIntensity={emissiveIntensity}
      opacity={opacity}
      textureQualityHint={normalizedTextureQualityHint}
      url={url}
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

  return <meshBasicMaterial color={mappedTexture ? '#ffffff' : fallbackColor} map={mappedTexture ?? undefined} toneMapped={false} />;
}
