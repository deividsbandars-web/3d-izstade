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
const ROUTE = '/modular-homes/studio?view=exterior&homeStudio=1';
const EXPECTED_OPENING_IDS = [
  'D-ENTRY',
  'D-TERRACE',
  'W-BATH',
  'W-BED',
  'W-KITCHEN',
  'W-WEST-A',
  'W-WEST-B',
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

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? item.userData?.interiorBoardInstanceCount ?? 1);
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|vertical-timber|transparent-window-glass/i.test(item.name || '')).length > 60;
  }, null, { timeout: 60000 });
}

async function setExteriorDoorsOpen(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_GALA_DOOR_API__), null, { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => {
    const api = window.__WARPALA_GALA_DOOR_API__;
    if (api?.setDoorState) {
      api.setDoorState('D-ENTRY', 'open');
      api.setDoorState('D-TERRACE', 'open');
    } else {
      window.__WARPALA_GALA_DOOR_STATES__ = {
        ...(window.__WARPALA_GALA_DOOR_STATES__ ?? {}),
        'D-ENTRY': 'open',
        'D-TERRACE': 'open',
      };
      window.dispatchEvent(new CustomEvent('gala:door-state-change'));
    }
  });
  await page.waitForTimeout(700);
}

async function frameShot(page, shotName, screenshotPath) {
  await page.evaluate((nextShotName) => window.__WARPALA_3D_QA__?.frameModularHomeShot?.(nextShotName), shotName);
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: false, path: screenshotPath });
}

function collectOpeningAudit(inventory) {
  const boardMeshes = inventory.filter((item) => /individual-vertical-timber-board-panel/.test(item.name || '')
    && String(item.userData?.wallId || '').includes('exterior-wall'));
  const revealMeshes = inventory.filter((item) => /opening-clipped-thin-shadow-reveal-strip/.test(item.name || ''));
  const horizontalMarkMeshes = inventory.filter((item) => /scarf-joint|short-horizontal-board/i.test(item.name || ''));
  const fullRevealBacking = inventory.filter((item) => /thin-shadow-reveal-cladding-backing/.test(item.name || ''));
  const windowGlass = inventory.filter((item) => /transparent-window-glass-panel/.test(item.name || ''));
  const closedExteriorDoorSlabs = inventory.filter((item) => /D-(ENTRY|TERRACE)-closed-opaque-door-slab/.test(item.name || ''));
  const openExteriorDoorLeaves = inventory.filter((item) => /D-(ENTRY|TERRACE)-open-door-leaf-clear-passage/.test(item.name || ''));
  const openingIdsWithAssemblies = [...new Set(inventory
    .map((item) => item.userData?.openingId)
    .filter((value) => typeof value === 'string'))].sort();
  const missingOpenings = EXPECTED_OPENING_IDS.filter((openingId) => !openingIdsWithAssemblies.includes(openingId));
  const wallSkinMasksApplied = boardMeshes.length > 0
    && revealMeshes.length > 0
    && boardMeshes.every((item) => item.userData?.openingApertureMasksAppliedToWallSkin === true)
    && revealMeshes.every((item) => item.userData?.openingApertureMasksAppliedToWallSkin === true)
    && fullRevealBacking.length === 0;
  const windowGlassTransparent = windowGlass.length >= 5
    && windowGlass.every((item) => item.userData?.windowGlassTransparent === true
      && item.material?.transparent === true
      && Number(item.material?.opacity ?? 1) < 0.75
      && Number(item.material?.opacity ?? 0) >= 0.3);
  const doorPortalClearWhenOpen = closedExteriorDoorSlabs.length === 0
    && openExteriorDoorLeaves.length >= 2
    && wallSkinMasksApplied;
  const boardsVisibleThroughWindowFrames = !wallSkinMasksApplied || !windowGlassTransparent;
  const boardsInsideDoorPortal = !wallSkinMasksApplied || !doorPortalClearWhenOpen;
  const affectedOpenings = [
    ...missingOpenings.map((openingId) => ({ openingId, reason: 'missing opening assembly in scene inventory' })),
    ...(!wallSkinMasksApplied ? EXPECTED_OPENING_IDS.map((openingId) => ({ openingId, reason: 'wall-skin aperture masks not proven' })) : []),
    ...(!windowGlassTransparent ? windowGlass.map((item) => ({ openingId: item.userData?.openingId ?? 'unknown', reason: 'window glass not transparent', opacity: item.material?.opacity ?? null })) : []),
  ];

  return {
    affectedOpenings,
    boardsInsideDoorPortal,
    boardsVisibleThroughWindowFrames,
    doorPortalClearWhenOpen,
    horizontalFacadeMarksPresent: horizontalMarkMeshes.length > 0,
    horizontalMarkMeshCount: horizontalMarkMeshes.reduce((total, item) => total + meshInstanceCount(item), 0),
    openingApertureMasksAppliedToWallSkin: wallSkinMasksApplied,
    openingIdsWithAssemblies,
    windowGlass,
    windowGlassTransparent,
    diagnostics: {
      boardMeshGroups: boardMeshes.length,
      boardInstanceCount: boardMeshes.reduce((total, item) => total + meshInstanceCount(item), 0),
      closedExteriorDoorSlabCount: closedExteriorDoorSlabs.length,
      fullRevealBackingCount: fullRevealBacking.length,
      openExteriorDoorLeafCount: openExteriorDoorLeaves.length,
      revealMeshGroups: revealMeshes.length,
      revealInstanceCount: revealMeshes.reduce((total, item) => total + meshInstanceCount(item), 0),
      windowGlassCount: windowGlass.length,
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
  const page = await browser.newPage({ viewport: VIEWPORT });
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
  });

  const response = await page.goto(`${options.baseUrl}${ROUTE}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(900);
  const exteriorScreenshot = path.join(options.outDir, 'exterior-after-clean-vertical-boards.png');
  await page.screenshot({ fullPage: false, path: exteriorScreenshot });
  await sharp(exteriorScreenshot)
    .extract({ height: 420, left: 90, top: 230, width: 790 })
    .toFile(path.join(options.outDir, 'exterior-window-after-clear-glass-and-clipped-boards.png'));

  await setExteriorDoorsOpen(page);
  await frameShot(page, 'exteriorFrontHero', path.join(options.outDir, 'exterior-open-door-after-clear-portal.png'));
  const inventory = await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
  await browser.close();

  const audit = collectOpeningAudit(inventory);
  const pass = !audit.boardsVisibleThroughWindowFrames
    && !audit.boardsInsideDoorPortal
    && audit.windowGlassTransparent
    && audit.doorPortalClearWhenOpen
    && audit.openingApertureMasksAppliedToWallSkin
    && !audit.horizontalFacadeMarksPresent
    && audit.affectedOpenings.length === 0;
  const result = {
    generatedAt: new Date().toISOString(),
    openingClipAuditRan: true,
    boardsVisibleThroughWindowFrames: audit.boardsVisibleThroughWindowFrames,
    boardsInsideDoorPortal: audit.boardsInsideDoorPortal,
    windowGlassTransparent: audit.windowGlassTransparent,
    doorPortalClearWhenOpen: audit.doorPortalClearWhenOpen,
    openingApertureMasksAppliedToWallSkin: audit.openingApertureMasksAppliedToWallSkin,
    affectedOpenings: audit.affectedOpenings,
    horizontalFacadeMarksPresent: audit.horizontalFacadeMarksPresent,
    horizontalFacadeMarksRemoved: !audit.horizontalFacadeMarksPresent,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      ...audit.diagnostics,
      route: ROUTE,
      status: response?.status() ?? null,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-opening-clip-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
