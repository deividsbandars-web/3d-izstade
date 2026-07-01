#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { navigateForGalaAudit } from './qa-gala-browser-navigation.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-wall-skin-architecture-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
};
const FILES = {
  cladding: 'src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx',
  constructionModel: 'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts',
  constructionRenderer: 'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx',
  floorCeiling: 'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx',
  opening: 'src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx',
  wall: 'src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx',
  wallSkinModel: 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts',
  wallSkinSpec: 'docs/GALA_WALL_SKIN_SYSTEM_SPEC.md',
};
const EXPECTED_EXTERIOR_WALL_IDS = [
  'east-exterior-wall',
  'north-exterior-wall',
  'south-exterior-wall',
  'west-exterior-wall',
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

function readNumericConst(source, key) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*([0-9.]+)`));
  return match ? Number(match[1]) : null;
}

function collectSourceAudit() {
  const sources = Object.fromEntries(Object.entries(FILES).map(([key, file]) => [
    key,
    fs.existsSync(path.resolve(process.cwd(), file)) ? readRepoFile(file) : '',
  ]));
  const activeSources = [
    sources.cladding,
    sources.constructionModel,
    sources.constructionRenderer,
    sources.floorCeiling,
    sources.opening,
    sources.wall,
  ].join('\n');
  const wallSkinModelExists = fs.existsSync(path.resolve(process.cwd(), FILES.wallSkinModel));
  const oldCladdingSpecExists = fs.existsSync(path.resolve(process.cwd(), 'src/modules/expo/runtime/modularHome/construction/GalaCladdingSpec.ts'));
  const wallSkinSpecPresent = fs.existsSync(path.resolve(process.cwd(), FILES.wallSkinSpec));
  const wallSkinConsumers = {
    cladding: /resolveGalaWallSkin|GALA_WALL_SKIN_DIMENSIONS/.test(sources.cladding),
    constructionModel: /GALA_WALL_SKIN_DIMENSIONS/.test(sources.constructionModel),
    constructionRenderer: /resolveGalaWallSkin/.test(sources.constructionRenderer),
    floorCeiling: /resolveGalaWallSkin/.test(sources.floorCeiling),
    opening: /resolveGalaWallSkin/.test(sources.opening),
    wall: /resolveGalaWallSkin/.test(sources.wall),
  };
  const componentsBypassingWallSkinSystem = Object.entries(wallSkinConsumers)
    .filter(([, consumes]) => !consumes)
    .map(([name]) => name);
  const duplicateDimensionConstants = [];
  if (/GalaCladdingSpec/.test(activeSources) || oldCladdingSpecExists) {
    duplicateDimensionConstants.push('Old GalaCladdingSpec still exists or is referenced.');
  }
  if (/const spacing\s*=\s*0\.62/.test(sources.wall)) {
    duplicateDimensionConstants.push('GalaWallAssembly still owns local interior panel spacing.');
  }
  if (/boardGapM:\s*0\.026|boardPanelWidthM:\s*0\.34|exteriorCladdingDepthM:\s*0\.028/.test(activeSources)) {
    duplicateDimensionConstants.push('Old exterior cladding dimension literals remain in active sources.');
  }
  const duplicateMaterialConstants = [];
  if (/#a98763|#8a6848|#7a6250|#8f5f35/.test(activeSources)) {
    duplicateMaterialConstants.push('Known local wall/reveal material constants remain in active construction sources.');
  }
  const materialOverrideConflictPresent = duplicateMaterialConstants.length > 0
    || /individual-vertical-timber-board-panel[\s\S]{0,500}color=["']#[0-9a-f]{6}["']/i.test(activeSources)
    || /board\.index\s*%.*wall/i.test(activeSources);
  const wallSkinConstantsSingleOwner = wallSkinModelExists
    && wallSkinSpecPresent
    && !oldCladdingSpecExists
    && duplicateDimensionConstants.length === 0
    && componentsBypassingWallSkinSystem.length === 0;

  return {
    boardWidthMeters: readNumericConst(sources.wallSkinModel, 'boardWidthM'),
    componentsBypassingWallSkinSystem,
    duplicateDimensionConstants,
    duplicateMaterialConstants,
    gapWidthMeters: readNumericConst(sources.wallSkinModel, 'gapWidthM'),
    materialOverrideConflictPresent,
    wallSkinConstantsSingleOwner,
    wallSkinConsumers,
    wallSkinModelExists,
    wallSkinSpecPresent,
  };
}

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? item.userData?.interiorBoardInstanceCount ?? 1);
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|vertical-timber|interior-panel|finished-floor/i.test(item.name || '')).length > 120;
  }, null, { timeout: 60000 });
}

async function collectInventory(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
}

async function captureRoute(page, baseUrl, route, screenshotPath) {
  const response = await navigateForGalaAudit(page, `${baseUrl}${route}`);
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

function auditExteriorInventory(inventory) {
  const boardMeshes = inventory.filter((item) => /individual-vertical-timber-board-panel/.test(item.name || ''));
  const wallBoardCounts = EXPECTED_EXTERIOR_WALL_IDS.reduce((acc, wallId) => {
    acc[wallId] = boardMeshes
      .filter((item) => item.userData?.wallId === wallId)
      .reduce((total, item) => total + meshInstanceCount(item), 0);
    return acc;
  }, {});
  const missingCladWallIds = EXPECTED_EXTERIOR_WALL_IDS.filter((wallId) => (wallBoardCounts[wallId] ?? 0) < 8);
  const boardRatios = boardMeshes
    .map((item) => item.userData?.boardToGapRatio)
    .filter((value) => typeof value === 'number');
  const boardWidths = boardMeshes
    .map((item) => item.userData?.boardWidthM)
    .filter((value) => typeof value === 'number');
  const gapWidths = boardMeshes
    .map((item) => item.userData?.boardRevealGapM)
    .filter((value) => typeof value === 'number');
  const allBoardWidths = [...new Set(boardWidths.map((value) => Number(value.toFixed(4))))];
  const allGapWidths = [...new Set(gapWidths.map((value) => Number(value.toFixed(4))))];

  return {
    allBoardWidths,
    allGapWidths,
    boardMeshCount: boardMeshes.reduce((total, item) => total + meshInstanceCount(item), 0),
    boardRatioSamples: [...new Set(boardRatios.map((value) => Number(value.toFixed(2))))],
    exteriorAllVisibleWallsClad: missingCladWallIds.length === 0,
    exteriorBoardModuleConsistent: allBoardWidths.length === 1 && allGapWidths.length === 1,
    largePlainExteriorWallPresent: missingCladWallIds.length > 0,
    missingCladWallIds,
    wallBoardCounts,
  };
}

function auditInteriorInventory(inventory, exteriorInventory) {
  const interiorBoards = inventory.filter((item) => /interior-vertical-timber-board-panel/.test(item.name || ''));
  const exteriorBoards = exteriorInventory.filter((item) => /individual-vertical-timber-board-panel/.test(item.name || ''));
  const finishedFaces = inventory.filter((item) => /flat-finished-interior-wall-face|finished-partition-face/.test(item.name || ''));
  const wallSkinTagged = inventory.filter((item) => item.userData?.wallSkinModelOwner === 'GalaWallSkinModel');
  const floorCeilingTagged = inventory.filter((item) => /finished-floor|ceiling-panel|continuous-flat-ceiling|baseboard-trim|crown-trim/.test(item.name || '')
    && item.userData?.wallSkinModelOwner === 'GalaWallSkinModel');
  const trimBands = inventory.filter((item) => /baseboard-trim|crown-trim/.test(item.name || ''));
  const explicitHorizontalBands = inventory.filter((item) => /horizontal-wall-band|interior-rail|wall-band/i.test(item.name || ''));
  const interiorBoardInstanceCount = interiorBoards.reduce((total, item) => total + meshInstanceCount(item), 0);
  const interiorBoardWidths = [...new Set(interiorBoards
    .map((item) => item.userData?.interiorBoardWidthM)
    .filter((value) => typeof value === 'number')
    .map((value) => Number(value.toFixed(4))))];
  const interiorBoardGaps = [...new Set(interiorBoards
    .map((item) => item.userData?.interiorBoardGapM)
    .filter((value) => typeof value === 'number')
    .map((value) => Number(value.toFixed(4))))];
  const interiorBoardColors = [...new Set(interiorBoards.map((item) => item.material?.color).filter(Boolean))].sort();
  const exteriorBoardColors = [...new Set(exteriorBoards.map((item) => item.material?.color).filter(Boolean))].sort();
  const interiorUsesSameWallSkinSystem = interiorBoardInstanceCount >= 24
    && interiorBoards.every((item) => item.userData?.interiorUsesSameWallSkinSystem === true);
  const interiorBoardModuleMatchesExterior = interiorUsesSameWallSkinSystem
    && interiorBoardWidths.length === 1
    && interiorBoardGaps.length === 1
    && interiorBoardWidths[0] === 0.18
    && interiorBoardGaps[0] === 0.014
    && interiorBoards.every((item) => item.userData?.interiorBoardModuleMatchesExterior === true);
  const interiorUsesSameWoodTone = interiorBoardColors.length > 0
    && interiorBoardColors.length === exteriorBoardColors.length
    && interiorBoardColors.every((color, index) => color === exteriorBoardColors[index])
    && interiorBoards.every((item) => item.userData?.interiorUsesSameWoodTone === true);
  const unwantedInteriorHorizontalBandsPresent = explicitHorizontalBands.length > 0
    || trimBands.some((item) => item.userData?.documentedStructuralTrim !== true);
  const interiorMaterialPaletteCoherentWithExterior = interiorUsesSameWallSkinSystem
    && interiorBoardColors.length > 0
    && interiorBoardColors.length <= 2
    && interiorUsesSameWoodTone
    && !unwantedInteriorHorizontalBandsPresent
    && interiorBoards.every((item) => item.userData?.interiorMaterialPaletteCoherentWithExterior === true);
  const finishedFaceCount = finishedFaces.reduce((total, item) => total + meshInstanceCount(item), 0);

  return {
    documentedStructuralTrimCount: trimBands.filter((item) => item.userData?.documentedStructuralTrim === true).length,
    exteriorBoardColors,
    finishedFaceCount,
    floorCeilingTaggedCount: floorCeilingTagged.length,
    interiorFinishedWallFacesPresent: finishedFaceCount >= 24,
    interiorMaterialAuthority: 'qa-gala-visual-design-intent-audit.mjs',
    interiorMaterialPaletteCheckedByDesignIntentAudit: true,
    interiorBoardColors,
    interiorBoardGaps,
    interiorBoardInstanceCount,
    interiorBoardModuleMatchesExterior,
    interiorBoardWidths,
    interiorExteriorMaterialSystemCoherent: interiorMaterialPaletteCoherentWithExterior && floorCeilingTagged.length >= 8,
    interiorMaterialPaletteCoherentWithExterior,
    interiorPanelModuleConsistent: interiorBoardModuleMatchesExterior,
    interiorUsesSameWoodTone,
    interiorUsesSameWallSkinSystem,
    unwantedInteriorHorizontalBandsPresent,
    wallSkinTaggedCount: wallSkinTagged.length,
    wallSkinRuntimeTagged: wallSkinTagged.length >= 24,
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
  const context = await browser.newContext({
    serviceWorkers: 'block',
    viewport: VIEWPORT,
  });
  const page = await context.newPage();
  let exteriorInventory;
  let exteriorStatus;
  let interiorInventory;
  let interiorStatus;

  try {
    const exteriorFront = path.join(options.outDir, 'exterior-front-after-wall-skin-fix.png');
    exteriorStatus = await captureRoute(page, options.baseUrl, ROUTES.exterior, exteriorFront);
    exteriorInventory = await collectInventory(page);
    await sharp(exteriorFront)
      .extract({ height: 430, left: 40, top: 245, width: 1060 })
      .toFile(path.join(options.outDir, 'exterior-detail-after-wall-skin-fix.png'));
    await frameShot(page, 'exteriorSideAngle', path.join(options.outDir, 'exterior-side-after-wall-skin-fix.png'));

    const interiorScreenshot = path.join(options.outDir, 'interior-after-wall-skin-fix.png');
    interiorStatus = await captureRoute(page, options.baseUrl, ROUTES.interior, interiorScreenshot);
    interiorInventory = await collectInventory(page);
    await sharp(interiorScreenshot)
      .extract({ height: 560, left: 80, top: 165, width: 850 })
      .toFile(path.join(options.outDir, 'interior-detail-after-wall-skin-fix.png'));
  } finally {
    await browser.close();
  }

  const exteriorAudit = auditExteriorInventory(exteriorInventory);
  const interiorAudit = auditInteriorInventory(interiorInventory, exteriorInventory);
  const boardWidth = sourceAudit.boardWidthMeters;
  const gapWidth = sourceAudit.gapWidthMeters;
  const facadeBoardGapAcceptable = gapWidth !== null && gapWidth >= 0.01 && gapWidth <= 0.025;
  const facadeBoardToGapRatioAcceptable = boardWidth !== null && gapWidth !== null && boardWidth / gapWidth >= 8;
  const pass = exteriorAudit.exteriorAllVisibleWallsClad
    && !exteriorAudit.largePlainExteriorWallPresent
    && exteriorAudit.exteriorBoardModuleConsistent
    && facadeBoardGapAcceptable
    && facadeBoardToGapRatioAcceptable
    && interiorAudit.interiorFinishedWallFacesPresent
    && interiorAudit.wallSkinRuntimeTagged
    && !interiorAudit.unwantedInteriorHorizontalBandsPresent
    && sourceAudit.wallSkinConstantsSingleOwner
    && !sourceAudit.materialOverrideConflictPresent;

  const result = {
    generatedAt: new Date().toISOString(),
    wallSkinCoverageAuditRan: true,
    exteriorAllVisibleWallsClad: exteriorAudit.exteriorAllVisibleWallsClad,
    largePlainExteriorWallPresent: exteriorAudit.largePlainExteriorWallPresent,
    exteriorBoardModuleConsistent: exteriorAudit.exteriorBoardModuleConsistent,
    interiorPanelModuleConsistent: interiorAudit.interiorPanelModuleConsistent,
    interiorExteriorMaterialSystemCoherent: interiorAudit.interiorExteriorMaterialSystemCoherent,
    interiorFinishedWallFacesPresent: interiorAudit.interiorFinishedWallFacesPresent,
    interiorMaterialAuthority: interiorAudit.interiorMaterialAuthority,
    interiorMaterialPaletteCheckedByDesignIntentAudit: interiorAudit.interiorMaterialPaletteCheckedByDesignIntentAudit,
    interiorUsesSameWallSkinSystem: interiorAudit.interiorUsesSameWallSkinSystem,
    interiorBoardModuleMatchesExterior: interiorAudit.interiorBoardModuleMatchesExterior,
    interiorMaterialPaletteCoherentWithExterior: interiorAudit.interiorMaterialPaletteCoherentWithExterior,
    interiorUsesSameWoodTone: interiorAudit.interiorUsesSameWoodTone,
    unwantedInteriorHorizontalBandsPresent: interiorAudit.unwantedInteriorHorizontalBandsPresent,
    wallSkinRuntimeTagged: interiorAudit.wallSkinRuntimeTagged,
    wallSkinConstantsSingleOwner: sourceAudit.wallSkinConstantsSingleOwner,
    materialOverrideConflictPresent: sourceAudit.materialOverrideConflictPresent,
    componentsBypassingWallSkinSystem: sourceAudit.componentsBypassingWallSkinSystem,
    screenshotReadabilityIsNotDesignAcceptance: true,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      exteriorAudit,
      exteriorStatus,
      facadeBoardGapAcceptable,
      facadeBoardToGapRatioAcceptable,
      interiorAudit,
      interiorStatus,
      sourceAudit,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-wall-skin-coverage-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
