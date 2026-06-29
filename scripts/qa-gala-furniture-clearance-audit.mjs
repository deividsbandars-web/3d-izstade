#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-interior-performance-geometry-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const ROUTE = '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1';
const MIN_CLEARANCE_M = 0.03;
const MODEL_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts';
const ROOM_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx';
const REQUIRED_FURNITURE_LAYOUT_KEYS = [
  'bedroomBedsideCabinet',
  'bedroomWardrobe',
];
const REQUIRED_GLTF_CLEARANCE_PROXY_PATTERNS = [
  /living-sofa.*clearance-proxy/,
  /living-coffee-table.*clearance-proxy/,
];
const REQUIRED_FIXTURE_LAYOUT_KEYS = [
  'bathroomMirror',
  'bathroomShowerBackPanel',
  'bathroomShowerHead',
  'bathroomShowerRiser',
  'bathroomSinkFaucet',
  'bathroomVanityDrawerFront',
  'bathroomVanityDrawerHandle',
  'bathroomWcBowl',
  'bathroomWcCistern',
  'bathroomWcDarkBowlInset',
  'bathroomWcFlushButton',
  'bathroomWcRoundedBowl',
  'bathroomWcSeat',
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

function readRepoFile(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function boundsToPlain(bounds) {
  return bounds ? {
    max: bounds.max,
    min: bounds.min,
    size: bounds.size,
  } : null;
}

function collisionBounds(item) {
  return item.userData?.constructionLocalBounds ?? item.bounds;
}

function overlaps1d(aMin, aMax, bMin, bMax) {
  return aMin < bMax && aMax > bMin;
}

function boxesIntersect(a, b) {
  return Boolean(a && b
    && overlaps1d(a.min.x, a.max.x, b.min.x, b.max.x)
    && overlaps1d(a.min.y, a.max.y, b.min.y, b.max.y)
    && overlaps1d(a.min.z, a.max.z, b.min.z, b.max.z));
}

function clearanceBetweenBoxes(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }
  const dx = a.max.x < b.min.x
    ? b.min.x - a.max.x
    : b.max.x < a.min.x
      ? a.min.x - b.max.x
      : 0;
  const dy = a.max.y < b.min.y
    ? b.min.y - a.max.y
    : b.max.y < a.min.y
      ? a.min.y - b.max.y
      : 0;
  const dz = a.max.z < b.min.z
    ? b.min.z - a.max.z
    : b.max.z < a.min.z
      ? a.min.z - b.max.z
      : 0;
  if (dy > 0.04) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot(dx, dz);
}

function collectExteriorWallEnvelope(wallCores) {
  const exteriorWalls = wallCores
    .map((item) => collisionBounds(item))
    .filter((bounds, index) => bounds && /exterior-wall/.test(wallCores[index]?.name || ''));
  if (exteriorWalls.length === 0) {
    return null;
  }

  return exteriorWalls.reduce((envelope, bounds) => ({
    max: {
      x: Math.max(envelope.max.x, bounds.max.x),
      y: Math.max(envelope.max.y, bounds.max.y),
      z: Math.max(envelope.max.z, bounds.max.z),
    },
    min: {
      x: Math.min(envelope.min.x, bounds.min.x),
      y: Math.min(envelope.min.y, bounds.min.y),
      z: Math.min(envelope.min.z, bounds.min.z),
    },
  }), {
    max: { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY },
    min: { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY },
  });
}

function throughWallLeakage(subjectBounds, wallEnvelope) {
  if (!subjectBounds || !wallEnvelope) {
    return [];
  }

  const tolerance = MIN_CLEARANCE_M;
  return [
    subjectBounds.min.x < wallEnvelope.min.x - tolerance ? 'west exterior wall envelope' : null,
    subjectBounds.max.x > wallEnvelope.max.x + tolerance ? 'east exterior wall envelope' : null,
    subjectBounds.min.z < wallEnvelope.min.z - tolerance ? 'south exterior wall envelope' : null,
    subjectBounds.max.z > wallEnvelope.max.z + tolerance ? 'north exterior wall envelope' : null,
  ].filter(Boolean);
}

function isWallCore(item) {
  return /wall-core-cell-opening-aware/.test(item.name || '');
}

function isClearanceSubject(item) {
  const name = item.name || '';
  if (!item.bounds || item.userData?.wallMountedFixture === true) {
    return false;
  }
  if (item.userData?.furnitureClearanceSubject === 'furniture' || item.userData?.fixtureClearanceSubject === 'fixture') {
    return true;
  }
  return /living-(sofa|coffee-table)|bedroom-(bed-frame|mattress|blanket|pillow|bedside|wardrobe)|kitchen-(base-cabinets|countertop|sink|cooktop|upper-cabinet|readable-cabinet|small-dark-cabinet-handle)|bathroom-(shower|vanity|sink|wc|faucet)/.test(name);
}

function collectSourceAudit() {
  const modelSource = readRepoFile(MODEL_FILE);
  const roomSource = readRepoFile(ROOM_FILE);
  const furnitureLayoutKeysPresent = REQUIRED_FURNITURE_LAYOUT_KEYS
    .filter((key) => new RegExp(`${key}\\s*:`).test(modelSource));
  const fixtureLayoutKeysPresent = REQUIRED_FIXTURE_LAYOUT_KEYS
    .filter((key) => new RegExp(`${key}\\s*:`).test(modelSource));
  const furnitureRoomKeysConsumed = REQUIRED_FURNITURE_LAYOUT_KEYS
    .filter((key) => roomSource.includes(`layout.${key}.position`) && roomSource.includes(`layout.${key}.size`));
  const fixtureRoomKeysConsumed = REQUIRED_FIXTURE_LAYOUT_KEYS
    .filter((key) => roomSource.includes(`layout.${key}.position`));
  const blockingInlinePlacements = [
    '-2.31',
    '-2.456',
    '-2.28',
    'layout.bathroomVanity.position[0]',
    'layout.bathroomWcBowl.position[0]',
  ].filter((pattern) => roomSource.includes(pattern));

  return {
    blockingInlinePlacements,
    fixturePlacementSingleOwner: fixtureLayoutKeysPresent.length === REQUIRED_FIXTURE_LAYOUT_KEYS.length
      && fixtureRoomKeysConsumed.length === REQUIRED_FIXTURE_LAYOUT_KEYS.length
      && blockingInlinePlacements.length === 0,
    fixtureRoomKeysConsumed,
    furniturePlacementSingleOwner: furnitureLayoutKeysPresent.length === REQUIRED_FURNITURE_LAYOUT_KEYS.length
      && furnitureRoomKeysConsumed.length === REQUIRED_FURNITURE_LAYOUT_KEYS.length
      && blockingInlinePlacements.length === 0,
    furnitureRoomKeysConsumed,
    requiredFixtureLayoutKeys: REQUIRED_FIXTURE_LAYOUT_KEYS,
    requiredFurnitureLayoutKeys: REQUIRED_FURNITURE_LAYOUT_KEYS,
  };
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|bathroom|bedroom|kitchen|sofa/i.test(item.name || '')).length > 80;
  }, null, { timeout: 60000 });
}

async function frameShot(page, shotName, screenshotPath) {
  await page.evaluate((nextShotName) => window.__WARPALA_3D_QA__?.frameModularHomeShot?.(nextShotName), shotName);
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: false, path: screenshotPath });
}

function collectClearanceAudit(inventory) {
  const wallCores = inventory.filter(isWallCore);
  const subjects = inventory.filter(isClearanceSubject);
  const gltfProxySubjects = subjects.filter((item) => item.userData?.furnitureGltfClearanceProxy === true);
  const missingGltfProxySubjects = REQUIRED_GLTF_CLEARANCE_PROXY_PATTERNS
    .filter((pattern) => !gltfProxySubjects.some((item) => pattern.test(item.name || '')))
    .map((pattern) => String(pattern));
  const exteriorWallEnvelope = collectExteriorWallEnvelope(wallCores);
  const intersections = [];
  const clearanceViolations = [];
  const throughWallVisibility = [];

  subjects.forEach((subject) => {
    const subjectBounds = collisionBounds(subject);
    const leakageFaces = throughWallLeakage(subjectBounds, exteriorWallEnvelope);
    if (leakageFaces.length > 0) {
      throughWallVisibility.push({
        leakageFaces,
        objectBounds: boundsToPlain(subjectBounds),
        objectName: subject.name,
      });
    }

    wallCores.forEach((wall) => {
      const wallBounds = collisionBounds(wall);
      if (boxesIntersect(subjectBounds, wallBounds)) {
        intersections.push({
          objectBounds: boundsToPlain(subjectBounds),
          objectName: subject.name,
          wallBounds: boundsToPlain(wallBounds),
          wallName: wall.name,
        });
        return;
      }

      const clearance = clearanceBetweenBoxes(subjectBounds, wallBounds);
      if (Number.isFinite(clearance) && clearance < MIN_CLEARANCE_M) {
        clearanceViolations.push({
          clearanceMeters: Number(clearance.toFixed(4)),
          objectName: subject.name,
          wallName: wall.name,
        });
      }
    });
  });

  return {
    clearanceViolations,
    exteriorWallEnvelope: boundsToPlain(exteriorWallEnvelope),
    gltfProxySubjectNames: gltfProxySubjects.map((item) => item.name),
    intersections,
    missingGltfProxySubjects,
    subjectCount: subjects.length,
    throughWallVisibility,
    wallCoreCount: wallCores.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);

  const sourceAudit = collectSourceAudit();
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const response = await page.goto(`${options.baseUrl}${ROUTE}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(900);
  await frameShot(page, 'interiorKitchen', path.join(options.outDir, 'furniture-clearance-after.png'));
  await frameShot(page, 'interiorSleepingBathroom', path.join(options.outDir, 'bathroom-fixture-clearance-after.png'));

  const inventory = await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
  await browser.close();

  const clearanceAudit = collectClearanceAudit(inventory);
  const wallIntersectionsDetected = clearanceAudit.intersections.length > 0 || clearanceAudit.clearanceViolations.length > 0;
  const throughWallVisibilityDetected = clearanceAudit.intersections.length > 0 || clearanceAudit.throughWallVisibility.length > 0;
  const pass = !wallIntersectionsDetected
    && !throughWallVisibilityDetected
    && sourceAudit.furniturePlacementSingleOwner
    && sourceAudit.fixturePlacementSingleOwner
    && clearanceAudit.missingGltfProxySubjects.length === 0;
  const result = {
    generatedAt: new Date().toISOString(),
    furnitureClearanceAuditRan: true,
    wallIntersectionsDetected,
    throughWallVisibilityDetected,
    intersections: clearanceAudit.intersections,
    minimumClearanceMeters: MIN_CLEARANCE_M,
    furniturePlacementSingleOwner: sourceAudit.furniturePlacementSingleOwner,
    fixturePlacementSingleOwner: sourceAudit.fixturePlacementSingleOwner,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      clearanceViolations: clearanceAudit.clearanceViolations,
      exteriorWallEnvelope: clearanceAudit.exteriorWallEnvelope,
      gltfProxySubjectNames: clearanceAudit.gltfProxySubjectNames,
      missingGltfProxySubjects: clearanceAudit.missingGltfProxySubjects,
      route: ROUTE,
      screenshots: {
        bathroomFixture: 'bathroom-fixture-clearance-after.png',
        furniture: 'furniture-clearance-after.png',
      },
      sourceAudit,
      standardViewThroughWallVisibilityChecks: {
        method: 'clearance subject bounds must remain inside the exterior wall envelope for standard interior/exterior views',
        throughWallVisibility: clearanceAudit.throughWallVisibility,
      },
      status: response?.status() ?? null,
      subjectCount: clearanceAudit.subjectCount,
      wallCoreCount: clearanceAudit.wallCoreCount,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-furniture-clearance-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
