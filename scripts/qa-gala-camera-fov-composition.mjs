#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'artifacts/gala-camera-fov-composition';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROUTES = [
  { name: 'exterior', path: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1' },
  { name: 'interior', path: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1' },
];
const VIEWPORTS = [
  { expectedFov: 50, hasTouch: false, height: 900, isMobile: false, name: 'desktop', width: 1440 },
  { expectedFov: 56, hasTouch: true, height: 844, isMobile: true, name: 'mobile', width: 390 },
];

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

function normalizeLevelEulerPair(pitch, roll) {
  const piWrapped = Math.abs(Math.abs(pitch) - Math.PI) <= 0.001
    && Math.abs(Math.abs(roll) - Math.PI) <= 0.001;

  if (piWrapped) {
    return { pitch: 0, roll: 0 };
  }

  return { pitch, roll };
}

async function waitForQaState(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getState), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const state = window.__WARPALA_3D_QA__?.getState?.();
    return Boolean(state?.modularHomeVisible && state?.cameraPosition);
  }, null, { timeout: 60000 });
  await page.waitForTimeout(900);
}

async function capture(browser, baseUrl, outDir, route, viewport) {
  const context = await browser.newContext({
    hasTouch: viewport.hasTouch,
    isMobile: viewport.isMobile,
    viewport: { height: viewport.height, width: viewport.width },
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}${route.path}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForQaState(page);

  const state = await page.evaluate(() => window.__WARPALA_3D_QA__?.getState?.() ?? null);
  const screenshotName = `${viewport.name}-${route.name}-first-frame.png`;
  await page.screenshot({ fullPage: false, path: path.join(outDir, screenshotName) });
  await context.close();

  const cameraFov = Number(state?.cameraFov ?? Number.NaN);
  const rawCameraPitch = Number(state?.cameraPitch ?? state?.cameraRotation?.x ?? Number.NaN);
  const rawCameraRoll = Number(state?.cameraRoll ?? state?.cameraRotation?.z ?? Number.NaN);
  const normalizedCamera = normalizeLevelEulerPair(rawCameraPitch, rawCameraRoll);
  const cameraPitch = normalizedCamera.pitch;
  const cameraRoll = normalizedCamera.roll;
  const fovMatches = Math.abs(cameraFov - viewport.expectedFov) <= 0.2;
  const rollOk = Math.abs(cameraRoll) <= 0.001;
  const pitchOk = Math.abs(cameraPitch) <= 0.22;

  return {
    cameraFov,
    cameraPitch,
    cameraRoll,
    rawCameraPitch,
    rawCameraRoll,
    cameraRollApproximatelyZero: Boolean(state?.cameraRollApproximatelyZero) && rollOk,
    expectedFov: viewport.expectedFov,
    fovMatches,
    pass: response?.status() === 200 && fovMatches && pitchOk && rollOk,
    pitchOk,
    responseStatus: response?.status() ?? null,
    rollOk,
    route: route.name,
    routePath: route.path,
    screenshot: screenshotName,
    viewport: viewport.name,
    viewportSize: { height: viewport.height, width: viewport.width },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const captures = [];
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      captures.push(await capture(browser, options.baseUrl, options.outDir, route, viewport));
    }
  }

  await browser.close();

  const result = {
    cameraFovCompositionAuditRan: true,
    captures,
    generatedAt: new Date().toISOString(),
    pass: captures.every((capture) => capture.pass),
    productVisualAccepted: false,
  };

  writeJson(path.join(options.outDir, 'qa-gala-camera-fov-composition-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
