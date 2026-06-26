#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-full-architecture-audit-local';
const VIEWPORT = { width: 1440, height: 900 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1',
  quoteReview: '/modular-homes/quotes',
};

const RELEVANT_FILES = [
  'src/App.tsx',
  'src/pages/modularHome/ModularHomeStudioPage.tsx',
  'src/pages/modularHome/ModularHomeQuoteReview.tsx',
  'src/modules/expo/Expo3D.tsx',
  'src/modules/expo/runtime/app/Expo3D.tsx',
  'src/modules/expo/runtime/app/useExpoRuntimeSession.ts',
  'src/modules/expo/runtime/app/expo3dQa.ts',
  'src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx',
  'src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx',
  'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx',
  'src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx',
  'src/modules/expo/runtime/world/ModularHomeEntrancePortal.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx',
  'src/modules/expo/runtime/modularHome/HomeDesignInstanceShell.tsx',
  'src/modules/expo/runtime/modularHome/RoomPanoramaWalkthroughPanel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeUploadedModelPreview.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeProjectSummary.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeUploadPreviewPanel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeProjectWorkspace.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeShareLinkPanel.tsx',
  'src/modules/expo/runtime/modularHome/homeDemoFlags.ts',
  'src/modules/expo/runtime/modularHome/GalaHouseShell.tsx',
  'src/modules/expo/runtime/modularHome/GalaRoof.tsx',
  'src/modules/expo/runtime/modularHome/GalaHouseDimensions.ts',
  'src/modules/expo/runtime/modularHome/GalaFloorplan.ts',
  'src/modules/expo/runtime/modularHome/GalaDoorState.ts',
  'src/modules/expo/runtime/modularHome/GalaHouseConfig.ts',
  'src/modules/expo/runtime/modularHome/GalaMaterials.ts',
  'src/modules/expo/runtime/modularHome/GalaCeiling.tsx',
  'src/modules/expo/runtime/modularHome/GalaInterior.tsx',
  'src/modules/expo/runtime/modularHome/GalaInteriorConstruction.tsx',
  'src/modules/expo/runtime/modularHome/GalaInteriorFurniture.tsx',
  'src/modules/expo/runtime/modularHome/GalaOpenings.tsx',
  'src/modules/expo/runtime/modularHome/modularHomeConfig.ts',
  'src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts',
  'src/modules/expo/runtime/modularHome/modularHomeProducts.ts',
  'src/modules/expo/runtime/modularHome/modularHomeQuoteReview.ts',
  'src/modules/expo/runtime/modularHome/modularHomeQuoteBackend.ts',
  'src/modules/expo/runtime/modularHome/modularHomeEstimate.ts',
  'src/modules/expo/runtime/modularHome/modularHomePricing.ts',
  'src/modules/expo/runtime/modularHome/modularHomeShareUrl.ts',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx',
  'scripts/qa-gala-construction-renderer.mjs',
  'scripts/qa-gala-opening-voids.mjs',
  'scripts/qa-gala-real-user-walk-physics.mjs',
  'scripts/qa-3d-runtime-playwright.mjs',
  'scripts/qa-gala-visual-construction.mjs',
  'scripts/qa-gala-final-fit.mjs',
  'scripts/qa-gala-defect-root-cause.mjs',
];

const FILE_NOTES = {
  'src/pages/modularHome/ModularHomeStudioPage.tsx': {
    responsibilities: ['route owner for /modular-homes/studio', 'view query canonicalization', 'top-left fixed DOM route card', 'Quote Review and Start inside/outside links'],
    risk: 'high',
    notes: 'Drops unknown query params except qa3d=1; renders route chrome over the canvas.',
  },
  'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx': {
    responsibilities: ['active home model wrapper', 'mounts GalaHouseShell', 'renders Drei Html model label', 'contains legacy module/floorplan label/render code'],
    risk: 'blocker',
    notes: 'Owns the blocking 40 m² / Compact Timber 40 Html overlay outside the construction renderer; mesh traversal cannot see it.',
  },
  'src/modules/expo/runtime/modularHome/ModularHomeUploadedModelPreview.tsx': {
    responsibilities: ['optional uploaded model preview layer', 'Drei Html upload-state labels'],
    risk: 'medium',
    notes: 'Mounted in the home-studio scene beside ModularHomeModel; normally null/placeholder depending on upload state, but still an active layer owner.',
  },
  'src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx': {
    responsibilities: ['right rail UI controls', 'view mode state', 'quote/BOM/project/upload panels'],
    risk: 'high',
    notes: 'Owns user-facing controls and business panels over the canvas; audit-only for quote/BOM because backend flow was not changed.',
  },
  'src/modules/expo/runtime/modularHome/HomeDesignInstanceShell.tsx': {
    responsibilities: ['design instance guidance panel sections inside right rail'],
    risk: 'medium',
    notes: 'UI guidance owner only; not the Three renderer owner.',
  },
  'src/modules/expo/runtime/modularHome/RoomPanoramaWalkthroughPanel.tsx': {
    responsibilities: ['room panorama/walkthrough panel inside right rail'],
    risk: 'medium',
    notes: 'UI walkthrough panel owner; can affect user perception without appearing in mesh inventory.',
  },
  'src/modules/expo/runtime/modularHome/GalaHouseShell.tsx': {
    responsibilities: ['active GALA group transform', 'transparentCutaway calculation', 'mounts construction renderer', 'mounts GalaRoof outside construction renderer'],
    risk: 'blocker',
    notes: 'Not a single renderer boundary because roof remains active as a sibling to GalaConstructionRenderer.',
  },
  'src/modules/expo/runtime/modularHome/GalaRoof.tsx': {
    responsibilities: ['active roof geometry', 'roof seams/eaves/gables/gutters/trim'],
    risk: 'high',
    notes: 'Still active outside the construction renderer reset.',
  },
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts': {
    responsibilities: ['construction data adapter', 'construction wall/opening list', 'levels', 'furniture anchors'],
    risk: 'high',
    notes: 'Adapts data from GalaHouseDimensions and GalaFloorplan, but not all assemblies consume it as sole source.',
  },
  'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx': {
    responsibilities: ['finished floor', 'ceiling plane', 'baseboards/crown trim', 'threshold-like floor details'],
    risk: 'high',
    notes: 'Contains local interior door opening trim interruption data, duplicating construction model/floorplan ownership.',
  },
  'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx': {
    responsibilities: ['furniture mesh output', 'interior room objects', 'bathroom/bedroom/living/kitchen low-poly contents'],
    risk: 'high',
    notes: 'Actual furniture positions are hardcoded here; GALA_FURNITURE_ANCHORS is not the exclusive mesh source.',
  },
  'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx': {
    responsibilities: ['real-user movement', 'GALA collision', 'door interaction prompt Html overlay', 'door traversal logic'],
    risk: 'high',
    notes: 'Runtime physics/door behavior is separate from visual opening assembly.',
  },
  'src/modules/expo/runtime/world/ModularHomeEntrancePortal.tsx': {
    responsibilities: ['expo boulevard portal to modular-home studio', 'Drei Html portal CTA'],
    risk: 'medium',
    notes: 'Not active inside homeStudio route, but active on expo route and owns a separate Html portal surface.',
  },
  'src/modules/expo/runtime/app/useExpoRuntimeSession.ts': {
    responsibilities: ['runtime mode/session flags', 'home demo/home studio environment detection'],
    risk: 'medium',
    notes: 'Contributes to whether the app uses home-studio runtime mode.',
  },
  'src/modules/expo/runtime/modularHome/homeDemoFlags.ts': {
    responsibilities: ['home demo/home studio route flag detection'],
    risk: 'high',
    notes: 'Controls whether home studio branch is active.',
  },
  'scripts/qa-gala-construction-renderer.mjs': {
    responsibilities: ['construction renderer evidence script', 'mesh inventory', 'construction result JSON'],
    risk: 'blocker',
    notes: 'Misses DOM Html overlays and has several pass conditions based on flags, counts, or screenshot existence.',
  },
  'scripts/qa-gala-opening-voids.mjs': {
    responsibilities: ['opening/door close-up screenshots and result JSON'],
    risk: 'blocker',
    notes: 'Several visual result booleans are phase-based rather than measured from pixels/geometry.',
  },
  'scripts/qa-3d-runtime-playwright.mjs': {
    responsibilities: ['8-shot evidence', 'screenshot validity', 'manifest'],
    risk: 'high',
    notes: 'Technical screenshot existence/readability can pass with blocking DOM overlays still present.',
  },
};

const QA_SCRIPT_AUDITS = [
  {
    file: 'scripts/qa-gala-construction-renderer.mjs',
    checks: [
      ['Runtime mesh inventory through window.__WARPALA_3D_QA__.getSceneMeshInventory', 'REAL CHECK', 'Traverses actual Three scene meshes, but excludes DOM/Drei Html overlays.'],
      ['singleConstructionModelCreated = flag or Boolean(wallCount)', 'FALSE-POSITIVE RISK', 'Can pass when renderer is still fragmented but has wall meshes.'],
      ['wallAssemblyOwnsCoreFacesRevealsTrim = wallCount >= 20 or flag', 'WEAK CHECK', 'Counts objects; does not prove ownership or visual continuity.'],
      ['openingAssemblyOwnsDoorWindowRevealsCasing = openingCount >= 6 or flag', 'WEAK CHECK', 'Counts opening meshes; does not verify slits/voids are visually gone.'],
      ['bedroomDoorFrameNoVisibleSlit via screenshot file existence', 'FALSE-POSITIVE RISK', 'A saved PNG is not visual classification.'],
      ['floorColorStableNearAndFar via runtime userData flag', 'FALSE-POSITIVE RISK', 'Can pass while manual screenshot shows overlay/color instability.'],
      ['facadeGroovesCredible via userData and board count', 'FALSE-POSITIVE RISK', 'Does not classify whether grooves look like drawn lines.'],
      ['DOM overlay detection', 'DEAD CHECK', 'Not implemented; cannot catch the 40 m² label.'],
    ],
  },
  {
    file: 'scripts/qa-gala-opening-voids.mjs',
    checks: [
      ['Door open/closed screenshots', 'REAL CHECK', 'Screenshots exist for human review.'],
      ['entryDoorClosedBlocks/openPasses flags', 'WEAK CHECK', 'Depends on script phase/probe logic; needs measured collision details to be reliable.'],
      ['windowsDoNotReadAsVoid', 'FALSE-POSITIVE RISK', 'Known prior versions set visual booleans from phase or existence; no pixel/edge classification.'],
      ['facadeSeamsDoNotCrossOpenings', 'FALSE-POSITIVE RISK', 'No robust image/geometry intersection check.'],
    ],
  },
  {
    file: 'scripts/qa-gala-real-user-walk-physics.mjs',
    checks: [
      ['qa3d=false real-user route', 'REAL CHECK', 'Exercises non-qa3d mode when run against the studio route.'],
      ['Movement speed samples from before/after positions', 'REAL CHECK', 'Empirical position delta.'],
      ['Wall collision from measured positions and collision segments', 'REAL CHECK', 'Empirical wall/collision probe.'],
      ['Door traversal probes', 'REAL CHECK', 'Empirical open/closed movement probe if door state API is active.'],
      ['floorVisualPass/openingGapPass', 'FALSE-POSITIVE RISK', 'Visual quality cannot be trusted if derived from phase/declared state instead of image evidence.'],
    ],
  },
  {
    file: 'scripts/qa-3d-runtime-playwright.mjs',
    checks: [
      ['8 technical screenshots exist', 'WEAK CHECK', 'Valid PNGs can still show a blocked scene.'],
      ['humanReadableFrame manifest flags', 'FALSE-POSITIVE RISK', 'Prior failures show screenshots can pass harness but fail human review.'],
      ['productVisualAccepted=false', 'REAL CHECK', 'State is intentionally not accepted.'],
      ['DOM Html overlay blocking detection', 'DEAD CHECK', 'Not implemented as a hard failure.'],
    ],
  },
  {
    file: 'scripts/qa-gala-visual-construction.mjs',
    checks: [
      ['Before/after visual evidence capture', 'WEAK CHECK', 'Evidence for manual review only.'],
      ['Visual construction result booleans', 'FALSE-POSITIVE RISK', 'Mostly declared expected outcomes unless backed by explicit runtime/pixel checks.'],
      ['Synthetic/topdown debug diagrams', 'FALSE-POSITIVE RISK', 'Can represent intended layout rather than actual rendered scene.'],
    ],
  },
  {
    file: 'scripts/qa-gala-final-fit.mjs',
    checks: [
      ['Final-fit result JSON matrix', 'FALSE-POSITIVE RISK', 'Can encode intended flags without proving visible fix.'],
      ['Secondary 8-shot regression', 'WEAK CHECK', 'Does not replace close-up/manual quality review.'],
    ],
  },
  {
    file: 'scripts/qa-gala-defect-root-cause.mjs',
    checks: [
      ['Mesh inventory', 'FALSE-POSITIVE RISK', 'Previous version contained expected/static inventories rather than enough browser-derived proof.'],
      ['Root-cause result JSON', 'FALSE-POSITIVE RISK', 'Could pass while manual local review still rejects.'],
    ],
  },
];

const EXPLICIT_ACTIVE_ROUTE_FILES = new Set([
  'src/App.tsx',
  'src/pages/modularHome/ModularHomeStudioPage.tsx',
  'src/pages/modularHome/ModularHomeQuoteReview.tsx',
  'src/modules/expo/Expo3D.tsx',
  'src/modules/expo/runtime/app/Expo3D.tsx',
  'src/modules/expo/runtime/app/useExpoRuntimeSession.ts',
  'src/modules/expo/runtime/app/expo3dQa.ts',
  'src/modules/expo/runtime/world/scene/ExpoWorldCanvasShell.tsx',
  'src/modules/expo/runtime/world/scene/ExpoWorldSceneLayers.tsx',
  'src/modules/expo/runtime/world/scene/ExpoWorldPlayerLayer.tsx',
  'src/modules/expo/runtime/world/scene/Expo3DQAHook.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeDemoOverlay.tsx',
  'src/modules/expo/runtime/modularHome/HomeDesignInstanceShell.tsx',
  'src/modules/expo/runtime/modularHome/RoomPanoramaWalkthroughPanel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeUploadedModelPreview.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeProjectSummary.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeQuoteForm.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeUploadPreviewPanel.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeProjectWorkspace.tsx',
  'src/modules/expo/runtime/modularHome/ModularHomeShareLinkPanel.tsx',
  'src/modules/expo/runtime/modularHome/homeDemoFlags.ts',
  'src/modules/expo/runtime/modularHome/GalaHouseShell.tsx',
  'src/modules/expo/runtime/modularHome/GalaRoof.tsx',
  'src/modules/expo/runtime/modularHome/GalaHouseDimensions.ts',
  'src/modules/expo/runtime/modularHome/GalaFloorplan.ts',
  'src/modules/expo/runtime/modularHome/GalaDoorState.ts',
  'src/modules/expo/runtime/modularHome/GalaHouseConfig.ts',
  'src/modules/expo/runtime/modularHome/modularHomeConfig.ts',
  'src/modules/expo/runtime/modularHome/modularHomeConfigurator.ts',
  'src/modules/expo/runtime/modularHome/modularHomeProducts.ts',
  'src/modules/expo/runtime/modularHome/modularHomeQuoteReview.ts',
  'src/modules/expo/runtime/modularHome/modularHomeQuoteBackend.ts',
  'src/modules/expo/runtime/modularHome/modularHomeEstimate.ts',
  'src/modules/expo/runtime/modularHome/modularHomePricing.ts',
  'src/modules/expo/runtime/modularHome/modularHomeShareUrl.ts',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionModel.ts',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionRenderer.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaConstructionPrimitives.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaWallAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaOpeningAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaFloorCeilingAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaCladdingAssembly.tsx',
  'src/modules/expo/runtime/modularHome/construction/GalaRoomAssembly.tsx',
  'scripts/qa-gala-construction-renderer.mjs',
  'scripts/qa-gala-opening-voids.mjs',
  'scripts/qa-gala-real-user-walk-physics.mjs',
  'scripts/qa-3d-runtime-playwright.mjs',
]);

function parseArgs(argv) {
  const options = { baseUrl: DEFAULT_BASE_URL, outDir: DEFAULT_OUT_DIR };
  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    else if (arg.startsWith('--out-dir=')) options.outDir = path.resolve(arg.slice('--out-dir='.length));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileSafe(file) {
  try {
    return fs.readFileSync(path.resolve(file), 'utf8');
  } catch {
    return '';
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function extractImports(source) {
  const imports = [];
  const patterns = [
    /import\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) imports.push(match[1]);
  }
  return Array.from(new Set(imports)).sort();
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return specifier;
  const fromDir = path.dirname(fromFile);
  const candidate = path.normalize(path.join(fromDir, specifier)).replace(/\\/g, '/');
  const variants = [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, `${candidate}.mjs`, `${candidate}/index.ts`, `${candidate}/index.tsx`];
  return variants.find((variant) => RELEVANT_FILES.includes(variant)) ?? candidate;
}

function classifyFile(file, source, imports, importedBy) {
  const note = FILE_NOTES[file] ?? {};
  const lower = file.toLowerCase();
  const ownsGeometry = /<mesh|<group|GalaConstructionBox|boxGeometry|shapeGeometry|planeGeometry|extrudeGeometry/.test(source) || /construction\/Gala.*Assembly|GalaRoof|GalaHouseShell|ModularHomeModel/.test(file);
  const ownsData = /GALA_|MODULAR_HOME_|const .* = \{|type .* =|interface .* \{/.test(source) && !lower.includes('script');
  const ownsUIOverlay = /<Html|position:\s*'fixed'|data-home-demo|data-gala-door-prompt|ModularHomeDemoOverlay|Link/.test(source);
  const ownsQA = lower.includes('scripts/qa-') || lower.includes('expo3dqahook') || lower.includes('expo3dqa');
  let legacyOrCurrent = 'unknown';
  if (file.includes('/construction/') || file.endsWith('GalaHouseShell.tsx') || file.endsWith('GalaRoof.tsx') || file.endsWith('ModularHomeModel.tsx')) legacyOrCurrent = 'current';
  if (file.endsWith('GalaCeiling.tsx') || file.endsWith('GalaInterior.tsx') || file.endsWith('GalaInteriorConstruction.tsx') || file.endsWith('GalaInteriorFurniture.tsx') || file.endsWith('GalaOpenings.tsx')) legacyOrCurrent = 'legacy';
  if (file.endsWith('GalaConstructionModel.ts') || file.endsWith('GalaHouseConfig.ts') || file.endsWith('GalaFloorplan.ts') || file.endsWith('GalaHouseDimensions.ts')) legacyOrCurrent = 'adapter';
  if (lower.includes('scripts/')) legacyOrCurrent = 'current';
  const legacyRenderOnly = file.endsWith('GalaCeiling.tsx')
    || file.endsWith('GalaInterior.tsx')
    || file.endsWith('GalaInteriorConstruction.tsx')
    || file.endsWith('GalaInteriorFurniture.tsx')
    || file.endsWith('GalaOpenings.tsx');
  const activeInCurrentRoute = !legacyRenderOnly && (EXPLICIT_ACTIVE_ROUTE_FILES.has(file) || importedBy.length > 0);
  const risk = note.risk ?? (ownsUIOverlay && activeInCurrentRoute ? 'high' : ownsGeometry && legacyOrCurrent === 'legacy' ? 'medium' : ownsQA ? 'medium' : 'low');
  const responsibilities = note.responsibilities ?? [
    ownsGeometry ? 'geometry/render output' : null,
    ownsData ? 'data/config/type definitions' : null,
    ownsUIOverlay ? 'DOM/Html overlay output' : null,
    ownsQA ? 'QA/diagnostic validation' : null,
  ].filter(Boolean);
  return {
    file,
    activeInCurrentRoute,
    responsibilities,
    imports,
    importedBy,
    ownsGeometry,
    ownsData,
    ownsUIOverlay,
    ownsQA,
    legacyOrCurrent,
    risk,
    notes: note.notes ?? '',
  };
}

function buildOwnerMatrix() {
  const importMap = new Map();
  const reverse = new Map(RELEVANT_FILES.map((file) => [file, []]));
  for (const file of RELEVANT_FILES) {
    const source = readFileSafe(file);
    const imports = extractImports(source).map((specifier) => resolveImport(file, specifier));
    importMap.set(file, imports);
    for (const imported of imports) {
      if (reverse.has(imported)) reverse.get(imported).push(file);
    }
  }
  return RELEVANT_FILES.map((file) => {
    const source = readFileSafe(file);
    const imports = importMap.get(file) ?? [];
    const importedBy = reverse.get(file) ?? [];
    return classifyFile(file, source, imports, importedBy);
  });
}

async function captureRoute(page, baseUrl, route, file) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: file, fullPage: false });
}

async function collectRuntimeTrace(page) {
  return page.evaluate(() => {
    const overlaySelectors = [
      '[data-home-demo-model-label]',
      '[data-home-demo-floorplan-label]',
      '[data-home-demo-interior-zone-label]',
      '[data-home-demo-module-label]',
      '[data-home-demo-floorplan-marker-label]',
      '[data-gala-door-prompt]',
      '[data-home-design-instance-guidance]',
      '[data-home-demo-tabs]',
      'a',
      'button',
    ];
    const all = Array.from(document.querySelectorAll(overlaySelectors.join(',')));
    const overlays = all.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tagName: element.tagName,
        text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 260),
        attributes: Array.from(element.attributes).reduce((acc, attr) => {
          if (attr.name.startsWith('data-') || attr.name === 'href') acc[attr.name] = attr.value;
          return acc;
        }, {}),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        visible: rect.width > 0 && rect.height > 0,
        zIndex: getComputedStyle(element).zIndex,
        position: getComputedStyle(element).position,
      };
    });
    const largeLabel = overlays.find((overlay) => /40\s*M|40\s*m|Compact Timber 40|MODULAR LAYOUT/i.test(overlay.text));
    const sceneMeshInventory = window.__WARPALA_3D_QA__?.getSceneMeshInventory?.() ?? null;
    return {
      href: window.location.href,
      documentTitle: document.title,
      canvasCount: document.querySelectorAll('canvas').length,
      qaHookPresent: Boolean(window.__WARPALA_3D_QA__),
      doorApiPresent: Boolean(window.__WARPALA_GALA_DOOR_API__),
      domOverlayInventory: overlays,
      largeBlockingLabelCandidate: largeLabel ?? null,
      sceneMeshInventory,
      meshInventorySummary: Array.isArray(sceneMeshInventory)
        ? {
            count: sceneMeshInventory.length,
            namesContainingLabel: sceneMeshInventory.filter((item) => /label|text|html|40|compact/i.test(item.name || '')).map((item) => item.name),
          }
        : null,
    };
  });
}

function writeArchitectureAudit(outDir, matrix, renderTrace) {
  const blockers = [
    'The 40 m² / Compact Timber 40 label is owned by ModularHomeModel.tsx as a Drei Html overlay outside GalaConstructionRenderer.',
    'The active GALA route still mounts GalaRoof as a sibling of GalaConstructionRenderer inside GalaHouseShell.',
    'Construction model data is not a complete single source: furniture and some trim/opening interruption data are hardcoded in assemblies.',
    'QA scripts can pass on mesh counts, userData flags, screenshot existence, or phase-derived booleans while the visible product is broken.',
    'DOM overlays are not part of mesh traversal, so a major scene-blocking regression is invisible to the current construction renderer QA.',
  ];
  const duplicateRows = [
    ['Large model label', 'ModularHomeModel.tsx', 'modularHomeConfig.ts', 'Outside renderer and invisible to mesh inventory.'],
    ['Roof/eaves/gutters', 'GalaRoof.tsx', 'GalaHouseShell.tsx + GalaConstructionRenderer gable/base trim', 'Active sibling of construction renderer.'],
    ['Door/opening data', 'GalaConstructionModel.ts + GalaFloorplan.ts + GalaHouseDimensions.ts', 'GalaOpeningAssembly.tsx / FloorCeilingAssembly.tsx', 'Visual/collision/trim interruption ownership split.'],
    ['Furniture anchors/meshes', 'GalaConstructionModel.ts', 'GalaRoomAssembly.tsx', 'Anchors declared separately but mesh positions remain hardcoded.'],
    ['Cutaway transparency', 'GalaHouseShell.tsx', 'GalaConstructionRenderer + GalaRoof', 'Must be propagated to multiple active render owners.'],
    ['QA acceptance', 'scripts/qa-gala-*.mjs', 'manual screenshots', 'Automated results do not reliably represent human visual acceptance.'],
  ];
  const activeFiles = matrix.filter((item) => item.activeInCurrentRoute).map((item) => `- \`${item.file}\` (${item.legacyOrCurrent}, risk: ${item.risk})`).join('\n');
  const deadLegacy = matrix.filter((item) => !item.activeInCurrentRoute && item.legacyOrCurrent === 'legacy').map((item) => `- \`${item.file}\``).join('\n') || '- None identified in this matrix.';
  const label = renderTrace?.largeBlockingLabelCandidate;
  const text = `# GALA Full Architecture Audit

Generated: ${new Date().toISOString()}

## Executive Summary

The previous "construction renderer reset" did not prove a single-source renderer. The current route still has multiple active render owners and a blocking DOM/Drei Html label that is outside the construction renderer. The audit therefore leaves \`productVisualAccepted=false\`, \`stagingDeployAllowed=false\`, and \`singleSourceRendererProven=false\`.

## Current Active Render Tree

1. \`src/App.tsx\` maps \`/modular-homes/studio\` to \`ModularHomeStudioPage\`.
2. \`ModularHomeStudioPage.tsx\` canonicalizes \`view=exterior|interior\`, preserves only \`qa3d=1\`, renders fixed route chrome, and lazy-loads \`Expo3D\`.
3. \`src/modules/expo/Expo3D.tsx\` re-exports \`runtime/app/Expo3D.tsx\`.
4. \`runtime/app/Expo3D.tsx\` owns home-studio start state and still mounts \`ModularHomeDemoOverlay\`.
5. \`ExpoWorldCanvasShell.tsx\` and \`ExpoWorldSceneLayers.tsx\` mount home-studio scene layers.
6. \`ExpoWorldSceneLayers.tsx\` mounts \`ModularHomeModel\` and \`ModularHomeUploadedModelPreview\` in home-studio mode.
7. \`ModularHomeModel.tsx\` mounts \`GalaHouseShell\` and separately renders the large model label Html overlay.
8. \`GalaHouseShell.tsx\` mounts \`GalaConstructionRenderer\` and \`GalaRoof\`.
9. \`GalaConstructionRenderer.tsx\` mounts construction wall/opening/floor/ceiling/cladding/room assemblies.
10. \`ExpoWorldPlayerLayer.tsx\` separately owns movement, collision, door state interaction, and door prompt Html.

## Blocking Label Owner

- Owner file: \`src/modules/expo/runtime/modularHome/ModularHomeModel.tsx\`
- Owner lines: the \`<Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">\` block with \`data-home-demo-model-label="true"\`.
- Text source: \`src/modules/expo/runtime/modularHome/modularHomeConfig.ts\`, \`sizeLabel: '40 m²'\` and \`name: 'Compact Timber 40'\`.
- Runtime DOM evidence: ${label ? `\`${label.text}\` at rect ${JSON.stringify(label.rect)}` : 'not captured in this run; static source still proves ownership.'}
- Why QA missed it: it is a Drei Html/DOM overlay, not a Three.js mesh. \`getSceneMeshInventory()\` cannot see it.

## Active vs Dead vs Legacy-But-Still-Mounted

### Active
${activeFiles}

### Legacy/Support Files Not Proved Active
${deadLegacy}

## Single-Source Truth Assessment

Verdict: **not proven**.

\`GalaConstructionModel.ts\` is a useful adapter, but the active renderer is not exclusively sourced from it. \`GalaRoof.tsx\` is active outside the construction renderer. \`ModularHomeModel.tsx\` still owns visible Html labels. \`GalaRoomAssembly.tsx\` hardcodes furniture meshes independent of the declared furniture anchors. \`GalaFloorCeilingAssembly.tsx\` contains local trim/opening interruption logic. Door behavior is split between visual opening assemblies, \`GalaDoorState.ts\`, \`GalaFloorplan.ts\`, and \`ExpoWorldPlayerLayer.tsx\`.

## Duplicate Ownership Table

| Responsibility | Owner A | Owner B | Audit finding |
| --- | --- | --- | --- |
${duplicateRows.map((row) => `| ${row[0]} | \`${row[1]}\` | \`${row[2]}\` | ${row[3]} |`).join('\n')}

## Regression Root-Cause Hypotheses Ranked By Evidence

1. **P0: DOM label outside construction renderer blocks the scene.** Static source and runtime DOM inventory identify the owner. Mesh QA cannot catch it.
2. **P0: Renderer reset did not replace all active render owners.** \`GalaRoof\` and \`ModularHomeModel\` remain active siblings/parents outside the construction renderer.
3. **P0: QA false-positive risk is systemic.** Several pass conditions depend on flags/counts/screenshots existing rather than visual classification or ownership proof.
4. **P1: Construction model is an adapter, not the only source.** Openings, trims, furniture, roof, and door behavior still have duplicate owners.
5. **P1: Evidence provenance is incomplete.** Visual ZIPs and source ZIPs do not prove reproducibility because evidence scripts can classify weakly and source can change outside artifact capture.

## Exact Blocker List

${blockers.map((blocker) => `- ${blocker}`).join('\n')}

## Minimal Remediation Plan (Do Not Implement In This Audit)

1. Remove or gate the \`ModularHomeModel.tsx\` global Html model label from real-user studio views, then add DOM overlay blocking detection to QA.
2. Define a renderer ownership contract: \`GalaHouseShell\` should mount exactly one visual construction owner, with \`GalaRoof\` either moved inside the construction renderer/model or documented as an explicit adapter.
3. Move furniture, ceiling trim interruptions, and opening reveal dimensions into \`GalaConstructionModel\` or named adapters with one-way dependencies.
4. Replace QA pass booleans that depend on flags/counts/screenshot existence with direct checks: DOM overlay occlusion, pixel/edge close-up classification, measured collision/door traversal, and scene/DOM trace diffing.
5. Require every evidence ZIP to contain source git SHA/status, script version, route URL, DOM trace, mesh trace, and validation command outputs.
`;
  fs.writeFileSync(path.join(outDir, 'ARCHITECTURE_AUDIT.md'), text);
}

function writeQaAudit(outDir) {
  const rows = QA_SCRIPT_AUDITS.flatMap((script) => script.checks.map((check) => ({ file: script.file, check: check[0], classification: check[1], notes: check[2] })));
  const text = `# QA Audit

Generated: ${new Date().toISOString()}

The current QA stack contains useful probes, but it is not trustworthy as product visual acceptance. Several checks can pass while the product is visibly broken. Product visual acceptance remains false.

| Script | Condition | Classification | Notes |
| --- | --- | --- | --- |
${rows.map((row) => `| \`${row.file}\` | ${row.check} | **${row.classification}** | ${row.notes} |`).join('\n')}

## Cross-Cutting Problems

- Mesh traversal excludes Drei Html and DOM overlays, including the current blocking \`40 m² / Compact Timber 40\` label.
- Screenshot existence is often treated as proof, but saved PNGs require human or pixel-level review.
- \`userData\` flags can represent intent rather than actual visual outcome.
- Mesh counts can prove that objects exist, not that they own responsibility or look correct.
- Synthetic debug SVG/topdown evidence can diverge from actual runtime scene rendering.
- \`productVisualAccepted\` must remain \`false\` until manual review accepts the visible result.
`;
  fs.writeFileSync(path.join(outDir, 'QA_AUDIT.md'), text);
}

function writeVisualRegressionReport(outDir, renderTrace) {
  const label = renderTrace?.largeBlockingLabelCandidate;
  const text = `# Visual Regression Report

Generated: ${new Date().toISOString()}

## Current Local Reproduction

- Exterior route: \`${ROUTES.exterior}\`
- Interior route: \`${ROUTES.interior}\`
- Quote review route: \`${ROUTES.quoteReview}\`

## Findings

| Question | Verdict | Evidence |
| --- | --- | --- |
| Exterior is readable | **Blocked / needs human review** | Current screenshot captured to \`manual-repro/current-exterior.png\`; DOM overlay inventory finds label candidate. |
| Interior is readable | **Blocked / needs human review** | Current screenshot captured to \`manual-repro/current-interior.png\`; renderer ownership is still fragmented. |
| Label overlay is blocking | **Yes** | ${label ? `Runtime DOM text: \`${label.text}\`, rect: \`${JSON.stringify(label.rect)}\`.` : 'Static source proves label ownership; runtime capture did not find the candidate.'} |
| Start outside / start inside behavior is correct | **Not accepted by this audit** | Route exists, but this audit did not claim behavior acceptance. Previous route owner canonicalizes view state. |
| Quote review route still works | **Route screenshot captured, not business-smoke accepted** | \`manual-repro/quote-review-route.png\` captured if local route loaded. Backend/quote was not modified. |
| Walking/collision remains intact | **Not re-certified here** | Existing physics scripts are audited separately; no runtime changes were made. |

## Product State

\`productVisualAccepted=false\`. \`stagingDeployAllowed=false\`. The audit identifies a visual regression and QA false-positive risks; it does not fix or accept the product.
`;
  fs.writeFileSync(path.join(outDir, 'VISUAL_REGRESSION_REPORT.md'), text);
}

function writeReproduction(outDir, options, commands) {
  const text = `# Reproduction

Generated: ${new Date().toISOString()}

## Environment

- Working directory: \`${process.cwd()}\`
- Base URL: \`${options.baseUrl}\`
- Output folder: \`${options.outDir}\`
- Node: \`${process.version}\`

## Commands Run / Intended For Audit Round

${commands.map((command) => `- \`${command}\``).join('\n')}

## Local Routes Captured

- \`${options.baseUrl}${ROUTES.exterior}\`
- \`${options.baseUrl}${ROUTES.interior}\`
- \`${options.baseUrl}${ROUTES.quoteReview}\`

## Notes

- No staging deploy was performed.
- No product renderer, camera, route, backend, auth, quote, payment, or QA semantics were changed by this audit script.
- Runtime trace uses browser DOM inspection and, where available, \`window.__WARPALA_3D_QA__.getSceneMeshInventory()\`.
`;
  fs.writeFileSync(path.join(outDir, 'REPRODUCTION.md'), text);
}

function writeAuditStatus(outDir) {
  writeJson(path.join(outDir, 'AUDIT_STATUS.json'), {
    architectureAuditPassed: false,
    productVisualAccepted: false,
    stagingDeployAllowed: false,
    visualRegressionPresent: true,
    evidenceProvenanceComplete: false,
    singleSourceRendererProven: false,
    qaFalsePositiveRiskPresent: true,
    blockingFindings: [
      'Blocking 40 m² / Compact Timber 40 label is a DOM/Drei Html overlay owned by ModularHomeModel.tsx and missed by mesh traversal.',
      'GalaHouseShell still mounts GalaRoof outside GalaConstructionRenderer.',
      'GalaConstructionModel is not the sole source for furniture, roof, labels, trim interruptions, or door runtime behavior.',
      'QA scripts contain weak/false-positive checks based on flags, counts, screenshot existence, or phase state.',
      'Evidence provenance is incomplete; source and visual artifacts do not prove reproducibility or visual acceptance.',
    ],
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manualDir = path.join(options.outDir, 'manual-repro');
  const debugDir = path.join(options.outDir, 'debug');
  ensureDir(options.outDir);
  ensureDir(manualDir);
  ensureDir(debugDir);

  const matrix = buildOwnerMatrix();
  writeJson(path.join(options.outDir, 'FILE_OWNER_MATRIX.json'), matrix);

  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const routeStatuses = {};
  let renderTrace = {
    error: 'runtime capture did not run',
    domOverlayInventory: [],
    sceneMeshInventory: null,
    largeBlockingLabelCandidate: null,
  };

  try {
    await page.addInitScript(() => {
      window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
    });
    const response = await page.goto(`${options.baseUrl}${ROUTES.exterior}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    routeStatuses.exterior = response?.status() ?? null;
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(manualDir, 'current-exterior.png'), fullPage: false });
    const canvas = page.locator('canvas').first();
    await canvas.screenshot({ path: path.join(manualDir, 'current-exterior-canvas.png') }).catch(() => {});
    renderTrace = await collectRuntimeTrace(page);

    const interiorResponse = await page.goto(`${options.baseUrl}${ROUTES.interior}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    routeStatuses.interior = interiorResponse?.status() ?? null;
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(manualDir, 'current-interior.png'), fullPage: false });
    await page.locator('canvas').first().screenshot({ path: path.join(manualDir, 'current-interior-canvas.png') }).catch(() => {});

    const quoteResponse = await page.goto(`${options.baseUrl}${ROUTES.quoteReview}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    routeStatuses.quoteReview = quoteResponse?.status() ?? null;
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(manualDir, 'quote-review-route.png'), fullPage: false });
  } catch (error) {
    renderTrace.captureError = error instanceof Error ? error.message : String(error);
  } finally {
    await browser.close();
  }

  renderTrace.routeStatuses = routeStatuses;
  renderTrace.staticRenderPath = [
    'App.tsx:/modular-homes/studio',
    'ModularHomeStudioPage.tsx',
    'Expo3D.tsx re-export',
    'runtime/app/Expo3D.tsx',
    'ExpoWorldCanvasShell.tsx',
    'ExpoWorldSceneLayers.tsx',
    'ModularHomeModel.tsx',
    'GalaHouseShell.tsx',
    'GalaConstructionRenderer.tsx + GalaRoof.tsx',
  ];
  writeJson(path.join(options.outDir, 'RENDER_TRACE.json'), renderTrace);
  writeJson(path.join(debugDir, 'dom-overlay-inventory.json'), renderTrace.domOverlayInventory ?? []);
  writeJson(path.join(debugDir, 'runtime-mesh-inventory.json'), renderTrace.sceneMeshInventory ?? []);
  writeJson(path.join(debugDir, 'html-text-inventory.json'), (renderTrace.domOverlayInventory ?? []).filter((item) => item.text));

  writeArchitectureAudit(options.outDir, matrix, renderTrace);
  writeQaAudit(options.outDir);
  writeVisualRegressionReport(options.outDir, renderTrace);
  writeReproduction(options.outDir, options, [
    'node scripts/qa-gala-full-architecture-audit.mjs --base-url=http://127.0.0.1:5173 --out-dir=<audit-folder>',
    'npm run build',
    'npm run lint',
    'node --check scripts/qa-gala-construction-renderer.mjs',
    'node --check scripts/qa-gala-opening-voids.mjs',
    'node --check scripts/qa-gala-real-user-walk-physics.mjs',
    'node --check scripts/qa-3d-runtime-playwright.mjs',
  ]);
  writeAuditStatus(options.outDir);

  console.log(JSON.stringify({
    ok: true,
    outDir: options.outDir,
    routeStatuses,
    labelOwner: 'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
    productVisualAccepted: false,
    stagingDeployAllowed: false,
    singleSourceRendererProven: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
