#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-cladding-gap-and-ownership-remediation-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };
const ROUTE = '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1';
const SPEC_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts';
const CONSTRUCTION_MODEL_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts';
const CLADDING_ASSEMBLY_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx';
const CONSTRUCTION_RENDERER_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx';
const WALL_ASSEMBLY_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx';
const OPENING_ASSEMBLY_FILE = 'src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx';
const DIMENSION_SPEC_DOC = 'docs/GALA_CLADDING_DIMENSION_SPEC.md';
const WALL_SKIN_SPEC_DOC = 'docs/GALA_WALL_SKIN_SYSTEM_SPEC.md';
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

function hasPattern(source, pattern) {
  return pattern.test(source);
}

function collectSourceAudit() {
  const specSource = readRepoFile(SPEC_FILE);
  const modelSource = readRepoFile(CONSTRUCTION_MODEL_FILE);
  const claddingSource = readRepoFile(CLADDING_ASSEMBLY_FILE);
  const rendererSource = readRepoFile(CONSTRUCTION_RENDERER_FILE);
  const wallSource = readRepoFile(WALL_ASSEMBLY_FILE);
  const openingSource = readRepoFile(OPENING_ASSEMBLY_FILE);
  const dimensionSpecPresent = fs.existsSync(path.resolve(process.cwd(), DIMENSION_SPEC_DOC));
  const wallSkinSpecPresent = fs.existsSync(path.resolve(process.cwd(), WALL_SKIN_SPEC_DOC));
  const boardWidthMeters = readNumericConst(specSource, 'boardWidthM');
  const gapWidthMeters = readNumericConst(specSource, 'gapWidthM');
  const maxGapMeters = readNumericConst(specSource, 'gapMaxM') ?? 0.025;
  const minRatio = readNumericConst(specSource, 'boardToGapMinRatio') ?? 8;
  const boardToGapRatio = boardWidthMeters && gapWidthMeters
    ? Number((boardWidthMeters / gapWidthMeters).toFixed(2))
    : null;

  const constructionLevelsBody = modelSource.match(/export const GALA_CONSTRUCTION_LEVELS = \{([\s\S]*?)\n\} as const;/)?.[1] ?? '';
  const oldDimensionConstantsRemain = /boardGapM|boardPanelWidthM|exteriorCladdingDepthM/.test(constructionLevelsBody);
  const activeSourcesUseSingleSpec = /GALA_WALL_SKIN_DIMENSIONS/.test(modelSource)
    && /resolveGalaWallSkin|GALA_WALL_SKIN_DIMENSIONS/.test(claddingSource)
    && /resolveGalaWallSkin|GALA_WALL_SKIN_DIMENSIONS/.test(rendererSource)
    && /resolveGalaWallSkin/.test(wallSource)
    && /resolveGalaWallSkin/.test(openingSource);
  const activeDecorativeVerticalStripSourcePresent = hasPattern(claddingSource + rendererSource, /raised-board-edge-shadow|subtle-raised-board-edge-shadow/);
  const perBoardMaterialOverride = /board\.index\s*%.*wall/i.test(claddingSource + rendererSource)
    || /wallLightColor/.test(claddingSource + rendererSource)
    || /color=\{[^}]*board\.index/i.test(claddingSource + rendererSource);
  const hardcodedActiveCladdingMaterial = /individual-vertical-timber-board-panel[\s\S]{0,500}color=["']#[0-9a-f]{6}["']/i.test(claddingSource + rendererSource);
  const claddingConstantsSingleOwner = dimensionSpecPresent
    && wallSkinSpecPresent
    && activeSourcesUseSingleSpec
    && !oldDimensionConstantsRemain;
  const materialOverrideConflictPresent = perBoardMaterialOverride || hardcodedActiveCladdingMaterial;

  return {
    activeDecorativeVerticalStripSourcePresent,
    boardToGapRatio,
    boardWidthMeters,
    claddingConstantsSingleOwner,
    dimensionSpecPresent,
    gapWidthMeters,
    materialOverrideConflictPresent,
    maxGapMeters,
    minRatio,
    oldDimensionConstantsRemain,
    perBoardMaterialOverride,
    wallSkinSpecPresent,
  };
}

function meshInstanceCount(item) {
  return Number(item.userData?.instanceCount ?? item.userData?.exteriorBoardInstanceCount ?? 1);
}

async function waitForGalaScene(page) {
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__), null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const inventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? [];
    return inventory.filter((item) => /gala-construction|vertical-timber|cladding/i.test(item.name || '')).length > 80;
  }, null, { timeout: 60000 });
}

async function collectInventory(page) {
  return await page.evaluate(() => window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? []);
}

async function captureExterior(page, baseUrl, outDir) {
  const response = await page.goto(`${baseUrl}${ROUTE}`, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await waitForGalaScene(page);
  await page.waitForTimeout(900);

  const front = path.join(outDir, 'exterior-after-cladding-gap-fix.png');
  const detail = path.join(outDir, 'exterior-detail-after-cladding-gap-fix.png');
  const side = path.join(outDir, 'exterior-side-after-cladding-gap-fix.png');
  await page.screenshot({ fullPage: false, path: front });
  await sharp(front).extract({ height: 430, left: 40, top: 245, width: 1060 }).toFile(detail);

  await page.evaluate(() => window.__WARPALA_3D_QA__?.frameModularHomeShot?.('exteriorSideAngle'));
  await page.waitForTimeout(900);
  await page.screenshot({ fullPage: false, path: side });

  return response?.status() ?? null;
}

function auditRuntimeInventory(inventory) {
  const boardMeshes = inventory.filter((item) => /individual-vertical-timber-board-panel|gable-individual-vertical-timber-board-panel/.test(item.name || ''));
  const revealMeshes = inventory.filter((item) => /thin-shadow-reveal-cladding-backing|gable-opaque-wall-core/.test(item.name || ''));
  const extraVerticalStrips = inventory.filter((item) => /raised-board-edge-shadow|subtle-raised-board-edge-shadow|opening-clipped-recessed-vertical-cladding-shadow-channel|construction-shadow-channel-vertical-board-gap/.test(item.name || ''));
  const boardColors = [...new Set(boardMeshes.map((item) => item.material?.color).filter(Boolean))].sort();
  const revealColors = [...new Set(revealMeshes.map((item) => item.material?.color).filter(Boolean))].sort();
  const wallBoardCounts = EXPECTED_EXTERIOR_WALL_IDS.reduce((acc, wallId) => {
    acc[wallId] = boardMeshes
      .filter((item) => item.userData?.wallId === wallId)
      .reduce((total, item) => total + meshInstanceCount(item), 0);
    return acc;
  }, {});
  const missingCladWallIds = EXPECTED_EXTERIOR_WALL_IDS.filter((wallId) => (wallBoardCounts[wallId] ?? 0) < 8);
  const boardInstanceCount = boardMeshes.reduce((total, item) => total + meshInstanceCount(item), 0);

  return {
    boardColors,
    boardMeshCount: boardInstanceCount,
    extraVerticalStripCount: extraVerticalStrips.length,
    extraVerticalStripSamples: extraVerticalStrips.slice(0, 12).map((item) => item.name),
    revealColors,
    revealMeshCount: revealMeshes.length,
    exteriorAllVisibleWallsClad: missingCladWallIds.length === 0,
    missingCladWallIds,
    verticalBoardIntentPresent: boardInstanceCount >= 40,
    wallBoardCounts,
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
  const exteriorStatus = await captureExterior(page, options.baseUrl, options.outDir);
  const inventory = await collectInventory(page);
  await browser.close();

  const runtimeAudit = auditRuntimeInventory(inventory);
  const gapTooWide = sourceAudit.gapWidthMeters === null || sourceAudit.gapWidthMeters > sourceAudit.maxGapMeters;
  const boardToGapRatioAcceptable = sourceAudit.boardToGapRatio !== null && sourceAudit.boardToGapRatio >= sourceAudit.minRatio;
  const gapWithinTarget = sourceAudit.gapWidthMeters !== null
    && sourceAudit.gapWidthMeters >= 0.01
    && sourceAudit.gapWidthMeters <= 0.02;
  const extraDecorativeStripsPresent = sourceAudit.activeDecorativeVerticalStripSourcePresent || runtimeAudit.extraVerticalStripCount > 0;
  const largePlainExteriorWallPresent = !runtimeAudit.exteriorAllVisibleWallsClad;
  const darkStripeDominancePresent = gapTooWide
    || !boardToGapRatioAcceptable
    || extraDecorativeStripsPresent
    || largePlainExteriorWallPresent
    || runtimeAudit.boardMeshCount < 40;
  const pass = runtimeAudit.verticalBoardIntentPresent
    && runtimeAudit.exteriorAllVisibleWallsClad
    && gapWithinTarget
    && !gapTooWide
    && boardToGapRatioAcceptable
    && !darkStripeDominancePresent
    && !extraDecorativeStripsPresent
    && sourceAudit.claddingConstantsSingleOwner
    && !sourceAudit.materialOverrideConflictPresent;

  const result = {
    generatedAt: new Date().toISOString(),
    claddingDimensionAuditRan: true,
    verticalBoardIntentPresent: runtimeAudit.verticalBoardIntentPresent,
    targetGapMeters: [0.01, 0.02],
    maxGapMeters: sourceAudit.maxGapMeters,
    boardWidthMeters: sourceAudit.boardWidthMeters,
    gapWidthMeters: sourceAudit.gapWidthMeters,
    boardToGapRatio: sourceAudit.boardToGapRatio,
    gapTooWide,
    exteriorAllVisibleWallsClad: runtimeAudit.exteriorAllVisibleWallsClad,
    largePlainExteriorWallPresent,
    darkStripeDominancePresent,
    extraDecorativeStripsPresent,
    claddingConstantsSingleOwner: sourceAudit.claddingConstantsSingleOwner,
    materialOverrideConflictPresent: sourceAudit.materialOverrideConflictPresent,
    screenshotReadabilityIsNotDesignAcceptance: true,
    productVisualAccepted: false,
    pass,
    diagnostics: {
      exteriorStatus,
      route: ROUTE,
      screenshots: {
        detail: 'exterior-detail-after-cladding-gap-fix.png',
        front: 'exterior-after-cladding-gap-fix.png',
        side: 'exterior-side-after-cladding-gap-fix.png',
      },
      sourceAudit,
      runtimeAudit,
    },
  };

  writeJson(path.join(options.outDir, 'qa-gala-cladding-dimension-result.json'), result);

  if (!result.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
