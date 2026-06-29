#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'artifacts/gala-owner-rejection-motion-openings';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const FINISHED_FLOOR_TOP_Y = 0.18;
const PLAYER_EYE_HEIGHT_M = FINISHED_FLOOR_TOP_Y + 1.65;
const LOOK_HEIGHT_M = FINISHED_FLOOR_TOP_Y + 1.42;

const DEFAULT_DOOR_STATES = {
  'D-BATHROOM': 'closed',
  'D-BEDROOM': 'closed',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

const ROUTES = [
  {
    doorStates: { ...DEFAULT_DOOR_STATES, 'D-ENTRY': 'closed' },
    openingId: 'D-ENTRY',
    routeId: 'entry-door-walk-pan',
    startView: { lookAt: [4.64, LOOK_HEIGHT_M, -2.5], position: [4.64, PLAYER_EYE_HEIGHT_M, -1.18] },
    steps: [
      { durationMs: 750, keys: ['KeyW'], label: 'walk-toward-closed-entry-frame' },
      { durationMs: 520, keys: ['ArrowLeft'], label: 'pan-left-across-entry-frame' },
      { durationMs: 920, keys: ['ArrowRight'], label: 'pan-right-across-entry-frame' },
      { durationMs: 520, keys: ['KeyS'], label: 'walk-back-from-entry-frame' },
    ],
  },
  {
    doorStates: { ...DEFAULT_DOOR_STATES, 'D-TERRACE': 'open' },
    openingId: 'D-TERRACE',
    routeId: 'terrace-door-walk-pan',
    startView: { lookAt: [4.38, LOOK_HEIGHT_M, 2.48], position: [4.38, PLAYER_EYE_HEIGHT_M, 1.24] },
    steps: [
      { durationMs: 750, keys: ['KeyW'], label: 'walk-toward-terrace-frame' },
      { durationMs: 520, keys: ['ArrowRight'], label: 'pan-right-across-terrace-frame' },
      { durationMs: 920, keys: ['ArrowLeft'], label: 'pan-left-across-terrace-frame' },
      { durationMs: 520, keys: ['KeyS'], label: 'walk-back-from-terrace-frame' },
    ],
  },
  {
    doorStates: { ...DEFAULT_DOOR_STATES, 'D-BATHROOM': 'open' },
    openingId: 'D-BATHROOM',
    routeId: 'bathroom-door-walk-through-pan',
    startView: { lookAt: [6.42, LOOK_HEIGHT_M, -0.1], position: [6.42, PLAYER_EYE_HEIGHT_M, 0.86] },
    steps: [
      { durationMs: 720, keys: ['KeyW'], label: 'walk-through-open-bathroom-frame' },
      { durationMs: 560, keys: ['ArrowLeft'], label: 'pan-left-bathroom-jamb' },
      { durationMs: 900, keys: ['ArrowRight'], label: 'pan-right-bathroom-jamb' },
      { durationMs: 520, keys: ['KeyS'], label: 'walk-back-through-bathroom-frame' },
    ],
  },
  {
    doorStates: { ...DEFAULT_DOOR_STATES, 'D-BEDROOM': 'open' },
    openingId: 'D-BEDROOM',
    routeId: 'bedroom-door-walk-through-pan',
    startView: { lookAt: [7.28, LOOK_HEIGHT_M, 1.14], position: [6.26, PLAYER_EYE_HEIGHT_M, 1.14] },
    steps: [
      { durationMs: 780, keys: ['KeyW'], label: 'walk-through-open-bedroom-frame' },
      { durationMs: 560, keys: ['ArrowLeft'], label: 'pan-left-bedroom-jamb' },
      { durationMs: 900, keys: ['ArrowRight'], label: 'pan-right-bedroom-jamb' },
      { durationMs: 520, keys: ['KeyS'], label: 'walk-back-through-bedroom-frame' },
    ],
  },
  {
    openingId: 'W-KITCHEN',
    routeId: 'kitchen-window-walk-pan',
    startView: { lookAt: [2.1, LOOK_HEIGHT_M, -2.48], position: [3.0, PLAYER_EYE_HEIGHT_M, -1.32] },
    steps: [
      { durationMs: 520, keys: ['KeyW'], label: 'walk-toward-kitchen-window' },
      { durationMs: 520, keys: ['ArrowLeft'], label: 'pan-left-kitchen-window-frame' },
      { durationMs: 920, keys: ['ArrowRight'], label: 'pan-right-kitchen-window-frame' },
      { durationMs: 420, keys: ['KeyS'], label: 'walk-back-kitchen-window' },
    ],
  },
  {
    openingId: 'W-BATH',
    routeId: 'bath-window-walk-pan',
    startView: { lookAt: [6.18, LOOK_HEIGHT_M + 0.18, -2.48], position: [6.18, PLAYER_EYE_HEIGHT_M, -0.92] },
    steps: [
      { durationMs: 520, keys: ['KeyW'], label: 'walk-toward-bath-window' },
      { durationMs: 520, keys: ['ArrowLeft'], label: 'pan-left-bath-window-frame' },
      { durationMs: 920, keys: ['ArrowRight'], label: 'pan-right-bath-window-frame' },
      { durationMs: 420, keys: ['KeyS'], label: 'walk-back-bath-window' },
    ],
  },
  {
    openingId: 'W-BED',
    routeId: 'bed-window-walk-pan',
    startView: { lookAt: [8.58, LOOK_HEIGHT_M + 0.16, 2.48], position: [8.58, PLAYER_EYE_HEIGHT_M, 0.82] },
    steps: [
      { durationMs: 520, keys: ['KeyW'], label: 'walk-toward-bed-window' },
      { durationMs: 520, keys: ['ArrowRight'], label: 'pan-right-bed-window-frame' },
      { durationMs: 920, keys: ['ArrowLeft'], label: 'pan-left-bed-window-frame' },
      { durationMs: 420, keys: ['KeyS'], label: 'walk-back-bed-window' },
    ],
  },
  {
    openingId: 'W-WEST-A',
    routeId: 'west-window-a-walk-pan',
    startView: { lookAt: [0.06, LOOK_HEIGHT_M + 0.1, -1.26], position: [0.92, PLAYER_EYE_HEIGHT_M, -1.26] },
    steps: [
      { durationMs: 520, keys: ['KeyW'], label: 'walk-toward-west-window-a' },
      { durationMs: 520, keys: ['ArrowLeft'], label: 'pan-left-west-window-a-frame' },
      { durationMs: 920, keys: ['ArrowRight'], label: 'pan-right-west-window-a-frame' },
      { durationMs: 420, keys: ['KeyS'], label: 'walk-back-west-window-a' },
    ],
  },
  {
    openingId: 'W-WEST-B',
    routeId: 'west-window-b-walk-pan',
    startView: { lookAt: [0.06, LOOK_HEIGHT_M + 0.1, 1.26], position: [0.92, PLAYER_EYE_HEIGHT_M, 1.26] },
    steps: [
      { durationMs: 520, keys: ['KeyW'], label: 'walk-toward-west-window-b' },
      { durationMs: 520, keys: ['ArrowLeft'], label: 'pan-left-west-window-b-frame' },
      { durationMs: 920, keys: ['ArrowRight'], label: 'pan-right-west-window-b-frame' },
      { durationMs: 420, keys: ['KeyS'], label: 'walk-back-west-window-b' },
    ],
  },
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

function planXToLocalX(planX) {
  return planX - (HOUSE_LENGTH * 0.5);
}

function rotateWorldPoint(unrotatedX, unrotatedZ) {
  const cos = Math.cos(ROTATION_Y);
  const sin = Math.sin(ROTATION_Y);
  return {
    x: (unrotatedX * cos) + (unrotatedZ * sin),
    z: (-unrotatedX * sin) + (unrotatedZ * cos),
  };
}

function planToWorld(planX, planY, planZ) {
  const rotated = rotateWorldPoint(
    GALA_PREVIEW_POSITION.x + (planXToLocalX(planX) * GALA_PREVIEW_SCALE),
    GALA_PREVIEW_POSITION.z + (planZ * GALA_PREVIEW_SCALE),
  );
  return [rotated.x, GALA_PREVIEW_POSITION.y + (planY * GALA_PREVIEW_SCALE), rotated.z];
}

function vectorToArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return [value.x, value.y, value.z];
  }
  return null;
}

function distance3(left, right) {
  const leftArray = vectorToArray(left);
  const rightArray = vectorToArray(right);
  if (!leftArray || !rightArray) {
    return null;
  }
  return Math.hypot(
    rightArray[0] - leftArray[0],
    rightArray[1] - leftArray[1],
    rightArray[2] - leftArray[2],
  );
}

function normalizeInventoryForOpening(inventory, openingId) {
  return inventory
    .filter((item) => item.userData?.openingId === openingId)
    .map((item) => ({
      material: {
        color: item.material?.color ?? null,
        opacity: item.material?.opacity ?? null,
        transparent: item.material?.transparent ?? null,
      },
      name: item.name,
      position: item.position,
      scale: item.scale,
      userData: {
        doorState: item.userData?.doorState ?? null,
        pbrTextureKind: item.userData?.pbrTextureKind ?? null,
        windowGlassTransparent: item.userData?.windowGlassTransparent ?? null,
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function openingSignature(inventory, openingId) {
  return JSON.stringify(normalizeInventoryForOpening(inventory, openingId));
}

async function captureCanvas(page, file) {
  const canvas = page.locator('canvas').first();
  await canvas.screenshot({ path: file, timeout: 8000 }).catch(async () => {
    await page.screenshot({ fullPage: false, path: file });
  });
}

async function openMotionStudio(page, baseUrl) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=interior&homeStudio=1&galaOpeningMotionAudit=1`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(4500);
  await page.locator('canvas').click({ position: { x: 20, y: 20 }, timeout: 6000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__WARPALA_GALA_DOOR_API__), null, { timeout: 20000 }).catch(() => {});
  await page.waitForFunction(() => {
    return Boolean(window.__WARPALA_GALA_GEOMETRY_SANITY__?.useGalaShowroomPhysics);
  }, null, { timeout: 20000 }).catch(() => {});
}

async function openInventoryStudio(page, baseUrl) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=interior&homeStudio=1&qa3d=1&galaOpeningInventoryAudit=1`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(4500);
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => item.userData?.openingId).length >= 10;
  }, null, { timeout: 60000 });
}

async function setDoorStates(page, states) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_GALA_DOOR_API__), null, { timeout: 12000 }).catch(() => {});
  await page.evaluate((nextStates) => {
    const api = window.__WARPALA_GALA_DOOR_API__;
    if (!api?.setDoorState) {
      return;
    }
    Object.entries(nextStates).forEach(([doorId, state]) => api.setDoorState(doorId, state));
  }, states);
  await page.waitForTimeout(350);
}

async function applyStartView(page, route) {
  const startView = {
    lookAt: planToWorld(...route.startView.lookAt),
    position: planToWorld(...route.startView.position),
    source: `gala-opening-motion:${route.routeId}`,
  };
  await page.evaluate((nextStartView) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: nextStartView,
        zoneId: 'gala-owner-rejection-opening-motion-audit',
      },
    }));
  }, startView);
  await page.waitForTimeout(900);
  await page.locator('canvas').click({ position: { x: 20, y: 20 }, timeout: 6000 }).catch(() => {});
  return startView;
}

async function getState(page) {
  const state = await page.evaluate(() => ({
    evidencePosition: window.__WARPALA_EXPO_EVIDENCE__?.playerPosition ?? null,
    inventory: window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [],
    qaState: window.__WARPALA_3D_QA__?.getState?.() ?? null,
    runtimeSanity: window.__WARPALA_GALA_GEOMETRY_SANITY__ ?? null,
  }));
  const planPosition = state.runtimeSanity?.currentPlanPosition;
  const runtimeCameraPosition = planPosition
    && Number.isFinite(Number(planPosition.x))
    && Number.isFinite(Number(planPosition.z))
    ? planToWorld(Number(planPosition.x), PLAYER_EYE_HEIGHT_M, Number(planPosition.z))
    : null;

  return {
    ...state,
    sampledCameraPosition: runtimeCameraPosition
      ?? state.qaState?.cameraPosition
      ?? state.evidencePosition
      ?? null,
  };
}

async function collectOpeningInventoryAudit(browser, baseUrl, route) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await openInventoryStudio(page, baseUrl);
  await setDoorStates(page, route.doorStates ?? DEFAULT_DOOR_STATES);
  await page.waitForTimeout(650);
  const beforeState = await getState(page);
  await page.waitForTimeout(1000);
  const afterState = await getState(page);
  await page.close();

  const beforeSignature = openingSignature(beforeState.inventory, route.openingId);
  const afterSignature = openingSignature(afterState.inventory, route.openingId);

  return {
    materialStateStable: beforeSignature === afterSignature,
    openingInventory: normalizeInventoryForOpening(afterState.inventory, route.openingId),
    openingInventoryPresent: normalizeInventoryForOpening(afterState.inventory, route.openingId).length > 0,
  };
}

async function performStep(page, routeDir, openingId, step, frameIndex) {
  for (const key of step.keys) {
    await page.keyboard.down(key);
  }
  await page.waitForTimeout(Math.max(120, Math.floor(step.durationMs * 0.5)));
  const duringState = await getState(page);
  const file = path.join(routeDir, `${String(frameIndex).padStart(2, '0')}-${step.label}.png`);
  await captureCanvas(page, file);
  await page.waitForTimeout(Math.max(120, step.durationMs - Math.floor(step.durationMs * 0.5)));
  for (const key of [...step.keys].reverse()) {
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(140);

  return {
    cameraPosition: duringState.sampledCameraPosition,
    file,
    inventorySignature: openingSignature(duringState.inventory, openingId),
    keys: step.keys,
    label: step.label,
  };
}

async function runRoute(browser, baseUrl, outDir, route) {
  const inventoryAudit = await collectOpeningInventoryAudit(browser, baseUrl, route);
  const page = await browser.newPage({ viewport: VIEWPORT });
  const routeDir = path.join(outDir, route.openingId);
  ensureDir(routeDir);
  await openMotionStudio(page, baseUrl);
  const appliedStartView = await applyStartView(page, route);
  await setDoorStates(page, route.doorStates ?? DEFAULT_DOOR_STATES);

  const beforeState = await getState(page);
  const beforeFile = path.join(routeDir, '00-before-user-motion.png');
  await captureCanvas(page, beforeFile);
  const frames = [{
    cameraPosition: beforeState.sampledCameraPosition,
    file: beforeFile,
    inventorySignature: null,
    keys: [],
    label: 'before-user-motion',
  }];

  let frameIndex = 1;
  for (const step of route.steps) {
    frames.push(await performStep(page, routeDir, route.openingId, step, frameIndex));
    frameIndex += 1;
  }

  const afterState = await getState(page);
  const afterFile = path.join(routeDir, `${String(frameIndex).padStart(2, '0')}-after-user-motion.png`);
  await captureCanvas(page, afterFile);
  frames.push({
    cameraPosition: afterState.sampledCameraPosition,
    file: afterFile,
    inventorySignature: null,
    keys: [],
    label: 'after-user-motion',
  });
  await page.close();

  const firstPosition = frames[0]?.cameraPosition;
  const lastPosition = frames[frames.length - 1]?.cameraPosition;
  const movementWorldUnits = distance3(firstPosition, lastPosition);
  const materialStateStable = inventoryAudit.materialStateStable;
  const openingInventory = inventoryAudit.openingInventory;
  const openingInventoryPresent = inventoryAudit.openingInventoryPresent;
  const movementExercised = movementWorldUnits === null ? false : movementWorldUnits > 0.2;
  const automatedFlickerDetected = openingInventoryPresent && !materialStateStable;

  return {
    automatedFlickerDetected,
    cameraPositions: frames.map((frame) => ({
      cameraPosition: frame.cameraPosition,
      label: frame.label,
    })),
    doorStates: route.doorStates ?? DEFAULT_DOOR_STATES,
    frameCount: frames.length,
    frames: frames.map((frame) => ({
      file: path.relative(outDir, frame.file).replaceAll('\\', '/'),
      keys: frame.keys,
      label: frame.label,
    })),
    materialStateStable,
    movementExercised,
    movementPath: route.steps.map((step) => ({ durationMs: step.durationMs, keys: step.keys, label: step.label })),
    movementWorldUnits,
    openingId: route.openingId,
    openingInventory,
    openingInventoryPresent,
    requiresHumanReview: true,
    routeId: route.routeId,
    routeStartView: appliedStartView,
    visualReviewNote: 'Review the captured before/during/after movement frames for visible frame/glass color flipping, shimmer, or z-fighting.',
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const routes = [];
  try {
    for (const route of ROUTES) {
      routes.push(await runRoute(browser, options.baseUrl, options.outDir, route));
    }
  } finally {
    await browser.close();
  }

  const pass = routes.every((route) => (
    route.openingInventoryPresent
    && route.materialStateStable
    && route.movementExercised
    && !route.automatedFlickerDetected
  ));
  const result = {
    baseUrl: options.baseUrl,
    generatedAt: new Date().toISOString(),
    motionOpeningFlickerAuditRan: true,
    pass,
    productVisualAccepted: false,
    inventoryRouteUsesQa3dWithoutMotion: true,
    motionRouteUsesQa3d: false,
    realGalaMovementPhysicsActive: true,
    routes,
    stagingDeployPerformed: false,
  };

  writeJson(path.join(options.outDir, 'qa-gala-opening-motion-flicker-result.json'), result);
  console.log(JSON.stringify({
    outDir: options.outDir,
    pass,
    routeCount: routes.length,
    routes: routes.map((route) => ({
      automatedFlickerDetected: route.automatedFlickerDetected,
      frameCount: route.frameCount,
      materialStateStable: route.materialStateStable,
      movementExercised: route.movementExercised,
      openingId: route.openingId,
      requiresHumanReview: route.requiresHumanReview,
    })),
  }, null, 2));

  if (!pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
