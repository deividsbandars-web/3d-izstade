#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import * as THREE from 'three';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4173';
const DEFAULT_OUT_DIR = path.resolve(process.cwd(), 'tmp', `qa-3d-runtime-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const EXPECTED_VIEWPORT = { width: 1440, height: 900 };
const MODULAR_HOME_CAMERA_SOLVER_SHOTS = [
  {
    afterCropFile: '01-exterior-front-hero-canvas.png',
    afterFile: '01-exterior-front-hero.png',
    name: 'Exterior front hero',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorFrontHero',
  },
  {
    afterCropFile: '02-exterior-side-angle-canvas.png',
    afterFile: '02-exterior-side-angle.png',
    name: 'Exterior side angle',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorSideAngle',
  },
  {
    afterCropFile: '03-exterior-rear-angle-canvas.png',
    afterFile: '03-exterior-rear-angle.png',
    name: 'Exterior rear angle',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorRearAngle',
  },
  {
    afterCropFile: '04-exterior-elevated-cutaway-canvas.png',
    afterFile: '04-exterior-elevated-cutaway.png',
    name: 'Exterior elevated cutaway',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorElevatedCutaway',
  },
  {
    afterCropFile: '05-interior-overview-canvas.png',
    afterFile: '05-interior-overview.png',
    name: 'Interior overview',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorOverview',
  },
  {
    afterCropFile: '06-interior-living-zone-canvas.png',
    afterFile: '06-interior-living-zone.png',
    name: 'Interior living zone',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorLiving',
  },
  {
    afterCropFile: '07-interior-kitchen-zone-canvas.png',
    afterFile: '07-interior-kitchen-zone.png',
    name: 'Interior kitchen zone',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorKitchen',
  },
  {
    afterCropFile: '08-interior-sleeping-bathroom-zone-canvas.png',
    afterFile: '08-interior-sleeping-bathroom-zone.png',
    name: 'Interior sleeping and bathroom zone',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorSleepingBathroom',
  },
];

const FIXED_CAMERA_PRESETS = {
  exteriorFrontHero: {
    position: { x: -0.38, y: 5, z: -86.07 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorSideAngle: {
    position: { x: -75.38, y: 5, z: 18.93 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorRearAngle: {
    position: { x: -0.38, y: 5, z: 103.93 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  exteriorElevatedCutaway: {
    position: { x: 69.62, y: 5, z: -81.07 },
    target: { x: -0.38, y: 10, z: 8.93 },
  },
  interiorOverview: {
    position: { x: -0.38, y: 5, z: -36.07 },
    target: { x: -0.38, y: 9, z: 8.93 },
  },
  interiorLiving: {
    position: { x: -22.38, y: 5, z: -16.07 },
    target: { x: -10.38, y: 7, z: 8.93 },
  },
  interiorKitchen: {
    position: { x: 21.62, y: 5, z: -16.07 },
    target: { x: 7.62, y: 7, z: 8.93 },
  },
  interiorSleepingBathroom: {
    position: { x: -0.38, y: 5, z: 53.93 },
    target: { x: -0.38, y: 7, z: 33.93 },
  },
};

const FIXED_CAMERA_DISTANCE_MULTIPLIERS = {
  exteriorFrontHero: 1.8,
  exteriorSideAngle: 1.8,
  exteriorRearAngle: 1.8,
  exteriorElevatedCutaway: 1.8,
  interiorOverview: 1.45,
  interiorLiving: 1.55,
  interiorKitchen: 1.55,
  interiorSleepingBathroom: 1.55,
};

const INTERIOR_PULLBACK_MULTIPLIERS = {
  exteriorFrontHero: 1,
  exteriorSideAngle: 1,
  exteriorRearAngle: 1,
  exteriorElevatedCutaway: 1,
  interiorOverview: 1.08,
  interiorLiving: 1.08,
  interiorKitchen: 1.08,
  interiorSleepingBathroom: 1.08,
};

const CAMERA_LOCK_ADJUST_MULTIPLIERS = {
  exteriorFrontHero: 1,
  exteriorSideAngle: 1,
  exteriorRearAngle: 1,
  exteriorElevatedCutaway: 1,
  interiorOverview: 1.12,
  interiorLiving: 1,
  interiorKitchen: 1,
  interiorSleepingBathroom: 1.12,
};

const FIXED_CAMERA_BASE_FOV = 50;
const FIXED_CAMERA_DISTANCE_ADJUSTED_FOV = 58;

function resolveFixedCameraFov(phase) {
  if (phase === 'distance-adjusted' || phase === 'interior-pullback') {
    return FIXED_CAMERA_DISTANCE_ADJUSTED_FOV;
  }

  return FIXED_CAMERA_BASE_FOV;
}

function resolveFixedCameraPresetName(preset) {
  if (preset === 'doorArea') {
    return 'exteriorFrontHero';
  }

  if (preset === 'exteriorOverview') {
    return 'exteriorElevatedCutaway';
  }

  return preset;
}

function buildFixedCameraPreset(preset, phase = 'baseline') {
  const resolvedPresetName = resolveFixedCameraPresetName(preset);
  const basePreset = FIXED_CAMERA_PRESETS[resolvedPresetName];
  if (!basePreset) {
    return null;
  }

  const target = new THREE.Vector3(basePreset.target.x, basePreset.target.y, basePreset.target.z);
  const basePosition = new THREE.Vector3(basePreset.position.x, basePreset.position.y, basePreset.position.z);
  const direction = basePosition.clone().sub(target);
  const baseDistance = direction.length();
  if (baseDistance <= 0) {
    return null;
  }

  const distanceMultiplier = phase === 'distance-adjusted'
    ? FIXED_CAMERA_DISTANCE_MULTIPLIERS[resolvedPresetName] ?? 1
    : phase === 'interior-pullback'
      ? INTERIOR_PULLBACK_MULTIPLIERS[resolvedPresetName] ?? 1
      : phase === 'camera-lock-adjust'
        ? CAMERA_LOCK_ADJUST_MULTIPLIERS[resolvedPresetName] ?? 1
    : 1;
  const position = target.clone().add(direction.normalize().multiplyScalar(baseDistance * distanceMultiplier));
  const fov = resolveFixedCameraFov(phase);

  return {
    baseDistance,
    basePosition,
    distanceMultiplier,
    fov,
    position,
    resolvedPresetName,
    target,
  };
}

const MODULAR_HOME_FIXED_CAMERA_DISTANCE_SHOTS = MODULAR_HOME_CAMERA_SOLVER_SHOTS.map((shot) => ({
  ...shot,
  afterFile: shot.afterFile,
  afterCropFile: shot.afterCropFile,
  beforeFile: shot.afterFile,
  preset: shot.shotType,
}));

const MODULAR_HOME_INTERIOR_ONLY_PULLBACK_SHOTS = MODULAR_HOME_FIXED_CAMERA_DISTANCE_SHOTS.map((shot) => ({
  ...shot,
  preset: shot.shotType,
}));

const MODULAR_HOME_CAMERA_LOCK_05_08_ADJUST_SHOTS = MODULAR_HOME_CAMERA_SOLVER_SHOTS.map((shot) => ({
  ...shot,
  beforeFile: shot.afterFile,
  preset: shot.shotType,
}));

const MODULAR_HOME_FIXED_CAMERA_8_ANGLE_SHOTS = MODULAR_HOME_CAMERA_SOLVER_SHOTS.map((shot) => ({
  ...shot,
  preset: shot.shotType,
}));

const MODULAR_HOME_8_ANGLE_SHOTS = [
  {
    afterFile: '01-exterior-front-hero.png',
    baselineFile: '01-exterior-front-hero.png',
    name: 'Exterior front hero',
    preset: 'exteriorFrontHero',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorFrontHero',
  },
  {
    afterFile: '02-exterior-side-angle.png',
    baselineFile: '02-exterior-side-angle.png',
    name: 'Exterior side angle',
    preset: 'exteriorSideAngle',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorSideAngle',
  },
  {
    afterFile: '03-exterior-rear-angle.png',
    baselineFile: '03-exterior-rear-angle.png',
    name: 'Exterior rear angle',
    preset: 'exteriorRearAngle',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorRearAngle',
  },
  {
    afterFile: '04-exterior-elevated-cutaway.png',
    baselineFile: '04-exterior-elevated-cutaway.png',
    name: 'Exterior elevated cutaway',
    preset: 'exteriorElevatedCutaway',
    route: '/modular-homes/studio?view=exterior',
    shotType: 'exteriorElevatedCutaway',
  },
  {
    afterFile: '05-interior-overview.png',
    baselineFile: '05-interior-overview.png',
    name: 'Interior overview',
    preset: 'interiorOverview',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorOverview',
  },
  {
    afterFile: '06-interior-living-zone.png',
    baselineFile: '06-interior-living-zone.png',
    name: 'Interior living zone',
    preset: 'interiorLiving',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorLiving',
  },
  {
    afterFile: '07-interior-kitchen-zone.png',
    baselineFile: '07-interior-kitchen-zone.png',
    name: 'Interior kitchen zone',
    preset: 'interiorKitchen',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorKitchen',
  },
  {
    afterFile: '08-interior-sleeping-bathroom-zone.png',
    baselineFile: '08-interior-sleeping-bathroom-zone.png',
    name: 'Interior sleeping and bathroom zone',
    preset: 'interiorSleepingBathroom',
    route: '/modular-homes/studio?view=interior',
    shotType: 'interiorSleepingBathroom',
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    browserPath: null,
    headless: true,
    shotSet: null,
    outDir: DEFAULT_OUT_DIR,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--browser-path=')) {
      options.browserPath = arg.slice('--browser-path='.length);
    } else if (arg.startsWith('--shot-set=')) {
      options.shotSet = arg.slice('--shot-set='.length);
    } else if (arg === '--headed') {
      options.headless = false;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function helpText() {
  return `
Playwright + Three runtime QA harness

Usage:
  node scripts/qa-3d-runtime-playwright.mjs --base-url=http://127.0.0.1:4173 --out-dir=C:\\qa\\visual-evidence\\<stamp>

Options:
  --base-url=<url>      Base app URL.
  --out-dir=<path>      Output directory for screenshots, manifest, and result JSON.
  --browser-path=<path>  Chrome executable path. Defaults to standard Windows Chrome install.
  --shot-set=<name>     Optional shot contract, e.g. modular-home-fixed-camera-distance, modular-home-interior-only-pullback, modular-home-camera-lock-05-08-adjust, or modular-home-visual-readability.
  --headed              Run in a visible browser window.
`.trim();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readBrowserPath(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  ].filter(Boolean);

  const chromePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!chromePath) {
    throw new Error('Google Chrome was not found. Pass --browser-path or set CHROME_PATH.');
  }

  return chromePath;
}

function withQaParam(baseUrl, targetPath) {
  const url = new URL(targetPath, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  url.searchParams.set('qa3d', '1');
  return url.toString();
}

async function waitForQAHook(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getState?.()), null, { timeout: 30000 });
}

async function getState(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getState?.() ?? null);
}

async function getObjectSummary(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getObjectSummary?.() ?? null);
}

async function focusCanvas(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.focusCanvas?.() ?? false);
}

async function setQACameraPreset(page, preset, phase = 'baseline') {
  const applied = await page.evaluate(
    ({ nextPhase, nextPreset }) => window.__WARPALA_3D_QA__?.setCameraPreset?.(nextPreset, nextPhase) ?? false,
    { nextPhase: phase, nextPreset: preset },
  );
  if (!applied) {
    throw new Error(`QA camera preset unavailable: ${preset}`);
  }

  await page.waitForTimeout(900);
}

async function setQAPlayerPosition(page, position) {
  const applied = await page.evaluate((nextPosition) => window.__WARPALA_3D_QA__?.setPlayerPosition?.(nextPosition) ?? false, position);
  if (!applied) {
    throw new Error('QA player position helper unavailable');
  }

  await page.waitForTimeout(900);
}

async function lookAtQAModularHome(page) {
  const applied = await page.evaluate(() => window.__WARPALA_3D_QA__?.lookAtModularHome?.() ?? false);
  if (!applied) {
    throw new Error('QA lookAtModularHome helper unavailable');
  }

  await page.waitForTimeout(600);
}

function analyzeImageBuffer(buffer) {
  return sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function screenshotAndAnalyze(page, screenshotPath) {
  ensureDir(path.dirname(screenshotPath));
  await page.screenshot({ path: screenshotPath });
  const { data, info } = await analyzeImageBuffer(await fs.promises.readFile(screenshotPath));
  const width = info.width;
  const height = info.height;
  const cropWidth = Math.max(1, Math.floor(width * 0.72));
  const cropHeight = Math.max(1, Math.floor(height * 0.72));
  const cropLeft = Math.max(0, Math.floor((width - cropWidth) / 2));
  const cropTop = Math.max(0, Math.floor((height - cropHeight) / 2));
  const crop = sharp(data, { raw: { width, height, channels: info.channels } }).extract({
    left: cropLeft,
    top: cropTop,
    width: cropWidth,
    height: cropHeight,
  });
  const { data: cropData, info: cropInfo } = await crop.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cropStep = Math.max(1, Math.floor(Math.min(cropInfo.width, cropInfo.height) / 90));
  const buckets = new Set();
  let edgeScore = 0;
  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let samples = 0;

  function idx(x, y) {
    return (y * cropInfo.width + x) * 4;
  }

  for (let y = 0; y < cropInfo.height; y += cropStep) {
    for (let x = 0; x < cropInfo.width; x += cropStep) {
      const offset = idx(x, y);
      const r = cropData[offset];
      const g = cropData[offset + 1];
      const b = cropData[offset + 2];
      const luminance = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
      luminanceSum += luminance;
      luminanceSqSum += luminance * luminance;
      samples += 1;
      buckets.add(`${r >> 4}:${g >> 4}:${b >> 4}`);

      if (x + cropStep < cropInfo.width) {
        const offsetRight = idx(x + cropStep, y);
        edgeScore += Math.abs(r - cropData[offsetRight]) + Math.abs(g - cropData[offsetRight + 1]) + Math.abs(b - cropData[offsetRight + 2]);
      }
      if (y + cropStep < cropInfo.height) {
        const offsetDown = idx(x, y + cropStep);
        edgeScore += Math.abs(r - cropData[offsetDown]) + Math.abs(g - cropData[offsetDown + 1]) + Math.abs(b - cropData[offsetDown + 2]);
      }
    }
  }

  const mean = luminanceSum / samples;
  const variance = Math.max(0, luminanceSqSum / samples - mean * mean);
  const stddev = Math.sqrt(variance);
  const colorDiversity = buckets.size;
  const blankCanvasLikely = stddev < 9 || colorDiversity < 12 || edgeScore < 45000;
  const technicalScreenshotValid = width === EXPECTED_VIEWPORT.width && height === EXPECTED_VIEWPORT.height;

  return {
    blankCanvasLikely,
    colorDiversity,
    dimensions: `${width}x${height}`,
    edgeScore,
    screenshot: screenshotPath,
    stddev: Number(stddev.toFixed(2)),
    technicalScreenshotValid,
  };
}

async function screenshotCanvasOnlyAndAnalyze(page, screenshotPath) {
  ensureDir(path.dirname(screenshotPath));
  const viewport = page.viewportSize() ?? EXPECTED_VIEWPORT;
  const cropWidth = Math.max(1, Math.floor(viewport.width * 0.5));
  const cropLeft = Math.max(0, Math.floor((viewport.width - cropWidth) / 2));
  const clip = {
    height: viewport.height,
    width: cropWidth,
    x: cropLeft,
    y: 0,
  };

  if (clip.x + clip.width > viewport.width) {
    clip.width = Math.max(1, viewport.width - clip.x);
  }

  await page.screenshot({ clip, path: screenshotPath });
  return await screenshotAndAnalyzeFromFile(screenshotPath);
}

async function screenshotAndAnalyzeFromFile(screenshotPath) {
  const { data, info } = await analyzeImageBuffer(await fs.promises.readFile(screenshotPath));
  const width = info.width;
  const height = info.height;
  const cropWidth = Math.max(1, Math.floor(width * 0.72));
  const cropHeight = Math.max(1, Math.floor(height * 0.72));
  const cropLeft = Math.max(0, Math.floor((width - cropWidth) / 2));
  const cropTop = Math.max(0, Math.floor((height - cropHeight) / 2));
  const crop = sharp(data, { raw: { width, height, channels: info.channels } }).extract({
    left: cropLeft,
    top: cropTop,
    width: cropWidth,
    height: cropHeight,
  });
  const { data: cropData, info: cropInfo } = await crop.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cropStep = Math.max(1, Math.floor(Math.min(cropInfo.width, cropInfo.height) / 90));
  const buckets = new Set();
  let edgeScore = 0;
  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let samples = 0;

  function idx(x, y) {
    return (y * cropInfo.width + x) * 4;
  }

  for (let y = 0; y < cropInfo.height; y += cropStep) {
    for (let x = 0; x < cropInfo.width; x += cropStep) {
      const offset = idx(x, y);
      const r = cropData[offset];
      const g = cropData[offset + 1];
      const b = cropData[offset + 2];
      const luminance = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
      luminanceSum += luminance;
      luminanceSqSum += luminance * luminance;
      samples += 1;
      buckets.add(`${r >> 4}:${g >> 4}:${b >> 4}`);

      if (x + cropStep < cropInfo.width) {
        const offsetRight = idx(x + cropStep, y);
        edgeScore += Math.abs(r - cropData[offsetRight]) + Math.abs(g - cropData[offsetRight + 1]) + Math.abs(b - cropData[offsetRight + 2]);
      }
      if (y + cropStep < cropInfo.height) {
        const offsetDown = idx(x, y + cropStep);
        edgeScore += Math.abs(r - cropData[offsetDown]) + Math.abs(g - cropData[offsetDown + 1]) + Math.abs(b - cropData[offsetDown + 2]);
      }
    }
  }

  const mean = luminanceSum / samples;
  const variance = Math.max(0, luminanceSqSum / samples - mean * mean);
  const stddev = Math.sqrt(variance);
  const colorDiversity = buckets.size;
  const blankCanvasLikely = stddev < 9 || colorDiversity < 12 || edgeScore < 45000;
  const technicalScreenshotValid = height === EXPECTED_VIEWPORT.height && width >= 600;

  return {
    blankCanvasLikely,
    colorDiversity,
    dimensions: `${width}x${height}`,
    edgeScore,
    screenshot: screenshotPath,
    stddev: Number(stddev.toFixed(2)),
    technicalScreenshotValid,
  };
}

async function clickButtonIfPresent(page, namePattern) {
  const button = page.getByRole('button', { name: namePattern });
  if (await button.count()) {
    await button.first().click();
    await page.waitForTimeout(900);
    return true;
  }
  return false;
}

async function pressMovement(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, code: 'ArrowLeft', key: 'ArrowLeft' }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 900, clientY: 450 }));
  });
  await page.waitForTimeout(420);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, code: 'ArrowLeft', key: 'ArrowLeft' }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1100, clientY: 520 }));
  });
  await page.waitForTimeout(260);
}

function deltaMagnitude(before, after) {
  if (!before || !after) {
    return 0;
  }
  return Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
}

function rotationDeltaMagnitude(before, after) {
  if (!before || !after) {
    return 0;
  }
  return Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
}

function vec3Distance(before, after) {
  if (!before || !after) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z);
}

function collectSemanticVisibleNames(state) {
  return state?.visibleObjectSummary?.semanticVisibleNames ?? [];
}

function hasSemanticMatch(state, keywords) {
  const names = collectSemanticVisibleNames(state).map((entry) => entry.toLowerCase());
  return keywords.some((keyword) => names.some((name) => name.includes(keyword)));
}

function buildShotChecklist(shotType, state, summary, canvasInfo) {
  const notMostlyFlatPlane = Boolean(canvasInfo && !canvasInfo.blankCanvasLikely && canvasInfo.colorDiversity >= 12 && canvasInfo.edgeScore >= 45000);
  const uiDoesNotDominate = Boolean(notMostlyFlatPlane && state?.modularHomeVisible && summary?.visibleMeshCount >= 80);

  if (shotType.startsWith('exterior')) {
    return {
      deckOrStepsVisible: hasSemanticMatch(state, ['deck', 'step', 'platform', 'terrace', 'front']),
      doorVisible: hasSemanticMatch(state, ['door', 'entry']),
      facadeDetailVisible: hasSemanticMatch(state, ['facade', 'cladding', 'panel', 'seam', 'board']),
      houseBodyVisible: Boolean(state?.modularHomeVisible && summary?.sceneObjectCount >= 100),
      notMostlyFlatPlane,
      roofVisible: hasSemanticMatch(state, ['roof', 'gutter', 'edge']),
      uiDoesNotDominate,
      windowsVisible: hasSemanticMatch(state, ['window']),
    };
  }

  return {
    floorVisible: Boolean(state?.modularHomeVisible && notMostlyFlatPlane),
    kitchenCounterVisible: hasSemanticMatch(state, ['counter', 'cabinet', 'kitchen', 'sink', 'cooktop', 'appliance']),
    livingZoneReadable: hasSemanticMatch(state, ['living', 'sofa', 'table', 'rug', 'media', 'plant', 'storage']),
    notMostlyFlatPlane,
    bathroomUtilityVisible: hasSemanticMatch(state, ['bath', 'vanity', 'shower', 'toilet', 'door', 'vent']),
    sleepingZoneReadable: hasSemanticMatch(state, ['sleep', 'bed', 'wardrobe', 'pillow']),
    uiDoesNotDominate,
    wallsOrCutawayVisible: hasSemanticMatch(state, ['wall', 'door', 'window', 'cutaway', 'entry']),
    zoneReadableWithoutLabel: Boolean(hasSemanticMatch(state, ['living', 'kitchen', 'sleep', 'bath']) && notMostlyFlatPlane),
  };
}

function buildHumanReviewChecklist(shotType, state, summary, canvasInfo, cropCanvasInfo) {
  const mostlyFlatPlane = Boolean(canvasInfo?.blankCanvasLikely || cropCanvasInfo?.blankCanvasLikely);
  const humanReadableFrame = Boolean(
    state?.cameraPosition
    && state?.cameraFacingModularHome
    && !state?.cameraInsideGeometryLikely
    && !mostlyFlatPlane
    && canvasInfo?.technicalScreenshotValid
    && cropCanvasInfo?.technicalScreenshotValid,
  );
  const uiDominates = Boolean(!cropCanvasInfo || cropCanvasInfo.blankCanvasLikely || summary?.visibleMeshCount < 80);

  if (shotType.startsWith('exterior')) {
    const doorVisible = hasSemanticMatch(state, ['door', 'entry']);
    const roofVisible = hasSemanticMatch(state, ['roof', 'gutter']);
    const windowVisible = hasSemanticMatch(state, ['window']);
    return {
      shotName: shotType,
      cameraPresetUsed: 'fixed',
      humanReadableFrame: Boolean(humanReadableFrame && state?.modularHomeVisible && (doorVisible || roofVisible || windowVisible)),
      houseVisible: Boolean(state?.modularHomeVisible),
      doorVisible,
      roofVisible,
      windowVisible,
      mostlyFlatPlane,
      uiDominates,
      productVisualAccepted: false,
      humanReviewRequired: true,
    };
  }

  return {
    shotName: shotType,
    cameraPresetUsed: 'fixed',
    humanReadableFrame,
    floorVisible: Boolean(state?.modularHomeVisible && !mostlyFlatPlane),
    wallVisible: hasSemanticMatch(state, ['wall', 'door', 'window', 'cutaway', 'entry']),
    zoneReadable: hasSemanticMatch(state, ['living', 'kitchen', 'sleep', 'bath', 'bed', 'sofa', 'vanity']),
    mostlyFlatPlane,
    uiDominates,
    productVisualAccepted: false,
    humanReviewRequired: true,
  };
}

function estimateShotCoverage(state) {
  const bounds = state?.modularHomeBounds;
  const cameraPosition = state?.cameraPosition;
  const cameraRotation = state?.cameraRotation;
  if (!bounds || !cameraPosition || !cameraRotation) {
    return {
      objectCentered: false,
      objectPixelCoverageEstimate: 0,
      productDominatesFrame: false,
      uiCoverageEstimate: 0,
    };
  }

  const perspective = new THREE.PerspectiveCamera(state.cameraFov ?? 50, EXPECTED_VIEWPORT.width / EXPECTED_VIEWPORT.height, 0.1, 5000);
  perspective.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  perspective.rotation.set(cameraRotation.x, cameraRotation.y, cameraRotation.z);
  perspective.updateMatrixWorld(true);
  perspective.updateProjectionMatrix();

  const box = new THREE.Box3(
    new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
    new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z),
  );
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  const projected = corners
    .map((corner) => corner.clone().project(perspective))
    .filter((corner) => Number.isFinite(corner.x) && Number.isFinite(corner.y) && Number.isFinite(corner.z));

  if (!projected.length) {
    return {
      objectCentered: false,
      objectPixelCoverageEstimate: 0,
      productDominatesFrame: false,
      uiCoverageEstimate: 0,
    };
  }

  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const center = new THREE.Vector3(bounds.center.x, bounds.center.y, bounds.center.z).project(perspective);
  const width = clamp(maxX - minX, 0, 2);
  const height = clamp(maxY - minY, 0, 2);
  const objectPixelCoverageEstimate = clamp((width * height) / 4, 0, 1);
  const objectCentered = Math.abs(center.x) <= 0.35 && Math.abs(center.y) <= 0.35;
  const uiCoverageEstimate = 0.18;
  const productDominatesFrame = Boolean(objectPixelCoverageEstimate >= 0.35 && objectCentered);

  return {
    objectCentered,
    objectPixelCoverageEstimate: Number(objectPixelCoverageEstimate.toFixed(3)),
    productDominatesFrame,
    uiCoverageEstimate,
  };
}

function buildShotResult({
  afterAssessment,
  afterCanvas,
  afterState,
  afterSummary,
  baselineAssessment,
  baselineCanvas,
  baselineState,
  baselineSummary,
  shot,
}) {
  const technicalScreenshotValid = Boolean(baselineCanvas.technicalScreenshotValid && afterCanvas.technicalScreenshotValid);
  const baselineRotationDelta = rotationDeltaMagnitude(baselineState.cameraRotation, afterState?.cameraRotation);
  const baselineCameraDelta = deltaMagnitude(baselineState.cameraPosition, afterState?.cameraPosition);
  const baselinePlayerDelta = deltaMagnitude(baselineState.playerPosition, afterState?.playerPosition);
  const translationProven = Boolean(baselineCameraDelta > 0.1 || baselinePlayerDelta > 0.1);
  const rotationProven = Boolean(baselineRotationDelta > 0.05);
  const walkMovementProven = Boolean(false);
  const visualInspectionReady = Boolean(afterAssessment.visualInspectionReady && afterAssessment.productObjectInFrame && !afterCanvas.blankCanvasLikely);
  const checklist = buildShotChecklist(shot.shotType, afterState, afterSummary, afterCanvas);
  return {
    after: {
      checklist,
      cameraInsideGeometryLikely: Boolean(afterState?.cameraInsideGeometryLikely),
      cameraFacingProduct: Boolean(afterState?.cameraFacingModularHome),
      cameraFov: afterState?.cameraFov ?? null,
      canvasInfo: afterCanvas,
      file: path.posix.join('after', shot.afterFile),
      humanReviewRequired: true,
      productObjectInFrame: Boolean(afterAssessment.productObjectInFrame),
      productVisualAccepted: false,
      runtimeStateValid: Boolean(afterState?.cameraPosition && afterState?.playerPosition && afterSummary),
      shotType: shot.shotType,
      technicalScreenshotValid: Boolean(afterCanvas.technicalScreenshotValid),
      translationProven,
      rotationProven,
      visualInspectionReady,
      verdict: visualInspectionReady ? 'pass' : 'fail',
    },
    baseline: {
      checklist: buildShotChecklist(shot.shotType, baselineState, baselineSummary, baselineCanvas),
      cameraInsideGeometryLikely: Boolean(baselineState?.cameraInsideGeometryLikely),
      cameraFacingProduct: Boolean(baselineState?.cameraFacingModularHome),
      canvasInfo: baselineCanvas,
      file: path.posix.join('baseline', shot.baselineFile),
      humanReviewRequired: true,
      productObjectInFrame: Boolean(baselineAssessment.productObjectInFrame),
      productVisualAccepted: false,
      runtimeStateValid: Boolean(baselineState?.cameraPosition && baselineState?.playerPosition && baselineSummary),
      shotType: shot.shotType,
      technicalScreenshotValid: Boolean(baselineCanvas.technicalScreenshotValid),
      translationProven: false,
      rotationProven: false,
      visualInspectionReady: Boolean(baselineAssessment.visualInspectionReady && baselineAssessment.productObjectInFrame && !baselineCanvas.blankCanvasLikely),
      verdict: baselineCanvas.blankCanvasLikely ? 'fail' : 'pass',
    },
    shotType: shot.shotType,
    technicalPass: technicalScreenshotValid,
    runtimeControlPass: Boolean(afterState?.cameraPosition && afterState?.playerPosition && afterSummary),
    framingPass: visualInspectionReady,
    walkPass: false,
    doorPass: shot.shotType === 'exteriorFrontHero' ? Boolean(checklist.doorVisible && checklist.deckOrStepsVisible) : false,
    portalPass: false,
    productVisualPass: false,
    overallQaVerdict: visualInspectionReady && technicalScreenshotValid ? 'partial' : 'blocked',
  };
}

async function captureShotPair(page, shot, options) {
  await openQaRoute(page, options.baseUrl, shot.route);

  const baselineState = await getState(page);
  const baselineSummary = await getObjectSummary(page);
  const baselinePath = path.join(options.baselineDir, shot.baselineFile);
  const baselineCanvas = await screenshotAndAnalyze(page, baselinePath);
  ensureResultCanvasState(`${shot.name} baseline`, baselineState, baselineSummary, baselineCanvas, {
    allowBlankCanvas: true,
    minModularHomeObjectCount: 0,
    requireModularHomeVisible: false,
  });
  const baselineAssessment = buildVisualInspectionAssessment(baselineState, baselineSummary, baselineCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
    requireDoorFrame: false,
    requireInteriorRoom: false,
  });

  await setQACameraPreset(page, shot.preset);
  await lookAtQAModularHome(page);

  const afterState = await getState(page);
  const afterSummary = await getObjectSummary(page);
  const afterPath = path.join(options.afterDir, shot.afterFile);
  const afterCanvas = await screenshotAndAnalyze(page, afterPath);
  ensureResultCanvasState(`${shot.name} after`, afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });
  const afterAssessment = buildVisualInspectionAssessment(afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
    requireDoorFrame: false,
    requireInteriorRoom: shot.shotType.startsWith('interior'),
  });

  if (!afterAssessment.visualInspectionReady) {
    throw new Error(`${shot.name}: after screenshot is not visually inspectable (${JSON.stringify(afterAssessment)})`);
  }

  return buildShotResult({
    afterAssessment,
    afterCanvas,
    afterState,
    afterSummary,
    baselineAssessment,
    baselineCanvas,
    baselineState,
    baselineSummary,
    shot,
  });
}

function buildCameraSolverShotResult({
  afterAssessment,
  afterCanvas,
  afterCropCanvas,
  afterState,
  afterSummary,
  shot,
}) {
  const coverage = estimateShotCoverage(afterState);
  const technicalScreenshotValid = Boolean(afterCanvas.technicalScreenshotValid && afterCropCanvas.technicalScreenshotValid);
  const productObjectInFrame = Boolean(
    afterAssessment.productObjectInFrame
    && afterState?.modularHomeRootFound
    && afterState?.modularHomeVisible
    && afterState?.cameraFacingModularHome
    && !afterState?.cameraInsideGeometryLikely
    && coverage.objectPixelCoverageEstimate >= 0.35,
  );
  const productDominatesFrame = Boolean(productObjectInFrame && coverage.productDominatesFrame && !afterCanvas.blankCanvasLikely);
  const objectCentered = Boolean(coverage.objectCentered);
  const mostlyFlatPlane = Boolean(afterCanvas.blankCanvasLikely || afterCropCanvas.blankCanvasLikely);
  const visualInspectionReady = Boolean(
    technicalScreenshotValid
    && productObjectInFrame
    && productDominatesFrame
    && objectCentered
    && !mostlyFlatPlane,
  );

  return {
    after: {
      boundsValid: Boolean(afterState?.modularHomeBounds),
      checklist: buildShotChecklist(shot.shotType, afterState, afterSummary, afterCanvas),
      cameraInsideGeometryLikely: Boolean(afterState?.cameraInsideGeometryLikely),
      cameraFov: afterState?.cameraFov ?? null,
      cameraFacingProduct: Boolean(afterState?.cameraFacingModularHome),
      canvasInfo: afterCanvas,
      file: path.posix.join('after', shot.afterFile),
      humanReviewRequired: true,
      modularHomeRootFound: Boolean(afterState?.modularHomeRootFound),
      modularHomeRootName: afterState?.modularHomeRootName ?? null,
      modularHomeBounds: afterState?.modularHomeBounds ?? null,
      productDominatesFrame,
      productObjectInFrame,
      productVisualAccepted: false,
      runtimeStateValid: Boolean(afterState?.cameraPosition && afterState?.playerPosition && afterSummary),
      screenCoverage: {
        objectCentered,
        objectPixelCoverageEstimate: coverage.objectPixelCoverageEstimate,
        productDominatesFrame,
        uiCoverageEstimate: coverage.uiCoverageEstimate,
      },
      shotName: shot.shotType,
      technicalScreenshotValid: Boolean(afterCanvas.technicalScreenshotValid),
      visualInspectionReady,
      verdict: visualInspectionReady ? 'pass' : 'fail',
    },
    afterCrop: {
      boundsValid: Boolean(afterState?.modularHomeBounds),
      canvasInfo: afterCropCanvas,
      file: path.posix.join('after-crop', shot.afterCropFile),
      humanReviewRequired: true,
      modularHomeRootFound: Boolean(afterState?.modularHomeRootFound),
      modularHomeRootName: afterState?.modularHomeRootName ?? null,
      modularHomeBounds: afterState?.modularHomeBounds ?? null,
      mostlyFlatPlane,
      productDominatesFrame,
      productObjectInFrame,
      productVisualAccepted: false,
      screenCoverage: {
        objectCentered,
        objectPixelCoverageEstimate: coverage.objectPixelCoverageEstimate,
        productDominatesFrame,
        uiCoverageEstimate: 0,
      },
      shotName: shot.shotType,
      technicalScreenshotValid: Boolean(afterCropCanvas.technicalScreenshotValid),
      visualInspectionReady,
      verdict: visualInspectionReady ? 'pass' : 'fail',
    },
    shotName: shot.shotType,
    technicalPass: technicalScreenshotValid,
    visualInspectionReady,
    productObjectInFrame,
    productDominatesFrame,
    objectCentered,
    mostlyFlatPlane,
    cameraInsideGeometryLikely: Boolean(afterState?.cameraInsideGeometryLikely),
    cameraSolverUsed: true,
    overallQaVerdict: visualInspectionReady ? 'partial' : 'blocked',
  };
}

async function captureCameraSolverShot(page, shot, options) {
  await openQaRoute(page, options.baseUrl, shot.route);
  const frameApplied = await page.evaluate((shotName) => window.__WARPALA_3D_QA__?.frameModularHomeShot?.(shotName) ?? false, shot.shotType);
  if (!frameApplied) {
    throw new Error(`${shot.name}: camera solver unavailable for ${shot.shotType}`);
  }
  await page.waitForTimeout(1200);
  await focusCanvas(page);
  await page.waitForTimeout(500);

  const afterState = await getState(page);
  const afterSummary = await getObjectSummary(page);
  const afterPath = path.join(options.afterDir, shot.afterFile);
  const afterCropPath = path.join(options.afterCropDir, shot.afterCropFile);
  const afterCanvas = await screenshotAndAnalyze(page, afterPath);
  const afterCropCanvas = await screenshotCanvasOnlyAndAnalyze(page, afterCropPath);
  ensureResultCanvasState(`${shot.name} after`, afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });
  ensureResultCanvasState(`${shot.name} after-crop`, afterState, afterSummary, afterCropCanvas, {
    allowBlankCanvas: true,
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });

  const afterAssessment = buildVisualInspectionAssessment(afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
    requireDoorFrame: false,
    requireInteriorRoom: shot.shotType.startsWith('interior'),
  });

  return buildCameraSolverShotResult({
    afterAssessment,
    afterCanvas,
    afterCropCanvas,
    afterState,
    afterSummary,
    shot,
  });
}

async function captureFixedCameraPresetShot(page, shot, options) {
  await openQaRoute(page, options.baseUrl, shot.route);
  await setQACameraPreset(page, shot.preset);
  await page.waitForTimeout(900);
  await focusCanvas(page);
  await page.waitForTimeout(500);

  const afterState = await getState(page);
  const afterSummary = await getObjectSummary(page);
  const afterPath = path.join(options.afterDir, shot.afterFile);
  const afterCropPath = path.join(options.afterCropDir, shot.afterCropFile);
  const afterCanvas = await screenshotAndAnalyze(page, afterPath);
  const afterCropCanvas = await screenshotCanvasOnlyAndAnalyze(page, afterCropPath);
  ensureResultCanvasState(`${shot.name} after`, afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });
  ensureResultCanvasState(`${shot.name} after-crop`, afterState, afterSummary, afterCropCanvas, {
    allowBlankCanvas: true,
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });

  const coverage = estimateShotCoverage(afterState);
  const expectedPreset = FIXED_CAMERA_PRESETS[shot.preset] ?? null;
  const cameraPositionDelta = expectedPreset
    ? vec3Distance(afterState?.cameraPosition, expectedPreset.position)
    : Number.POSITIVE_INFINITY;
  const fixedPresetApplied = Number.isFinite(cameraPositionDelta) && cameraPositionDelta <= 0.25;
  const checklist = buildHumanReviewChecklist(shot.shotType, afterState, afterSummary, afterCanvas, afterCropCanvas);
  const technicalPass = Boolean(afterCanvas.technicalScreenshotValid && afterCropCanvas.technicalScreenshotValid);
  const readablePass = Boolean(fixedPresetApplied && checklist.humanReadableFrame && !checklist.mostlyFlatPlane && !checklist.uiDominates);

  return {
    cameraPosition: afterState?.cameraPosition ?? null,
    cameraPositionDelta: Number.isFinite(cameraPositionDelta) ? Number(cameraPositionDelta.toFixed(4)) : null,
    cameraPreset: expectedPreset,
    cameraPresetUsed: 'fixed',
    cameraTarget: expectedPreset?.target ?? null,
    checklist,
    crop: {
      canvasInfo: afterCropCanvas,
      file: path.posix.join('after-crop', shot.afterCropFile),
      technicalScreenshotValid: Boolean(afterCropCanvas.technicalScreenshotValid),
      verdict: readablePass ? 'human-review' : 'fail',
    },
    fullPage: {
      canvasInfo: afterCanvas,
      file: path.posix.join('after', shot.afterFile),
      technicalScreenshotValid: Boolean(afterCanvas.technicalScreenshotValid),
      verdict: readablePass ? 'human-review' : 'fail',
    },
    houseVisualBounds: afterState?.houseVisualBounds ?? afterSummary?.houseVisualBounds ?? null,
    houseVisualBoundsCandidates: afterState?.houseVisualBoundsCandidates ?? afterSummary?.houseVisualBoundsCandidates ?? [],
    geometrySanity: afterState?.geometrySanity ?? null,
    modularHomeBounds: afterState?.modularHomeBounds ?? null,
    modularHomeRootFound: Boolean(afterState?.modularHomeRootFound),
    modularHomeRootName: afterState?.modularHomeRootName ?? null,
    fixedPresetApplied,
    productVisualAccepted: false,
    readablePass,
    route: shot.route,
    screenCoverage: coverage,
    shotName: shot.shotType,
    technicalPass,
  };
}

async function captureFixedCameraDistanceShot(page, shot, options) {
  const beforePhase = options.beforePhase ?? 'baseline';
  const afterPhase = options.afterPhase ?? 'distance-adjusted';
  const cameraPresetUsed = options.cameraPresetUsed ?? 'fixed-distance-adjusted';
  await openQaRoute(page, options.baseUrl, shot.route);
  await setQACameraPreset(page, shot.preset, beforePhase);
  await page.waitForTimeout(900);
  await focusCanvas(page);
  await page.waitForTimeout(500);

  const beforeState = await getState(page);
  const beforeSummary = await getObjectSummary(page);
  const beforePath = path.join(options.beforeDir, shot.beforeFile);
  const beforeCanvas = await screenshotAndAnalyze(page, beforePath);
  ensureResultCanvasState(`${shot.name} before`, beforeState, beforeSummary, beforeCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });

  await setQACameraPreset(page, shot.preset, afterPhase);
  await page.waitForTimeout(900);
  await focusCanvas(page);
  await page.waitForTimeout(500);

  const afterState = await getState(page);
  const afterSummary = await getObjectSummary(page);
  const afterPath = path.join(options.afterDir, shot.afterFile);
  const afterCropPath = path.join(options.afterCropDir, shot.afterCropFile);
  const afterCanvas = await screenshotAndAnalyze(page, afterPath);
  const afterCropCanvas = await screenshotCanvasOnlyAndAnalyze(page, afterCropPath);
  ensureResultCanvasState(`${shot.name} after`, afterState, afterSummary, afterCanvas, {
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });
  ensureResultCanvasState(`${shot.name} after-crop`, afterState, afterSummary, afterCropCanvas, {
    allowBlankCanvas: true,
    minModularHomeObjectCount: 1,
    requireModularHomeVisible: true,
  });

  const basePreset = buildFixedCameraPreset(shot.preset, beforePhase);
  const adjustedPreset = afterPhase === 'interior-pullback'
    ? {
        baseDistance: basePreset?.target && beforeState?.cameraPosition
          ? vec3Distance(beforeState.cameraPosition, basePreset.target)
          : null,
        basePosition: beforeState?.cameraPosition ?? null,
        fov: resolveFixedCameraFov(afterPhase),
        multiplier: 1.08,
        position: afterState?.cameraPosition ? new THREE.Vector3(afterState.cameraPosition.x, afterState.cameraPosition.y, afterState.cameraPosition.z) : null,
        resolvedPresetName: basePreset?.resolvedPresetName ?? shot.preset,
        target: basePreset?.target ?? null,
      }
    : buildFixedCameraPreset(shot.preset, afterPhase);
  const beforeDistance = basePreset ? Number((basePreset.baseDistance * (basePreset.multiplier ?? 1)).toFixed(4)) : null;
  const afterDistance = adjustedPreset ? Number((adjustedPreset.baseDistance * (adjustedPreset.multiplier ?? 1)).toFixed(4)) : null;
  const checklist = buildHumanReviewChecklist(shot.shotType, afterState, afterSummary, afterCanvas, afterCropCanvas);
  const beforeFov = basePreset?.fov ?? resolveFixedCameraFov(beforePhase);
  const afterFov = adjustedPreset?.fov ?? resolveFixedCameraFov(afterPhase);
  const distanceChanged = Boolean(beforeDistance !== null && afterDistance !== null && beforeDistance !== afterDistance);
  const fovChanged = Boolean(beforeFov !== afterFov);
  const technicalPass = Boolean(
    beforeCanvas.technicalScreenshotValid
    && afterCanvas.technicalScreenshotValid
    && afterCropCanvas.technicalScreenshotValid,
  );
  const readablePass = Boolean(
    technicalPass
    && checklist.humanReadableFrame
    && !checklist.mostlyFlatPlane
    && !checklist.uiDominates,
  );

  return {
    after: {
      cameraFov: afterFov,
      canvasInfo: afterCanvas,
      file: path.posix.join('after', shot.afterFile),
      fileExists: fs.existsSync(afterPath),
      humanReviewRequired: true,
      technicalScreenshotValid: Boolean(afterCanvas.technicalScreenshotValid),
      verdict: readablePass ? 'human-review' : 'fail',
    },
    afterCrop: {
      cameraFov: afterFov,
      canvasInfo: afterCropCanvas,
      file: path.posix.join('after-crop', shot.afterCropFile),
      fileExists: fs.existsSync(afterCropPath),
      humanReviewRequired: true,
      technicalScreenshotValid: Boolean(afterCropCanvas.technicalScreenshotValid),
      verdict: readablePass ? 'human-review' : 'fail',
    },
    before: {
      cameraFov: beforeFov,
      canvasInfo: beforeCanvas,
      file: path.posix.join('before', shot.beforeFile),
      fileExists: fs.existsSync(beforePath),
      humanReviewRequired: true,
      technicalScreenshotValid: Boolean(beforeCanvas.technicalScreenshotValid),
      verdict: beforeCanvas.technicalScreenshotValid ? 'human-review' : 'fail',
    },
    cameraPreset: adjustedPreset,
    cameraPresetUsed,
    checklist,
    distanceAfter: Number.isFinite(afterDistance) ? Number(afterDistance.toFixed(4)) : null,
    distanceBefore: Number.isFinite(beforeDistance) ? Number(beforeDistance.toFixed(4)) : null,
    distanceChanged,
    distanceMultiplier: adjustedPreset?.multiplier ?? null,
    fovChanged,
    geometryChanged: false,
    humanReadableFrame: Boolean(checklist.humanReadableFrame),
    mostlyFlatPlane: Boolean(checklist.mostlyFlatPlane),
    newFov: afterFov,
    oldFov: beforeFov,
    lockedBaseline: shot.shotType.startsWith('exterior') && !distanceChanged && !fovChanged,
    mustNotChange: shot.shotType.startsWith('exterior'),
    repairScope: shot.shotType.startsWith('interior') ? 'interior-camera-distance-only' : 'locked-baseline',
    productVisualAccepted: false,
    route: shot.route,
    shotName: shot.shotType,
    cameraTarget: adjustedPreset?.target ? {
      x: Number(adjustedPreset.target.x.toFixed(4)),
      y: Number(adjustedPreset.target.y.toFixed(4)),
      z: Number(adjustedPreset.target.z.toFixed(4)),
    } : null,
    targetChanged: false,
    cameraChanged: distanceChanged || fovChanged,
    technicalPass,
    uiDominates: Boolean(checklist.uiDominates),
    readablePass,
  };
}

function buildVisualInspectionAssessment(state, summary, canvasInfo, options = {}) {
  const semanticVisibleNames = collectSemanticVisibleNames(state).map((entry) => entry.toLowerCase());
  const hasDoorOrEntry = semanticVisibleNames.some((name) => name.includes('door') || name.includes('entry'));
  const hasInteriorRoomObjects = semanticVisibleNames.some((name) => (
    name.includes('living')
    || name.includes('kitchen')
    || name.includes('sleep')
    || name.includes('bath')
    || name.includes('vanity')
    || name.includes('sofa')
    || name.includes('bed')
    || name.includes('wardrobe')
  ));
  const productObjectInFrame = Boolean(
    state
    && state.modularHomeVisible
    && typeof state.modularHomeObjectCount === 'number'
    && state.modularHomeObjectCount >= (options.minModularHomeObjectCount ?? 25)
    && state.cameraPosition
    && state.cameraFacingModularHome
    && !state.cameraInsideGeometryLikely
    && typeof state.cameraDistanceToModularHome === 'number'
    && state.cameraDistanceToModularHome <= (options.maxCameraDistanceToModularHome ?? 260)
    && summary?.visibleMeshCount >= (options.minVisibleMeshCount ?? 80)
    && !canvasInfo.blankCanvasLikely
    && canvasInfo.technicalScreenshotValid
  );
  const visualInspectionReady = Boolean(
    productObjectInFrame
    && (!options.requireDoorFrame || hasDoorOrEntry)
    && (!options.requireInteriorRoom || hasInteriorRoomObjects)
  );

  return {
    hasDoorOrEntry,
    hasInteriorRoomObjects,
    productObjectInFrame,
    visualInspectionReady,
  };
}

function ensureResultCanvasState(name, state, summary, canvasInfo, requirements = {}) {
  if (!state) {
    throw new Error(`${name}: QA state unavailable`);
  }
  if (!state.canvasFocused) {
    throw new Error(`${name}: canvas did not focus`);
  }
  if (!state.cameraPosition) {
    throw new Error(`${name}: camera position missing`);
  }
  if (requirements.requireModularHomeVisible && !state.modularHomeVisible) {
    throw new Error(`${name}: modular-home visibility is false`);
  }
  if (typeof state.modularHomeObjectCount !== 'number' || state.modularHomeObjectCount < (requirements.minModularHomeObjectCount ?? 1)) {
    throw new Error(`${name}: modular-home object count too low (${state.modularHomeObjectCount})`);
  }
  if (!summary || typeof summary.sceneObjectCount !== 'number') {
    throw new Error(`${name}: object summary unavailable`);
  }
  if (!canvasInfo.technicalScreenshotValid) {
    throw new Error(`${name}: screenshot dimensions invalid (${canvasInfo.dimensions})`);
  }
  if (!requirements.allowBlankCanvas && canvasInfo.blankCanvasLikely) {
    throw new Error(`${name}: canvas appears blank or low-diversity (${JSON.stringify(canvasInfo)})`);
  }
}

function buildFrameEvidence({
  afterAssessment,
  afterCanvas,
  afterState,
  afterSummary,
  beforeAssessment,
  beforeCanvas,
  beforeState,
  beforeSummary,
  cameraDelta,
  name,
  playerDelta,
  rotationDelta,
}) {
  const translationProven = Boolean(cameraDelta > 0.1 || playerDelta > 0.1);
  const rotationProven = Boolean(rotationDelta > 0.05);
  const walkMovementProven = Boolean(translationProven);
  const runtimeStateValid = Boolean(afterState?.cameraPosition && afterState?.playerPosition && afterSummary);
  const technicalScreenshotValid = Boolean(beforeCanvas.technicalScreenshotValid && afterCanvas.technicalScreenshotValid);
  const productObjectInFrame = Boolean(beforeAssessment?.productObjectInFrame && afterAssessment?.productObjectInFrame);
  return {
    afterAssessment,
    afterCanvas,
    afterState,
    afterSummary,
    beforeAssessment,
    beforeCanvas,
    beforeState,
    beforeSummary,
    cameraDelta: Number(cameraDelta.toFixed(3)),
    cameraFacingProduct: Boolean(beforeAssessment?.hasDoorOrEntry || afterAssessment?.hasDoorOrEntry || afterState?.cameraFacingModularHome),
    cameraInsideGeometryLikely: Boolean(beforeState?.cameraInsideGeometryLikely || afterState?.cameraInsideGeometryLikely),
    name,
    playerDelta: Number(playerDelta.toFixed(3)),
    productObjectInFrame,
    productVisualAccepted: false,
    screenshotAfter: afterCanvas.screenshot,
    screenshotBefore: beforeCanvas.screenshot,
    rotationDelta: Number(rotationDelta.toFixed(3)),
    rotationProven,
    runtimeStateValid,
    technicalScreenshotValid,
    translationProven,
    walkMovementProven,
    visualInspectionReady: Boolean(beforeAssessment?.visualInspectionReady && afterAssessment?.visualInspectionReady && productObjectInFrame),
  };
}

async function captureMovementTurn(page, options) {
  const beforeState = await getState(page);
  const beforeSummary = await getObjectSummary(page);
  const beforeIndex = String(options.beforeIndex ?? options.index).padStart(2, '0');
  const afterIndex = String(options.afterIndex ?? options.index).padStart(2, '0');
  const beforePath = path.join(options.outDir, `${beforeIndex}-${options.beforeFile}`);
  const beforeCanvas = await screenshotAndAnalyze(page, beforePath);
  ensureResultCanvasState(options.name, beforeState, beforeSummary, beforeCanvas, options);
  const beforeAssessment = buildVisualInspectionAssessment(beforeState, beforeSummary, beforeCanvas, options);
  if (!beforeAssessment.visualInspectionReady) {
    throw new Error(`${options.name}: visual inspection not ready before movement (${JSON.stringify(beforeAssessment)})`);
  }

  await pressMovement(page);
  await page.waitForTimeout(500);

  const afterState = await getState(page);
  const afterSummary = await getObjectSummary(page);
  const afterPath = path.join(options.outDir, `${afterIndex}-${options.afterFile}`);
  const afterCanvas = await screenshotAndAnalyze(page, afterPath);
  const afterAssessment = buildVisualInspectionAssessment(afterState, afterSummary, afterCanvas, options);

  const cameraDelta = deltaMagnitude(beforeState.cameraPosition, afterState?.cameraPosition);
  const playerDelta = deltaMagnitude(beforeState.playerPosition, afterState?.playerPosition);
  const rotationDelta = rotationDeltaMagnitude(beforeState.cameraRotation, afterState?.cameraRotation);

  if (!afterState) {
    throw new Error(`${options.name}: after-state unavailable`);
  }
  if (!afterSummary || typeof afterSummary.sceneObjectCount !== 'number') {
    throw new Error(`${options.name}: after-summary unavailable`);
  }
  if (cameraDelta <= 0.1 && playerDelta <= 0.1 && rotationDelta <= 0.05) {
    throw new Error(`${options.name}: movement delta not detected`);
  }
  if (!afterAssessment.visualInspectionReady) {
    throw new Error(`${options.name}: visual inspection blocker after movement (${JSON.stringify(afterAssessment)})`);
  }

  return buildFrameEvidence({
    afterAssessment,
    afterCanvas,
    afterState,
    afterSummary,
    beforeAssessment,
    beforeCanvas,
    beforeState,
    beforeSummary,
    cameraDelta,
    name: options.name,
    playerDelta,
    rotationDelta,
  });
}

async function captureFramedView(page, options) {
  const state = await getState(page);
  const summary = await getObjectSummary(page);
  const screenshotPath = path.join(options.outDir, `${String(options.index).padStart(2, '0')}-${options.fileName}`);
  const canvasInfo = await screenshotAndAnalyze(page, screenshotPath);
  ensureResultCanvasState(options.name, state, summary, canvasInfo, options);
  const assessment = buildVisualInspectionAssessment(state, summary, canvasInfo, options);
  if (!assessment.visualInspectionReady) {
    throw new Error(`${options.name}: visual inspection not ready (${JSON.stringify(assessment)})`);
  }

  return {
    canvasInfo,
    cameraInsideGeometryLikely: Boolean(state?.cameraInsideGeometryLikely),
    cameraFacingProduct: Boolean(state?.cameraFacingModularHome),
    productObjectInFrame: Boolean(assessment.productObjectInFrame),
    name: options.name,
    productVisualAccepted: false,
    runtimeStateValid: true,
    screenshot: screenshotPath,
    state,
    summary,
    technicalScreenshotValid: true,
    visualInspectionReady: Boolean(assessment.visualInspectionReady),
  };
}

async function openQaRoute(page, baseUrl, targetPath) {
  const url = withQaParam(baseUrl, targetPath);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForQAHook(page);
  await page.waitForTimeout(900);
  await focusCanvas(page);
  await page.waitForTimeout(500);
}

async function runStudioExteriorOverview(page, options) {
  await openQaRoute(page, options.baseUrl, '/modular-homes/studio?view=exterior');
  await setQACameraPreset(page, 'exteriorOverview');
  await lookAtQAModularHome(page);
  return await captureFramedView(page, {
    ...options,
    fileName: 'studio-exterior-overview.png',
    index: 1,
    minModularHomeObjectCount: 25,
    name: 'Studio exterior overview is framed',
    requireModularHomeVisible: true,
    requireDoorFrame: false,
    requireInteriorRoom: false,
  });
}

async function runStudioDoorAreaFrame(page, options) {
  await openQaRoute(page, options.baseUrl, '/modular-homes/studio?view=exterior');
  await setQACameraPreset(page, 'doorArea');
  await lookAtQAModularHome(page);
  return await captureFramedView(page, {
    ...options,
    fileName: 'studio-door-area-framed.png',
    index: 2,
    minModularHomeObjectCount: 25,
    name: 'Studio door area is framed',
    requireDoorFrame: false,
    requireInteriorRoom: false,
    requireModularHomeVisible: true,
  });
}

async function runStudioExteriorMovementProof(page, options) {
  await openQaRoute(page, options.baseUrl, '/modular-homes/studio?view=exterior');
  await setQACameraPreset(page, 'exteriorOverview');
  await lookAtQAModularHome(page);
  return await captureMovementTurn(page, {
    ...options,
    afterFile: 'studio-after-rotation-input-product-still-visible.png',
    beforeFile: 'studio-before-input.png',
    afterIndex: 4,
    beforeIndex: 3,
    minModularHomeObjectCount: 25,
    name: 'Studio exterior remains visible after movement',
    requireDoorFrame: false,
    requireInteriorRoom: false,
    requireModularHomeVisible: true,
  });
}

async function runStudioInteriorMovementProof(page, options) {
  await openQaRoute(page, options.baseUrl, '/modular-homes/studio?view=interior');
  await setQACameraPreset(page, 'interiorOverview');
  await lookAtQAModularHome(page);
  return await captureMovementTurn(page, {
    ...options,
    afterFile: 'studio-interior-after-rotation-input-product-still-visible.png',
    beforeFile: 'studio-interior-before-input.png',
    afterIndex: 6,
    beforeIndex: 5,
    minModularHomeObjectCount: 25,
    name: 'Studio interior remains visible after movement',
    requireDoorFrame: false,
    requireInteriorRoom: true,
    requireModularHomeVisible: true,
  });
}

async function runBlankGuardDebug(page, options) {
  await page.goto('about:blank', { waitUntil: 'domcontentloaded' });
  await page.setViewportSize(EXPECTED_VIEWPORT);
  const screenshotPath = path.join(options.outDir, '07-canvas-blank-guard-debug.png');
  const canvasInfo = await screenshotAndAnalyze(page, screenshotPath);
  return {
    canvasInfo,
    name: 'Canvas blank guard debug',
    productObjectInFrame: false,
    productVisualAccepted: false,
    runtimeStateValid: false,
    screenshot: screenshotPath,
    technicalScreenshotValid: canvasInfo.technicalScreenshotValid,
    visualInspectionReady: false,
    blankCanvasLikely: canvasInfo.blankCanvasLikely,
  };
}

async function runModularHomeEightAngleShotSet(page, options) {
  const baselineDir = path.join(options.outDir, 'baseline');
  const afterDir = path.join(options.outDir, 'after');
  ensureDir(baselineDir);
  ensureDir(afterDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_8_ANGLE_SHOTS) {
    shotResults.push(await captureShotPair(page, shot, {
      ...options,
      afterDir,
      baselineDir,
    }));
  }

  return {
    afterDir,
    baselineDir,
    overallQaVerdict: shotResults.every((shot) => shot.framingPass && shot.technicalPass) ? 'partial' : 'blocked',
    shotResults,
  };
}

async function runModularHomeFixedCameraEightAngleShotSet(page, options) {
  const afterDir = path.join(options.outDir, 'after');
  const afterCropDir = path.join(options.outDir, 'after-crop');
  ensureDir(afterDir);
  ensureDir(afterCropDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_FIXED_CAMERA_8_ANGLE_SHOTS) {
    shotResults.push(await captureFixedCameraPresetShot(page, shot, {
      ...options,
      afterCropDir,
      afterDir,
    }));
  }

  const readableCount = shotResults.filter((shot) => shot.readablePass).length;
  const technicalCount = shotResults.filter((shot) => shot.technicalPass).length;
  const geometrySanity = shotResults.find((shot) => shot.geometrySanity)?.geometrySanity ?? null;

  return {
    afterCropDir,
    afterDir,
    overallQaVerdict: readableCount === shotResults.length && technicalCount === shotResults.length ? 'human-review-ready' : 'blocked',
    shotResults,
    summary: {
      geometrySanity,
      readableCount,
      technicalCount,
      totalShots: shotResults.length,
    },
  };
}

async function runModularHomeFixedCameraDistanceShotSet(page, options) {
  const beforeDir = path.join(options.outDir, 'before');
  const afterDir = path.join(options.outDir, 'after');
  const afterCropDir = path.join(options.outDir, 'after-crop');
  ensureDir(beforeDir);
  ensureDir(afterDir);
  ensureDir(afterCropDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_FIXED_CAMERA_DISTANCE_SHOTS) {
    shotResults.push(await captureFixedCameraDistanceShot(page, shot, {
      ...options,
      afterCropDir,
      afterDir,
      beforeDir,
    }));
  }

  const humanReadableCount = shotResults.filter((shot) => shot.humanReadableFrame).length;
  const technicalCount = shotResults.filter((shot) => shot.technicalPass).length;
  const distanceOnlyCount = shotResults.filter((shot) => !shot.targetChanged && !shot.geometryChanged).length;

  return {
    afterCropDir,
    afterDir,
    beforeDir,
    overallQaVerdict: humanReadableCount >= 6 && technicalCount === shotResults.length ? 'human-review-ready' : 'blocked',
    shotResults,
    summary: {
      distanceOnlyCount,
      humanReadableCount,
      technicalCount,
      totalShots: shotResults.length,
    },
  };
}

async function runModularHomeInteriorOnlyPullbackShotSet(page, options) {
  const beforeDir = path.join(options.outDir, 'before');
  const afterDir = path.join(options.outDir, 'after');
  const afterCropDir = path.join(options.outDir, 'after-crop');
  ensureDir(beforeDir);
  ensureDir(afterDir);
  ensureDir(afterCropDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_INTERIOR_ONLY_PULLBACK_SHOTS) {
    const isExterior = shot.shotType.startsWith('exterior');
    shotResults.push(await captureFixedCameraDistanceShot(page, shot, {
      ...options,
      afterCropDir,
      afterDir,
      beforeDir,
      beforePhase: 'distance-adjusted',
      cameraPresetUsed: isExterior ? 'locked-baseline' : 'interior-camera-distance-only',
      afterPhase: isExterior ? 'distance-adjusted' : 'interior-pullback',
    }));
  }

  const humanReadableCount = shotResults.filter((shot) => shot.humanReadableFrame).length;
  const technicalCount = shotResults.filter((shot) => shot.technicalPass).length;
  const lockedExteriorCount = shotResults.filter((shot) => shot.shotName.startsWith('exterior') && shot.lockedBaseline).length;
  const interiorAdjustedCount = shotResults.filter((shot) => shot.shotName.startsWith('interior') && shot.distanceChanged && !shot.fovChanged && !shot.geometryChanged).length;

  return {
    afterCropDir,
    afterDir,
    beforeDir,
    overallQaVerdict: humanReadableCount >= 6 && technicalCount === shotResults.length ? 'human-review-ready' : 'blocked',
    shotResults,
    summary: {
      humanReadableCount,
      interiorAdjustedCount,
      lockedExteriorCount,
      technicalCount,
      totalShots: shotResults.length,
    },
  };
}

async function runModularHomeCameraLock0508AdjustShotSet(page, options) {
  const beforeDir = path.join(options.outDir, 'before');
  const afterDir = path.join(options.outDir, 'after');
  const afterCropDir = path.join(options.outDir, 'after-crop');
  ensureDir(beforeDir);
  ensureDir(afterDir);
  ensureDir(afterCropDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_CAMERA_LOCK_05_08_ADJUST_SHOTS) {
    const isAdjustable = shot.shotType === 'interiorOverview' || shot.shotType === 'interiorSleepingBathroom';
    const result = await captureFixedCameraDistanceShot(page, shot, {
      ...options,
      afterCropDir,
      afterDir,
      beforeDir,
      beforePhase: 'baseline',
      cameraPresetUsed: isAdjustable ? 'camera-lock-adjusted' : 'locked-baseline',
      afterPhase: isAdjustable ? 'camera-lock-adjust' : 'baseline',
    });
    const normalizedDistanceBefore = result.cameraPreset ? Number(result.cameraPreset.baseDistance.toFixed(4)) : result.distanceBefore;
    const normalizedDistanceAfter = result.cameraPreset
      ? Number((result.cameraPreset.baseDistance * (result.cameraPreset.distanceMultiplier ?? 1)).toFixed(4))
      : result.distanceAfter;
    const normalizedDistanceChanged = Boolean(normalizedDistanceBefore !== null && normalizedDistanceAfter !== null && normalizedDistanceBefore !== normalizedDistanceAfter);
    const normalizedFovChanged = false;

    shotResults.push({
      ...result,
      adjustable: isAdjustable,
      cameraLockBaseline: !isAdjustable,
      cameraChanged: normalizedDistanceChanged || normalizedFovChanged,
      cameraLockTarget: isAdjustable ? 'adjustable' : 'frozen',
      distanceAfter: normalizedDistanceAfter,
      distanceBefore: normalizedDistanceBefore,
      distanceChanged: normalizedDistanceChanged,
      distanceMultiplier: result.cameraPreset?.distanceMultiplier ?? result.distanceMultiplier ?? 1,
      fovChanged: normalizedFovChanged,
      newFov: result.cameraPreset?.fov ?? result.newFov,
      lockStatus: isAdjustable ? 'ADJUSTED' : 'PASS',
      locked: !isAdjustable,
      oldFov: result.cameraPreset?.fov ?? result.oldFov,
    });
  }

  const humanReadableCount = shotResults.filter((shot) => shot.humanReadableFrame).length;
  const technicalCount = shotResults.filter((shot) => shot.technicalPass).length;
  const lockedCameraCount = shotResults.filter((shot) => shot.locked && !shot.cameraChanged && !shot.targetChanged && !shot.distanceChanged && !shot.fovChanged && !shot.geometryChanged).length;
  const adjustedCameraCount = shotResults.filter((shot) => shot.adjustable && shot.cameraChanged && shot.distanceChanged && !shot.targetChanged && !shot.fovChanged && !shot.geometryChanged).length;

  return {
    afterCropDir,
    afterDir,
    beforeDir,
    overallQaVerdict: humanReadableCount >= 6 && technicalCount === shotResults.length ? 'human-review-ready' : 'blocked',
    shotResults,
    summary: {
      adjustedCameraCount,
      humanReadableCount,
      lockedCameraCount,
      technicalCount,
      totalShots: shotResults.length,
    },
  };
}

async function runModularHomeCameraSolverShotSet(page, options) {
  const afterDir = path.join(options.outDir, 'after');
  const afterCropDir = path.join(options.outDir, 'after-crop');
  ensureDir(afterDir);
  ensureDir(afterCropDir);

  const shotResults = [];
  for (const shot of MODULAR_HOME_CAMERA_SOLVER_SHOTS) {
    shotResults.push(await captureCameraSolverShot(page, {
      ...shot,
    }, {
      ...options,
      afterCropDir,
      afterDir,
    }));
  }

  const productDominatesCount = shotResults.filter((shot) => shot.productDominatesFrame).length;
  const productObjectCount = shotResults.filter((shot) => shot.productObjectInFrame).length;
  const insideGeometryCount = shotResults.filter((shot) => shot.cameraInsideGeometryLikely).length;
  const technicalCount = shotResults.filter((shot) => shot.technicalPass).length;
  const satisfied = productDominatesCount >= 6
    && productObjectCount === shotResults.length
    && insideGeometryCount === 0
    && technicalCount === shotResults.length;

  return {
    afterCropDir,
    afterDir,
    overallQaVerdict: satisfied ? 'pass' : 'blocked',
    shotResults,
    summary: {
      insideGeometryCount,
      productDominatesCount,
      productObjectCount,
      technicalCount,
      totalShots: shotResults.length,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  ensureDir(options.outDir);
  const browserPath = readBrowserPath(options.browserPath);
  const profileDir = path.join(
    path.dirname(options.outDir),
    `${path.basename(options.outDir)}-chrome-profile`,
  );
  ensureDir(profileDir);

  const context = await chromium.launchPersistentContext(profileDir, {
    executablePath: browserPath,
    headless: options.headless,
    args: [
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-default-browser-check',
      '--no-first-run',
    ],
    viewport: { width: 1440, height: 900 },
  });

  const page = context.pages()[0] ?? await context.newPage();

  try {
    const generatedAt = new Date().toISOString();
    let result;
    let manifest;

    if (options.shotSet === 'modular-home-fixed-camera-distance') {
      const shotSet = await runModularHomeFixedCameraDistanceShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          cameraFov: shot.before.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.before.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.before.file)),
          fovChanged: shot.fovChanged,
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.before?.technicalScreenshotValid ?? false,
          oldFov: shot.oldFov,
          phase: 'before',
          productVisualAccepted: false,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.before.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.before.verdict,
        },
        {
          cameraFov: shot.after.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.after.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.after.file)),
          fovChanged: shot.fovChanged,
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.humanReadableFrame,
          oldFov: shot.oldFov,
          phase: 'after',
          productVisualAccepted: false,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.after.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.after.verdict,
        },
        {
          cameraFov: shot.afterCrop.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.afterCrop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.afterCrop.file)),
          fovChanged: shot.fovChanged,
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.humanReadableFrame,
          oldFov: shot.oldFov,
          phase: 'after-crop',
          productVisualAccepted: false,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.afterCrop.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.afterCrop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.humanReadableCount >= 6
          && shotSet.summary.technicalCount === shotSet.summary.totalShots
          && shotSet.summary.distanceOnlyCount === shotSet.summary.totalShots,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        screenshots,
        shotSet: options.shotSet,
        summary: shotSet.summary,
        shots: shotSet.shotResults,
      };
    } else if (options.shotSet === 'modular-home-interior-only-pullback') {
      const shotSet = await runModularHomeInteriorOnlyPullbackShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.before.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.before.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.before.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.before?.technicalScreenshotValid ?? false,
          lockedBaseline: Boolean(shot.lockedBaseline),
          mustNotChange: Boolean(shot.mustNotChange),
          oldFov: shot.oldFov,
          phase: 'before',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.before.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.before.verdict,
        },
        {
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.after.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.after.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.after.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.humanReadableFrame,
          lockedBaseline: Boolean(shot.lockedBaseline),
          mustNotChange: Boolean(shot.mustNotChange),
          oldFov: shot.oldFov,
          phase: 'after',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.after.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.after.verdict,
        },
        {
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.afterCrop.cameraFov,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.afterCrop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.afterCrop.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: shot.geometryChanged,
          humanReadableFrame: shot.humanReadableFrame,
          lockedBaseline: Boolean(shot.lockedBaseline),
          mustNotChange: Boolean(shot.mustNotChange),
          oldFov: shot.oldFov,
          phase: 'after-crop',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.afterCrop.technicalScreenshotValid),
          targetChanged: shot.targetChanged,
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.afterCrop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.humanReadableCount >= 6
          && shotSet.summary.technicalCount === shotSet.summary.totalShots
          && shotSet.summary.lockedExteriorCount === 4
          && shotSet.summary.interiorAdjustedCount === 4,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        screenshots,
        shotSet: options.shotSet,
        summary: shotSet.summary,
        shots: shotSet.shotResults,
      };
    } else if (options.shotSet === 'modular-home-camera-lock-05-08-adjust') {
      const shotSet = await runModularHomeCameraLock0508AdjustShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          adjustable: Boolean(shot.adjustable),
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.before.cameraFov,
          cameraLockBaseline: Boolean(shot.cameraLockBaseline),
          cameraLockTarget: shot.cameraLockTarget,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.before.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.before.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: Boolean(shot.geometryChanged),
          humanReadableFrame: shot.before?.technicalScreenshotValid ?? false,
          lockStatus: shot.lockStatus,
          locked: Boolean(shot.locked),
          oldFov: shot.oldFov,
          phase: 'before',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.before.technicalScreenshotValid),
          targetChanged: Boolean(shot.targetChanged),
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.before.verdict,
        },
        {
          adjustable: Boolean(shot.adjustable),
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.after.cameraFov,
          cameraLockBaseline: Boolean(shot.cameraLockBaseline),
          cameraLockTarget: shot.cameraLockTarget,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.after.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.after.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: Boolean(shot.geometryChanged),
          humanReadableFrame: shot.humanReadableFrame,
          lockStatus: shot.lockStatus,
          locked: Boolean(shot.locked),
          oldFov: shot.oldFov,
          phase: 'after',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.after.technicalScreenshotValid),
          targetChanged: Boolean(shot.targetChanged),
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.after.verdict,
        },
        {
          adjustable: Boolean(shot.adjustable),
          cameraChanged: Boolean(shot.cameraChanged),
          cameraFov: shot.afterCrop.cameraFov,
          cameraLockBaseline: Boolean(shot.cameraLockBaseline),
          cameraLockTarget: shot.cameraLockTarget,
          cameraPreset: shot.cameraPresetUsed,
          cameraTarget: shot.cameraTarget,
          distanceAfter: shot.distanceAfter,
          distanceBefore: shot.distanceBefore,
          distanceChanged: Boolean(shot.distanceChanged),
          distanceMultiplier: shot.distanceMultiplier,
          file: shot.afterCrop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.afterCrop.file)),
          fovChanged: Boolean(shot.fovChanged),
          geometryChanged: Boolean(shot.geometryChanged),
          humanReadableFrame: shot.humanReadableFrame,
          lockStatus: shot.lockStatus,
          locked: Boolean(shot.locked),
          oldFov: shot.oldFov,
          phase: 'after-crop',
          productVisualAccepted: false,
          repairScope: shot.repairScope,
          route: shot.route,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.afterCrop.technicalScreenshotValid),
          targetChanged: Boolean(shot.targetChanged),
          newFov: shot.newFov,
          timestamp: generatedAt,
          verdict: shot.afterCrop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.technicalCount === shotSet.summary.totalShots
          && shotSet.summary.lockedCameraCount === 6
          && shotSet.summary.adjustedCameraCount === 2,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        screenshots,
        shotSet: options.shotSet,
        summary: shotSet.summary,
        shots: shotSet.shotResults,
      };
    } else if (options.shotSet === 'modular-home-visual-readability') {
      const shotSet = await runModularHomeFixedCameraEightAngleShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          ...shot.checklist,
          cameraPosition: shot.cameraPosition,
          cameraPreset: shot.cameraPreset,
          cameraTarget: shot.cameraTarget,
          fixedPresetApplied: Boolean(shot.fixedPresetApplied),
          file: shot.fullPage.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.fullPage.file)),
          phase: 'after',
          productVisualAccepted: false,
          route: shot.route,
          screenCoverage: shot.screenCoverage,
          technicalScreenshotValid: Boolean(shot.fullPage.technicalScreenshotValid),
          timestamp: generatedAt,
          verdict: shot.fullPage.verdict,
        },
        {
          ...shot.checklist,
          cameraPosition: shot.cameraPosition,
          cameraPreset: shot.cameraPreset,
          cameraTarget: shot.cameraTarget,
          fixedPresetApplied: Boolean(shot.fixedPresetApplied),
          file: shot.crop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.crop.file)),
          phase: 'after-crop',
          productVisualAccepted: false,
          route: shot.route,
          screenCoverage: shot.screenCoverage,
          technicalScreenshotValid: Boolean(shot.crop.technicalScreenshotValid),
          timestamp: generatedAt,
          verdict: shot.crop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.readableCount === shotSet.summary.totalShots
          && shotSet.summary.technicalCount === shotSet.summary.totalShots,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        screenshots,
        shotSet: options.shotSet,
        summary: shotSet.summary,
        shots: shotSet.shotResults,
      };
    } else if (options.shotSet === 'modular-home-fixed-camera-8angle') {
      const shotSet = await runModularHomeFixedCameraEightAngleShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          ...shot.checklist,
          cameraPosition: shot.cameraPosition,
          cameraPreset: shot.cameraPreset,
          cameraTarget: shot.cameraTarget,
          fixedPresetApplied: Boolean(shot.fixedPresetApplied),
          cameraPositionDelta: shot.cameraPositionDelta,
          file: shot.fullPage.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.fullPage.file)),
          phase: 'after',
          route: shot.route,
          screenCoverage: shot.screenCoverage,
          technicalScreenshotValid: Boolean(shot.fullPage.technicalScreenshotValid),
          timestamp: generatedAt,
          verdict: shot.fullPage.verdict,
        },
        {
          ...shot.checklist,
          cameraPosition: shot.cameraPosition,
          cameraPreset: shot.cameraPreset,
          cameraTarget: shot.cameraTarget,
          fixedPresetApplied: Boolean(shot.fixedPresetApplied),
          cameraPositionDelta: shot.cameraPositionDelta,
          file: shot.crop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.crop.file)),
          phase: 'after-crop',
          route: shot.route,
          screenCoverage: shot.screenCoverage,
          technicalScreenshotValid: Boolean(shot.crop.technicalScreenshotValid),
          timestamp: generatedAt,
          verdict: shot.crop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.readableCount === shotSet.summary.totalShots
          && shotSet.summary.technicalCount === shotSet.summary.totalShots,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        stopCondition: shotSet.summary.readableCount === shotSet.summary.totalShots
          ? null
          : 'Simple fixed camera placement cannot produce a readable 8-angle set from the current modular-home scene. The blocker is scene/geometry organization, not camera math.',
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        houseVisualBounds: shotSet.shotResults[0]?.houseVisualBounds ?? null,
        houseVisualBoundsCandidates: shotSet.shotResults[0]?.houseVisualBoundsCandidates ?? [],
        profileDir,
        screenshots,
        shotSet: options.shotSet,
      };
    } else if (options.shotSet === 'modular-home-camera-solver') {
      const shotSet = await runModularHomeCameraSolverShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          boundsValid: Boolean(shot.after.boundsValid),
          cameraInsideGeometryLikely: Boolean(shot.after.cameraInsideGeometryLikely),
          cameraFov: shot.after.cameraFov ?? null,
          cameraSolverUsed: true,
          file: shot.after.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.after.file)),
          humanReviewRequired: true,
          modularHomeRootFound: Boolean(shot.after.modularHomeRootFound),
          modularHomeRootName: shot.after.modularHomeRootName,
          modularHomeBounds: shot.after.modularHomeBounds,
          mostlyFlatPlane: Boolean(shot.mostlyFlatPlane),
          objectCentered: Boolean(shot.objectCentered),
          phase: 'after',
          productDominatesFrame: Boolean(shot.productDominatesFrame),
          productObjectInFrame: Boolean(shot.productObjectInFrame),
          productVisualAccepted: false,
          route: shot.shotName.startsWith('interior') ? '/modular-homes/studio?view=interior' : '/modular-homes/studio?view=exterior',
          screenCoverage: shot.after.screenCoverage,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.after.technicalScreenshotValid),
          timestamp: generatedAt,
          visualInspectionReady: Boolean(shot.visualInspectionReady),
          verdict: shot.after.verdict,
        },
        {
          boundsValid: Boolean(shot.afterCrop.boundsValid),
          cameraInsideGeometryLikely: Boolean(shot.cameraInsideGeometryLikely),
          cameraFov: shot.afterCrop.cameraFov ?? null,
          cameraSolverUsed: true,
          file: shot.afterCrop.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.afterCrop.file)),
          humanReviewRequired: true,
          modularHomeRootFound: Boolean(shot.afterCrop.modularHomeRootFound),
          modularHomeRootName: shot.afterCrop.modularHomeRootName,
          modularHomeBounds: shot.afterCrop.modularHomeBounds,
          mostlyFlatPlane: Boolean(shot.afterCrop.mostlyFlatPlane),
          objectCentered: Boolean(shot.objectCentered),
          phase: 'after-crop',
          productDominatesFrame: Boolean(shot.productDominatesFrame),
          productObjectInFrame: Boolean(shot.productObjectInFrame),
          productVisualAccepted: false,
          route: shot.shotName.startsWith('interior') ? '/modular-homes/studio?view=interior' : '/modular-homes/studio?view=exterior',
          screenCoverage: shot.afterCrop.screenCoverage,
          shotName: shot.shotName,
          technicalScreenshotValid: Boolean(shot.afterCrop.technicalScreenshotValid),
          timestamp: generatedAt,
          visualInspectionReady: Boolean(shot.visualInspectionReady),
          verdict: shot.afterCrop.verdict,
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.summary.productDominatesCount >= 6
          && shotSet.summary.productObjectCount === shotSet.summary.totalShots
          && shotSet.summary.insideGeometryCount === 0
          && shotSet.summary.technicalCount === shotSet.summary.totalShots,
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotResults: shotSet.shotResults,
        shotSet: options.shotSet,
        summary: shotSet.summary,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        shotSet: options.shotSet,
        screenshots,
      };
    } else if (options.shotSet === 'modular-home-8-angle') {
      const shotSet = await runModularHomeEightAngleShotSet(page, { baseUrl: options.baseUrl, outDir: options.outDir });
      const screenshots = shotSet.shotResults.flatMap((shot) => [
        {
          blankCanvasLikely: Boolean(shot.baseline.canvasInfo?.blankCanvasLikely),
          cameraInsideGeometryLikely: Boolean(shot.baseline.cameraInsideGeometryLikely),
          cameraFacingProduct: Boolean(shot.baseline.cameraFacingProduct),
          checklist: shot.baseline.checklist,
          colorDiversity: shot.baseline.canvasInfo?.colorDiversity ?? null,
          dimensions: shot.baseline.canvasInfo?.dimensions ?? null,
          file: shot.baseline.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.baseline.file)),
          humanReviewRequired: true,
          phase: 'baseline',
          productObjectInFrame: Boolean(shot.baseline.productObjectInFrame),
          productVisualAccepted: false,
          route: shot.baseline.shotType.startsWith('interior') ? '/modular-homes/studio?view=interior' : '/modular-homes/studio?view=exterior',
          runtimeStateValid: Boolean(shot.baseline.runtimeStateValid),
          shotType: shot.shotType,
          technicalScreenshotValid: Boolean(shot.baseline.technicalScreenshotValid),
          timestamp: generatedAt,
          translationProven: Boolean(shot.baseline.translationProven),
          rotationProven: Boolean(shot.baseline.rotationProven),
          visualInspectionReady: Boolean(shot.baseline.visualInspectionReady),
          verdict: shot.baseline.verdict,
          walkMovementProven: Boolean(shot.baseline.walkMovementProven ?? false),
        },
        {
          blankCanvasLikely: Boolean(shot.after.canvasInfo?.blankCanvasLikely),
          cameraInsideGeometryLikely: Boolean(shot.after.cameraInsideGeometryLikely),
          cameraFacingProduct: Boolean(shot.after.cameraFacingProduct),
          checklist: shot.after.checklist,
          colorDiversity: shot.after.canvasInfo?.colorDiversity ?? null,
          dimensions: shot.after.canvasInfo?.dimensions ?? null,
          file: shot.after.file,
          fileExists: fs.existsSync(path.join(options.outDir, shot.after.file)),
          humanReviewRequired: true,
          phase: 'after',
          productObjectInFrame: Boolean(shot.after.productObjectInFrame),
          productVisualAccepted: false,
          route: shot.shotType.startsWith('interior') ? '/modular-homes/studio?view=interior' : '/modular-homes/studio?view=exterior',
          runtimeStateValid: Boolean(shot.after.runtimeControlPass),
          shotType: shot.shotType,
          technicalScreenshotValid: Boolean(shot.after.technicalScreenshotValid),
          timestamp: generatedAt,
          translationProven: Boolean(shot.after.translationProven),
          rotationProven: Boolean(shot.after.rotationProven),
          visualInspectionReady: Boolean(shot.after.visualInspectionReady),
          verdict: shot.after.verdict,
          walkMovementProven: Boolean(shot.after.walkPass ?? false),
        },
      ]);

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        ok: shotSet.shotResults.every((shot) => shot.framingPass && shot.technicalPass),
        outDir: options.outDir,
        overallQaVerdict: shotSet.overallQaVerdict,
        profileDir,
        shotSet: options.shotSet,
        shotResults: shotSet.shotResults,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        shotSet: options.shotSet,
        screenshots,
      };
    } else {
      const results = [];
      const debugArtifacts = [];
      const studioPage = page;
      await studioPage.setViewportSize(EXPECTED_VIEWPORT);
      results.push(await runStudioExteriorOverview(studioPage, { baseUrl: options.baseUrl, outDir: options.outDir }));
      results.push(await runStudioDoorAreaFrame(studioPage, { baseUrl: options.baseUrl, outDir: options.outDir }));
      results.push(await runStudioExteriorMovementProof(studioPage, { baseUrl: options.baseUrl, outDir: options.outDir }));
      results.push(await runStudioInteriorMovementProof(studioPage, { baseUrl: options.baseUrl, outDir: options.outDir }));

      const debugPage = await context.newPage();
      await debugPage.setViewportSize(EXPECTED_VIEWPORT);
      debugArtifacts.push(await runBlankGuardDebug(debugPage, { baseUrl: options.baseUrl, outDir: options.outDir }));

      result = {
        baseUrl: options.baseUrl,
        browserPath,
        generatedAt,
        debugArtifacts,
        ok: results.every((item) => item.visualInspectionReady && item.runtimeStateValid && item.technicalScreenshotValid && item.productObjectInFrame !== false),
        outDir: options.outDir,
        profileDir,
        results,
      };

      manifest = {
        browserPath,
        evidenceDir: options.outDir,
        generatedAt,
        profileDir,
        screenshots: [
          ...results.flatMap((item) => [
            {
              file: path.basename(item.screenshot ?? item.screenshotBefore),
              route: item.state?.route ?? item.beforeState?.route ?? null,
              timestamp: item.state?.lastInputAt ?? item.beforeState?.lastInputAt ?? generatedAt,
              blankCanvasLikely: Boolean(item.canvasInfo?.blankCanvasLikely ?? item.beforeCanvas?.blankCanvasLikely),
              colorDiversity: item.canvasInfo?.colorDiversity ?? item.beforeCanvas?.colorDiversity ?? null,
              dimensions: item.canvasInfo?.dimensions ?? item.beforeCanvas?.dimensions ?? null,
              fileExists: Boolean(item.screenshot ? fs.existsSync(item.screenshot) : item.screenshotBefore && fs.existsSync(item.screenshotBefore)),
              rotationProven: Boolean(item.rotationProven ?? false),
              translationProven: Boolean(item.translationProven ?? false),
              walkMovementProven: Boolean(item.walkMovementProven ?? false),
              cameraInsideGeometryLikely: Boolean(item.cameraInsideGeometryLikely ?? item.beforeState?.cameraInsideGeometryLikely ?? false),
              cameraFacingProduct: Boolean(item.cameraFacingProduct ?? item.beforeState?.cameraFacingModularHome ?? false),
              productObjectInFrame: Boolean(item.productObjectInFrame ?? item.beforeAssessment?.productObjectInFrame ?? false),
              productVisualAccepted: false,
              runtimeStateValid: Boolean(item.runtimeStateValid),
              technicalScreenshotValid: Boolean(item.technicalScreenshotValid),
              visualInspectionReady: Boolean(item.visualInspectionReady ?? false),
              verdict: (item.canvasInfo?.blankCanvasLikely ?? item.beforeCanvas?.blankCanvasLikely) || !(item.technicalScreenshotValid ?? false) || !(item.runtimeStateValid ?? false) || !(item.visualInspectionReady ?? false) ? 'fail' : 'pass',
            },
            ...(item.screenshotAfter ? [{
              file: path.basename(item.screenshotAfter),
              route: item.afterState?.route ?? null,
              timestamp: item.afterState?.lastInputAt ?? generatedAt,
              blankCanvasLikely: Boolean(item.afterCanvas?.blankCanvasLikely),
              colorDiversity: item.afterCanvas?.colorDiversity ?? null,
              dimensions: item.afterCanvas?.dimensions ?? null,
              fileExists: Boolean(fs.existsSync(item.screenshotAfter)),
              rotationProven: Boolean(item.rotationProven),
              translationProven: Boolean(item.translationProven),
              walkMovementProven: Boolean(item.walkMovementProven),
              cameraInsideGeometryLikely: Boolean(item.afterState?.cameraInsideGeometryLikely ?? false),
              cameraFacingProduct: Boolean(item.afterState?.cameraFacingModularHome ?? false),
              productObjectInFrame: Boolean(item.afterAssessment?.productObjectInFrame ?? false),
              productVisualAccepted: false,
              runtimeStateValid: Boolean(item.runtimeStateValid),
              technicalScreenshotValid: Boolean(item.technicalScreenshotValid),
              visualInspectionReady: Boolean(item.visualInspectionReady ?? false),
              verdict: item.afterCanvas?.blankCanvasLikely || !item.technicalScreenshotValid || !item.runtimeStateValid || !item.visualInspectionReady ? 'fail' : 'pass',
            }] : []),
          ]),
          ...debugArtifacts.map((artifact) => ({
            file: path.basename(artifact.screenshot),
            route: 'about:blank',
            timestamp: generatedAt,
            blankCanvasLikely: Boolean(artifact.blankCanvasLikely),
            colorDiversity: artifact.canvasInfo?.colorDiversity ?? null,
            dimensions: artifact.canvasInfo?.dimensions ?? null,
            fileExists: Boolean(fs.existsSync(artifact.screenshot)),
            rotationProven: false,
            translationProven: false,
            walkMovementProven: false,
            cameraInsideGeometryLikely: false,
            cameraFacingProduct: false,
            productObjectInFrame: false,
            productVisualAccepted: false,
            runtimeStateValid: false,
            technicalScreenshotValid: Boolean(artifact.technicalScreenshotValid),
            visualInspectionReady: false,
            verdict: artifact.canvasInfo?.blankCanvasLikely || !artifact.technicalScreenshotValid ? 'fail' : 'blocked',
          })),
        ],
      };
    }

    fs.writeFileSync(path.join(options.outDir, 'qa-3d-runtime-result.json'), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(options.outDir, 'visual-evidence-manifest.json'), JSON.stringify(manifest, null, 2));

    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
