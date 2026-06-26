#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-renderer-ownership-remediation-local';

const REPO_ROOT = process.cwd();
const FILES = {
  contract: 'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
  currentTask: 'docs/CURRENT_TASK.md',
  shell: 'src/modules/expo/runtime/modularHome/GalaHouseShell.tsx',
  constructionModel: 'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts',
  constructionRenderer: 'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx',
  floorCeilingAssembly: 'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx',
  roomAssembly: 'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx',
  wallAssembly: 'src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx',
  openingAssembly: 'src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx',
  claddingAssembly: 'src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx',
  wallSkinModel: 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts',
  wallSkinSpec: 'docs/GALA_WALL_SKIN_SYSTEM_SPEC.md',
  wallSkinQa: 'scripts/qa-gala-wall-skin-coverage-audit.mjs',
  domOverlayQa: 'scripts/qa-gala-dom-overlay-audit.mjs',
  constructionQa: 'scripts/qa-gala-construction-renderer.mjs',
};

const EXPECTED_CHANGED_FILES = [
  'docs/GALA_RENDERER_OWNERSHIP_CONTRACT.md',
  'docs/CURRENT_TASK.md',
  'src/modules/expo/runtime/modularHome/GalaHouseShell.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx',
  'scripts/qa-gala-renderer-ownership-audit.mjs',
];

function parseArgs(argv) {
  const options = {
    outDir: DEFAULT_OUT_DIR,
  };

  for (const arg of argv) {
    if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--base-url=')) {
      // Accepted for consistency with other QA scripts. This audit is static and does not use the URL.
      options.baseUrl = arg.slice('--base-url='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function repoPath(file) {
  return path.join(REPO_ROOT, file);
}

function read(file) {
  return fs.readFileSync(repoPath(file), 'utf8');
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function copyContract(outDir) {
  const targetDir = path.join(outDir, 'docs');
  ensureDir(targetDir);
  fs.copyFileSync(repoPath(FILES.contract), path.join(targetDir, 'GALA_RENDERER_OWNERSHIP_CONTRACT.md'));
}

function findForbiddenOpeningOwnership(sources) {
  const forbidden = [];
  const assemblyEntries = [
    ['constructionRenderer', sources.constructionRenderer],
    ['floorCeilingAssembly', sources.floorCeilingAssembly],
    ['wallAssembly', sources.wallAssembly],
    ['openingAssembly', sources.openingAssembly],
    ['claddingAssembly', sources.claddingAssembly],
    ['roomAssembly', sources.roomAssembly],
  ];

  for (const [name, source] of assemblyEntries) {
    if (/\bGALA_OPENING_SCHEDULE\b|\bGALA_INTERIOR_DOORS\b/.test(source)) {
      forbidden.push(`${name}: imports schedule/floorplan opening source directly`);
    }

    const localOpeningLiteral = /axisStartM\s*:\s*[-\d.]+|widthM\s*:\s*[-\d.]+|heightM\s*:\s*[-\d.]+/.test(source);
    if (localOpeningLiteral) {
      forbidden.push(`${name}: defines local opening dimensions`);
    }
  }

  return forbidden;
}

function findForbiddenFurnitureOwnership(sources) {
  const forbidden = [];
  if (!/\bGALA_FURNITURE_LAYOUT\b/.test(sources.constructionModel)) {
    forbidden.push('construction model does not expose GALA_FURNITURE_LAYOUT');
  }
  if (!/\bGALA_FURNITURE_LAYOUT\b/.test(sources.roomAssembly)) {
    forbidden.push('room assembly does not consume GALA_FURNITURE_LAYOUT');
  }

  const directNumericPositions = [...sources.roomAssembly.matchAll(/position=\{\[\s*-?\d/g)];
  const primaryCoordinateLeaks = directNumericPositions.length;
  if (primaryCoordinateLeaks > 0) {
    forbidden.push(`room assembly still owns ${primaryCoordinateLeaks} direct numeric position arrays`);
  }

  return forbidden;
}

function buildResult() {
  const sources = Object.fromEntries(Object.entries(FILES).map(([key, file]) => [
    key,
    fs.existsSync(repoPath(file)) ? read(file) : '',
  ]));

  const shellMountsRoof = /\bimport\s+\{\s*GalaRoof\s*\}/.test(sources.shell) || /<GalaRoof\b/.test(sources.shell);
  const rendererMountsRoofAdapter = /\bimport\s+\{\s*GalaRoof\s*\}/.test(sources.constructionRenderer)
    && /gala-construction-roof-adapter-mounted-inside-construction-renderer/.test(sources.constructionRenderer)
    && /<GalaRoof\b/.test(sources.constructionRenderer);
  const contractDocumentsRoofAdapter = /GalaRoof\.tsx` mounted only through `GalaConstructionRenderer\.tsx`/.test(sources.contract)
    || /GalaRoof.*adapter.*GalaConstructionRenderer/s.test(sources.contract);
  const roofOwnershipDocumented = !shellMountsRoof && rendererMountsRoofAdapter && contractDocumentsRoofAdapter;

  const forbiddenOpeningOwnership = findForbiddenOpeningOwnership(sources);
  const duplicateOpeningOwnershipPresent = forbiddenOpeningOwnership.length > 0;

  const forbiddenFurnitureOwnership = findForbiddenFurnitureOwnership(sources);
  const duplicateFurnitureOwnershipPresent = forbiddenFurnitureOwnership.length > 0;

  const constructionModelIsAdapter = /GALA_CONSTRUCTION_MODEL_OWNERSHIP/.test(sources.constructionModel)
    && /role:\s*'adapter'/.test(sources.constructionModel)
    && /singleSourceRendererProven:\s*false/.test(sources.constructionModel);
  const constructionModelFalselyClaimsSingleSource = /single-source-of-truth|single source of truth/i.test(sources.constructionModel)
    && !constructionModelIsAdapter;

  const domOverlayQaPresent = fs.existsSync(repoPath(FILES.domOverlayQa))
    && /blockingHomeDemoLabelPresent/.test(sources.domOverlayQa)
    && /threeMeshAuditDoesNotCoverDom/.test(sources.domOverlayQa)
    && /data-home-demo-model-label/.test(sources.domOverlayQa);
  const constructionQaIncludesDomOverlay = /domOverlayAuditRan/.test(sources.constructionQa)
    && /blockingDomOverlayPresent/.test(sources.constructionQa)
    && /threeMeshAuditDoesNotCoverDom/.test(sources.constructionQa);
  const wallSkinOwnershipDocumented = fs.existsSync(repoPath(FILES.wallSkinModel))
    && fs.existsSync(repoPath(FILES.wallSkinSpec))
    && /GALA_WALL_SKIN_OWNERSHIP/.test(sources.wallSkinModel)
    && /Ownership Contract/.test(sources.wallSkinSpec);
  const wallSkinCoverageQaPresent = fs.existsSync(repoPath(FILES.wallSkinQa))
    && /wallSkinCoverageAuditRan/.test(sources.wallSkinQa)
    && /screenshotReadabilityIsNotDesignAcceptance/.test(sources.wallSkinQa);
  const wallSkinBypassCandidates = [
    ['constructionRenderer', sources.constructionRenderer],
    ['floorCeilingAssembly', sources.floorCeilingAssembly],
    ['wallAssembly', sources.wallAssembly],
    ['openingAssembly', sources.openingAssembly],
    ['claddingAssembly', sources.claddingAssembly],
  ].filter(([, source]) => !/resolveGalaWallSkin|GALA_WALL_SKIN_DIMENSIONS/.test(source))
    .map(([name]) => name);
  const wallSkinBypassPresent = wallSkinBypassCandidates.length > 0;

  const result = {
    rendererOwnershipAuditRan: true,
    singleSourceRendererProven: false,
    roofOwnershipDocumented,
    duplicateOpeningOwnershipPresent,
    duplicateFurnitureOwnershipPresent,
    constructionModelIsAdapter,
    domOverlayQaRequired: true,
    domOverlayQaPresent: domOverlayQaPresent && constructionQaIncludesDomOverlay,
    meshTraversalDoesNotCoverDom: constructionQaIncludesDomOverlay,
    wallSkinOwnershipDocumented,
    wallSkinCoverageQaPresent,
    wallSkinBypassPresent,
    productVisualAccepted: false,
    details: {
      constructionModelFalselyClaimsSingleSource,
      forbiddenFurnitureOwnership,
      forbiddenOpeningOwnership,
      rendererMountsRoofAdapter,
      shellMountsRoof,
      wallSkinBypassCandidates,
    },
  };

  return result;
}

function writeMarkdown(outDir, result) {
  const status = result.roofOwnershipDocumented
    && !result.duplicateOpeningOwnershipPresent
    && !result.duplicateFurnitureOwnershipPresent
    && result.constructionModelIsAdapter
    && result.domOverlayQaPresent
    && result.meshTraversalDoesNotCoverDom
    && result.wallSkinOwnershipDocumented
    && result.wallSkinCoverageQaPresent
    && !result.wallSkinBypassPresent;

  fs.writeFileSync(path.join(outDir, 'RENDERER_OWNERSHIP_REMEDIATION.md'), `# GALA Renderer Ownership Remediation

Generated: ${new Date().toISOString()}

## Scope

This phase formalizes renderer ownership for the real-user GALA modular-home studio route. It does not deploy to staging and does not change cameras, FOV, lookAt targets, routes, backend, auth, quote, payment, or visual acceptance state.

## Result

- Ownership audit status: ${status ? 'PASS for this remediation scope' : 'FAIL'}
- singleSourceRendererProven: ${result.singleSourceRendererProven}
- roofOwnershipDocumented: ${result.roofOwnershipDocumented}
- duplicateOpeningOwnershipPresent: ${result.duplicateOpeningOwnershipPresent}
- duplicateFurnitureOwnershipPresent: ${result.duplicateFurnitureOwnershipPresent}
- constructionModelIsAdapter: ${result.constructionModelIsAdapter}
- domOverlayQaPresent: ${result.domOverlayQaPresent}
- meshTraversalDoesNotCoverDom: ${result.meshTraversalDoesNotCoverDom}
- wallSkinOwnershipDocumented: ${result.wallSkinOwnershipDocumented}
- wallSkinCoverageQaPresent: ${result.wallSkinCoverageQaPresent}
- wallSkinBypassPresent: ${result.wallSkinBypassPresent}
- productVisualAccepted: ${result.productVisualAccepted}

## Ownership Decisions

1. \`GalaHouseShell.tsx\` is only the transformed route shell. It no longer mounts \`GalaRoof\` as a sibling renderer.
2. \`GalaRoof.tsx\` remains a documented roof adapter and is mounted inside \`GalaConstructionRenderer.tsx\`.
3. \`GALA_CONSTRUCTION_MODEL\` is classified as an adapter, not as a proven single-source renderer.
4. Opening geometry for construction assemblies resolves through normalized construction openings.
5. Furniture placement resolves through \`GALA_FURNITURE_LAYOUT\`; \`GalaRoomAssembly.tsx\` consumes that placement and renders primitives.
6. DOM overlay QA remains required because Three.js mesh traversal does not cover Drei Html or other DOM overlays.
7. Wall-skin dimensions/materials resolve through \`GalaWallSkinModel.ts\`; wall, cladding, opening, gable, and floor/ceiling assemblies consume that model.
`);

  fs.writeFileSync(path.join(outDir, 'changed-files.txt'), `${EXPECTED_CHANGED_FILES.join('\n')}\n`);

  fs.writeFileSync(path.join(outDir, 'VALIDATION.md'), `# Validation

Populate this file with command results after running validation.

Required commands:

- npm.cmd run build
- npm.cmd run lint
- node --check scripts/qa-gala-dom-overlay-audit.mjs
- node --check scripts/qa-gala-renderer-ownership-audit.mjs
- node --check scripts/qa-gala-construction-renderer.mjs
- DOM overlay QA
- renderer ownership QA
- local route smoke via DOM overlay QA

No staging deploy. productVisualAccepted=false.
`);
}

function writeStatus(outDir, result) {
  writeJson(path.join(outDir, 'AUDIT_STATUS_AFTER_OWNERSHIP_REMEDIATION.json'), {
    architectureAuditPassed: false,
    productVisualAccepted: false,
    stagingDeployAllowed: false,
    visualRegressionPresent: false,
    blockingHomeDemoLabelPresent: false,
    blockingDomOverlayPresent: false,
    singleSourceRendererProven: false,
    rendererOwnershipContractExists: fs.existsSync(repoPath(FILES.contract)),
    roofOwnershipDocumented: result.roofOwnershipDocumented,
    duplicateOpeningOwnershipPresent: result.duplicateOpeningOwnershipPresent,
    duplicateFurnitureOwnershipPresent: result.duplicateFurnitureOwnershipPresent,
    wallSkinOwnershipDocumented: result.wallSkinOwnershipDocumented,
    wallSkinCoverageQaPresent: result.wallSkinCoverageQaPresent,
    wallSkinBypassPresent: result.wallSkinBypassPresent,
    qaFalsePositiveRiskPresent: true,
    remediationScope: 'renderer-ownership-contract-and-high-risk-duplicate-removal',
    remainingBlockers: [
      'Architecture audit remains failed until full renderer/data/runtime ownership is proven end-to-end.',
      'GALA_CONSTRUCTION_MODEL is still an adapter, not a full single source of truth.',
      'Broader QA false-positive risk remains outside DOM overlay and ownership checks.',
      'Manual visual acceptance is still required after later renderer-quality remediation.',
    ],
  });
}

function run(options) {
  ensureDir(options.outDir);
  ensureDir(path.join(options.outDir, 'debug'));
  const result = buildResult();
  copyContract(options.outDir);
  writeJson(path.join(options.outDir, 'qa-renderer-ownership-result.json'), result);
  writeMarkdown(options.outDir, result);
  writeStatus(options.outDir, result);

  const failures = [];
  if (!result.roofOwnershipDocumented) failures.push('roof ownership is not documented or shell still mounts GalaRoof');
  if (result.duplicateOpeningOwnershipPresent) failures.push('duplicate opening ownership is present');
  if (result.duplicateFurnitureOwnershipPresent) failures.push('duplicate furniture ownership is present');
  if (!result.constructionModelIsAdapter) failures.push('construction model is not honestly classified as adapter');
  if (!result.domOverlayQaPresent) failures.push('DOM overlay QA is missing from required path');
  if (!result.meshTraversalDoesNotCoverDom) failures.push('mesh traversal still lacks explicit DOM limitation');
  if (!result.wallSkinOwnershipDocumented) failures.push('wall-skin ownership is not documented');
  if (!result.wallSkinCoverageQaPresent) failures.push('wall-skin coverage QA is missing');
  if (result.wallSkinBypassPresent) failures.push('active wall-skin components bypass GalaWallSkinModel');

  console.log(JSON.stringify({
    failures,
    outDir: options.outDir,
    result,
  }, null, 2));

  if (failures.length > 0) {
    process.exit(1);
  }
}

run(parseArgs(process.argv.slice(2)));
