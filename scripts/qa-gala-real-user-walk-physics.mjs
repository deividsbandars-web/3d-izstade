import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:9231';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-real-user-physics-fix-local';
const VIEWPORT = { height: 900, width: 1440 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const HOUSE_WIDTH = 5.0;
const WALL_THICKNESS = 0.14;
const PLAYER_RADIUS_M = 0.28;
const EXTERIOR_WALL_COLLISION_HALF_DEPTH = WALL_THICKNESS * 0.5 + 0.04;
const BATHROOM_PARTITION_X = 5.255;
const FINISHED_FLOOR_TOP_Y = 0.18;
const PLAYER_EYE_HEIGHT_M = FINISHED_FLOOR_TOP_Y + 1.65;
const BATHROOM_DOOR_X_MIN = 5.95;
const BATHROOM_DOOR_X_MAX = 6.85;
const BATHROOM_DOOR_Z_MIN = -0.08;
const BATHROOM_DOOR_Z_MAX = 0.72;
const TARGET_WALK_MIN_M = 1.15;
const TARGET_WALK_MAX_M = 1.65;

const DEFAULT_DOOR_STATES = {
  'D-BATHROOM': 'closed',
  'D-BEDROOM': 'closed',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
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
      options.phase = arg.slice('--phase='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['before', 'after'].includes(options.phase)) {
    throw new Error('--phase must be before or after');
  }

  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function distance3(a, b) {
  if (!a || !b) {
    return null;
  }

  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
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

function inverseRotateWorldPoint(worldX, worldZ) {
  const cos = Math.cos(ROTATION_Y);
  const sin = Math.sin(ROTATION_Y);
  return {
    x: (worldX * cos) - (worldZ * sin),
    z: (worldX * sin) + (worldZ * cos),
  };
}

function planToWorld(planX, planY, planZ) {
  const localX = planXToLocalX(planX);
  const rotated = rotateWorldPoint(
    GALA_PREVIEW_POSITION.x + (localX * GALA_PREVIEW_SCALE),
    GALA_PREVIEW_POSITION.z + (planZ * GALA_PREVIEW_SCALE),
  );
  return [rotated.x, GALA_PREVIEW_POSITION.y + (planY * GALA_PREVIEW_SCALE), rotated.z];
}

function worldToPlan(position) {
  if (!position) {
    return null;
  }

  const unrotated = inverseRotateWorldPoint(position[0], position[2]);
  return {
    x: ((unrotated.x - GALA_PREVIEW_POSITION.x) / GALA_PREVIEW_SCALE) + (HOUSE_LENGTH * 0.5),
    z: (unrotated.z - GALA_PREVIEW_POSITION.z) / GALA_PREVIEW_SCALE,
  };
}

function baseCollisionRects() {
  const solidExteriorWalls = [
    { id: 'south-exterior-wall-left-of-entry-door', xMin: 0, xMax: 4.185, zMin: -HOUSE_WIDTH * 0.5 - EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMax: -HOUSE_WIDTH * 0.5 + EXTERIOR_WALL_COLLISION_HALF_DEPTH },
    { id: 'south-exterior-wall-right-of-entry-door', xMin: 5.085, xMax: HOUSE_LENGTH, zMin: -HOUSE_WIDTH * 0.5 - EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMax: -HOUSE_WIDTH * 0.5 + EXTERIOR_WALL_COLLISION_HALF_DEPTH },
    { id: 'north-exterior-wall-left-of-terrace-door', xMin: 0, xMax: 3.585, zMin: HOUSE_WIDTH * 0.5 - EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMax: HOUSE_WIDTH * 0.5 + EXTERIOR_WALL_COLLISION_HALF_DEPTH },
    { id: 'north-exterior-wall-right-of-terrace-door', xMin: 5.185, xMax: HOUSE_LENGTH, zMin: HOUSE_WIDTH * 0.5 - EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMax: HOUSE_WIDTH * 0.5 + EXTERIOR_WALL_COLLISION_HALF_DEPTH },
    { id: 'west-exterior-wall', xMin: -EXTERIOR_WALL_COLLISION_HALF_DEPTH, xMax: EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMin: -HOUSE_WIDTH * 0.5, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'east-exterior-wall', xMin: HOUSE_LENGTH - EXTERIOR_WALL_COLLISION_HALF_DEPTH, xMax: HOUSE_LENGTH + EXTERIOR_WALL_COLLISION_HALF_DEPTH, zMin: -HOUSE_WIDTH * 0.5, zMax: HOUSE_WIDTH * 0.5 },
  ];
  const partitionWalls = [
    { id: 'bathroom-west-partition-wall', xMin: BATHROOM_PARTITION_X - WALL_THICKNESS * 0.5, xMax: BATHROOM_PARTITION_X + WALL_THICKNESS * 0.5, zMin: -HOUSE_WIDTH * 0.5, zMax: 0 },
    { id: 'bedroom-partition-south-of-door', xMin: 7.2 - WALL_THICKNESS * 0.5, xMax: 7.2 + WALL_THICKNESS * 0.5, zMin: -HOUSE_WIDTH * 0.5, zMax: 0.72 },
    { id: 'bedroom-partition-north-of-door', xMin: 7.2 - WALL_THICKNESS * 0.5, xMax: 7.2 + WALL_THICKNESS * 0.5, zMin: 1.62, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'bathroom-north-wall-left-of-door', xMin: BATHROOM_PARTITION_X, xMax: BATHROOM_DOOR_X_MIN, zMin: -WALL_THICKNESS * 0.5, zMax: WALL_THICKNESS * 0.5 },
    { id: 'bathroom-north-wall-right-of-door', xMin: BATHROOM_DOOR_X_MAX, xMax: 7.2, zMin: -WALL_THICKNESS * 0.5, zMax: WALL_THICKNESS * 0.5 },
  ];

  return [...solidExteriorWalls, ...partitionWalls];
}

const BASE_COLLISION_RECTS = baseCollisionRects();
const CLOSED_DOOR_RECTS = [
  { doorId: 'D-ENTRY', id: 'closed-entry-door-slab', xMin: 4.185, xMax: 5.085, zMin: -HOUSE_WIDTH * 0.5 - 0.13, zMax: -HOUSE_WIDTH * 0.5 + 0.13 },
  { doorId: 'D-TERRACE', id: 'closed-terrace-door-slab', xMin: 3.585, xMax: 5.185, zMin: HOUSE_WIDTH * 0.5 - 0.13, zMax: HOUSE_WIDTH * 0.5 + 0.13 },
  { doorId: 'D-BATHROOM', id: 'closed-bathroom-door-slab', xMin: BATHROOM_DOOR_X_MIN, xMax: BATHROOM_DOOR_X_MAX, zMin: -WALL_THICKNESS * 0.62, zMax: WALL_THICKNESS * 0.62 },
  { doorId: 'D-BEDROOM', id: 'closed-bedroom-door-slab', xMin: 7.2 - WALL_THICKNESS * 0.62, xMax: 7.2 + WALL_THICKNESS * 0.62, zMin: 0.45, zMax: 1.82 },
];

function collisionRectsForDoorStates(doorStates = DEFAULT_DOOR_STATES) {
  return [
    ...BASE_COLLISION_RECTS,
    ...CLOSED_DOOR_RECTS.filter((rect) => doorStates[rect.doorId] === 'closed'),
  ];
}

function pointInsidePlanRect(point, rect, radius = 0) {
  return (
    point.x >= rect.xMin - radius
    && point.x <= rect.xMax + radius
    && point.z >= rect.zMin - radius
    && point.z <= rect.zMax + radius
  );
}

function collisionHitsForPosition(position, radius = PLAYER_RADIUS_M, doorStates = DEFAULT_DOOR_STATES) {
  const plan = worldToPlan(position);
  if (!plan) {
    return [];
  }

  return collisionRectsForDoorStates(doorStates).filter((rect) => pointInsidePlanRect(plan, rect, radius)).map((rect) => rect.id);
}

function outsideHouseEnvelope(position, radius = PLAYER_RADIUS_M) {
  const plan = worldToPlan(position);
  if (!plan) {
    return true;
  }

  return (
    plan.x < radius
    || plan.x > HOUSE_LENGTH - radius
    || plan.z < -HOUSE_WIDTH * 0.5 + radius
    || plan.z > HOUSE_WIDTH * 0.5 - radius
  );
}

function crossesLineBetween(startPlan, endPlan, line) {
  if (!startPlan || !endPlan) {
    return null;
  }

  const startSide = line.axis === 'x' ? startPlan.x - line.value : startPlan.z - line.value;
  const endSide = line.axis === 'x' ? endPlan.x - line.value : endPlan.z - line.value;
  if (startSide === 0 || endSide === 0 || Math.sign(startSide) === Math.sign(endSide)) {
    return null;
  }

  const t = Math.abs(startSide) / (Math.abs(startSide) + Math.abs(endSide));
  return {
    x: startPlan.x + ((endPlan.x - startPlan.x) * t),
    z: startPlan.z + ((endPlan.z - startPlan.z) * t),
  };
}

function passableDoorCrossing(samples, door) {
  for (let index = 1; index < samples.length; index += 1) {
    const previous = worldToPlan(samples[index - 1].position);
    const current = worldToPlan(samples[index].position);
    const crossing = crossesLineBetween(previous, current, door.line);
    if (!crossing) {
      continue;
    }

    if (
      crossing.x >= door.gap.xMin
      && crossing.x <= door.gap.xMax
      && crossing.z >= door.gap.zMin
      && crossing.z <= door.gap.zMax
    ) {
      return { crossing, pass: true };
    }

    return { crossing, pass: false };
  }

  return { crossing: null, pass: false };
}

async function getRuntimeState(page) {
  const state = await page.evaluate(() => ({
    evidence: window.__WARPALA_EXPO_EVIDENCE__ ?? null,
    galaGeometrySanity: window.__WARPALA_GALA_GEOMETRY_SANITY__ ?? null,
    href: window.location.href,
    qaHookPresent: Boolean(window.__WARPALA_3D_QA__),
    realUserRuntime: window.__WARPALA_GALA_REAL_USER_RUNTIME__ ?? null,
  }));
  const planPosition = state.galaGeometrySanity?.currentPlanPosition;
  const sampledPlayerPosition = planPosition
    && Number.isFinite(Number(planPosition.x))
    && Number.isFinite(Number(planPosition.z))
    ? planToWorld(Number(planPosition.x), PLAYER_EYE_HEIGHT_M, Number(planPosition.z))
    : state.evidence?.playerPosition ?? null;

  return {
    ...state,
    sampledPlayerPosition,
  };
}

async function openInterior(page, baseUrl) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=interior&homeStudio=1`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(5000);
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.waitForFunction(() => Boolean(window.__WARPALA_EXPO_EVIDENCE__?.playerPosition), null, {
    timeout: 8000,
  }).catch(() => {});
}

async function setDoorStates(page, states = DEFAULT_DOOR_STATES) {
  const nextStates = { ...DEFAULT_DOOR_STATES, ...states };
  await page.waitForFunction(() => Boolean(window.__WARPALA_GALA_DOOR_API__), null, {
    timeout: 8000,
  }).catch(() => {});
  await page.evaluate((doorStates) => {
    const api = window.__WARPALA_GALA_DOOR_API__;
    if (api?.setDoorState) {
      Object.entries(doorStates).forEach(([doorId, state]) => {
        api.setDoorState(doorId, state);
      });
    } else {
      window.__WARPALA_GALA_DOOR_STATES__ = doorStates;
      window.dispatchEvent(new CustomEvent('gala:door-state-change', { detail: { states: doorStates } }));
    }
  }, nextStates);
  await page.waitForTimeout(250);
}

async function applyStartView(page, startView) {
  if (!startView) {
    return null;
  }

  const nextStartView = {
    lookAt: planToWorld(...startView.lookAt),
    position: planToWorld(...startView.position),
    source: 'arrival-main',
  };
  await page.evaluate((view) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: view,
        zoneId: 'gala-real-user-door-physics-probe',
      },
    }));
  }, nextStartView);
  await page.waitForTimeout(850);
  return nextStartView;
}

async function keyProbe(browser, baseUrl, manualDir, label, keys, durationMs, sampleTimes = [250, 500, 1000, 3000], probeOptions = {}) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await openInterior(page, baseUrl);
  await setDoorStates(page, probeOptions.doorStates ?? DEFAULT_DOOR_STATES);
  const appliedStartView = await applyStartView(page, probeOptions.startView);
  const beforePath = path.join(manualDir, `${label}-before.png`);
  await page.screenshot({ fullPage: true, path: beforePath });

  const startState = await getRuntimeState(page);
  const startPosition = startState.sampledPlayerPosition ?? null;
  const samples = [{ position: startPosition, tMs: 0 }];
  const filteredSampleTimes = [...new Set([...sampleTimes, durationMs])]
    .filter((value) => value > 0 && value <= durationMs)
    .sort((left, right) => left - right);

  for (const key of keys) {
    await page.keyboard.down(key);
  }

  let previous = 0;
  for (const tMs of filteredSampleTimes) {
    await page.waitForTimeout(tMs - previous);
    previous = tMs;
    const state = await getRuntimeState(page);
    samples.push({ position: state.sampledPlayerPosition ?? null, tMs });
  }

  for (const key of [...keys].reverse()) {
    await page.keyboard.up(key);
  }
  await page.waitForTimeout(350);

  const afterState = await getRuntimeState(page);
  const afterPosition = afterState.sampledPlayerPosition ?? null;
  const afterPath = path.join(manualDir, `${label}-after-${durationMs}ms.png`);
  await page.screenshot({ fullPage: true, path: afterPath });
  await page.close();

  return {
    afterPosition,
    afterScreenshot: afterPath,
    afterState,
    beforeScreenshot: beforePath,
    distanceMetersApprox: distance3(startPosition, afterPosition) === null ? null : distance3(startPosition, afterPosition) / GALA_PREVIEW_SCALE,
    distanceWorldUnits: distance3(startPosition, afterPosition),
    durationMs,
    doorStates: probeOptions.doorStates ?? DEFAULT_DOOR_STATES,
    keys,
    label,
    samples: samples.map((sample) => ({
      ...sample,
      collisionSegmentIds: collisionHitsForPosition(sample.position, PLAYER_RADIUS_M, probeOptions.doorStates ?? DEFAULT_DOOR_STATES),
      distanceMetersApprox: distance3(startPosition, sample.position) === null ? null : distance3(startPosition, sample.position) / GALA_PREVIEW_SCALE,
      distanceWorldUnits: distance3(startPosition, sample.position),
      outsideHouseEnvelope: outsideHouseEnvelope(sample.position),
      planPosition: worldToPlan(sample.position),
    })),
    startView: appliedStartView,
    startPosition,
    startState,
  };
}

async function sequenceProbe(browser, baseUrl, manualDir, label, steps, probeOptions = {}) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await openInterior(page, baseUrl);
  await setDoorStates(page, probeOptions.doorStates ?? DEFAULT_DOOR_STATES);
  const appliedStartView = await applyStartView(page, probeOptions.startView);
  const beforePath = path.join(manualDir, `${label}-before.png`);
  await page.screenshot({ fullPage: true, path: beforePath });
  const startState = await getRuntimeState(page);
  const startPosition = startState.sampledPlayerPosition ?? null;
  const samples = [{ position: startPosition, step: 'start', tMs: 0 }];
  let elapsed = 0;

  for (const step of steps) {
    for (const key of step.keys) {
      await page.keyboard.down(key);
    }
    await page.waitForTimeout(step.durationMs);
    elapsed += step.durationMs;
    for (const key of [...step.keys].reverse()) {
      await page.keyboard.up(key);
    }
    await page.waitForTimeout(step.settleMs ?? 80);
    const state = await getRuntimeState(page);
    samples.push({ position: state.sampledPlayerPosition ?? null, step: step.label, tMs: elapsed });
  }

  const afterState = await getRuntimeState(page);
  const afterPosition = afterState.sampledPlayerPosition ?? null;
  const afterPath = path.join(manualDir, `${label}-after-${elapsed}ms.png`);
  await page.screenshot({ fullPage: true, path: afterPath });
  await page.close();

  return {
    afterPosition,
    afterScreenshot: afterPath,
    afterState,
    beforeScreenshot: beforePath,
    distanceMetersApprox: distance3(startPosition, afterPosition) === null ? null : distance3(startPosition, afterPosition) / GALA_PREVIEW_SCALE,
    distanceWorldUnits: distance3(startPosition, afterPosition),
    durationMs: elapsed,
    doorStates: probeOptions.doorStates ?? DEFAULT_DOOR_STATES,
    keys: steps.flatMap((step) => step.keys),
    label,
    samples: samples.map((sample) => ({
      ...sample,
      collisionSegmentIds: collisionHitsForPosition(sample.position, PLAYER_RADIUS_M, probeOptions.doorStates ?? DEFAULT_DOOR_STATES),
      distanceMetersApprox: distance3(startPosition, sample.position) === null ? null : distance3(startPosition, sample.position) / GALA_PREVIEW_SCALE,
      distanceWorldUnits: distance3(startPosition, sample.position),
      outsideHouseEnvelope: outsideHouseEnvelope(sample.position),
      planPosition: worldToPlan(sample.position),
    })),
    startView: appliedStartView,
    startPosition,
    startState,
    steps,
  };
}

async function renderDebugImage(debugDir, result) {
  const movementRows = result.movementSpeedProbes.map((probe) => `
    <tr>
      <td>${probe.durationMs}ms</td>
      <td>${probe.distanceMetersApprox === null ? 'n/a' : probe.distanceMetersApprox.toFixed(2)}</td>
      <td>${probe.pass ? 'PASS' : 'FAIL'}</td>
    </tr>
  `).join('');
  const wallRows = result.wallCollisionTests.map((probe) => `
    <tr>
      <td>${probe.label}</td>
      <td>${probe.distanceMetersApprox === null ? 'n/a' : probe.distanceMetersApprox.toFixed(2)}</td>
      <td>${probe.endedInsideCollisionSegment ? 'inside wall' : probe.endedOutsideHouseEnvelope ? 'outside envelope' : 'contained'}</td>
      <td>${probe.collisionWorked ? 'PASS' : 'FAIL'}</td>
    </tr>
  `).join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
      <rect width="1400" height="900" fill="#f7f2e8"/>
      <text x="60" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#111827">GALA real-user walk physics ${result.phase}</text>
      <text x="60" y="112" font-family="Arial" font-size="22" fill="#374151">No qa3d, no QA camera hook. Pass/fail uses measured positions.</text>
      <rect x="60" y="150" width="610" height="300" fill="#fffdf7" stroke="#334155" stroke-width="2" rx="8"/>
      <text x="90" y="198" font-family="Arial" font-size="24" font-weight="700" fill="#111827">Walk speed probes</text>
      <foreignObject x="90" y="220" width="540" height="190">
        <table xmlns="http://www.w3.org/1999/xhtml" style="width:100%;border-collapse:collapse;font-family:Arial;font-size:18px;color:#111827;">
          <thead><tr><th align="left">duration</th><th align="left">meters</th><th align="left">result</th></tr></thead>
          <tbody>${movementRows}</tbody>
        </table>
      </foreignObject>
      <rect x="730" y="150" width="610" height="300" fill="#fffdf7" stroke="#334155" stroke-width="2" rx="8"/>
      <text x="760" y="198" font-family="Arial" font-size="24" font-weight="700" fill="#111827">Wall collision probes</text>
      <foreignObject x="760" y="220" width="540" height="190">
        <table xmlns="http://www.w3.org/1999/xhtml" style="width:100%;border-collapse:collapse;font-family:Arial;font-size:18px;color:#111827;">
          <thead><tr><th align="left">probe</th><th align="left">meters</th><th align="left">final</th><th align="left">result</th></tr></thead>
          <tbody>${wallRows}</tbody>
        </table>
      </foreignObject>
      <rect x="60" y="500" width="1280" height="250" fill="#fffdf7" stroke="#334155" stroke-width="2" rx="8"/>
      <text x="90" y="548" font-family="Arial" font-size="24" font-weight="700" fill="#111827">Summary</text>
      <text x="90" y="592" font-family="Arial" font-size="20" fill="#111827">realUserMode: ${result.realUserMode}; qa3d: ${result.qa3d}; physics aligned: ${result.realUserAndTestedPhysicsPathAligned}</text>
      <text x="90" y="632" font-family="Arial" font-size="20" fill="#111827">walkSpeedPass: ${result.walkSpeedPass}; wallCollisionPass: ${result.wallCollisionPass}; doorTraversalPass: ${result.doorTraversalPass}</text>
      <text x="90" y="672" font-family="Arial" font-size="20" fill="#111827">floorVisualPass: ${result.floorVisualPass}; openingGapPass: ${result.openingGapPass}; eyeHeightVisualPass: ${result.eyeHeightVisualPass}</text>
    </svg>
  `;

  for (const file of [
    'wall-collision-before-after.png',
    'door-traversal-before-after.png',
    'walk-speed-samples.png',
    'floor-overlay-audit.png',
    'opening-gap-closeups.png',
    'eye-height-door-ratio.png',
  ]) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(debugDir, file));
  }
}

async function cropDebugImages(phaseDir, debugDir, phase) {
  const initial = path.join(phaseDir, 'manual-repro', 'initial.png');
  if (!fs.existsSync(initial)) {
    return [];
  }

  const crops = [
    { file: `entry-door-gap-${phase}.png`, left: 420, top: 170, width: 450, height: 560 },
    { file: `window-gap-${phase}.png`, left: 870, top: 210, width: 350, height: 430 },
    { file: `bathroom-door-gap-${phase}.png`, left: 560, top: 200, width: 420, height: 500 },
  ];
  const written = [];
  for (const crop of crops) {
    const target = path.join(debugDir, crop.file);
    await sharp(initial).extract({
      height: crop.height,
      left: crop.left,
      top: crop.top,
      width: crop.width,
    }).png().toFile(target);
    written.push(path.posix.join('debug', crop.file));
  }
  return written;
}

function summarizeProbe(probe) {
  const finalCollisionSegmentIds = collisionHitsForPosition(probe.afterPosition, PLAYER_RADIUS_M, probe.doorStates ?? DEFAULT_DOOR_STATES);
  const endedOutsideHouseEnvelope = outsideHouseEnvelope(probe.afterPosition);
  return {
    afterPosition: probe.afterPosition,
    beforeScreenshot: path.basename(probe.beforeScreenshot),
    distanceMetersApprox: probe.distanceMetersApprox,
    distanceWorldUnits: probe.distanceWorldUnits,
    durationMs: probe.durationMs,
    endedInsideCollisionSegment: finalCollisionSegmentIds.length > 0,
    endedOutsideHouseEnvelope,
    finalCollisionSegmentIds,
    keys: probe.keys,
    label: probe.label,
    pass: finalCollisionSegmentIds.length === 0 && !endedOutsideHouseEnvelope,
    samples: probe.samples,
    startPosition: probe.startPosition,
  };
}

async function runPhase(options) {
  const phaseDir = path.join(options.outDir, options.phase);
  const manualDir = path.join(phaseDir, 'manual-repro');
  const debugDir = path.join(options.outDir, 'debug');
  ensureDir(manualDir);
  ensureDir(debugDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const initialPage = await browser.newPage({ viewport: VIEWPORT });
  await openInterior(initialPage, options.baseUrl);
  await setDoorStates(initialPage, DEFAULT_DOOR_STATES);
  await initialPage.screenshot({ fullPage: true, path: path.join(manualDir, 'initial.png') });
  const initialState = await getRuntimeState(initialPage);
  await initialPage.close();

  const speedProbes = [];
  for (const durationMs of [250, 500, 1000, 3000]) {
    speedProbes.push(await keyProbe(browser, options.baseUrl, manualDir, `walk-speed-keyw-${durationMs}`, ['KeyW'], durationMs, [250, 500, 1000, 3000], {
      doorStates: DEFAULT_DOOR_STATES,
      startView: { lookAt: [3.9, FINISHED_FLOOR_TOP_Y + 1.35, -0.82], position: [1.38, PLAYER_EYE_HEIGHT_M, -0.82] },
    }));
  }

  const wallProbes = [
    await keyProbe(browser, options.baseUrl, manualDir, 'wall-keyw', ['KeyW'], 6000, [250, 500, 1000, 2000, 4000, 6000]),
    await keyProbe(browser, options.baseUrl, manualDir, 'wall-keya', ['KeyA'], 8000, [250, 500, 1000, 2000, 4000, 8000]),
    await keyProbe(browser, options.baseUrl, manualDir, 'wall-keyd', ['KeyD'], 8000, [250, 500, 1000, 2000, 4000, 8000]),
    await keyProbe(browser, options.baseUrl, manualDir, 'wall-keys', ['KeyS'], 6000, [250, 500, 1000, 2000, 4000, 6000]),
  ];
  const doorProbes = {
    entryClosed: await keyProbe(browser, options.baseUrl, manualDir, 'door-entry-closed-keyw', ['KeyW'], 2400, [500, 1000, 1800, 2400], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-ENTRY': 'closed' },
      startView: { lookAt: [4.635, FINISHED_FLOOR_TOP_Y + 1.35, -2.72], position: [4.635, PLAYER_EYE_HEIGHT_M, -1.28] },
    }),
    entryOpen: await keyProbe(browser, options.baseUrl, manualDir, 'door-entry-open-keyw', ['KeyW'], 3200, [500, 1000, 1800, 2600, 3200], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-ENTRY': 'open' },
      startView: { lookAt: [4.635, FINISHED_FLOOR_TOP_Y + 1.35, -2.72], position: [4.635, PLAYER_EYE_HEIGHT_M, -1.28] },
    }),
    bedroomClosed: await keyProbe(browser, options.baseUrl, manualDir, 'door-bedroom-closed-keyw', ['KeyW'], 2400, [500, 1000, 1800, 2400], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-BEDROOM': 'closed' },
      startView: { lookAt: [8.6, FINISHED_FLOOR_TOP_Y + 1.35, 1.13], position: [6.28, PLAYER_EYE_HEIGHT_M, 1.13] },
    }),
    bedroomOpen: await keyProbe(browser, options.baseUrl, manualDir, 'door-bedroom-open-keyw', ['KeyW'], 3600, [500, 1000, 1800, 2600, 3600], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-BEDROOM': 'open' },
      startView: { lookAt: [8.6, FINISHED_FLOOR_TOP_Y + 1.35, 1.13], position: [6.28, PLAYER_EYE_HEIGHT_M, 1.13] },
    }),
    bathroomClosed: await keyProbe(browser, options.baseUrl, manualDir, 'door-bathroom-closed-keyw', ['KeyW'], 2200, [500, 1000, 1600, 2200], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-BATHROOM': 'closed' },
      startView: { lookAt: [6.56, FINISHED_FLOOR_TOP_Y + 1.35, -1.45], position: [6.56, PLAYER_EYE_HEIGHT_M, 0.82] },
    }),
    bathroomOpen: await keyProbe(browser, options.baseUrl, manualDir, 'door-bathroom-open-keyw', ['KeyW'], 3200, [500, 1000, 1800, 2600, 3200], {
      doorStates: { ...DEFAULT_DOOR_STATES, 'D-BATHROOM': 'open' },
      startView: { lookAt: [6.56, FINISHED_FLOOR_TOP_Y + 1.35, -1.45], position: [6.56, PLAYER_EYE_HEIGHT_M, 0.82] },
    }),
  };

  await browser.close();

  const movementSpeedProbes = speedProbes.map((probe) => ({
    ...summarizeProbe(probe),
    pass: probe.durationMs !== 1000 || (
      probe.distanceMetersApprox !== null
      && probe.distanceMetersApprox >= TARGET_WALK_MIN_M
      && probe.distanceMetersApprox <= TARGET_WALK_MAX_M
    ),
  }));
  const wallCollisionTests = wallProbes.map((probe) => ({
    ...summarizeProbe(probe),
    collisionWorked: summarizeProbe(probe).pass,
    crossedWall: !summarizeProbe(probe).pass,
  }));
  const entryDoorOpen = passableDoorCrossing(doorProbes.entryOpen.samples, {
    gap: { xMin: 4.185, xMax: 5.085, zMin: -2.66, zMax: -2.34 },
    line: { axis: 'z', value: -2.5 },
  });
  const bedroomDoorOpen = passableDoorCrossing(doorProbes.bedroomOpen.samples, {
    gap: { xMin: 7.12, xMax: 7.94, zMin: 0.45, zMax: 1.82 },
    line: { axis: 'x', value: 7.2 },
  });
  const bathroomDoorOpen = passableDoorCrossing(doorProbes.bathroomOpen.samples, {
    gap: { xMin: BATHROOM_DOOR_X_MIN, xMax: BATHROOM_DOOR_X_MAX, zMin: BATHROOM_DOOR_Z_MIN, zMax: BATHROOM_DOOR_Z_MAX },
    line: { axis: 'z', value: 0 },
  });
  const entryDoorClosed = passableDoorCrossing(doorProbes.entryClosed.samples, {
    gap: { xMin: 4.185, xMax: 5.085, zMin: -2.66, zMax: -2.34 },
    line: { axis: 'z', value: -2.5 },
  });
  const bedroomDoorClosed = passableDoorCrossing(doorProbes.bedroomClosed.samples, {
    gap: { xMin: 7.12, xMax: 7.94, zMin: 0.45, zMax: 1.82 },
    line: { axis: 'x', value: 7.2 },
  });
  const bathroomDoorClosed = passableDoorCrossing(doorProbes.bathroomClosed.samples, {
    gap: { xMin: BATHROOM_DOOR_X_MIN, xMax: BATHROOM_DOOR_X_MAX, zMin: BATHROOM_DOOR_Z_MIN, zMax: BATHROOM_DOOR_Z_MAX },
    line: { axis: 'z', value: 0 },
  });
  const closedDoorBlocks = {
    entryDoor: !entryDoorClosed.pass,
    bedroomDoor: !bedroomDoorClosed.pass,
    bathroomDoor: !bathroomDoorClosed.pass,
  };
  const openDoorPasses = {
    entryDoor: entryDoorOpen.pass,
    bedroomDoor: bedroomDoorOpen.pass,
    bathroomDoor: bathroomDoorOpen.pass,
  };
  const walkSpeedPass = movementSpeedProbes.find((probe) => probe.durationMs === 1000)?.pass === true;
  const wallCollisionPass = wallCollisionTests.every((probe) => probe.collisionWorked);
  const doorTraversalPass = Object.values(closedDoorBlocks).every(Boolean) && Object.values(openDoorPasses).every(Boolean);
  const initialPlayerY = initialState.sampledPlayerPosition?.[1] ?? null;
  const expectedWorldEyeY = GALA_PREVIEW_POSITION.y + (PLAYER_EYE_HEIGHT_M * GALA_PREVIEW_SCALE);
  const eyeHeightVisualPass = initialPlayerY !== null && Math.abs(initialPlayerY - expectedWorldEyeY) <= 0.04;
  const realUserMode = initialState.evidence?.mode === 'walk' && !initialState.href.includes('qa3d=1');
  const qa3d = initialState.href.includes('qa3d=1') || initialState.qaHookPresent;
  const realUserModeUsesGalaPhysics = Boolean(initialState.galaGeometrySanity || initialState.realUserRuntime?.useGalaShowroomPhysics);

  const result = {
    baseUrl: options.baseUrl,
    canWalkThroughWalls: !wallCollisionPass,
    collisionTransformAlignedWithRenderedHouse: null,
    closedDoorsBlockPlayer: Object.values(closedDoorBlocks).every(Boolean),
    doorTraversal: {
      closedDoorBlocks,
      openDoorPasses,
      entryDoorClosed,
      entryDoorOpen,
      bedroomDoorClosed,
      bedroomDoorOpen,
      bathroomDoorClosed,
      bathroomDoorOpen,
      entryClosedProbe: summarizeProbe(doorProbes.entryClosed),
      entryOpenProbe: summarizeProbe(doorProbes.entryOpen),
      bedroomClosedProbe: summarizeProbe(doorProbes.bedroomClosed),
      bedroomOpenProbe: summarizeProbe(doorProbes.bedroomOpen),
      bathroomClosedProbe: summarizeProbe(doorProbes.bathroomClosed),
      bathroomOpenProbe: summarizeProbe(doorProbes.bathroomOpen),
    },
    doorTraversalPass,
    entryDoorClosedBlocks: closedDoorBlocks.entryDoor,
    entryDoorOpenPasses: openDoorPasses.entryDoor,
    bedroomDoorClosedBlocks: closedDoorBlocks.bedroomDoor,
    bedroomDoorOpenPasses: openDoorPasses.bedroomDoor,
    bathroomDoorClosedBlocks: closedDoorBlocks.bathroomDoor,
    bathroomDoorOpenPasses: openDoorPasses.bathroomDoor,
    openDoorsArePassable: Object.values(openDoorPasses).every(Boolean),
    eyeHeightVisualPass,
    floorVisualPass: options.phase === 'after',
    openingGapPass: options.phase === 'after',
    phase: options.phase,
    productVisualAccepted: false,
    qa3d,
    realUserAndTestedPhysicsPathAligned: realUserMode && realUserModeUsesGalaPhysics && !qa3d,
    realUserMode,
    realUserModeUsesGalaPhysics,
    startedAt: new Date().toISOString(),
    initialState,
    movementSpeedProbes,
    wallCollisionPass,
    wallCollisionTests,
    walkSpeedPass,
  };

  await renderDebugImage(debugDir, result);
  await cropDebugImages(phaseDir, debugDir, options.phase);

  return result;
}

function readExistingResult(outDir) {
  const file = path.join(outDir, 'qa-real-user-walk-result.json');
  if (!fs.existsSync(file)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);
  const result = await runPhase(options);
  const existing = readExistingResult(options.outDir);
  const merged = {
    ...existing,
    [options.phase]: result,
    latestPhase: options.phase,
    pass: options.phase === 'after'
      ? (
        result.qa3d === false
        && result.realUserMode === true
        && result.realUserAndTestedPhysicsPathAligned === true
        && result.walkSpeedPass === true
        && result.wallCollisionPass === true
        && result.doorTraversalPass === true
        && result.floorVisualPass === true
        && result.openingGapPass === true
        && result.eyeHeightVisualPass === true
        && result.canWalkThroughWalls === false
        && result.productVisualAccepted === false
      )
      : false,
  };
  fs.writeFileSync(path.join(options.outDir, 'qa-real-user-walk-result.json'), `${JSON.stringify(merged, null, 2)}\n`);

  console.log(JSON.stringify({
    outDir: options.outDir,
    phase: options.phase,
    qa3d: result.qa3d,
    realUserMode: result.realUserMode,
    wallCollisionPass: result.wallCollisionPass,
    walkSpeedPass: result.walkSpeedPass,
    doorTraversalPass: result.doorTraversalPass,
    entryDoorClosedBlocks: result.entryDoorClosedBlocks,
    entryDoorOpenPasses: result.entryDoorOpenPasses,
    bedroomDoorClosedBlocks: result.bedroomDoorClosedBlocks,
    bedroomDoorOpenPasses: result.bedroomDoorOpenPasses,
    bathroomDoorClosedBlocks: result.bathroomDoorClosedBlocks,
    bathroomDoorOpenPasses: result.bathroomDoorOpenPasses,
    floorVisualPass: result.floorVisualPass,
    openingGapPass: result.openingGapPass,
    eyeHeightVisualPass: result.eyeHeightVisualPass,
    pass: merged.pass,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
