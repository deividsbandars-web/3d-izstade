#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-interior-performance-geometry-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_CONFIGS = {
  desktop: {
    cpuThrottleRate: 1,
    deviceScaleFactor: 1,
    fpsMin: 45,
    frameTimeP95MaxMs: 28,
    hasTouch: false,
    isMobile: false,
    viewport: { height: 900, width: 1440 },
  },
  mobile: {
    cpuThrottleRate: 1,
    deviceScaleFactor: 3,
    fpsMin: 30,
    frameTimeP95MaxMs: 40,
    hasTouch: true,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  },
  'constrained-mobile': {
    cpuThrottleRate: 4,
    deviceScaleFactor: 3,
    fpsMin: 30,
    frameTimeP95MaxMs: 40,
    hasTouch: true,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  },
};
const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
  startInside: '/modular-homes/studio?start=inside&homeStudio=1&qa3d=1',
  startOutside: '/modular-homes/studio?start=outside&homeStudio=1&qa3d=1',
};

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value);
  if (!match) {
    throw new Error('--viewport must use WIDTHxHEIGHT, for example 390x844');
  }
  return {
    height: Number(match[2]),
    width: Number(match[1]),
  };
}

function parseArgs(argv) {
  let options = {
    baseUrl: DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
    profile: 'desktop',
    ...PROFILE_CONFIGS.desktop,
  };

  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--profile=')) {
      const profile = arg.slice('--profile='.length);
      if (!PROFILE_CONFIGS[profile]) {
        throw new Error(`Unknown profile: ${profile}`);
      }
      options = {
        ...options,
        ...PROFILE_CONFIGS[profile],
        profile,
      };
    } else if (arg.startsWith('--viewport=')) {
      options.viewport = parseViewport(arg.slice('--viewport='.length));
    } else if (arg.startsWith('--device-scale-factor=')) {
      options.deviceScaleFactor = Number(arg.slice('--device-scale-factor='.length));
    } else if (arg === '--mobile') {
      options.isMobile = true;
    } else if (arg === '--has-touch') {
      options.hasTouch = true;
    } else if (arg.startsWith('--fps-min=')) {
      options.fpsMin = Number(arg.slice('--fps-min='.length));
    } else if (arg.startsWith('--frame-time-p95-max-ms=')) {
      options.frameTimeP95MaxMs = Number(arg.slice('--frame-time-p95-max-ms='.length));
    } else if (arg.startsWith('--cpu-throttle-rate=')) {
      options.cpuThrottleRate = Number(arg.slice('--cpu-throttle-rate='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.deviceScaleFactor) || options.deviceScaleFactor <= 0) {
    throw new Error('--device-scale-factor must be a positive number');
  }
  if (!Number.isFinite(options.fpsMin) || options.fpsMin <= 0) {
    throw new Error('--fps-min must be a positive number');
  }
  if (!Number.isFinite(options.frameTimeP95MaxMs) || options.frameTimeP95MaxMs <= 0) {
    throw new Error('--frame-time-p95-max-ms must be a positive number');
  }
  if (!Number.isFinite(options.cpuThrottleRate) || options.cpuThrottleRate < 1) {
    throw new Error('--cpu-throttle-rate must be a number greater than or equal to 1');
  }

  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.5)];
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function roundMetric(value) {
  return value === null || value === undefined ? null : Number(value.toFixed(2));
}

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? item.userData?.interiorBoardInstanceCount ?? 1);
}

function classifySystem(name) {
  if (/interior-vertical-timber-board-panel|individual-vertical-timber-board-panel|gable-individual-vertical-timber-board-panel/.test(name)) {
    return 'wall-skin boards';
  }
  if (/cladding-backing|reveal|groove|scarf-joint|gable-opaque-wall-core/.test(name)) {
    return 'reveals/grooves';
  }
  if (/trim|corner-board|baseboard|crown/.test(name)) {
    return 'trim';
  }
  if (/roof|gable/.test(name)) {
    return 'roof';
  }
  if (/sofa|bed|wardrobe|cabinet|countertop|table|rug|pillow|blanket|tv/.test(name)) {
    return 'furniture';
  }
  if (/bathroom|shower|vanity|sink|wc|mirror|faucet|cooktop/.test(name)) {
    return 'fixtures';
  }
  if (/opening|window|door|casing|threshold|sill/.test(name)) {
    return 'openings';
  }
  if (/wall-core|finished-partition-face|flat-finished-interior-wall-face|finished-floor|ceiling/.test(name)) {
    return 'walls/floors/ceilings';
  }
  if (/html|label|overlay/i.test(name)) {
    return 'DOM/Html overlays';
  }
  return 'other';
}

function summarizeInventory(inventory) {
  const meshCountsBySystem = {};
  const materialSignaturesBySystem = {};
  const materialSignatures = new Set();

  inventory.forEach((item) => {
    const name = item.name || '';
    const system = classifySystem(name);
    const instanceCount = meshInstanceCount(item);
    const material = item.material ?? {};
    const signature = [
      material.color ?? 'none',
      material.opacity ?? 'none',
      material.transparent ?? 'none',
      material.roughness ?? 'none',
      material.metalness ?? 'none',
    ].join('|');
    meshCountsBySystem[system] = (meshCountsBySystem[system] ?? 0) + instanceCount;
    materialSignaturesBySystem[system] ??= new Set();
    materialSignaturesBySystem[system].add(signature);
    materialSignatures.add(signature);
  });

  return {
    materialCount: materialSignatures.size,
    materialCountsBySystem: Object.fromEntries(Object.entries(materialSignaturesBySystem)
      .map(([system, values]) => [system, values.size])),
    meshCount: inventory.reduce((total, item) => total + meshInstanceCount(item), 0),
    meshCountsBySystem,
  };
}

async function installWebGlProfiler(page) {
  await page.addInitScript(() => {
    const state = {
      current: { drawCalls: 0, triangles: 0 },
      frames: [],
    };
    const triangleCount = (gl, mode, count) => {
      if (mode === gl.TRIANGLES) {
        return Math.floor(count / 3);
      }
      if (mode === gl.TRIANGLE_STRIP || mode === gl.TRIANGLE_FAN) {
        return Math.max(0, count - 2);
      }
      return 0;
    };
    const patchContext = (contextType) => {
      const proto = window[contextType]?.prototype;
      if (!proto || proto.__galaPerformancePatched) {
        return;
      }
      const drawArrays = proto.drawArrays;
      const drawArraysInstanced = proto.drawArraysInstanced;
      const drawElements = proto.drawElements;
      const drawElementsInstanced = proto.drawElementsInstanced;
      proto.drawArrays = function patchedDrawArrays(mode, first, count) {
        state.current.drawCalls += 1;
        state.current.triangles += triangleCount(this, mode, count);
        return drawArrays.call(this, mode, first, count);
      };
      proto.drawElements = function patchedDrawElements(mode, count, type, offset) {
        state.current.drawCalls += 1;
        state.current.triangles += triangleCount(this, mode, count);
        return drawElements.call(this, mode, count, type, offset);
      };
      if (drawArraysInstanced) {
        proto.drawArraysInstanced = function patchedDrawArraysInstanced(mode, first, count, instanceCount) {
          state.current.drawCalls += 1;
          state.current.triangles += triangleCount(this, mode, count) * instanceCount;
          return drawArraysInstanced.call(this, mode, first, count, instanceCount);
        };
      }
      if (drawElementsInstanced) {
        proto.drawElementsInstanced = function patchedDrawElementsInstanced(mode, count, type, offset, instanceCount) {
          state.current.drawCalls += 1;
          state.current.triangles += triangleCount(this, mode, count) * instanceCount;
          return drawElementsInstanced.call(this, mode, count, type, offset, instanceCount);
        };
      }
      proto.__galaPerformancePatched = true;
    };
    patchContext('WebGLRenderingContext');
    patchContext('WebGL2RenderingContext');

    const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => originalRequestAnimationFrame((timestamp) => {
      state.frames.push({
        drawCalls: state.current.drawCalls,
        timestamp,
        triangles: state.current.triangles,
      });
      state.current = { drawCalls: 0, triangles: 0 };
      callback(timestamp);
    });
    window.__GALA_WEBGL_PROFILE__ = state;
  });
}

async function applyCpuThrottle(page, rate) {
  if (rate <= 1) {
    return null;
  }
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate });
  return client;
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    const galaMeshes = inventory.filter((item) => /gala-construction|vertical-timber|bathroom|bedroom|kitchen|sofa/i.test(item.name || ''));
    const hasConstructionCore = inventory.some((item) => /gala-construction-.*wall-core-cell-opening-aware|gala-construction-single-finished-floor/i.test(item.name || ''));
    const renderCalls = Number(window.__WARPALA_3D_QA__?.getRendererInfo?.()?.render?.calls ?? 0);
    return galaMeshes.length >= 30 && hasConstructionCore && renderCalls > 0;
  }, null, { timeout: 60000 });
}

async function collectRouteMetrics(page, options, route) {
  const { baseUrl } = options;
  const response = await page.goto(`${baseUrl}${route}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    if (window.__GALA_WEBGL_PROFILE__) {
      window.__GALA_WEBGL_PROFILE__.frames = [];
      window.__GALA_WEBGL_PROFILE__.current = { drawCalls: 0, triangles: 0 };
    }
  });
  await page.waitForTimeout(5000);

  const profile = await page.evaluate(() => window.__GALA_WEBGL_PROFILE__ ?? { frames: [] });
  const inventory = await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
  const rendererInfo = await page.evaluate(() => window.__WARPALA_3D_QA__?.getRendererInfo?.() ?? null);
  const frames = profile.frames.slice(2).filter((frame) => typeof frame.timestamp === 'number');
  const frameTimes = frames.slice(1)
    .map((frame, index) => frame.timestamp - frames[index].timestamp)
    .filter((value) => value >= 4 && value <= 80);
  const drawCalls = frames.map((frame) => Number(frame.drawCalls || 0)).filter((value) => value > 0);
  const triangles = frames.map((frame) => Number(frame.triangles || 0)).filter((value) => value > 0);
  const frameTimeMedian = median(frameTimes);
  const frameTimeP95 = percentile(frameTimes, 95);
  const fpsMedian = frameTimeMedian ? 1000 / frameTimeMedian : null;
  const inventorySummary = summarizeInventory(inventory);
  const pass = fpsMedian !== null
    && frameTimeP95 !== null
    && fpsMedian >= options.fpsMin
    && frameTimeP95 <= options.frameTimeP95MaxMs;

  return {
    drawCalls: Math.round(median(drawCalls) ?? 0),
    fpsMedian: roundMetric(fpsMedian),
    frameTimeP95Ms: roundMetric(frameTimeP95),
    materialCount: inventorySummary.materialCount,
    meshCount: inventorySummary.meshCount,
    pass,
    route,
    status: response?.status() ?? null,
    triangles: Math.round(median(triangles) ?? 0),
    rendererInfo,
    diagnostics: {
      frameSampleCount: frameTimes.length,
      materialCountsBySystem: inventorySummary.materialCountsBySystem,
      meshCountsBySystem: inventorySummary.meshCountsBySystem,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({
    deviceScaleFactor: options.deviceScaleFactor,
    hasTouch: options.hasTouch,
    isMobile: options.isMobile,
    viewport: options.viewport,
  });
  const cpuThrottleClient = await applyCpuThrottle(page, options.cpuThrottleRate);
  await installWebGlProfiler(page);

  const exterior = await collectRouteMetrics(page, options, ROUTES.exterior);
  const interior = await collectRouteMetrics(page, options, ROUTES.interior);
  const startOutside = await collectRouteMetrics(page, options, ROUTES.startOutside);
  const startInside = await collectRouteMetrics(page, options, ROUTES.startInside);
  await cpuThrottleClient?.detach();
  await browser.close();

  const hotspots = Object.entries({
    exterior: exterior.diagnostics.meshCountsBySystem,
    interior: interior.diagnostics.meshCountsBySystem,
  }).flatMap(([routeName, counts]) => Object.entries(counts)
    .filter(([, count]) => count >= 40)
    .map(([system, count]) => ({ count, route: routeName, system })));

  const performanceBudgetMet = exterior.pass && interior.pass;
  const result = {
    generatedAt: new Date().toISOString(),
    performanceBudgetAuditRan: true,
    exterior,
    interior,
    hotspots,
    performanceBudgetMet,
    productVisualAccepted: false,
    pass: performanceBudgetMet,
    diagnostics: {
      budget: {
        fpsMedianMin: options.fpsMin,
        frameTimeP95MaxMs: options.frameTimeP95MaxMs,
      },
      profile: {
        cpuThrottleRate: options.cpuThrottleRate,
        deviceScaleFactor: options.deviceScaleFactor,
        hasTouch: options.hasTouch,
        isMobile: options.isMobile,
        name: options.profile,
        viewport: options.viewport,
      },
      startInside,
      startOutside,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-performance-budget-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
