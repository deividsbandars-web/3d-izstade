#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-visual-design-intent-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };

const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
};
const CLADDING_SPEC_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts';
const CLADDING_DIMENSION_SPEC_DOC = 'docs/GALA_CLADDING_DIMENSION_SPEC.md';
const WALL_SKIN_SYSTEM_SPEC_DOC = 'docs/GALA_WALL_SKIN_SYSTEM_SPEC.md';
const EXPECTED_EXTERIOR_WALL_IDS = [
  'east-exterior-wall',
  'north-exterior-wall',
  'south-exterior-wall',
  'west-exterior-wall',
];

const DEBUG_COLORS = new Set([
  '#ff00ff',
  '#00ffff',
  '#00ff00',
  '#ff0000',
  '#0000ff',
  '#0ea5e9',
  '#38bdf8',
]);

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

function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    return null;
  }

  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
}

function colorDistance(a, b) {
  const left = hexToRgb(a);
  const right = hexToRgb(b);
  if (!left || !right) {
    return 0;
  }

  return Math.hypot(left.r - right.r, left.g - right.g, left.b - right.b);
}

function maxColorDistance(colors) {
  let max = 0;
  colors.forEach((left, leftIndex) => {
    colors.slice(leftIndex + 1).forEach((right) => {
      max = Math.max(max, colorDistance(left, right));
    });
  });
  return Number(max.toFixed(2));
}

function uniqueColors(items) {
  return [...new Set(items.map((item) => item.material?.color).filter(Boolean))].sort();
}

function countByName(items, pattern) {
  return items
    .filter((item) => pattern.test(item.name || ''))
    .reduce((total, item) => total + meshInstanceCount(item), 0);
}

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? item.userData?.interiorBoardInstanceCount ?? 1);
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

function readNumericConst(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*([0-9.]+)`));
  return match ? Number(match[1]) : null;
}

function auditCladdingDimensions(exteriorInventory) {
  const claddingDimensionSpecPresent = fs.existsSync(path.resolve(process.cwd(), CLADDING_DIMENSION_SPEC_DOC));
  const wallSkinSystemSpecPresent = fs.existsSync(path.resolve(process.cwd(), WALL_SKIN_SYSTEM_SPEC_DOC));
  let boardWidthMeters = null;
  let gapWidthMeters = null;
  let maxGapMeters = 0.025;
  let minRatio = 8;

  try {
    const source = readRepoFile(CLADDING_SPEC_FILE);
    boardWidthMeters = readNumericConst(source, 'boardWidthM');
    gapWidthMeters = readNumericConst(source, 'gapWidthM');
    maxGapMeters = readNumericConst(source, 'gapMaxM') ?? maxGapMeters;
    minRatio = readNumericConst(source, 'boardToGapMinRatio') ?? minRatio;
  } catch {
    // Missing spec is reported through claddingDimensionSpecPresent and failed checks.
  }

  const boardToGapRatio = boardWidthMeters && gapWidthMeters
    ? Number((boardWidthMeters / gapWidthMeters).toFixed(2))
    : null;
  const extraDecorativeStrips = exteriorInventory.filter((item) => /raised-board-edge-shadow|subtle-raised-board-edge-shadow|opening-clipped-recessed-vertical-cladding-shadow-channel|construction-shadow-channel-vertical-board-gap/.test(item.name || ''));
  const facadeBoards = exteriorInventory.filter((item) => /individual-vertical-timber-board-panel/.test(item.name || ''));
  const wallBoardCounts = EXPECTED_EXTERIOR_WALL_IDS.reduce((acc, wallId) => {
    acc[wallId] = facadeBoards
      .filter((item) => item.userData?.wallId === wallId)
      .reduce((total, item) => total + meshInstanceCount(item), 0);
    return acc;
  }, {});
  const missingCladWallIds = EXPECTED_EXTERIOR_WALL_IDS.filter((wallId) => (wallBoardCounts[wallId] ?? 0) < 8);
  const exteriorAllVisibleWallsClad = missingCladWallIds.length === 0;
  const largePlainExteriorWallPresent = !exteriorAllVisibleWallsClad;
  const facadeBoardGapAcceptable = gapWidthMeters !== null
    && gapWidthMeters >= 0.01
    && gapWidthMeters <= maxGapMeters;
  const facadeBoardToGapRatioAcceptable = boardToGapRatio !== null && boardToGapRatio >= minRatio;
  const facadeDarkStripeDominancePresent = !facadeBoardGapAcceptable
    || !facadeBoardToGapRatioAcceptable
    || extraDecorativeStrips.length > 0
    || largePlainExteriorWallPresent;

  return {
    boardToGapRatio,
    boardWidthMeters,
    claddingDimensionSpecPresent,
    exteriorAllVisibleWallsClad,
    extraDecorativeStripCount: extraDecorativeStrips.length,
    facadeBoardGapAcceptable,
    facadeBoardToGapRatioAcceptable,
    facadeDarkStripeDominancePresent,
    gapWidthMeters,
    largePlainExteriorWallPresent,
    maxGapMeters,
    missingCladWallIds,
    wallBoardCounts,
    wallSkinSystemSpecPresent,
  };
}

function isGalaProductMesh(item) {
  return /gala|construction|modular-home|bathroom|bedroom|kitchen|living|sofa|wardrobe|wc|vanity|fixture/i.test(item.name || '');
}

function materialNamesByColor(items) {
  return items.reduce((acc, item) => {
    const color = item.material?.color;
    if (!color) {
      return acc;
    }
    acc[color] ??= [];
    if (acc[color].length < 8) {
      acc[color].push(item.name);
    }
    return acc;
  }, {});
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|vertical-timber|bathroom|bedroom|kitchen|sofa/i.test(item.name || '')).length > 80;
  }, null, { timeout: 60000 });
}

async function captureRoute(page, baseUrl, route, screenshotPath) {
  const response = await page.goto(`${baseUrl}${route}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: false, path: screenshotPath });
  return response?.status() ?? null;
}

async function frameShot(page, shotName, screenshotPath) {
  await page.evaluate((nextShotName) => window.__WARPALA_3D_QA__?.frameModularHomeShot?.(nextShotName), shotName);
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: false, path: screenshotPath });
}

async function cropDetail(source, target, crop) {
  await sharp(source).extract(crop).toFile(target);
}

async function collectInventory(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
}

function auditDesignIntent(exteriorInventory, interiorInventory) {
  const facadeBoards = exteriorInventory.filter((item) => /individual-vertical-timber-board-panel|gable-individual-vertical-timber-board-panel/.test(item.name || ''));
  const facadeBoardInstanceCount = facadeBoards.reduce((total, item) => total + meshInstanceCount(item), 0);
  const facadeRelief = exteriorInventory.filter((item) => /raised-board-edge-shadow|opening-clipped-thin-shadow-reveal|continuous-top-eaves-trim|corner-board/.test(item.name || ''));
  const horizontalFacadeMarks = exteriorInventory.filter((item) => /scarf-joint|short-horizontal-board/i.test(item.name || ''));
  const facadeColors = uniqueColors(facadeBoards);
  const facadeReliefColors = uniqueColors(facadeRelief);
  const facadeMaxDistance = maxColorDistance(facadeColors);
  const reliefMaxDistance = maxColorDistance([...facadeColors, ...facadeReliefColors]);
  const claddingDimensionAudit = auditCladdingDimensions(exteriorInventory);
  const debugItems = [...exteriorInventory, ...interiorInventory]
    .filter(isGalaProductMesh)
    .filter((item) => DEBUG_COLORS.has(String(item.material?.color || '').toLowerCase()));
  const windowGlass = exteriorInventory.filter((item) => /transparent-window-glass-panel/.test(item.name || ''));
  const windowGlassTransparent = windowGlass.length >= 5
    && windowGlass.every((item) => item.userData?.windowGlassTransparent === true
      && item.material?.transparent === true
      && Number(item.material?.opacity ?? 1) < 0.75);
  const apertureWallBoards = facadeBoards.filter((item) => String(item.userData?.wallId || '').includes('exterior-wall'));
  const openingApertureMasksAppliedToWallSkin = apertureWallBoards.length > 0
    && apertureWallBoards.every((item) => item.userData?.openingApertureMasksAppliedToWallSkin === true)
    && exteriorInventory.some((item) => /opening-clipped-thin-shadow-reveal-strip/.test(item.name || ''));
  const blockedOpeningsPresent = !windowGlassTransparent || !openingApertureMasksAppliedToWallSkin;
  const blueVoidOrGroundInsideInterior = interiorInventory.some((item) => /world-ground-detail:|world-ground:(city-stadium|sponsor|arrival|center-spine)/.test(item.name || ''));
  const materialHasPbrMaps = (item) => Boolean(
    item.material?.hasMap
    && item.material?.hasNormalMap
    && item.material?.hasRoughnessMap
    && item.material?.hasMetalnessMap,
  );
  const allInventory = [...exteriorInventory, ...interiorInventory];
  const doorLeaves = allInventory.filter((item) => /open-door-leaf|closed-opaque-door-slab/.test(item.name || ''));
  const pbrOpeningTrim = allInventory.filter((item) => item.userData?.openingTrimUsesPbrTextureMaps === true);
  const doorLeavesUsePbrTextures = doorLeaves.length >= 2
    && doorLeaves.every((item) => item.userData?.doorLeafUsesPbrTextureMaps === true && materialHasPbrMaps(item));
  const openingTrimUsesPbrTextures = pbrOpeningTrim.length >= 6
    && pbrOpeningTrim.every(materialHasPbrMaps);

  const randomRainbowCladdingPresent = facadeColors.length > 2 || facadeMaxDistance > 34;
  const zebraStripingPresent = facadeColors.length > 1 && facadeMaxDistance > 26;
  const facadeTimberPaletteControlled = facadeBoardInstanceCount >= 24
    && facadeColors.length <= 2
    && facadeMaxDistance <= 34
    && reliefMaxDistance <= 155;
  const exteriorMatchesTimberBoardIntent = facadeTimberPaletteControlled
    && !randomRainbowCladdingPresent
    && !zebraStripingPresent
    && claddingDimensionAudit.facadeBoardGapAcceptable
    && claddingDimensionAudit.facadeBoardToGapRatioAcceptable
    && !claddingDimensionAudit.facadeDarkStripeDominancePresent
    && claddingDimensionAudit.claddingDimensionSpecPresent
    && claddingDimensionAudit.wallSkinSystemSpecPresent
    && claddingDimensionAudit.exteriorAllVisibleWallsClad
    && !claddingDimensionAudit.largePlainExteriorWallPresent
    && horizontalFacadeMarks.length === 0
    && !blockedOpeningsPresent
    && facadeRelief.length >= 8
    && countByName(exteriorInventory, /continuous-base-trim|continuous-top-eaves-trim|two-sided-(vertical-)?casing/) >= 4;

  const wallFaceCount = countByName(interiorInventory, /finished-partition-face|flat-finished-interior-wall-face/);
  const cleanInteriorWallFaces = interiorInventory.filter((item) => /finished-partition-face|flat-finished-interior-wall-face/.test(item.name || ''));
  const cleanInteriorWallMaterial = cleanInteriorWallFaces.length > 0
    && cleanInteriorWallFaces.every((item) => item.userData?.cleanInteriorWallMaterialNotExteriorCladding === true && materialHasPbrMaps(item));
  const interiorBoards = interiorInventory.filter((item) => /interior-vertical-timber-board-panel/.test(item.name || ''));
  const interiorBoardInstanceCount = interiorBoards.reduce((total, item) => total + meshInstanceCount(item), 0);
  const interiorBoardWidths = [...new Set(interiorBoards
    .map((item) => item.userData?.interiorBoardWidthM)
    .filter((value) => typeof value === 'number')
    .map((value) => Number(value.toFixed(4))))];
  const interiorBoardGaps = [...new Set(interiorBoards
    .map((item) => item.userData?.interiorBoardGapM)
    .filter((value) => typeof value === 'number')
    .map((value) => Number(value.toFixed(4))))];
  const interiorBoardColors = uniqueColors(interiorBoards);
  const interiorUsesSameWoodTone = interiorBoardColors.length > 0
    && interiorBoardColors.length === facadeColors.length
    && interiorBoardColors.every((color, index) => color === facadeColors[index])
    && interiorBoards.every((item) => item.userData?.interiorUsesSameWoodTone === true);
  const unwantedInteriorHorizontalBandsPresent = interiorInventory.some((item) => /horizontal-wall-band|interior-rail|wall-band/i.test(item.name || ''))
    || interiorInventory
      .filter((item) => /baseboard-trim|crown-trim/.test(item.name || ''))
      .some((item) => item.userData?.documentedStructuralTrim !== true);
  const interiorPhysicalBoardReliefIntentionallyRemoved = interiorBoardInstanceCount === 0;
  const interiorUsesSameWallSkinSystem = wallFaceCount >= 8
    && cleanInteriorWallMaterial
    && interiorPhysicalBoardReliefIntentionallyRemoved;
  const interiorBoardModuleMatchesExterior = interiorPhysicalBoardReliefIntentionallyRemoved;
  const interiorMaterialPaletteCoherentWithExterior = interiorUsesSameWallSkinSystem
    && !unwantedInteriorHorizontalBandsPresent;
  const floorSeamCount = countByName(interiorInventory, /finished-floor-plank-recessed-seam|finished-floor-short-board-butt-joint/);
  const ceilingSeamCount = countByName(interiorInventory, /ceiling-panel-longitudinal-seam|ceiling-panel-cross-seam/);
  const trimCount = countByName(interiorInventory, /baseboard-trim|crown-trim/);
  const floorFinishSurfaces = interiorInventory.filter((item) => /finished-floor-local-plank-surface/.test(item.name || ''));
  const floorFinishUsesLocalPbr = floorFinishSurfaces.length === 1
    && floorFinishSurfaces.every((item) => item.userData?.floorFinishUsesLocalUvPbr === true && materialHasPbrMaps(item));
  const interiorFinishIntentAcceptable = wallFaceCount >= 8
    && interiorUsesSameWallSkinSystem
    && interiorMaterialPaletteCoherentWithExterior
    && floorFinishUsesLocalPbr
    && !blueVoidOrGroundInsideInterior;

  const furnitureFixtureCounts = {
    bathroomFixture: countByName(interiorInventory, /bathroom-(shower|vanity|sink|wc|mirror|faucet)/),
    bed: countByName(interiorInventory, /bedroom-(bed|mattress|blanket|pillow|headboard)/),
    kitchen: countByName(interiorInventory, /kitchen-(base-cabinets|countertop|sink|cooktop|upper-cabinet|readable-cabinet)/),
    living: countByName(interiorInventory, /living-(sofa|coffee-table|rug)/),
  };
  const unresolvedPlaceholderCount = countByName(interiorInventory, /placeholder|random-white|debug/i);
  const furnitureFixtureIntentAcceptable = furnitureFixtureCounts.living >= 2
    && furnitureFixtureCounts.kitchen >= 6
    && furnitureFixtureCounts.bed >= 5
    && furnitureFixtureCounts.bathroomFixture >= 9
    && unresolvedPlaceholderCount === 0;

  const pass = facadeTimberPaletteControlled
    && !randomRainbowCladdingPresent
    && !zebraStripingPresent
    && debugItems.length === 0
    && horizontalFacadeMarks.length === 0
    && !blockedOpeningsPresent
    && windowGlassTransparent
    && doorLeavesUsePbrTextures
    && openingTrimUsesPbrTextures
    && !blueVoidOrGroundInsideInterior
    && exteriorMatchesTimberBoardIntent
    && claddingDimensionAudit.facadeBoardGapAcceptable
    && claddingDimensionAudit.facadeBoardToGapRatioAcceptable
    && !claddingDimensionAudit.facadeDarkStripeDominancePresent
    && claddingDimensionAudit.claddingDimensionSpecPresent
    && claddingDimensionAudit.wallSkinSystemSpecPresent
    && claddingDimensionAudit.exteriorAllVisibleWallsClad
    && !claddingDimensionAudit.largePlainExteriorWallPresent
    && interiorFinishIntentAcceptable
    && furnitureFixtureIntentAcceptable;

  return {
    visualDesignIntentAuditRan: true,
    facadeTimberPaletteControlled,
    randomRainbowCladdingPresent,
    zebraStripingPresent,
    debugMaterialsVisible: debugItems.length > 0,
    horizontalFacadeMarksRemoved: horizontalFacadeMarks.length === 0,
    blockedOpeningsPresent,
    windowGlassTransparent,
    exteriorMatchesTimberBoardIntent,
    facadeBoardGapAcceptable: claddingDimensionAudit.facadeBoardGapAcceptable,
    facadeBoardToGapRatioAcceptable: claddingDimensionAudit.facadeBoardToGapRatioAcceptable,
    facadeDarkStripeDominancePresent: claddingDimensionAudit.facadeDarkStripeDominancePresent,
    claddingDimensionSpecPresent: claddingDimensionAudit.claddingDimensionSpecPresent,
    interiorUsesSameWallSkinSystem,
    interiorBoardModuleMatchesExterior,
    interiorMaterialPaletteCoherentWithExterior,
    interiorUsesSameWoodTone,
    interiorPhysicalBoardReliefIntentionallyRemoved,
    cleanInteriorWallMaterial,
    floorFinishUsesLocalPbr,
    doorLeavesUsePbrTextures,
    openingTrimUsesPbrTextures,
    unwantedInteriorHorizontalBandsPresent,
    blueVoidOrGroundInsideInterior,
    wallSkinSystemSpecPresent: claddingDimensionAudit.wallSkinSystemSpecPresent,
    exteriorAllVisibleWallsClad: claddingDimensionAudit.exteriorAllVisibleWallsClad,
    largePlainExteriorWallPresent: claddingDimensionAudit.largePlainExteriorWallPresent,
    interiorFinishIntentAcceptable,
    furnitureFixtureIntentAcceptable,
    screenshotReadabilityIsNotDesignAcceptance: true,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      debugItems: debugItems.slice(0, 12).map((item) => ({ color: item.material?.color, name: item.name })),
      exterior: {
        facadeBoardCount: facadeBoardInstanceCount,
        facadeColors,
        facadeMaxDistance,
        facadeReliefColorSamples: materialNamesByColor(facadeRelief),
        facadeReliefCount: facadeRelief.length,
        horizontalFacadeMarkCount: horizontalFacadeMarks.reduce((total, item) => total + meshInstanceCount(item), 0),
        reliefMaxDistance,
        windowGlassCount: windowGlass.length,
        claddingDimensionAudit,
      },
      interior: {
        cleanInteriorWallFaceCount: cleanInteriorWallFaces.length,
        ceilingSeamCount,
        doorLeafCount: doorLeaves.length,
        floorFinishSurfaceCount: floorFinishSurfaces.length,
        floorSeamCount,
        furnitureFixtureCounts,
        interiorBoardColors,
        interiorBoardGaps,
        interiorBoardInstanceCount,
        interiorBoardWidths,
        interiorUsesSameWoodTone,
        pbrOpeningTrimCount: pbrOpeningTrim.length,
        unwantedInteriorHorizontalBandsPresent,
        trimCount,
        unresolvedPlaceholderCount,
        wallFaceCount,
      },
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
  const exteriorScreenshot = path.join(options.outDir, 'exterior-after-design-intent.png');
  const interiorScreenshot = path.join(options.outDir, 'interior-after-design-intent.png');
  const exteriorStatus = await captureRoute(page, options.baseUrl, ROUTES.exterior, exteriorScreenshot);
  const exteriorInventory = await collectInventory(page);

  await cropDetail(
    exteriorScreenshot,
    path.join(options.outDir, 'exterior-detail-after-design-intent.png'),
    { height: 430, left: 40, top: 245, width: 1060 },
  );

  const interiorStatus = await captureRoute(page, options.baseUrl, ROUTES.interior, interiorScreenshot);
  const interiorInventory = await collectInventory(page);

  await cropDetail(
    interiorScreenshot,
    path.join(options.outDir, 'interior-detail-after-design-intent.png'),
    { height: 560, left: 80, top: 165, width: 850 },
  );

  await frameShot(page, 'interiorSleepingBathroom', path.join(options.outDir, 'furniture-fixture-after-design-intent.png'));

  const result = {
    generatedAt: new Date().toISOString(),
    routes: {
      exterior: {
        path: ROUTES.exterior,
        screenshot: 'exterior-after-design-intent.png',
        status: exteriorStatus,
      },
      interior: {
        path: ROUTES.interior,
        screenshot: 'interior-after-design-intent.png',
        status: interiorStatus,
      },
    },
    ...auditDesignIntent(exteriorInventory, interiorInventory),
  };

  writeJson(path.join(options.outDir, 'qa-gala-visual-design-intent-result.json'), result);
  await browser.close();

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
