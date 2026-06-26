import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'https://staging.30sek24.com';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-walkable-failure-forensic-audit';
const VIEWPORT = { height: 900, width: 1440 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const GALA_PREVIEW_POSITION = { x: -0.38, y: 0, z: 8.93 };
const GALA_PREVIEW_SCALE = 5.4;
const ROTATION_Y = -0.12;
const HOUSE_LENGTH = 10.2;
const HOUSE_WIDTH = 5.0;
const WALL_THICKNESS = 0.14;
const PLAYER_RADIUS_M = 0.28;

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

function distance3(a, b) {
  if (!a || !b) {
    return null;
  }

  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

function planXToLocalX(planX) {
  return planX - (HOUSE_LENGTH * 0.5);
}

function rectToLocalRect(rect) {
  return {
    xMin: planXToLocalX(rect.xMin),
    xMax: planXToLocalX(rect.xMax),
    zMin: rect.zMin,
    zMax: rect.zMax,
  };
}

function rotateWorldPoint(unrotatedX, unrotatedZ) {
  const cos = Math.cos(ROTATION_Y);
  const sin = Math.sin(ROTATION_Y);
  return {
    x: (unrotatedX * cos) + (unrotatedZ * sin),
    z: (-unrotatedX * sin) + (unrotatedZ * cos),
  };
}

function planRectToWorldBounds(rect) {
  const localRect = rectToLocalRect(rect);
  const corners = [
    rotateWorldPoint(GALA_PREVIEW_POSITION.x + (localRect.xMin * GALA_PREVIEW_SCALE), GALA_PREVIEW_POSITION.z + (localRect.zMin * GALA_PREVIEW_SCALE)),
    rotateWorldPoint(GALA_PREVIEW_POSITION.x + (localRect.xMin * GALA_PREVIEW_SCALE), GALA_PREVIEW_POSITION.z + (localRect.zMax * GALA_PREVIEW_SCALE)),
    rotateWorldPoint(GALA_PREVIEW_POSITION.x + (localRect.xMax * GALA_PREVIEW_SCALE), GALA_PREVIEW_POSITION.z + (localRect.zMin * GALA_PREVIEW_SCALE)),
    rotateWorldPoint(GALA_PREVIEW_POSITION.x + (localRect.xMax * GALA_PREVIEW_SCALE), GALA_PREVIEW_POSITION.z + (localRect.zMax * GALA_PREVIEW_SCALE)),
  ];
  return {
    corners,
    maxX: Math.max(...corners.map((corner) => corner.x)),
    maxZ: Math.max(...corners.map((corner) => corner.z)),
    minX: Math.min(...corners.map((corner) => corner.x)),
    minZ: Math.min(...corners.map((corner) => corner.z)),
  };
}

function buildCollisionSegments() {
  const entryDoor = { xMin: 4.185, xMax: 5.085, zMin: -HOUSE_WIDTH * 0.5, zMax: (-HOUSE_WIDTH * 0.5) + 0.34 };
  const terraceDoor = { xMin: 3.585, xMax: 5.185, zMin: (HOUSE_WIDTH * 0.5) - 0.34, zMax: HOUSE_WIDTH * 0.5 };
  const rects = [
    { id: 'south-exterior-wall-left-of-entry', xMin: 0, xMax: entryDoor.xMin, zMin: -HOUSE_WIDTH * 0.5, zMax: (-HOUSE_WIDTH * 0.5) + WALL_THICKNESS },
    { id: 'south-exterior-wall-right-of-entry', xMin: entryDoor.xMax, xMax: HOUSE_LENGTH, zMin: -HOUSE_WIDTH * 0.5, zMax: (-HOUSE_WIDTH * 0.5) + WALL_THICKNESS },
    { id: 'north-exterior-wall-left-of-terrace-door', xMin: 0, xMax: terraceDoor.xMin, zMin: (HOUSE_WIDTH * 0.5) - WALL_THICKNESS, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'north-exterior-wall-right-of-terrace-door', xMin: terraceDoor.xMax, xMax: HOUSE_LENGTH, zMin: (HOUSE_WIDTH * 0.5) - WALL_THICKNESS, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'west-exterior-wall', xMin: 0, xMax: WALL_THICKNESS, zMin: -HOUSE_WIDTH * 0.5, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'east-exterior-wall', xMin: HOUSE_LENGTH - WALL_THICKNESS, xMax: HOUSE_LENGTH, zMin: -HOUSE_WIDTH * 0.5, zMax: HOUSE_WIDTH * 0.5 },
    { id: 'bathroom-west-partition', xMin: 5.15 - (WALL_THICKNESS * 0.5), xMax: 5.15 + (WALL_THICKNESS * 0.5), zMin: -HOUSE_WIDTH * 0.5, zMax: 0 },
    { id: 'bathroom-north-wall-left-of-door', xMin: 5.15, xMax: 6.1, zMin: -WALL_THICKNESS * 0.5, zMax: WALL_THICKNESS * 0.5 },
    { id: 'bathroom-north-wall-right-of-door', xMin: 6.92, xMax: 7.2, zMin: -WALL_THICKNESS * 0.5, zMax: WALL_THICKNESS * 0.5 },
    { id: 'bedroom-partition-south-of-door', xMin: 7.2 - (WALL_THICKNESS * 0.5), xMax: 7.2 + (WALL_THICKNESS * 0.5), zMin: -HOUSE_WIDTH * 0.5, zMax: 0.72 },
    { id: 'bedroom-partition-north-of-door', xMin: 7.2 - (WALL_THICKNESS * 0.5), xMax: 7.2 + (WALL_THICKNESS * 0.5), zMin: 1.62, zMax: HOUSE_WIDTH * 0.5 },
  ];

  return rects.map((rect) => ({
    ...rect,
    worldBounds: planRectToWorldBounds(rect),
  }));
}

function pointInsideBounds(point, bounds, radiusWorld = 0) {
  return (
    point[0] >= bounds.minX - radiusWorld
    && point[0] <= bounds.maxX + radiusWorld
    && point[2] >= bounds.minZ - radiusWorld
    && point[2] <= bounds.maxZ + radiusWorld
  );
}

function unionBounds(boundsList) {
  return boundsList.reduce((acc, bounds) => ({
    maxX: Math.max(acc.maxX, bounds.maxX),
    maxZ: Math.max(acc.maxZ, bounds.maxZ),
    minX: Math.min(acc.minX, bounds.minX),
    minZ: Math.min(acc.minZ, bounds.minZ),
  }), {
    maxX: Number.NEGATIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
    minX: Number.POSITIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
  });
}

async function getRuntimeState(page) {
  return await page.evaluate(() => ({
    bodyText: document.body.innerText.slice(0, 2200),
    evidence: window.__WARPALA_EXPO_EVIDENCE__ ?? null,
    galaGeometrySanity: window.__WARPALA_GALA_GEOMETRY_SANITY__ ?? null,
    href: window.location.href,
    qaHookPresent: Boolean(window.__WARPALA_3D_QA__),
    qaStateGeometrySanity: window.__WARPALA_3D_QA__?.getState?.().geometrySanity ?? null,
  }));
}

async function openRealUserInterior(page, baseUrl) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=interior&homeStudio=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(6000);
}

async function openQaInterior(page, baseUrl) {
  await page.goto(`${baseUrl}/modular-homes/studio?view=interior&homeStudio=1&qa3d=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(6000);
}

async function movementProbe(browser, baseUrl, manualDir, key, durationMs) {
  const page = await browser.newPage({ viewport: VIEWPORT });
  await openRealUserInterior(page, baseUrl);
  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  const initialScreenshot = path.join(manualDir, `real-user-${key.toLowerCase()}-before.png`);
  await page.screenshot({ fullPage: true, path: initialScreenshot });
  const startState = await getRuntimeState(page);
  const startPosition = startState.evidence?.playerPosition ?? null;
  const samples = [{ position: startPosition, tMs: 0 }];
  const sampleTimes = [250, 500, 1000, 2000, 4000, durationMs].filter((value, index, array) => (
    value <= durationMs && array.indexOf(value) === index
  ));

  await page.keyboard.down(key);
  let previous = 0;
  for (const tMs of sampleTimes) {
    await page.waitForTimeout(tMs - previous);
    previous = tMs;
    const state = await getRuntimeState(page);
    samples.push({ position: state.evidence?.playerPosition ?? null, tMs });
  }
  await page.keyboard.up(key);
  await page.waitForTimeout(300);
  const afterState = await getRuntimeState(page);
  const afterPosition = afterState.evidence?.playerPosition ?? null;
  const afterScreenshot = path.join(manualDir, `real-user-${key.toLowerCase()}-after-${durationMs}ms.png`);
  await page.screenshot({ fullPage: true, path: afterScreenshot });
  await page.close();

  return {
    afterPosition,
    afterScreenshot: path.relative(path.dirname(manualDir), afterScreenshot).replaceAll('\\', '/'),
    beforeScreenshot: path.relative(path.dirname(manualDir), initialScreenshot).replaceAll('\\', '/'),
    distanceMetersApprox: distance3(startPosition, afterPosition) === null ? null : distance3(startPosition, afterPosition) / GALA_PREVIEW_SCALE,
    distanceWorldUnits: distance3(startPosition, afterPosition),
    durationMs,
    key,
    samples: samples.map((sample) => ({
      ...sample,
      distanceMetersApprox: distance3(startPosition, sample.position) === null ? null : distance3(startPosition, sample.position) / GALA_PREVIEW_SCALE,
      distanceWorldUnits: distance3(startPosition, sample.position),
    })),
    startPosition,
  };
}

async function renderDebugSummary(debugDir, audit) {
  const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
  const rows = audit.movementTests.map((test, index) => `
    <tr>
      <td>${escape(test.key)}</td>
      <td>${test.durationMs}</td>
      <td>${test.distanceWorldUnits?.toFixed(2) ?? 'n/a'}</td>
      <td>${test.distanceMetersApprox?.toFixed(2) ?? 'n/a'}</td>
      <td>${audit.collisionAnalysis[index]?.finalInsideAnyCollisionSegment ? 'inside collision AABB' : 'not blocked by AABB'}</td>
    </tr>
  `).join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
      <rect width="1400" height="900" fill="#f6f1e8"/>
      <text x="60" y="70" font-family="Arial" font-size="34" font-weight="700" fill="#1f2937">GALA walkable failure forensic audit</text>
      <text x="60" y="115" font-family="Arial" font-size="22" fill="#374151">QA mode and real-user mode do not test the same walk-physics path.</text>
      <rect x="60" y="150" width="1280" height="250" fill="#fffdf7" stroke="#334155" stroke-width="2" rx="10"/>
      <text x="90" y="200" font-family="Arial" font-size="24" font-weight="700" fill="#1f2937">Mode comparison</text>
      <text x="90" y="245" font-family="Arial" font-size="20" fill="#111827">Real route qaHookPresent: ${audit.realUserInitial.qaHookPresent}</text>
      <text x="90" y="285" font-family="Arial" font-size="20" fill="#111827">Real player Y: ${audit.realUserInitial.evidence?.playerPosition?.[1] ?? 'n/a'}</text>
      <text x="90" y="325" font-family="Arial" font-size="20" fill="#111827">QA hook present: ${audit.qaModeInitial.qaHookPresent}</text>
      <text x="90" y="365" font-family="Arial" font-size="20" fill="#111827">QA mode player Y: ${audit.qaModeInitial.evidence?.playerPosition?.[1] ?? 'n/a'}</text>
      <text x="590" y="245" font-family="Arial" font-size="20" fill="#991b1b">Harness adds qa3d=1, while GALA physics requires !isExpo3dQaEnabled().</text>
      <rect x="60" y="440" width="1280" height="360" fill="#fffdf7" stroke="#334155" stroke-width="2" rx="10"/>
      <text x="90" y="490" font-family="Arial" font-size="24" font-weight="700" fill="#1f2937">Movement probes</text>
      <foreignObject x="90" y="520" width="1220" height="250">
        <table xmlns="http://www.w3.org/1999/xhtml" style="width:100%;border-collapse:collapse;font-family:Arial;font-size:18px;color:#111827;">
          <thead><tr><th align="left">key</th><th align="left">ms</th><th align="left">world distance</th><th align="left">approx meters</th><th align="left">collision observation</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </foreignObject>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(debugDir, 'qa-mode-vs-real-user-summary.png'));
}

async function cropDebugImages(outDir) {
  const initial = path.join(outDir, 'manual-repro', 'real-user-initial.png');
  const debugDir = path.join(outDir, 'debug');
  if (!fs.existsSync(initial)) {
    return [];
  }

  const crops = [
    { file: 'entry-door-gap-closeup.png', left: 470, top: 240, width: 360, height: 430 },
    { file: 'window-gap-closeup.png', left: 1030, top: 250, width: 290, height: 360 },
    { file: 'bathroom-door-gap-closeup.png', left: 610, top: 260, width: 360, height: 430 },
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manualDir = path.join(options.outDir, 'manual-repro');
  const debugDir = path.join(options.outDir, 'debug');
  ensureDir(manualDir);
  ensureDir(debugDir);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const realPage = await browser.newPage({ viewport: VIEWPORT });
  await openRealUserInterior(realPage, options.baseUrl);
  await realPage.screenshot({ fullPage: true, path: path.join(manualDir, 'real-user-initial.png') });
  const realUserInitial = await getRuntimeState(realPage);
  await realPage.close();

  const qaPage = await browser.newPage({ viewport: VIEWPORT });
  await openQaInterior(qaPage, options.baseUrl);
  await qaPage.screenshot({ fullPage: true, path: path.join(manualDir, 'qa-mode-initial.png') });
  const qaModeInitial = await getRuntimeState(qaPage);
  await qaPage.close();

  const movementTests = [];
  for (const [key, durationMs] of [['KeyW', 6000], ['KeyA', 8000], ['KeyD', 8000], ['KeyS', 6000]]) {
    movementTests.push(await movementProbe(browser, options.baseUrl, manualDir, key, durationMs));
  }

  await browser.close();

  const collisionSegments = buildCollisionSegments();
  const radiusWorld = PLAYER_RADIUS_M * GALA_PREVIEW_SCALE;
  const houseEnvelopeWorldBounds = unionBounds(collisionSegments.map((segment) => segment.worldBounds));
  const collisionAnalysis = movementTests.map((test) => ({
    finalInsideAnyCollisionSegment: test.afterPosition
      ? collisionSegments.some((segment) => pointInsideBounds(test.afterPosition, segment.worldBounds, radiusWorld))
      : null,
    finalOutsideHouseEnvelope: test.afterPosition
      ? !pointInsideBounds(test.afterPosition, houseEnvelopeWorldBounds, radiusWorld)
      : null,
    key: test.key,
    nearestSegmentsByAabb: test.afterPosition
      ? collisionSegments.map((segment) => ({
        id: segment.id,
        insideExpandedAabb: pointInsideBounds(test.afterPosition, segment.worldBounds, radiusWorld),
        worldBounds: segment.worldBounds,
      })).filter((segment) => segment.insideExpandedAabb)
      : [],
  }));
  const wallCollisionTests = movementTests.map((test, index) => ({
    collisionWorked: !(collisionAnalysis[index].finalInsideAnyCollisionSegment || collisionAnalysis[index].finalOutsideHouseEnvelope),
    crossedOrEndedInInvalidWallZone: Boolean(collisionAnalysis[index].finalInsideAnyCollisionSegment || collisionAnalysis[index].finalOutsideHouseEnvelope),
    distanceMetersApprox: test.distanceMetersApprox,
    distanceWorldUnits: test.distanceWorldUnits,
    durationMs: test.durationMs,
    finalInsideAnyCollisionSegment: collisionAnalysis[index].finalInsideAnyCollisionSegment,
    finalOutsideHouseEnvelope: collisionAnalysis[index].finalOutsideHouseEnvelope,
    key: test.key,
    target: `${test.key} long-hold movement from staging default interior start`,
  }));

  const sourceDerivedFindings = {
    floorAndFurniture: [
      {
        actual: 'The finished floor is a single box, but several furniture and finish boxes have bottoms above floor top Y=0.',
        source: 'GalaInterior.tsx DetailBox positions; e.g. living rug centerY=0.075 sizeY=0.035, sofa centerY=0.48 sizeY=0.52, bed centerY=0.34 sizeY=0.36.',
        verdict: 'single floor claim is incomplete; floor relationship was not visually tested',
      },
      {
        actual: 'Interior mode intentionally makes shell/walls/opening cells transparent.',
        source: 'GalaHouseShell.tsx shellOpacity=0.3; GalaOpenings.tsx shellOpacity=0.28 and seam opacity=0.35.',
        verdict: 'noCoplanarTransparentFloorOverlay does not mean no transparent overlapping geometry in the walk view',
      },
    ],
    qaModeMismatch: {
      harnessAddsQa3d: true,
      playerLayerRequiresNonQaForGalaPhysics: true,
      source: 'qa-3d-runtime-playwright.mjs withQaParam() sets qa3d=1; ExpoWorldPlayerLayer uses homeStudioEnabled && !isExpo3dQaEnabled().',
      verdict: 'QA 8-shot evidence did not exercise the real-user GALA walk physics path',
    },
    selfReportedFlags: {
      source: 'GalaFloorplan.ts GALA_GEOMETRY_SANITY and Expo3DQAHook getGalaGeometrySanity()',
      verdict: 'Most geometrySanity values are self-reported constants or runtime assertions, not empirical tests.',
    },
  };

  const audit = {
    auditedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    collisionAnalysis,
    collisionSegments,
    evidenceFiles: {
      debug: [
        'debug/qa-mode-vs-real-user-summary.png',
        'debug/entry-door-gap-closeup.png',
        'debug/window-gap-closeup.png',
        'debug/bathroom-door-gap-closeup.png',
      ],
      manualRepro: [
        'manual-repro/real-user-initial.png',
        'manual-repro/qa-mode-initial.png',
        ...movementTests.flatMap((test) => [test.beforeScreenshot, test.afterScreenshot]),
      ],
    },
    houseEnvelopeWorldBounds,
    movementTests,
    qaModeInitial,
    realUserInitial,
    sourceDerivedFindings,
    stagingState: {
      exteriorUrl: `${options.baseUrl}/modular-homes/studio?view=exterior&homeStudio=1`,
      handoffEvidence: '20260623-111046-gala-walkable-geometry-physics-staging',
      interiorUrl: `${options.baseUrl}/modular-homes/studio?view=interior&homeStudio=1`,
    },
    wallCollisionTests,
  };

  await renderDebugSummary(debugDir, audit);
  await cropDebugImages(options.outDir);

  fs.writeFileSync(path.join(options.outDir, 'qa-audit-result.json'), `${JSON.stringify(audit, null, 2)}\n`);
  console.log(JSON.stringify({
    outDir: options.outDir,
    qaModePlayerY: qaModeInitial.evidence?.playerPosition?.[1] ?? null,
    realModePlayerY: realUserInitial.evidence?.playerPosition?.[1] ?? null,
    movementTests: movementTests.map((test) => ({
      distanceMetersApprox: test.distanceMetersApprox,
      distanceWorldUnits: test.distanceWorldUnits,
      durationMs: test.durationMs,
      key: test.key,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
