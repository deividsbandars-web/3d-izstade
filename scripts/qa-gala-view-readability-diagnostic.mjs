#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-view-readability-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };

const ROUTES = {
  exteriorRoute: {
    expectedMode: 'outside',
    path: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
    screenshotStem: 'exterior',
  },
  interiorRoute: {
    expectedMode: 'inside',
    path: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
    screenshotStem: 'interior',
  },
  startOutside: {
    clickButtonText: 'Start outside',
    expectedMode: 'outside',
    path: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
    screenshotStem: 'start-outside',
  },
  startInside: {
    clickButtonText: 'Start inside',
    expectedMode: 'inside',
    path: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
    screenshotStem: 'start-inside',
  },
};

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
    phase: 'after',
  };

  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--phase=')) {
      const phase = arg.slice('--phase='.length);
      if (phase !== 'before' && phase !== 'after') {
        throw new Error(`Unsupported phase: ${phase}`);
      }
      options.phase = phase;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function screenshotName(route, phase) {
  return `${route.screenshotStem}-${phase === 'before' ? 'before-reference' : 'after'}.png`;
}

async function imageReadabilityMetrics(file) {
  const image = sharp(file);
  const metadata = await image.metadata();
  const crop = {
    height: Math.round(VIEWPORT.height * 0.78),
    left: Math.round(VIEWPORT.width * 0.25),
    top: Math.round(VIEWPORT.height * 0.1),
    width: Math.round(VIEWPORT.width * 0.5),
  };
  const { data, info } = await image
    .extract(crop)
    .resize({ fit: 'inside', height: 90, width: 150 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bins = new Map();
  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let blackish = 0;
  let whitish = 0;
  let edgeCount = 0;
  let edgeSamples = 0;
  const lums = [];
  const pixelCount = info.width * info.height;

  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const lum = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const bin = `${Math.floor(r / 16)}:${Math.floor(g / 16)}:${Math.floor(b / 16)}`;
    bins.set(bin, (bins.get(bin) ?? 0) + 1);
    luminanceSum += lum;
    luminanceSqSum += lum * lum;
    if (lum < 18) blackish += 1;
    if (lum > 242) whitish += 1;
    lums.push(lum);
  }

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const current = lums[(y * info.width) + x] ?? 0;
      if (x + 1 < info.width) {
        edgeSamples += 1;
        if (Math.abs(current - (lums[(y * info.width) + x + 1] ?? current)) > 18) {
          edgeCount += 1;
        }
      }
      if (y + 1 < info.height) {
        edgeSamples += 1;
        if (Math.abs(current - (lums[((y + 1) * info.width) + x] ?? current)) > 18) {
          edgeCount += 1;
        }
      }
    }
  }

  const mean = luminanceSum / Math.max(1, pixelCount);
  const luminanceVariance = Math.max(0, (luminanceSqSum / Math.max(1, pixelCount)) - (mean * mean));
  const dominantPixelRatio = Math.max(...bins.values()) / Math.max(1, pixelCount);

  return {
    blackRatio: blackish / Math.max(1, pixelCount),
    dominantPixelRatio,
    edgeDensity: edgeCount / Math.max(1, edgeSamples),
    height: metadata.height ?? 0,
    luminanceMean: mean,
    luminanceVariance,
    uniqueColorBins: bins.size,
    whiteRatio: whitish / Math.max(1, pixelCount),
    width: metadata.width ?? 0,
  };
}

function classifyReadability({ centerRaycast, domOverlayBlocking, metrics, qaState, route }) {
  const readable = metrics.uniqueColorBins >= 24
    && metrics.edgeDensity >= 0.012
    && metrics.luminanceVariance >= 80
    && metrics.blackRatio < 0.88
    && metrics.whiteRatio < 0.94
    && metrics.dominantPixelRatio < 0.55;
  const blank = metrics.blackRatio > 0.92 || metrics.whiteRatio > 0.97;
  const cameraInsideGeometry = Boolean(qaState?.cameraInsideGeometryLikely)
    || (centerRaycast?.hit === true && typeof centerRaycast.distance === 'number' && centerRaycast.distance < 0.6);
  const nearUniformCloseSurface = !blank
    && !domOverlayBlocking
    && !readable
    && centerRaycast?.hit === true
    && typeof centerRaycast.distance === 'number'
    && centerRaycast.distance < 24
    && (metrics.dominantPixelRatio >= 0.55 || metrics.edgeDensity < 0.012 || metrics.luminanceVariance < 80);

  if (domOverlayBlocking) {
    return {
      classification: 'blocked',
      pass: false,
      suspectedOwner: 'route-view-state',
    };
  }

  if (blank) {
    return {
      classification: 'blank',
      pass: false,
      suspectedOwner: 'unknown',
    };
  }

  if (cameraInsideGeometry) {
    return {
      classification: 'camera-inside-geometry',
      pass: false,
      suspectedOwner: 'camera',
    };
  }

  if (nearUniformCloseSurface) {
    return {
      classification: 'near-uniform-close-surface',
      pass: false,
      suspectedOwner: route.clickButtonText ? 'spawn' : 'camera',
    };
  }

  if (readable) {
    return {
      classification: 'readable',
      pass: true,
      suspectedOwner: 'unknown',
    };
  }

  return {
    classification: 'unknown',
    pass: false,
    suspectedOwner: 'unknown',
  };
}

async function auditDomOverlays(page) {
  return await page.evaluate(() => {
    const viewport = { height: window.innerHeight, width: window.innerWidth };
    const center = {
      height: viewport.height * 0.78,
      width: viewport.width * 0.5,
      x: viewport.width * 0.25,
      y: viewport.height * 0.1,
    };
    const blockingText = new RegExp('40\\s*(m\\u00b2|m2|M\\u00b2|M2)|Compact Timber 40|MODULAR\\s+LAYOUT', 'i');

    function intersectionArea(a, b) {
      const x1 = Math.max(a.x, b.x);
      const y1 = Math.max(a.y, b.y);
      const x2 = Math.min(a.x + a.width, b.x + b.width);
      const y2 = Math.min(a.y + a.height, b.y + b.height);
      return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    }

    const overlays = Array.from(document.querySelectorAll('body *')).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const visible = rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0.05
        && !element.hasAttribute('hidden');
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      const containsCanvas = Boolean(document.querySelector('canvas') && element.contains(document.querySelector('canvas')));
      const areaRatio = (rect.width * rect.height) / Math.max(1, viewport.width * viewport.height);
      const centerRatio = intersectionArea(rect, center) / Math.max(1, center.width * center.height);
      const positioned = ['absolute', 'fixed', 'sticky'].includes(style.position);
      const homeDemoModelLabel = element.matches('[data-home-demo-model-label="true"]');
      const textMatchesBlockingLabel = blockingText.test(text);
      const modalLike = element.getAttribute('role') === 'dialog' || element.getAttribute('aria-modal') === 'true';
      const backgroundBlocks = !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor);
      const blocking = visible
        && !containsCanvas
        && (
          homeDemoModelLabel
          || (textMatchesBlockingLabel && centerRatio > 0.02 && areaRatio > 0.01)
          || (positioned && backgroundBlocks && centerRatio > 0.08 && areaRatio > 0.08 && style.pointerEvents !== 'none')
          || (modalLike && centerRatio > 0.08)
        );

      return {
        areaRatio,
        blocking,
        centerRatio,
        homeDemoModelLabel,
        position: style.position,
        tagName: element.tagName,
        text: text.slice(0, 180),
        textMatchesBlockingLabel,
        visible,
      };
    }).filter((item) => item.blocking || item.homeDemoModelLabel || item.textMatchesBlockingLabel);

    return {
      blockingDomOverlayPresent: overlays.some((item) => item.blocking),
      blockingHomeDemoLabelPresent: overlays.some((item) => item.homeDemoModelLabel && item.visible),
      overlays,
    };
  });
}

async function waitForQaHook(page) {
  await page.waitForFunction(() => {
    const qa = window.__WARPALA_3D_QA__;
    if (!qa?.getState) {
      return false;
    }

    const inventory = qa.getSceneMeshInventory?.() ?? [];
    const summary = qa.getObjectSummary?.() ?? null;
    const state = qa.getState?.() ?? null;
    const centerRaycast = qa.getCenterRaycast?.() ?? null;
    const visibleMeshCount = Math.max(
      inventory.length,
      summary?.visibleMeshCount ?? 0,
      state?.visibleObjectSummary?.visibleMeshCount ?? 0,
    );
    const modularHomeObjectCount = Math.max(
      summary?.modularHomeObjectCount ?? 0,
      state?.modularHomeObjectCount ?? 0,
    );

    return visibleMeshCount >= 40
      && modularHomeObjectCount >= 40
      && centerRaycast?.hit === true;
  }, null, {
    timeout: 20000,
  }).catch(() => {});
}

async function captureRoute(page, baseUrl, route, phase, outDir) {
  const screenshot = screenshotName(route, phase);
  const screenshotPath = path.join(outDir, screenshot);
  const response = await page.goto(`${baseUrl}${route.path}`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);

  if (route.clickButtonText) {
    const button = page.getByRole('button', {
      name: new RegExp(`^${route.clickButtonText}$`, 'i'),
    }).last();
    await button.click({ timeout: 10000 });
    await page.waitForTimeout(1200);
  }

  await waitForQaHook(page);
  await page.waitForTimeout(2200);
  await page.screenshot({ fullPage: false, path: screenshotPath });

  const screenshotCaptured = fs.existsSync(screenshotPath);
  const metrics = screenshotCaptured
    ? await imageReadabilityMetrics(screenshotPath)
    : null;
  const domOverlay = await auditDomOverlays(page);
  const runtime = await page.evaluate(() => {
    const qa = window.__WARPALA_3D_QA__;
    const state = qa?.getState?.() ?? null;
    const summary = qa?.getObjectSummary?.() ?? null;
    const centerRaycast = qa?.getCenterRaycast?.() ?? null;
    return { centerRaycast, state, summary };
  });
  const cameraState = runtime.state?.cameraPosition ? {
    far: 10000,
    fov: runtime.state.cameraFov ?? null,
    near: 0.1,
    position: [
      runtime.state.cameraPosition.x,
      runtime.state.cameraPosition.y,
      runtime.state.cameraPosition.z,
    ],
    rotation: runtime.state.cameraRotation ? [
      runtime.state.cameraRotation.x,
      runtime.state.cameraRotation.y,
      runtime.state.cameraRotation.z,
    ] : null,
  } : null;
  const playerOrSpawn = {
    mode: route.expectedMode ?? 'unknown',
    position: runtime.state?.playerPosition ? [
      runtime.state.playerPosition.x,
      runtime.state.playerPosition.y,
      runtime.state.playerPosition.z,
    ] : null,
  };
  const sceneBounds = runtime.summary?.modularHomeBounds ?? runtime.summary?.houseVisualBounds ?? null;
  const classification = metrics
    ? classifyReadability({
      centerRaycast: runtime.centerRaycast,
      domOverlayBlocking: domOverlay.blockingDomOverlayPresent || domOverlay.blockingHomeDemoLabelPresent,
      metrics,
      qaState: runtime.state,
      route,
    })
    : { classification: 'unknown', pass: false, suspectedOwner: 'unknown' };

  return {
    status: response?.status() ?? null,
    screenshot,
    screenshotCaptured,
    canvasPresent: await page.locator('canvas').evaluate((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return rect.width > 500 && rect.height > 500;
    }).catch(() => false),
    domOverlayBlocking: domOverlay.blockingDomOverlayPresent || domOverlay.blockingHomeDemoLabelPresent,
    camera: cameraState,
    playerOrSpawn,
    sceneBounds,
    centerRaycast: runtime.centerRaycast,
    nearSurfaceDominance: metrics ? {
      classification: classification.classification,
      dominantPixelRatio: metrics.dominantPixelRatio,
      edgeDensity: metrics.edgeDensity,
      luminanceVariance: metrics.luminanceVariance,
    } : null,
    suspectedOwner: classification.suspectedOwner,
    diagnostics: {
      domOverlay,
      metrics,
      modularHomeObjectCount: runtime.summary?.modularHomeObjectCount ?? null,
      route: route.path,
      runtimeCameraInsideGeometryLikely: runtime.state?.cameraInsideGeometryLikely ?? null,
      visibleObjectSummary: runtime.summary?.visibleObjectSummary ?? null,
    },
    pass: Boolean(
      (response?.status() ?? 0) === 200
      && screenshotCaptured
      && !domOverlay.blockingDomOverlayPresent
      && !domOverlay.blockingHomeDemoLabelPresent
      && classification.pass
    ),
  };
}

async function run(options) {
  ensureDir(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
  });

  const routeResults = {};
  for (const [key, route] of Object.entries(ROUTES)) {
    routeResults[key] = await captureRoute(page, options.baseUrl, route, options.phase, options.outDir);
  }

  await browser.close();

  const result = {
    generatedAt: new Date().toISOString(),
    phase: options.phase,
    viewReadabilityDiagnosticRan: true,
    routes: routeResults,
    summary: {
      allPass: Object.values(routeResults).every((route) => route.pass),
      classifications: Object.fromEntries(
        Object.entries(routeResults).map(([key, route]) => [key, route.nearSurfaceDominance?.classification ?? 'unknown']),
      ),
      suspectedOwners: Object.fromEntries(
        Object.entries(routeResults).map(([key, route]) => [key, route.suspectedOwner]),
      ),
    },
    productVisualAccepted: false,
  };

  writeJson(path.join(options.outDir, 'qa-gala-view-readability-diagnostic-result.json'), result);
  console.log(JSON.stringify({
    ok: result.summary.allPass,
    outDir: options.outDir,
    phase: options.phase,
    summary: result.summary,
  }, null, 2));

  if (!result.summary.allPass) {
    process.exit(1);
  }
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
