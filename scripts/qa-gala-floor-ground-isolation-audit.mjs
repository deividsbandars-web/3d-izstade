#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-opening-interior-floor-performance-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const ROUTE = '/modular-homes/studio?view=interior&homeStudio=1';

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

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|finished-floor|vertical-timber/i.test(item.name || '')).length > 60;
  }, null, { timeout: 60000 });
}

async function floorSample(imagePath) {
  const crop = await sharp(imagePath)
    .extract({ height: 250, left: 430, top: 520, width: 520 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = crop;
  let blueDominant = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    r += red;
    g += green;
    b += blue;
    if (blue > red + 28 && blue > green + 18 && blue > 90) {
      blueDominant += 1;
    }
  }

  return {
    average: {
      b: Number((b / pixels).toFixed(2)),
      g: Number((g / pixels).toFixed(2)),
      r: Number((r / pixels).toFixed(2)),
    },
    blueDominantRatio: Number((blueDominant / pixels).toFixed(4)),
  };
}

function colorDistance(left, right) {
  return Number(Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b).toFixed(2));
}

async function moveBackward(page) {
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  await page.keyboard.down('s');
  await page.waitForTimeout(1300);
  await page.keyboard.up('s');
  await page.waitForTimeout(500);
}

function collectSceneAudit(inventory) {
  const groundDetail = inventory.filter((item) => /world-ground-detail:/.test(item.name || ''));
  const groundAnchors = inventory.filter((item) => /world-ground:(city-stadium|sponsor|arrival|center-spine)/.test(item.name || ''));
  const globalGround = inventory.filter((item) => item.name === 'world-ground:global-base');
  const floor = inventory.find((item) => item.name === 'gala-construction-single-finished-floor-no-overlays');
  const floorTransparent = floor?.material?.transparent === true || Number(floor?.material?.opacity ?? 1) < 0.99;
  const worldGroundMaskedFromInterior = groundDetail.length === 0
    && groundAnchors.length === 0
    && globalGround.every((item) => item.position?.[1] <= -0.3);

  return {
    floor,
    floorTransparent,
    globalGroundCount: globalGround.length,
    groundAnchors,
    groundDetail,
    groundDetailOverlapsHouseFootprint: groundDetail.length > 0 || groundAnchors.length > 0,
    worldGroundMaskedFromInterior,
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
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
  });
  const response = await page.goto(`${options.baseUrl}${ROUTE}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(1200);
  const nearScreenshot = path.join(options.outDir, 'floor-after-stable-near.png');
  await page.screenshot({ fullPage: false, path: nearScreenshot });
  const nearSample = await floorSample(nearScreenshot);

  await moveBackward(page);
  const backwardScreenshot = path.join(options.outDir, 'floor-after-stable-backward-motion.png');
  await page.screenshot({ fullPage: false, path: backwardScreenshot });
  const backwardSample = await floorSample(backwardScreenshot);

  const inventory = await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
  await browser.close();

  const sceneAudit = collectSceneAudit(inventory);
  const sampleDistance = colorDistance(nearSample.average, backwardSample.average);
  const blueVoidOrGroundVisibleInside = nearSample.blueDominantRatio > 0.08
    || backwardSample.blueDominantRatio > 0.08
    || sceneAudit.groundDetailOverlapsHouseFootprint
    || sceneAudit.floorTransparent;
  const floorColorStableNearFar = sampleDistance <= 80
    && nearSample.blueDominantRatio <= 0.08
    && backwardSample.blueDominantRatio <= 0.08;
  const floorColorStableDuringBackwardMovement = floorColorStableNearFar && !blueVoidOrGroundVisibleInside;
  const pass = !blueVoidOrGroundVisibleInside
    && !sceneAudit.groundDetailOverlapsHouseFootprint
    && floorColorStableNearFar
    && floorColorStableDuringBackwardMovement
    && sceneAudit.worldGroundMaskedFromInterior;
  const result = {
    generatedAt: new Date().toISOString(),
    floorGroundIsolationAuditRan: true,
    blueVoidOrGroundVisibleInside: blueVoidOrGroundVisibleInside,
    groundDetailOverlapsHouseFootprint: sceneAudit.groundDetailOverlapsHouseFootprint,
    floorColorStableNearFar,
    floorColorStableDuringBackwardMovement,
    worldGroundMaskedFromInterior: sceneAudit.worldGroundMaskedFromInterior,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      backwardSample,
      floorTransparent: sceneAudit.floorTransparent,
      globalGroundCount: sceneAudit.globalGroundCount,
      groundAnchorCount: sceneAudit.groundAnchors.length,
      groundDetailCount: sceneAudit.groundDetail.length,
      nearSample,
      route: ROUTE,
      sampleDistance,
      status: response?.status() ?? null,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-floor-ground-isolation-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
