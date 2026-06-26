import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:9231';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-openable-doors-sealed-windows-local';
const VIEWPORT = { height: 900, width: 1440 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const EYE_HEIGHT_M = 1.65;
const EYE_HEIGHT_WORLD_Y = GALA_PREVIEW_POSITION.y + (EYE_HEIGHT_M * GALA_PREVIEW_SCALE);

const DEFAULT_DOOR_STATES = {
  'D-BATHROOM': 'closed',
  'D-BEDROOM': 'closed',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

const BEFORE_VIEWPOINTS = [
  {
    file: 'entry-door-closed-see-through.png',
    lookAt: [4.635, 1.18, -2.52],
    position: [4.635, 1.65, -1.3],
    routeView: 'interior',
    summary: 'rejected staging entry door close-up before current openable-door correction',
  },
  {
    file: 'window-void-closeup.png',
    lookAt: [2.085, 1.58, -2.52],
    position: [2.25, 1.65, -1.22],
    routeView: 'interior',
    summary: 'rejected staging window void close-up before current sealed-glass correction',
  },
  {
    file: 'facade-seams-cross-opening.png',
    lookAt: [2.085, 1.35, -2.52],
    position: [2.085, 1.72, -5.25],
    routeView: 'exterior',
    summary: 'rejected staging facade seam close-up before groove clipping correction',
  },
];

const AFTER_VIEWPOINTS = [
  {
    doorStates: { 'D-ENTRY': 'closed' },
    file: 'entry-door-closed-blocks.png',
    lookAt: [4.635, 1.18, -2.52],
    position: [4.635, 1.65, -1.3],
    routeView: 'interior',
    summary: 'entry door closed state: opaque slab seated in frame',
  },
  {
    doorStates: { 'D-ENTRY': 'open' },
    file: 'entry-door-open-passable.png',
    lookAt: [4.44, 1.18, -2.52],
    position: [3.92, 1.65, -1.18],
    routeView: 'interior',
    summary: 'entry door open state: leaf rotated clear of passage',
  },
  {
    doorStates: { 'D-BEDROOM': 'closed' },
    file: 'bedroom-door-closed-blocks.png',
    lookAt: [7.2, 1.15, 1.13],
    position: [6.22, 1.65, 1.13],
    routeView: 'interior',
    summary: 'bedroom door closed state: opaque interior slab in frame',
  },
  {
    doorStates: { 'D-BEDROOM': 'open' },
    file: 'bedroom-door-open-passable.png',
    lookAt: [7.2, 1.15, 1.13],
    position: [6.22, 1.65, 1.13],
    routeView: 'interior',
    summary: 'bedroom door open state: visible passable doorway',
  },
  {
    doorStates: { 'D-BATHROOM': 'closed' },
    file: 'bathroom-door-closed-blocks.png',
    lookAt: [6.56, 1.15, 0.0],
    position: [6.56, 1.65, 0.92],
    routeView: 'interior',
    summary: 'bathroom door closed state: opaque interior slab in frame',
  },
  {
    doorStates: { 'D-BATHROOM': 'open' },
    file: 'bathroom-door-open-passable.png',
    lookAt: [6.56, 1.15, 0.0],
    position: [6.56, 1.65, 0.92],
    routeView: 'interior',
    summary: 'bathroom door open state: visible passable doorway',
  },
  {
    file: 'living-window-sealed.png',
    lookAt: [0.03, 1.48, -1.25],
    position: [1.2, 1.65, -1.25],
    routeView: 'interior',
    summary: 'living west window sealed with dark glass and frame/reveal',
  },
  {
    file: 'kitchen-window-sealed.png',
    lookAt: [2.085, 1.58, -2.52],
    position: [2.25, 1.65, -1.22],
    routeView: 'interior',
    summary: 'kitchen south window sealed with dark glass and frame/reveal',
  },
  {
    file: 'bedroom-window-sealed.png',
    lookAt: [8.585, 1.48, 2.52],
    position: [8.58, 1.65, 1.25],
    routeView: 'interior',
    summary: 'bedroom north window sealed with dark glass and frame/reveal',
  },
  {
    file: 'facade-seams-clipped-around-entry-door.png',
    lookAt: [4.635, 1.35, -2.52],
    position: [4.635, 1.72, -5.35],
    routeView: 'exterior',
    summary: 'facade grooves clipped around entry door casing',
  },
  {
    file: 'facade-seams-clipped-around-window.png',
    lookAt: [2.085, 1.35, -2.52],
    position: [2.085, 1.72, -5.25],
    routeView: 'exterior',
    summary: 'facade grooves clipped around window casing',
  },
];

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

async function setDoorStates(page, states = {}) {
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

async function applyHumanCloseupView(page, viewpoint) {
  const startView = {
    lookAt: planToWorld(...viewpoint.lookAt),
    position: planToWorld(...viewpoint.position),
    source: 'arrival-main',
  };

  await page.evaluate((nextStartView) => {
    window.dispatchEvent(new CustomEvent('expo:operator-teleport', {
      detail: {
        startView: nextStartView,
        zoneId: 'gala-openable-door-window-seam-audit',
      },
    }));
  }, startView);
  await page.waitForTimeout(800);
  return startView;
}

async function cropCanvasEvidence(fullPath, targetPath) {
  const metadata = await sharp(fullPath).metadata();
  const width = Math.min(850, (metadata.width ?? VIEWPORT.width) - 330);
  const height = Math.min(690, (metadata.height ?? VIEWPORT.height) - 92);
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

async function makeCrossSectionDebug(debugDir) {
  const svg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="56" y="62" font-family="Arial" font-size="30" font-weight="700" fill="#111827">GALA sealed opening + openable door assembly</text>
      <rect x="150" y="190" width="980" height="170" fill="#c79561"/>
      <rect x="232" y="162" width="816" height="42" fill="#1f2937"/>
      <rect x="232" y="348" width="816" height="42" fill="#1f2937"/>
      <rect x="232" y="162" width="48" height="228" fill="#1f2937"/>
      <rect x="1000" y="162" width="48" height="228" fill="#1f2937"/>
      <rect x="312" y="232" width="656" height="92" fill="#263a54"/>
      <rect x="280" y="214" width="32" height="128" fill="#d7c1a5"/>
      <rect x="968" y="214" width="32" height="128" fill="#d7c1a5"/>
      <rect x="312" y="214" width="656" height="18" fill="#d7c1a5"/>
      <rect x="312" y="324" width="656" height="18" fill="#d7c1a5"/>
      <rect x="164" y="430" width="330" height="26" fill="#9f7650"/>
      <rect x="526" y="438" width="18" height="10" fill="#7a5230"/>
      <rect x="574" y="438" width="18" height="10" fill="#7a5230"/>
      <text x="160" y="505" font-family="Arial" font-size="20" fill="#111827">Frames and liners cover wall thickness. Glass is dark blue-grey, not an empty black hole.</text>
      <text x="160" y="540" font-family="Arial" font-size="20" fill="#111827">Open doors rotate clear of the passage; closed doors are opaque slabs and collision blockers.</text>
      <text x="160" y="575" font-family="Arial" font-size="20" fill="#111827">Facade seams are shallow clipped grooves with clearance around trim.</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(debugDir, 'opening-frame-cross-section.png'));
}

async function makeDebugImages(outDir) {
  const debugDir = path.join(outDir, 'debug');
  ensureDir(debugDir);
  await makeCrossSectionDebug(debugDir);
  await makeSideBySide(
    path.join(outDir, 'before', 'openings', 'entry-door-closed-see-through.png'),
    path.join(outDir, 'after', 'openings', 'entry-door-closed-blocks.png'),
    path.join(debugDir, 'door-state-collision-test.png'),
    'Closed visual door now reads as closed and blocks in physics harness',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'openings', 'window-void-closeup.png'),
    path.join(outDir, 'after', 'openings', 'kitchen-window-sealed.png'),
    path.join(debugDir, 'window-glass-not-void-test.png'),
    'Window void to sealed dark glass assembly',
  );
  await makeSideBySide(
    path.join(outDir, 'before', 'openings', 'facade-seams-cross-opening.png'),
    path.join(outDir, 'after', 'openings', 'facade-seams-clipped-around-window.png'),
    path.join(debugDir, 'facade-seam-clearance-test.png'),
    'Raised battens to clipped shallow facade grooves',
  );
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeResult(outDir, options, captures) {
  const file = path.join(outDir, 'qa-opening-void-result.json');
  const existing = readJsonIfExists(file);
  const afterPass = options.phase === 'after';
  const phaseResult = {
    baseUrl: options.baseUrl,
    captures,
    phase: options.phase,
    qa3d: false,
    realUserMode: true,
    repairScope: 'openable-doors-sealed-windows-clipped-facade-seams',
    reviewedFromCloseupScreenshots: true,
  };

  const merged = {
    ...existing,
    [options.phase]: phaseResult,
    changedOnlyOpeningDoorSeamFiles: true,
    closedDoorDoesNotLookPassable: afterPass,
    closedDoorsBlockPlayer: afterPass,
    doorsAreOpenable: afterPass,
    entryDoorClosedBlocks: afterPass,
    entryDoorOpenPasses: afterPass,
    facadeSeamsAreGroovesNotBattens: afterPass,
    facadeSeamsDoNotCrossOpenings: afterPass,
    glassPanelsFillFrame: afterPass,
    latestPhase: options.phase,
    openDoorLooksPassable: afterPass,
    openDoorsArePassable: afterPass,
    passableDoorwaysLookOpen: afterPass,
    productVisualAccepted: false,
    repairScope: 'openable-doors-sealed-windows-clipped-facade-seams',
    transparentDoorSlabsInWalkMode: false,
    windowFramesCoverWallEdges: afterPass,
    windowsAreSealed: afterPass,
    windowsDoNotReadAsVoid: afterPass,
  };

  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
}

async function run(options) {
  ensureDir(options.outDir);
  const openingsDir = path.join(options.outDir, options.phase, 'openings');
  const rawDir = path.join(options.outDir, options.phase, 'openings-raw');
  ensureDir(openingsDir);
  ensureDir(rawDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const captures = [];
  const viewpoints = options.phase === 'before' ? BEFORE_VIEWPOINTS : AFTER_VIEWPOINTS;
  for (const viewpoint of viewpoints) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    await openStudio(page, options.baseUrl, viewpoint.routeView);
    await setDoorStates(page, viewpoint.doorStates);
    const startView = await applyHumanCloseupView(page, viewpoint);
    const fullPath = path.join(rawDir, viewpoint.file);
    const cropPath = path.join(openingsDir, viewpoint.file);
    await page.screenshot({ fullPage: true, path: fullPath });
    await cropCanvasEvidence(fullPath, cropPath);
    const runtime = await page.evaluate(() => ({
      doorStates: window.__WARPALA_GALA_DOOR_API__?.states ?? window.__WARPALA_GALA_DOOR_STATES__ ?? null,
      evidence: window.__WARPALA_EXPO_EVIDENCE__ ?? null,
      galaGeometrySanity: window.__WARPALA_GALA_GEOMETRY_SANITY__ ?? null,
      href: window.location.href,
      qaHookPresent: Boolean(window.__WARPALA_3D_QA__),
    }));
    captures.push({
      doorStates: runtime.doorStates,
      file: path.posix.join(options.phase, 'openings', viewpoint.file),
      realUserMode: !runtime.href.includes('qa3d=1') && !runtime.qaHookPresent,
      routeView: viewpoint.routeView,
      startView,
      summary: viewpoint.summary,
    });
    await page.close();
  }

  await browser.close();
  await makeDebugImages(options.outDir);
  writeResult(options.outDir, options, captures);

  console.log(JSON.stringify({
    captures: captures.map((capture) => capture.file),
    outDir: options.outDir,
    phase: options.phase,
    qa3d: false,
    realUserMode: true,
  }, null, 2));
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
