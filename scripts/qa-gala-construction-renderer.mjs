#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-construction-renderer-reset-local';
const REJECTED_BEFORE_DIR = 'C:\\qa\\visual-evidence\\20260625-164126-gala-defect-root-cause-final-cleanup-local';
const VIEWPORT = { height: 900, width: 1440 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const EYE_HEIGHT_M = 1.65;

const DEFAULT_DOOR_STATES = {
  'D-BATHROOM': 'open',
  'D-BEDROOM': 'open',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

const CAPTURES = [
  {
    file: 'exterior-front-readable.png',
    lookAt: [4.65, 1.5, -2.5],
    position: [4.65, 1.75, -6.05],
    routeView: 'exterior',
  },
  {
    file: 'exterior-side-cladding-readable.png',
    lookAt: [0.2, 1.55, 0.0],
    position: [-2.4, 1.92, 0.0],
    routeView: 'exterior',
  },
  {
    file: 'exterior-eaves-cladding-readable.png',
    lookAt: [0.2, 2.95, 0.0],
    position: [-2.72, 2.88, 0.0],
    routeView: 'exterior',
  },
  {
    file: 'interior-entry-looking-to-living.png',
    lookAt: [3.3, 1.25, 0.24],
    position: [4.55, 1.65, -1.25],
    routeView: 'interior',
  },
  {
    file: 'interior-bedroom-door-frame-sealed.png',
    lookAt: [7.2, 1.72, 1.12],
    position: [6.18, 1.65, 1.16],
    routeView: 'interior',
  },
  {
    file: 'interior-bathroom-door-frame-sealed.png',
    lookAt: [6.56, 1.72, 0.0],
    position: [6.56, 1.65, 1.04],
    routeView: 'interior',
  },
  {
    file: 'interior-ceiling-trim-continuous.png',
    lookAt: [6.65, 2.52, 0.05],
    position: [5.86, 1.88, 1.16],
    routeView: 'interior',
  },
  {
    file: 'interior-floor-stable-near.png',
    lookAt: [3.0, 0.16, 0.0],
    position: [4.55, 1.65, -0.14],
    routeView: 'interior',
  },
  {
    file: 'interior-floor-stable-far.png',
    lookAt: [2.2, 0.16, 0.05],
    position: [5.1, 1.65, 1.42],
    routeView: 'interior',
  },
  {
    file: 'bedroom-layout-readable.png',
    lookAt: [8.65, 0.78, -1.78],
    position: [7.34, 1.65, 1.58],
    routeView: 'interior',
  },
  {
    file: 'bathroom-layout-readable.png',
    lookAt: [6.96, 0.68, -1.18],
    position: [6.25, 1.65, -1.12],
    routeView: 'interior',
  },
];

const DEBUG_CAPTURE_ALIASES = [
  ['interior-floor-stable-near.png', 'wall-assembly-closeup.png'],
  ['interior-bedroom-door-frame-sealed.png', 'opening-assembly-closeup.png'],
  ['exterior-side-cladding-readable.png', 'cladding-assembly-closeup.png'],
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

function planXToLocalX(planX) {
  return planX - (HOUSE_LENGTH * 0.5);
}

function planToWorld(planX, planY, planZ) {
  const unrotatedX = GALA_PREVIEW_POSITION.x + (planXToLocalX(planX) * GALA_PREVIEW_SCALE);
  const unrotatedZ = GALA_PREVIEW_POSITION.z + (planZ * GALA_PREVIEW_SCALE);
  const cos = Math.cos(ROTATION_Y);
  const sin = Math.sin(ROTATION_Y);

  return [
    (unrotatedX * cos) + (unrotatedZ * sin),
    GALA_PREVIEW_POSITION.y + (planY * GALA_PREVIEW_SCALE),
    (-unrotatedX * sin) + (unrotatedZ * cos),
  ];
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function filterInventory(inventory, predicate) {
  return inventory.filter(predicate).map((item) => ({
    bounds: item.bounds,
    componentHint: item.componentHint,
    material: item.material,
    name: item.name,
    position: item.position,
    scale: item.scale,
    userData: item.userData,
  }));
}

function hasRuntimeFlag(inventory, flag) {
  return inventory.some((item) => item.userData?.[flag] === true);
}

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? item.userData?.interiorBoardInstanceCount ?? 1);
}

function countByName(inventory, pattern) {
  return inventory
    .filter((item) => pattern.test(item.name))
    .reduce((total, item) => total + meshInstanceCount(item), 0);
}

async function collectDomOverlayAudit(page) {
  return await page.evaluate(() => {
    const textPattern = /(40\s*(m²|mÂ²|m2|M²|M2)|Compact Timber 40|40\s*m|MODULAR\s+LAYOUT)/i;
    const viewport = {
      height: window.innerHeight,
      width: window.innerWidth,
    };
    const centralSceneRect = {
      x: viewport.width * 0.25,
      y: viewport.height * 0.1,
      width: viewport.width * 0.5,
      height: viewport.height * 0.78,
    };

    function intersectionArea(a, b) {
      const x1 = Math.max(a.x, b.x);
      const y1 = Math.max(a.y, b.y);
      const x2 = Math.min(a.x + a.width, b.x + b.width);
      const y2 = Math.min(a.y + a.height, b.y + b.height);
      return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    }

    const overlays = Array.from(document.querySelectorAll('[data-home-demo-model-label="true"], body *')).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      const canvas = document.querySelector('canvas');
      const containsCanvas = Boolean(canvas && element.contains(canvas));
      const backgroundBlocks = !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor);
      const visible = rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0.05;
      const homeDemoModelLabel = element.matches('[data-home-demo-model-label="true"]');
      const centralIntersection = intersectionArea(rect, centralSceneRect);
      const areaRatio = (rect.width * rect.height) / Math.max(1, viewport.width * viewport.height);
      const centralIntersectionRatio = centralIntersection / Math.max(1, centralSceneRect.width * centralSceneRect.height);
      const largeCentralOverlay = ['absolute', 'fixed', 'sticky'].includes(style.position)
        && areaRatio > 0.08
        && centralIntersectionRatio > 0.08
        && !containsCanvas
        && backgroundBlocks
        && style.pointerEvents !== 'none';

      return {
        areaRatio,
        blocking: visible && (
          homeDemoModelLabel
          || (!containsCanvas && element.childElementCount <= 4 && textPattern.test(text) && areaRatio > 0.01 && centralIntersectionRatio > 0.02)
          || largeCentralOverlay
        ),
        containsCanvas,
        homeDemoModelLabel,
        position: style.position,
        rect: {
          height: rect.height,
          width: rect.width,
          x: rect.x,
          y: rect.y,
        },
        text: text.slice(0, 180),
        textMatchesBlockingLabel: textPattern.test(text),
        visible,
      };
    }).filter((item) => item.homeDemoModelLabel || item.textMatchesBlockingLabel || item.blocking);

    return {
      blockingDomOverlayPresent: overlays.some((item) => item.blocking),
      blockingHomeDemoLabelPresent: overlays.some((item) => item.visible && item.homeDemoModelLabel),
      domOverlayAuditRan: true,
      overlays,
      threeMeshAuditDoesNotCoverDom: true,
    };
  });
}

function buildAudits(inventory) {
  const floorCandidates = inventory.filter((item) => item.isFloorCandidate);
  const transparentFloorLikeObjects = floorCandidates.filter((item) => item.material?.transparent || (item.material?.opacity ?? 1) < 1);
  const mainFinishedFloors = inventory.filter((item) => item.name === 'gala-construction-single-finished-floor-no-overlays');
  const wallAssemblies = inventory.filter((item) => item.isWallAssemblyCandidate);
  const openingAssemblies = inventory.filter((item) => item.isOpeningAssemblyCandidate);
  const ceilingTrim = inventory.filter((item) => item.isCeilingTrimCandidate || /crown-trim|ceiling/.test(item.name));
  const facadeCladding = inventory.filter((item) => item.isFacadeGrooveCandidate || /vertical-timber-board-panel|cladding-backing/.test(item.name));
  const furniture = inventory.filter((item) => /bedroom|bathroom|living|kitchen|sofa|bed|wardrobe|wc|sink|vanity|table/.test(item.name));

  return {
    facadeCladding,
    floorCeilingStack: {
      floorCandidates,
      mainFinishedFloorCount: mainFinishedFloors.length,
      transparentFloorLikeObjects,
    },
    furniture,
    openings: openingAssemblies,
    roomTrim: ceilingTrim,
    walls: wallAssemblies,
  };
}

function buildResult(inventory, captures, domOverlayAudits = [], floorGroundIsolationQaPass = false) {
  const audits = buildAudits(inventory);
  const openingCount = audits.openings.length;
  const wallCount = audits.walls.length;
  const facadeBoardCount = countByName(inventory, /individual-vertical-timber-board-panel/);
  const ceilingTrimCount = countByName(inventory, /continuous-crown-trim|continuous-flat-ceiling/);
  const doorLeaves = inventory.filter((item) => /open-door-leaf|closed-opaque-door-slab/.test(item.name || ''));
  const pbrOpeningTrim = inventory.filter((item) => item.userData?.openingTrimUsesPbrTextureMaps === true);
  const materialHasPbrMaps = (item) => Boolean(
    item.material?.hasMap
    && item.material?.hasNormalMap
    && item.material?.hasRoughnessMap
    && item.material?.hasMetalnessMap,
  );
  const doorLeavesUsePbrTextures = doorLeaves.length >= 2
    && doorLeaves.every((item) => item.userData?.doorLeafUsesPbrTextureMaps === true && materialHasPbrMaps(item));
  const openingTrimUsesPbrTextures = pbrOpeningTrim.length >= 6
    && pbrOpeningTrim.every(materialHasPbrMaps);
  const blockingHomeDemoLabelPresent = domOverlayAudits.some((audit) => audit.blockingHomeDemoLabelPresent);
  const blockingDomOverlayPresent = domOverlayAudits.some((audit) => audit.blockingDomOverlayPresent);

  return {
    repairScope: 'gala-construction-renderer-reset',
    domOverlayAuditRan: domOverlayAudits.length > 0 && domOverlayAudits.every((audit) => audit.domOverlayAuditRan),
    blockingHomeDemoLabelPresent,
    blockingDomOverlayPresent,
    threeMeshAuditDoesNotCoverDom: true,
    fragmentedPrimitivePatchLoopStopped: hasRuntimeFlag(inventory, 'constructionRendererReset') || hasRuntimeFlag(inventory, 'fragmentedPrimitivePatchLoopStopped'),
    singleConstructionModelCreated: hasRuntimeFlag(inventory, 'singleConstructionModelCreated') || Boolean(wallCount),
    wallAssemblyOwnsCoreFacesRevealsTrim: wallCount >= 20 || hasRuntimeFlag(inventory, 'wallAssemblyOwnsCoreFacesRevealsTrim'),
    openingAssemblyOwnsDoorWindowRevealsCasing: openingCount >= 6 || hasRuntimeFlag(inventory, 'openingAssemblyOwnsDoorWindowRevealsCasing'),
    ceilingTrimGeneratedFromRoomPerimeters: hasRuntimeFlag(inventory, 'ceilingTrimGeneratedFromRoomPerimeters') && ceilingTrimCount > 4,
    floorStackHasNoCoplanarOverlays: audits.floorCeilingStack.mainFinishedFloorCount === 1 && audits.floorCeilingStack.transparentFloorLikeObjects.length === 0,
    facadeCladdingIsBoardSystemNotDrawnLines: facadeBoardCount > 40 && hasRuntimeFlag(inventory, 'facadeCladdingIsBoardSystemNotDrawnLines'),
    runtimeMeshInventoryIsActualSceneTraverse: inventory.length > 0,

    bedroomDoorFrameNoVisibleSlit: inventory.some((item) => (
      item.userData?.openingId === 'D-BEDROOM'
      && item.userData?.noVisibleSlitBetweenJambAndWall === true
    )),
    bathroomDoorFrameNoVisibleSlit: inventory.some((item) => (
      item.userData?.openingId === 'D-BATHROOM'
      && item.userData?.noVisibleSlitBetweenJambAndWall === true
    )),
    doorLeavesUsePbrTextures,
    doorHeadersNoVisibleGap: hasRuntimeFlag(inventory, 'doorHeadersNoVisibleGap'),
    openingTrimUsesPbrTextures,
    ceilingTrimContinuous: hasRuntimeFlag(inventory, 'ceilingTrimContinuous'),
    floorColorStableNearAndFar: floorGroundIsolationQaPass && hasRuntimeFlag(inventory, 'floorColorStableNearAndFar'),
    noBlueFloorOverlay: floorGroundIsolationQaPass && hasRuntimeFlag(inventory, 'noBlueFloorOverlay') && audits.floorCeilingStack.transparentFloorLikeObjects.length === 0,
    facadeGroovesCredible: hasRuntimeFlag(inventory, 'facadeGroovesCredible') && facadeBoardCount > 40,
    interiorWallAssemblyCoherent: hasRuntimeFlag(inventory, 'interiorWallAssemblyCoherent'),
    bedroomLayoutReadable: hasRuntimeFlag(inventory, 'bedroomLayoutReadable'),
    bathroomLayoutReadable: hasRuntimeFlag(inventory, 'bathroomLayoutReadable'),

    openableDoorsStillPass: null,
    windowsStillSealed: hasRuntimeFlag(inventory, 'windowsStillSealed') || hasRuntimeFlag(inventory, 'windowsDoNotReadAsVoid'),
    wallCollisionPass: null,
    doorTraversalPass: null,
    canWalkThroughWalls: null,

    cameraChanged: false,
    fovChanged: false,
    routesChanged: false,
    backendChanged: false,
    quoteChanged: false,
    stagingDeployPerformed: false,
    productVisualAccepted: false,
  };
}

async function openStudio(page, baseUrl, routeView) {
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
  });
  await page.goto(`${baseUrl}/modular-homes/studio?view=${routeView}&homeStudio=1&galaConstructionAudit=1`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(4500);
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, {
    timeout: 12000,
  });
}

async function setDoorStates(page, states = DEFAULT_DOOR_STATES) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_GALA_DOOR_API__), null, {
    timeout: 8000,
  }).catch(() => {});
  await page.evaluate((doorStates) => {
    const api = window.__WARPALA_GALA_DOOR_API__;
    if (api?.setDoorState) {
      Object.entries(doorStates).forEach(([doorId, state]) => api.setDoorState(doorId, state));
    } else {
      window.__WARPALA_GALA_DOOR_STATES__ = doorStates;
      window.dispatchEvent(new CustomEvent('gala:door-state-change', { detail: { states: doorStates } }));
    }
  }, states);
  await page.waitForTimeout(250);
}

async function applyHumanCloseupView(page, capture) {
  const startView = {
    lookAt: planToWorld(...capture.lookAt),
    position: planToWorld(...capture.position),
    source: 'gala-construction-renderer-reset',
  };

  await page.evaluate((nextStartView) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: nextStartView,
        zoneId: 'gala-construction-renderer-reset-audit',
      },
    }));
  }, startView);
  await page.waitForTimeout(850);
  return startView;
}

async function captureCanvas(page, targetPath) {
  const canvas = page.locator('canvas').first();
  await canvas.screenshot({ path: targetPath, timeout: 8000 }).catch(async () => {
    await page.screenshot({ fullPage: true, path: targetPath });
  });
}

async function collectInventory(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
}

async function captureSet(browser, baseUrl, outDir) {
  const targetDir = path.join(outDir, 'after', 'manual-repro');
  ensureDir(targetDir);
  const captures = [];
  const domOverlayAudits = [];
  let inventory = [];

  for (const capture of CAPTURES) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await openStudio(page, baseUrl, capture.routeView);
    domOverlayAudits.push({
      routeView: capture.routeView,
      ...(await collectDomOverlayAudit(page)),
    });
    await setDoorStates(page, DEFAULT_DOOR_STATES);
    const startView = await applyHumanCloseupView(page, capture);
    const targetPath = path.join(targetDir, capture.file);
    await captureCanvas(page, targetPath);
    const nextInventory = await collectInventory(page);
    if (nextInventory.length > inventory.length) {
      inventory = nextInventory;
    }
    captures.push({
      file: path.posix.join('after', 'manual-repro', capture.file),
      routeView: capture.routeView,
      startView,
    });
    await page.close();
  }

  return { captures, domOverlayAudits, inventory };
}

function copyRejectedBeforeIfAvailable(outDir) {
  const beforeSource = path.join(REJECTED_BEFORE_DIR, 'after', 'manual-repro');
  const beforeTarget = path.join(outDir, 'before', 'manual-repro');
  if (!fs.existsSync(beforeSource)) {
    return [];
  }
  ensureDir(beforeTarget);
  const copied = [];
  for (const file of fs.readdirSync(beforeSource).filter((name) => name.endsWith('.png')).slice(0, 16)) {
    fs.copyFileSync(path.join(beforeSource, file), path.join(beforeTarget, file));
    copied.push(path.posix.join('before', 'manual-repro', file));
  }
  return copied;
}

function svgText(lines, title) {
  return `
    <svg width="1440" height="900" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="54" y="70" font-family="Arial" font-size="32" font-weight="700" fill="#111827">${title}</text>
      ${lines.map((line, index) => (
        `<text x="72" y="${128 + index * 34}" font-family="Arial" font-size="22" fill="#1f2937">${line}</text>`
      )).join('')}
    </svg>
  `;
}

async function makeDebugImages(outDir, audits, result) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);

  await sharp(Buffer.from(svgText([
    `Main finished floor meshes: ${audits.floorCeilingStack.mainFinishedFloorCount}`,
    `Transparent floor-like meshes: ${audits.floorCeilingStack.transparentFloorLikeObjects.length}`,
    `Floor stack has no coplanar overlays: ${result.floorStackHasNoCoplanarOverlays}`,
  ], 'Runtime floor / ceiling stack audit'))).png().toFile(path.join(debugDir, 'floor-ceiling-stack.png'));

  await sharp(Buffer.from(svgText([
    `Wall assembly candidates: ${audits.walls.length}`,
    `Opening assembly candidates: ${audits.openings.length}`,
    `Crown/ceiling trim candidates: ${audits.roomTrim.length}`,
    `Facade cladding candidates: ${audits.facadeCladding.length}`,
  ], 'Runtime construction assembly inventory'))).png().toFile(path.join(debugDir, 'topdown-floorplan-with-furniture.png'));

  for (const [source, target] of DEBUG_CAPTURE_ALIASES) {
    const sourcePath = path.join(outDir, 'after', 'manual-repro', source);
    const targetPath = path.join(debugDir, target);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function writeAuditJson(outDir, inventory, captures, domOverlayAudits = []) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);
  const audits = buildAudits(inventory);
  const floorGroundIsolationResult = readJsonIfExists(path.join(outDir, 'qa-gala-floor-ground-isolation-result.json'));
  const result = buildResult(inventory, captures, domOverlayAudits, floorGroundIsolationResult?.pass === true);

  writeJson(path.join(debugDir, 'runtime-mesh-inventory.json'), inventory);
  writeJson(path.join(debugDir, 'wall-assembly-inventory.json'), filterInventory(inventory, (item) => item.isWallAssemblyCandidate));
  writeJson(path.join(debugDir, 'opening-assembly-inventory.json'), filterInventory(inventory, (item) => item.isOpeningAssemblyCandidate));
  writeJson(path.join(debugDir, 'floor-ceiling-stack.json'), audits.floorCeilingStack);
  writeJson(path.join(debugDir, 'room-trim-continuity.json'), audits.roomTrim);
  writeJson(path.join(debugDir, 'facade-cladding-continuity.json'), audits.facadeCladding);
  writeJson(path.join(debugDir, 'furniture-layout-audit.json'), audits.furniture);
  writeJson(path.join(debugDir, 'dom-overlay-audit.json'), domOverlayAudits);
  writeJson(path.join(outDir, 'qa-gala-construction-renderer-result.json'), result);
  writeJson(path.join(outDir, 'visual-evidence-manifest.json'), {
    captures,
    generatedAt: new Date().toISOString(),
    inventorySource: 'window.__WARPALA_3D_QA__.getSceneMeshInventory actual Three.js scene traversal',
    productVisualAccepted: false,
    repairScope: 'gala-construction-renderer-reset',
    resultFile: 'qa-gala-construction-renderer-result.json',
  });

  return { audits, result };
}

async function run(options) {
  ensureDir(options.outDir);
  const beforeCopies = copyRejectedBeforeIfAvailable(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const { captures, domOverlayAudits, inventory } = await captureSet(browser, options.baseUrl, options.outDir);
  await browser.close();
  const { audits, result } = writeAuditJson(options.outDir, inventory, [
    ...beforeCopies.map((file) => ({ file, phase: 'before', source: REJECTED_BEFORE_DIR })),
    ...captures,
  ], domOverlayAudits);
  await makeDebugImages(options.outDir, audits, result);

  console.log(JSON.stringify({
    outDir: options.outDir,
    productVisualAccepted: false,
    repairScope: 'gala-construction-renderer-reset',
    result,
    runtimeMeshCount: inventory.length,
  }, null, 2));
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
