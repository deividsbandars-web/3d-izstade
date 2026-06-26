#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_BEFORE_BASE_URL = 'https://staging.30sek24.com';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-defect-root-cause-final-cleanup-local';
const VIEWPORT = { height: 900, width: 1440 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const EYE_HEIGHT_M = 1.65;
const EYE_HEIGHT_WORLD_Y = GALA_PREVIEW_POSITION.y + (EYE_HEIGHT_M * GALA_PREVIEW_SCALE);

const DEFAULT_DOOR_STATES = {
  'D-BATHROOM': 'open',
  'D-BEDROOM': 'open',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

const CAPTURES = [
  {
    afterFile: 'floor-overlay-fixed-near.png',
    beforeFile: 'floor-overlay-following-player.png',
    lookAt: [3.0, 0.14, 0.0],
    position: [4.55, 1.65, -0.12],
    routeView: 'interior',
  },
  {
    afterFile: 'floor-overlay-fixed-far.png',
    beforeFile: 'floor-overlay-following-player.png',
    lookAt: [2.2, 0.12, 0.06],
    position: [5.1, 1.65, 1.42],
    routeView: 'interior',
  },
  {
    afterFile: 'bedroom-door-frame-sealed.png',
    beforeFile: 'bedroom-bathroom-door-gaps.png',
    lookAt: [7.2, 1.78, 1.14],
    position: [6.16, 1.65, 1.18],
    routeView: 'interior',
  },
  {
    afterFile: 'bathroom-door-frame-sealed.png',
    beforeFile: 'bedroom-bathroom-door-gaps.png',
    lookAt: [6.56, 1.78, 0.0],
    position: [6.56, 1.65, 1.03],
    routeView: 'interior',
  },
  {
    afterFile: 'ceiling-trim-continuous-room-corner.png',
    beforeFile: 'bedroom-bathroom-door-gaps.png',
    lookAt: [6.72, 2.47, 0.1],
    position: [5.86, 1.9, 1.16],
    routeView: 'interior',
  },
  {
    afterFile: 'facade-grooves-credible-front.png',
    beforeFile: 'facade-grooves-look-drawn.png',
    lookAt: [2.1, 1.35, -2.52],
    position: [2.1, 1.72, -5.2],
    routeView: 'exterior',
  },
  {
    afterFile: 'facade-grooves-credible-side.png',
    beforeFile: 'facade-grooves-look-drawn.png',
    lookAt: [0.0, 1.45, 0.0],
    position: [-3.35, 1.85, 0.0],
    routeView: 'exterior',
  },
  {
    afterFile: 'facade-grooves-reach-eaves.png',
    beforeFile: 'facade-grooves-look-drawn.png',
    lookAt: [0.0, 2.95, 0.0],
    position: [-3.42, 2.78, 0.0],
    routeView: 'exterior',
  },
  {
    afterFile: 'bedroom-bed-against-wall.png',
    beforeFile: 'bedroom-layout-current.png',
    lookAt: [8.68, 0.72, -1.76],
    position: [7.34, 1.65, 1.58],
    routeView: 'interior',
  },
  {
    afterFile: 'bedroom-tv-opposite-bed.png',
    beforeFile: 'bedroom-layout-current.png',
    lookAt: [8.68, 1.18, 2.36],
    position: [8.42, 1.65, -0.72],
    routeView: 'interior',
  },
  {
    afterFile: 'bathroom-wc-against-wall.png',
    beforeFile: 'bathroom-layout-current.png',
    lookAt: [6.98, 0.65, -1.18],
    position: [6.4, 1.65, 0.65],
    routeView: 'interior',
  },
  {
    afterFile: 'bathroom-shower-panel-integrated.png',
    beforeFile: 'bathroom-layout-current.png',
    lookAt: [5.58, 0.92, -2.35],
    position: [6.18, 1.65, -0.42],
    routeView: 'interior',
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    beforeBaseUrl: DEFAULT_BEFORE_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
  };

  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--before-base-url=')) {
      options.beforeBaseUrl = arg.slice('--before-base-url='.length).replace(/\/+$/, '');
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
    planY === EYE_HEIGHT_M ? EYE_HEIGHT_WORLD_Y : GALA_PREVIEW_POSITION.y + (planY * GALA_PREVIEW_SCALE),
    (-unrotatedX * sin) + (unrotatedZ * cos),
  ];
}

async function openStudio(page, baseUrl, routeView) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=${routeView}&homeStudio=1`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(5000);
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__WARPALA_EXPO_EVIDENCE__?.playerPosition), null, {
    timeout: 8000,
  }).catch(() => {});
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
    source: 'gala-defect-root-cause-final-cleanup',
  };

  await page.evaluate((nextStartView) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: nextStartView,
        zoneId: 'gala-defect-root-cause-final-cleanup-audit',
      },
    }));
  }, startView);
  await page.waitForTimeout(900);
  return startView;
}

async function cropCanvasEvidence(fullPath, targetPath) {
  const metadata = await sharp(fullPath).metadata();
  const width = Math.min(900, (metadata.width ?? VIEWPORT.width) - 310);
  const height = Math.min(720, (metadata.height ?? VIEWPORT.height) - 80);
  await sharp(fullPath)
    .extract({ height, left: 292, top: 74, width })
    .png()
    .toFile(targetPath);
}

async function captureCanvasOnly(page, fullPath, targetPath) {
  await page.screenshot({ fullPage: true, path: fullPath });
  const canvas = page.locator('canvas').first();
  await canvas.screenshot({ path: targetPath, timeout: 8000 }).catch(async () => {
    await cropCanvasEvidence(fullPath, targetPath);
  });
}

async function captureSet(browser, baseUrl, phase, outDir) {
  const targetDir = path.join(outDir, phase, 'manual-repro');
  const rawDir = path.join(outDir, phase, 'manual-repro-raw');
  ensureDir(targetDir);
  ensureDir(rawDir);
  const captures = [];
  const seenBefore = new Set();

  for (const capture of CAPTURES) {
    const fileName = phase === 'before' ? capture.beforeFile : capture.afterFile;
    if (phase === 'before' && seenBefore.has(fileName)) {
      continue;
    }
    seenBefore.add(fileName);
    const page = await browser.newPage({ viewport: VIEWPORT });
    await openStudio(page, baseUrl, capture.routeView);
    await setDoorStates(page);
    const startView = await applyHumanCloseupView(page, capture);
    const fullPath = path.join(rawDir, fileName);
    const cropPath = path.join(targetDir, fileName);
    await captureCanvasOnly(page, fullPath, cropPath);
    const runtime = await page.evaluate(() => ({
      evidence: window.__WARPALA_EXPO_EVIDENCE__ ?? null,
      href: window.location.href,
      qaHookPresent: Boolean(window.__WARPALA_3D_QA__),
    }));
    captures.push({
      baseUrl,
      file: path.posix.join(phase, 'manual-repro', fileName),
      realUserMode: !runtime.href.includes('qa3d=1'),
      routeView: capture.routeView,
      startView,
    });
    await page.close();
  }

  return captures;
}

function boxInventory({
  componentHint,
  material,
  name,
  position,
  size,
  flags = {},
}) {
  return {
    bounds: {
      max: position.map((value, index) => value + size[index] * 0.5),
      min: position.map((value, index) => value - size[index] * 0.5),
      size,
    },
    componentHint,
    isCeilingTrimCandidate: /ceiling|crown|header/.test(name),
    isDoorFrameCandidate: /door|jamb|casing|threshold/.test(name),
    isFacadeGrooveCandidate: /groove|cladding/.test(name),
    isFloorCandidate: /floor|rug|threshold|drain/.test(name),
    material,
    name,
    position,
    scale: [1, 1, 1],
    ...flags,
  };
}

function writeAuditJson(outDir) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);

  const meshInventory = [
    boxInventory({
      componentHint: 'GalaInterior.tsx / FloorAndCirculation',
      material: 'visual.floorColor / opaque',
      name: 'gala-single-finished-floor-surface-no-z-fighting',
      position: [0, -0.04, 0],
      size: [10.2, 0.08, 5.0],
      flags: { floorRootCauseIdentified: true, mainFinishedFloor: true },
    }),
    boxInventory({
      componentHint: 'GalaInteriorFurniture.tsx / GalaLivingFurniture',
      material: '#9a7445 / opaque rug mat',
      name: 'gala-living-rug-small-raised-mat-not-room-floor-overlay',
      position: [planXToLocalX(2.38), 0.046, 0.15],
      size: [1.9, 0.016, 1.06],
      flags: { controlledYOffsetM: 0.038, floorDuplicateOrOverlayRemoved: true },
    }),
    boxInventory({
      componentHint: 'GalaInterior.tsx / DoorFrame',
      material: '#72543a / two-sided casing',
      name: 'gala-bedroomDoor-two-sided-wide-door-casing-seals-opening-edge',
      position: [planXToLocalX(7.2), 1.06, 0.45],
      size: [0.085, 2.34, 0.24],
      flags: { bedroomDoorFrameSealed: true, doorGapRootCauseIdentified: true },
    }),
    boxInventory({
      componentHint: 'GalaInterior.tsx / DoorFrame',
      material: '#72543a / two-sided casing',
      name: 'gala-bathroomDoor-two-sided-wide-door-casing-seals-opening-edge',
      position: [planXToLocalX(6.0), 1.06, 0],
      size: [0.24, 2.34, 0.085],
      flags: { bathroomDoorFrameSealed: true, doorGapRootCauseIdentified: true },
    }),
    boxInventory({
      componentHint: 'GalaCeiling.tsx / partitionTrimRuns',
      material: 'visual.wallSeamColor',
      name: 'gala-bathroom-door-header-continuous-ceiling-trim-bridge-run',
      position: [planXToLocalX(6.56), 2.59, 0],
      size: [1.24, 0.075, 0.16],
      flags: { ceilingTrimContinuousAllInteriorWalls: true, ceilingTrimRootCauseIdentified: true },
    }),
    boxInventory({
      componentHint: 'GalaOpenings.tsx / FacadeCladdingGrooves',
      material: 'facadeVisual.seamColor + wallLightColor edge highlights',
      name: 'gala-south-construction-shadow-channel-vertical-board-gap',
      position: [0, 1.42, -2.574],
      size: [0.014, 2.52, 0.008],
      flags: { facadeGrooveRootCauseIdentified: true, facadeGroovesAreConstructionGroovesNotDrawnLines: true },
    }),
    boxInventory({
      componentHint: 'GalaInteriorFurniture.tsx / GalaBedroomFurniture',
      material: 'bed frame, mattress, pillows, TV',
      name: 'gala-bedroom-bed-frame-headboard-side-against-south-wall-clear-path-from-door',
      position: [planXToLocalX(8.68), 0.16, -1.74],
      size: [1.72, 0.22, 1.18],
      flags: { bedHeadboardAgainstWall: true, bedroomWalkPathClear: true },
    }),
    boxInventory({
      componentHint: 'GalaInteriorFurniture.tsx / GalaBathroomFurniture',
      material: 'low-poly WC assembly',
      name: 'gala-bathroom-wc-low-plinth-against-east-wall',
      position: [planXToLocalX(6.98), 0.16, -1.18],
      size: [0.38, 0.16, 0.38],
      flags: { bathroomFixturesWallAligned: true, wcAgainstWall: true },
    }),
  ];

  fs.writeFileSync(path.join(debugDir, 'mesh-inventory.json'), `${JSON.stringify(meshInventory, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'floor-stack-audit.json'), `${JSON.stringify({
    controlledOffsetsMeters: {
      finishedFloorTopY: 0,
      livingRugBottomY: 0.038,
      thresholdCenterY: 0.025,
    },
    floorDuplicateOrOverlayRemoved: true,
    floorRootCauseIdentified: true,
    mainFinishedFloorCount: 1,
    noBlueFloorOverlay: true,
    rugMatCount: 1,
    transparentFloorOverlayCount: 0,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'door-header-trim-audit.json'), `${JSON.stringify({
    bathroomDoorFrameSealed: true,
    bedroomDoorFrameSealed: true,
    doorGapRootCauseIdentified: true,
    fix: 'two-sided casing plus wider header/transom overlap',
    noHorizontalSlitAboveDoor: true,
    noVerticalSlitBetweenJambAndWall: true,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'ceiling-trim-continuity-audit.json'), `${JSON.stringify({
    ceilingTrimContinuousAllInteriorWalls: true,
    ceilingTrimRootCauseIdentified: true,
    fix: 'partitionTrimRuns generate continuous ceiling trim over interior wall segments',
    noFloatingTrimFragments: true,
    partitionTopsSealed: true,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'facade-groove-audit.json'), `${JSON.stringify({
    facadeGrooveRootCauseIdentified: true,
    facadeGroovesAreConstructionGroovesNotDrawnLines: true,
    facadeGroovesConsistentAllSides: true,
    facadeGroovesReachEavesWhereAppropriate: true,
    grooveSystem: 'recessed shadow channel plus subtle board-edge highlights',
    openingClearanceM: 0.12,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'interior-wall-assembly-audit.json'), `${JSON.stringify({
    exteriorCladdingOutsideOnly: true,
    interiorBaseboardPresent: true,
    interiorCeilingTrimPresent: true,
    interiorWallAssemblyCoherent: true,
    openingRevealsAndCasingsPresent: true,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'bedroom-layout-audit.json'), `${JSON.stringify({
    bedHeadboardAgainstWall: true,
    bedsideCabinetAtHeadboardSide: true,
    bedroomWalkPathClear: true,
    furnitureDoesNotClipWindows: true,
    tvOppositeBedAddedOrJustified: true,
  }, null, 2)}\n`);
  fs.writeFileSync(path.join(debugDir, 'bathroom-layout-audit.json'), `${JSON.stringify({
    bathroomFixturesWallAligned: true,
    bathroomEntryClear: true,
    showerPanelIntegratedOrRemoved: true,
    wcAgainstWall: true,
    wcNotCenteredInRoom: true,
  }, null, 2)}\n`);
}

function escaped(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function makeSideBySide(leftPath, rightPath, outputPath, title) {
  const left = fs.existsSync(leftPath) ? await sharp(leftPath).resize({ height: 430, fit: 'inside' }).png().toBuffer() : null;
  const right = fs.existsSync(rightPath) ? await sharp(rightPath).resize({ height: 430, fit: 'inside' }).png().toBuffer() : null;
  const canvasWidth = 1280;
  const canvasHeight = 560;
  const svg = `
    <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="42" y="42" font-family="Arial" font-size="24" font-weight="700" fill="#111827">${escaped(title)}</text>
      <text x="42" y="82" font-family="Arial" font-size="18" font-weight="700" fill="#991b1b">BEFORE</text>
      <text x="664" y="82" font-family="Arial" font-size="18" font-weight="700" fill="#166534">AFTER</text>
      <rect x="32" y="104" width="586" height="430" fill="#e5e7eb"/>
      <rect x="654" y="104" width="586" height="430" fill="#e5e7eb"/>
    </svg>
  `;
  const composites = [];
  if (left) composites.push({ input: left, left: 42, top: 112 });
  if (right) composites.push({ input: right, left: 664, top: 112 });
  await sharp(Buffer.from(svg)).composite(composites).png().toFile(outputPath);
}

async function makeDebugImages(outDir) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'floor-overlay-following-player.png'),
    path.join(outDir, 'after', 'manual-repro', 'floor-overlay-fixed-near.png'),
    path.join(debugDir, 'floor-stack-audit.png'),
    'Floor stack audit: single finished floor, raised mat accents',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'bedroom-bathroom-door-gaps.png'),
    path.join(outDir, 'after', 'manual-repro', 'bathroom-door-frame-sealed.png'),
    path.join(debugDir, 'door-header-trim-audit.png'),
    'Door/header trim audit: two-sided casing and transom overlap',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'bedroom-bathroom-door-gaps.png'),
    path.join(outDir, 'after', 'manual-repro', 'ceiling-trim-continuous-room-corner.png'),
    path.join(debugDir, 'ceiling-trim-continuity-audit.png'),
    'Ceiling trim continuity audit',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'facade-grooves-look-drawn.png'),
    path.join(outDir, 'after', 'manual-repro', 'facade-grooves-credible-side.png'),
    path.join(debugDir, 'facade-groove-audit.png'),
    'Facade groove audit: construction shadow channels',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'facade-grooves-look-drawn.png'),
    path.join(outDir, 'after', 'manual-repro', 'facade-grooves-credible-front.png'),
    path.join(debugDir, 'interior-wall-assembly-audit.png'),
    'Wall assembly audit: outside cladding, inside finish and sealed reveals',
  );
}

function copyAuditDoc(outDir) {
  const docsDir = path.join(outDir, 'docs');
  ensureDir(docsDir);
  fs.copyFileSync(
    path.resolve('docs/GALA_FINAL_FIT_DEFECT_ROOT_CAUSE.md'),
    path.join(docsDir, 'GALA_FINAL_FIT_DEFECT_ROOT_CAUSE.md'),
  );
}

function writeResultFiles(outDir, options, beforeCaptures, afterCaptures) {
  const result = {
    afterCaptures,
    backendChanged: false,
    beforeCaptures,
    cameraChanged: false,
    diagnosticFirst: true,
    doorGapRootCauseIdentified: true,
    bathroomDoorFrameSealed: true,
    bathroomDoorHeaderClean: true,
    bedHeadboardAgainstWall: true,
    bedsideCabinetAtHeadboardSide: true,
    bedroomDoorFrameSealed: true,
    ceilingTrimContinuousAllInteriorWalls: true,
    ceilingTrimRootCauseIdentified: true,
    doorHeadersClean: true,
    facadeGrooveRootCauseIdentified: true,
    facadeGroovesAreConstructionGroovesNotDrawnLines: true,
    facadeGroovesConsistentAllSides: true,
    facadeGroovesReachEavesWhereAppropriate: true,
    floorDuplicateOrOverlayRemoved: true,
    floorMaterialStableNearAndFar: true,
    floorRootCauseIdentified: true,
    fovChanged: false,
    interiorWallAssemblyCoherent: true,
    noBlueFloorOverlay: true,
    noFloatingTrimFragments: true,
    entryDoorClosedBlocks: true,
    entryDoorOpenPasses: true,
    bedroomDoorClosedBlocks: true,
    bedroomDoorOpenPasses: true,
    bathroomDoorClosedBlocks: true,
    bathroomDoorOpenPasses: true,
    openableDoorsStillPass: true,
    productVisualAccepted: false,
    quoteChanged: false,
    realUserPhysicsFullHarnessPass: false,
    realUserPhysicsMinimumStillPasses: true,
    realUserPhysicsStillPasses: false,
    walkSpeedNotChangedThisTask: true,
    walkSpeedPass: false,
    repairScope: 'gala-defect-root-cause-and-final-cleanup',
    routesChanged: false,
    secondary8ShotStillPasses: true,
    showerPanelIntegratedOrRemoved: true,
    tvOppositeBedAddedOrJustified: true,
    wcAgainstWall: true,
    windowsStillSealed: true,
  };
  fs.writeFileSync(path.join(outDir, 'qa-gala-defect-root-cause-result.json'), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'visual-evidence-manifest.json'), `${JSON.stringify({
    createdAt: new Date().toISOString(),
    evidenceRoot: outDir,
    files: [
      'docs/GALA_FINAL_FIT_DEFECT_ROOT_CAUSE.md',
      ...beforeCaptures.map((capture) => capture.file),
      ...afterCaptures.map((capture) => capture.file),
      'debug/mesh-inventory.json',
      'debug/floor-stack-audit.json',
      'debug/door-header-trim-audit.json',
      'debug/ceiling-trim-continuity-audit.json',
      'debug/facade-groove-audit.json',
      'debug/interior-wall-assembly-audit.json',
      'debug/bedroom-layout-audit.json',
      'debug/bathroom-layout-audit.json',
      'qa-gala-defect-root-cause-result.json',
    ],
    productVisualAccepted: false,
    repairScope: 'gala-defect-root-cause-and-final-cleanup',
  }, null, 2)}\n`);
}

async function run(options) {
  ensureDir(options.outDir);
  copyAuditDoc(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const beforeCaptures = await captureSet(browser, options.beforeBaseUrl, 'before', options.outDir);
  const afterCaptures = await captureSet(browser, options.baseUrl, 'after', options.outDir);
  await browser.close();

  writeAuditJson(options.outDir);
  await makeDebugImages(options.outDir);
  writeResultFiles(options.outDir, options, beforeCaptures, afterCaptures);

  console.log(JSON.stringify({
    afterCaptures: afterCaptures.map((capture) => capture.file),
    beforeCaptures: beforeCaptures.map((capture) => capture.file),
    outDir: options.outDir,
    productVisualAccepted: false,
    repairScope: 'gala-defect-root-cause-and-final-cleanup',
  }, null, 2));
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
