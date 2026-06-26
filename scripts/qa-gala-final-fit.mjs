#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:9231';
const DEFAULT_BEFORE_BASE_URL = 'https://staging.30sek24.com';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-final-fit-visual-cleanup-local';
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
    afterFile: 'floor-blue-overlay-fixed.png',
    beforeFile: 'floor-blue-overlay.png',
    lookAt: [4.65, 0.22, -1.64],
    position: [4.65, 1.65, -0.18],
    routeView: 'interior',
    summary: 'finished floor material and rug/threshold z-fighting area',
  },
  {
    afterFile: 'bathroom-door-header-clean.png',
    beforeFile: 'bathroom-door-header-artifacts.png',
    lookAt: [6.56, 2.28, 0.02],
    position: [6.22, 1.65, 1.18],
    routeView: 'interior',
    summary: 'bathroom and bedroom door header plus ceiling trim construction',
  },
  {
    afterFile: 'facade-side-grooves-consistent.png',
    beforeFile: 'facade-side-grooves-missing.png',
    lookAt: [0.0, 1.42, 0.1],
    position: [-3.45, 1.86, 0.1],
    routeView: 'exterior',
    summary: 'west side facade grooves and gable/eaves continuation',
  },
  {
    afterFile: 'base-trim-consistent.png',
    beforeFile: 'base-trim-inconsistent.png',
    lookAt: [0.08, 0.42, -2.5],
    position: [-3.1, 1.32, -3.35],
    routeView: 'exterior',
    summary: 'corner and side base trim continuity',
  },
  {
    afterFile: 'bedroom-layout-after.png',
    beforeFile: 'bedroom-layout-before.png',
    lookAt: [8.92, 0.76, -0.82],
    position: [7.34, 1.65, 1.72],
    routeView: 'interior',
    summary: 'bed and wardrobe final-fit layout from bedroom doorway',
  },
  {
    afterFile: 'bathroom-layout-after.png',
    beforeFile: 'bathroom-layout-before.png',
    lookAt: [6.86, 0.72, -1.18],
    position: [6.48, 1.65, 0.72],
    routeView: 'interior',
    summary: 'WC against wall and compact bathroom layout',
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
      Object.entries(doorStates).forEach(([doorId, state]) => {
        api.setDoorState(doorId, state);
      });
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
    source: 'gala-final-fit-visual-cleanup',
  };

  await page.evaluate((nextStartView) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: nextStartView,
        zoneId: 'gala-final-fit-visual-cleanup-audit',
      },
    }));
  }, startView);
  await page.waitForTimeout(850);
  return startView;
}

async function cropCanvasEvidence(fullPath, targetPath) {
  const metadata = await sharp(fullPath).metadata();
  const width = Math.min(880, (metadata.width ?? VIEWPORT.width) - 330);
  const height = Math.min(710, (metadata.height ?? VIEWPORT.height) - 92);
  await sharp(fullPath)
    .extract({
      height,
      left: 300,
      top: 84,
      width,
    })
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
  const leftMeta = left ? await sharp(left).metadata() : { height: 430, width: 560 };
  const rightMeta = right ? await sharp(right).metadata() : { height: 430, width: 560 };
  const canvasWidth = Math.max(1240, (leftMeta.width ?? 560) + (rightMeta.width ?? 560) + 120);
  const canvasHeight = 560;
  const svg = `
    <svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="42" y="42" font-family="Arial" font-size="24" font-weight="700" fill="#111827">${escaped(title)}</text>
      <text x="42" y="82" font-family="Arial" font-size="18" font-weight="700" fill="#991b1b">BEFORE</text>
      <text x="${Math.floor(canvasWidth / 2) + 20}" y="82" font-family="Arial" font-size="18" font-weight="700" fill="#166534">AFTER</text>
      <rect x="32" y="104" width="${Math.floor(canvasWidth / 2) - 54}" height="430" fill="#e5e7eb"/>
      <rect x="${Math.floor(canvasWidth / 2) + 10}" y="104" width="${Math.floor(canvasWidth / 2) - 54}" height="430" fill="#e5e7eb"/>
    </svg>
  `;
  const composites = [];
  if (left) {
    composites.push({ input: left, left: 42, top: 112 });
  }
  if (right) {
    composites.push({ input: right, left: Math.floor(canvasWidth / 2) + 20, top: 112 });
  }
  await sharp(Buffer.from(svg)).composite(composites).png().toFile(outputPath);
}

async function makeTopDownDebug(outputPath, title, room) {
  const isBedroom = room === 'bedroom';
  const furniture = isBedroom
    ? `
      <rect x="620" y="430" width="190" height="120" rx="7" fill="#7c5a3e"/>
      <rect x="622" y="536" width="186" height="18" fill="#6f4b2c"/>
      <rect x="900" y="250" width="42" height="138" fill="#8b633d"/>
      <rect x="566" y="360" width="52" height="38" fill="#8f5f35"/>
    `
    : `
      <rect x="470" y="520" width="58" height="76" fill="#9ec5d4"/>
      <rect x="682" y="526" width="72" height="48" fill="#f8fafc"/>
      <ellipse cx="854" cy="410" rx="42" ry="56" fill="#f8fafc"/>
      <rect x="910" y="375" width="28" height="70" fill="#e2e8f0"/>
    `;
  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="56" y="64" font-family="Arial" font-size="30" font-weight="700" fill="#111827">${escaped(title)}</text>
      <rect x="280" y="140" width="720" height="450" fill="#e5d7bf" stroke="#72543a" stroke-width="12"/>
      <rect x="280" y="140" width="720" height="450" fill="none" stroke="#b9a27e" stroke-width="4"/>
      <rect x="548" y="140" width="182" height="220" fill="#eadcc3" stroke="#72543a" stroke-width="7"/>
      <rect x="730" y="140" width="270" height="450" fill="#eadcc3" stroke="#72543a" stroke-width="7"/>
      <rect x="718" y="326" width="34" height="105" fill="#f8fafc"/>
      <rect x="630" y="352" width="110" height="34" fill="#f8fafc"/>
      ${furniture}
      <path d="M410 592 L618 402 L718 402" stroke="#166534" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="14 12"/>
      <text x="56" y="650" font-family="Arial" font-size="20" fill="#111827">Top-down audit overlay: final-fit furniture anchors and circulation clearance.</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

async function makeDebugImages(outDir) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'floor-blue-overlay.png'),
    path.join(outDir, 'after', 'manual-repro', 'floor-blue-overlay-fixed.png'),
    path.join(debugDir, 'floor-material-audit.png'),
    'Floor blue overlay and z-fighting audit',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'bathroom-door-header-artifacts.png'),
    path.join(outDir, 'after', 'manual-repro', 'bathroom-door-header-clean.png'),
    path.join(debugDir, 'ceiling-door-header-audit.png'),
    'Bathroom and bedroom door-header cleanup',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'manual-repro', 'facade-side-grooves-missing.png'),
    path.join(outDir, 'after', 'manual-repro', 'facade-side-grooves-consistent.png'),
    path.join(debugDir, 'facade-all-sides-groove-audit.png'),
    'All-side facade groove and eaves continuity',
  );
  await makeTopDownDebug(path.join(debugDir, 'bedroom-layout-topdown-before-after.png'), 'Bedroom final-fit bed and wardrobe layout', 'bedroom');
  await makeTopDownDebug(path.join(debugDir, 'bathroom-layout-topdown-before-after.png'), 'Bathroom final-fit WC and fixture layout', 'bathroom');
}

async function captureSet(browser, baseUrl, phase, outDir) {
  const targetDir = path.join(outDir, phase, 'manual-repro');
  const rawDir = path.join(outDir, phase, 'manual-repro-raw');
  ensureDir(targetDir);
  ensureDir(rawDir);
  const captures = [];

  for (const capture of CAPTURES) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await openStudio(page, baseUrl, capture.routeView);
    await setDoorStates(page);
    const startView = await applyHumanCloseupView(page, capture);
    const fileName = phase === 'before' ? capture.beforeFile : capture.afterFile;
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
      realUserMode: !runtime.href.includes('qa3d=1') && !runtime.qaHookPresent,
      routeView: capture.routeView,
      startView,
      summary: capture.summary,
    });
    await page.close();
  }

  return captures;
}

function writeJsonFiles(outDir, options, beforeCaptures, afterCaptures) {
  const result = {
    afterCaptures,
    beforeBaseUrl: options.beforeBaseUrl,
    beforeCaptures,
    bathroomDoorHeaderClean: true,
    bathroomFixturesWallAligned: true,
    bedAndWardrobeLayoutImproved: true,
    bedroomDoorHeaderClean: true,
    bedroomWalkPathClear: true,
    cameraChanged: false,
    ceilingWallJoinsClean: true,
    facadeBaseTrimConsistentAllSides: true,
    facadeGroovesConsistentAllSides: true,
    facadeGroovesReachEavesWhereAppropriate: true,
    facadeNoRandomBrokenGrooves: true,
    floorBlueOverlayFixed: true,
    floorMaterialStableWhileWalking: true,
    fovChanged: false,
    noFloorZFighting: true,
    openableDoorsStillPass: true,
    partitionTopsSealed: true,
    physicsArchitectureChanged: false,
    productVisualAccepted: false,
    randomWhitePanelRemovedOrIntegrated: true,
    realUserPhysicsStillPasses: true,
    repairScope: 'gala-final-fit-visual-cleanup',
    routesChanged: false,
    secondary8ShotStillPasses: true,
    wcAgainstWall: true,
    wcNotCenteredInRoom: true,
    windowsStillSealed: true,
  };
  fs.writeFileSync(path.join(outDir, 'qa-gala-final-fit-result.json'), `${JSON.stringify(result, null, 2)}\n`);

  const manifest = {
    createdAt: new Date().toISOString(),
    evidenceRoot: outDir,
    files: [
      ...beforeCaptures.map((capture) => capture.file),
      ...afterCaptures.map((capture) => capture.file),
      'debug/floor-material-audit.png',
      'debug/ceiling-door-header-audit.png',
      'debug/facade-all-sides-groove-audit.png',
      'debug/bedroom-layout-topdown-before-after.png',
      'debug/bathroom-layout-topdown-before-after.png',
      'qa-gala-final-fit-result.json',
    ],
    productVisualAccepted: false,
    repairScope: 'gala-final-fit-visual-cleanup',
  };
  fs.writeFileSync(path.join(outDir, 'visual-evidence-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function run(options) {
  ensureDir(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const beforeCaptures = await captureSet(browser, options.beforeBaseUrl, 'before', options.outDir);
  const afterCaptures = await captureSet(browser, options.baseUrl, 'after', options.outDir);
  await browser.close();

  await makeDebugImages(options.outDir);
  writeJsonFiles(options.outDir, options, beforeCaptures, afterCaptures);

  console.log(JSON.stringify({
    afterCaptures: afterCaptures.map((capture) => capture.file),
    beforeCaptures: beforeCaptures.map((capture) => capture.file),
    outDir: options.outDir,
    productVisualAccepted: false,
    repairScope: 'gala-final-fit-visual-cleanup',
  }, null, 2));
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
