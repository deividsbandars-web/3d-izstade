#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-opening-interior-floor-performance-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1',
};
const FPS_MIN = 45;
const FRAME_TIME_P95_MAX_MS = 28;
const STUTTER_MAX = 1;

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
  };

  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
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

function summarizeInventory(inventory) {
  const materialSignatures = new Set();

  inventory.forEach((item) => {
    const material = item.material ?? {};
    materialSignatures.add([
      material.color ?? 'none',
      material.opacity ?? 'none',
      material.transparent ?? 'none',
      material.roughness ?? 'none',
      material.metalness ?? 'none',
    ].join('|'));
  });

  return {
    materialCount: materialSignatures.size,
    meshCount: inventory.reduce((total, item) => total + meshInstanceCount(item), 0),
  };
}

async function installWebGlProfiler(page) {
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
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
      if (!proto || proto.__galaMotionPerformancePatched) {
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
      proto.__galaMotionPerformancePatched = true;
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
    window.__GALA_MOTION_WEBGL_PROFILE__ = state;
  });
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|vertical-timber|finished-floor/i.test(item.name || '')).length > 60;
  }, null, { timeout: 60000 });
}

async function clearProfiler(page) {
  await page.evaluate(() => {
    if (window.__GALA_MOTION_WEBGL_PROFILE__) {
      window.__GALA_MOTION_WEBGL_PROFILE__.frames = [];
      window.__GALA_MOTION_WEBGL_PROFILE__.current = { drawCalls: 0, triangles: 0 };
    }
  });
}

async function runMotionSequence(page) {
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  await page.keyboard.down('w');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1800);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('w');
  await page.keyboard.down('s');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(1800);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('s');
  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  await page.keyboard.up('d');
}

async function collectSample(page, mode) {
  await clearProfiler(page);
  if (mode === 'motion') {
    await runMotionSequence(page);
  } else {
    await page.waitForTimeout(4500);
  }

  const profile = await page.evaluate(() => window.__GALA_MOTION_WEBGL_PROFILE__ ?? { frames: [] });
  const inventory = await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
  const frames = profile.frames.slice(2).filter((frame) => typeof frame.timestamp === 'number');
  const renderedFrames = frames.filter((frame) => Number(frame.drawCalls || 0) > 0);
  const timingFrames = renderedFrames.length >= 12 ? renderedFrames : frames;
  const frameTimes = timingFrames.slice(1)
    .map((frame, index) => frame.timestamp - timingFrames[index].timestamp)
    .filter((value) => value >= 4 && value <= 160);
  const drawCalls = renderedFrames.map((frame) => Number(frame.drawCalls || 0)).filter((value) => value > 0);
  const triangles = renderedFrames.map((frame) => Number(frame.triangles || 0)).filter((value) => value > 0);
  const frameTimeMedian = median(frameTimes);
  const frameTimeP95 = percentile(frameTimes, 95);
  const fpsMedian = frameTimeMedian ? 1000 / frameTimeMedian : null;
  const maxFrameTime = frameTimes.length > 0 ? Math.max(...frameTimes) : null;
  const stutterCountOver50Ms = frameTimes.filter((value) => value > 50).length;
  const inventorySummary = summarizeInventory(inventory);
  const pass = fpsMedian !== null
    && frameTimeP95 !== null
    && fpsMedian >= FPS_MIN
    && frameTimeP95 <= FRAME_TIME_P95_MAX_MS
    && stutterCountOver50Ms <= STUTTER_MAX;

  return {
    fpsMedian: roundMetric(fpsMedian),
    frameTimeP95Ms: roundMetric(frameTimeP95),
    maxFrameTimeMs: roundMetric(maxFrameTime),
    stutterCountOver50Ms,
    drawCalls: Math.round(median(drawCalls) ?? 0),
    triangles: Math.round(median(triangles) ?? 0),
    meshCount: inventorySummary.meshCount,
    materialCount: inventorySummary.materialCount,
    pass,
    diagnostics: {
      frameSampleCount: frameTimes.length,
      rawRafFrameSampleCount: frames.length,
      renderedFrameSampleCount: renderedFrames.length,
      timingSource: timingFrames === renderedFrames ? 'webgl-rendered-frames' : 'raw-raf-callbacks',
      zeroDrawFrameSampleCount: Math.max(0, frames.length - renderedFrames.length),
    },
  };
}

async function collectRoute(page, baseUrl, route) {
  const response = await page.goto(`${baseUrl}${route}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(1200);
  const stationary = await collectSample(page, 'stationary');
  const motion = await collectSample(page, 'motion');

  return {
    motion,
    stationary,
    status: response?.status() ?? null,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  await installWebGlProfiler(page);

  const exterior = await collectRoute(page, options.baseUrl, ROUTES.exterior);
  const interior = await collectRoute(page, options.baseUrl, ROUTES.interior);
  await browser.close();

  const hotspots = [
    ...(!exterior.motion.pass ? [{ route: 'exterior', sample: 'motion', reason: 'motion sample over budget', metrics: exterior.motion }] : []),
    ...(!interior.motion.pass ? [{ route: 'interior', sample: 'motion', reason: 'motion sample over budget', metrics: interior.motion }] : []),
  ];
  const motionPerformanceBudgetMet = exterior.stationary.pass
    && exterior.motion.pass
    && interior.stationary.pass
    && interior.motion.pass;
  const result = {
    generatedAt: new Date().toISOString(),
    motionPerformanceAuditRan: true,
    exteriorStationary: exterior.stationary,
    exteriorMotion: exterior.motion,
    interiorStationary: interior.stationary,
    interiorMotion: interior.motion,
    motionPerformanceBudgetMet,
    hotspots,
    productVisualAccepted: false,
    pass: motionPerformanceBudgetMet,
    diagnostics: {
      budget: {
        fpsMedianMin: FPS_MIN,
        frameTimeP95MaxMs: FRAME_TIME_P95_MAX_MS,
        stutterCountOver50MsMax: STUTTER_MAX,
      },
      routeStatus: {
        exterior: exterior.status,
        interior: interior.status,
      },
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-motion-performance-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
