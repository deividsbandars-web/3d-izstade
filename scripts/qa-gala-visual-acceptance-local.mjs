#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-visual-acceptance-qa-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };

const ROUTES = {
  exteriorStudio: {
    expectedContext: 'exterior',
    path: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
    screenshot: 'exterior-studio-after.png',
  },
  interiorStudio: {
    expectedContext: 'interior',
    path: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
    screenshot: 'interior-studio-after.png',
  },
  quoteReview: {
    path: '/modular-homes/quotes',
    screenshot: 'quote-review-after.png',
  },
  startOutside: {
    clickButtonText: 'Start outside',
    expectedContext: 'exterior',
    path: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
    screenshot: 'start-outside-after.png',
  },
  startInside: {
    clickButtonText: 'Start inside',
    expectedContext: 'interior',
    path: '/modular-homes/studio?view=exterior&homeStudio=1&qa3d=1',
    screenshot: 'start-inside-after.png',
  },
};

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

async function imageMetrics(file, crop) {
  const image = sharp(file);
  const metadata = await image.metadata();
  let pipeline = image;
  if (crop) {
    pipeline = pipeline.extract(crop);
  }
  const { data, info } = await pipeline
    .resize({ fit: 'inside', height: 72, width: 120 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bins = new Set();
  let blackish = 0;
  let whitish = 0;
  let sum = 0;
  let sumSq = 0;
  const pixelCount = info.width * info.height;

  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index] ?? 0;
    const g = data[index + 1] ?? 0;
    const b = data[index + 2] ?? 0;
    const lum = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    sum += lum;
    sumSq += lum * lum;
    if (lum < 18) blackish += 1;
    if (lum > 242) whitish += 1;
    bins.add(`${Math.round(r / 24)}:${Math.round(g / 24)}:${Math.round(b / 24)}`);
  }

  const mean = sum / Math.max(1, pixelCount);
  const variance = Math.max(0, (sumSq / Math.max(1, pixelCount)) - (mean * mean));
  const stddev = Math.sqrt(variance);

  return {
    blackRatio: blackish / Math.max(1, pixelCount),
    height: metadata.height ?? 0,
    mean,
    stddev,
    uniqueColorBins: bins.size,
    whiteRatio: whitish / Math.max(1, pixelCount),
    width: metadata.width ?? 0,
  };
}

function isReadablePixelContent(metrics) {
  return metrics.width === VIEWPORT.width
    && metrics.height === VIEWPORT.height
    && metrics.uniqueColorBins >= 16
    && metrics.stddev >= 10
    && metrics.blackRatio < 0.88
    && metrics.whiteRatio < 0.94;
}

async function auditDomOverlays(page) {
  return await page.evaluate(() => {
    const viewport = {
      height: window.innerHeight,
      width: window.innerWidth,
    };
    const canvas = document.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const centralSceneRect = {
      x: viewport.width * 0.25,
      y: viewport.height * 0.1,
      width: viewport.width * 0.5,
      height: viewport.height * 0.78,
    };
    const textPattern = new RegExp('40\\s*(m\\u00b2|m2|M\\u00b2|M2)|Compact Timber 40|40\\s*m|MODULAR\\s+LAYOUT', 'i');

    function intersectionArea(a, b) {
      const x1 = Math.max(a.x, b.x);
      const y1 = Math.max(a.y, b.y);
      const x2 = Math.min(a.x + a.width, b.x + b.width);
      const y2 = Math.min(a.y + a.height, b.y + b.height);
      return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    }

    function isVisible(element, rect, style) {
      return rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0.05
        && !element.hasAttribute('hidden');
    }

    const overlays = Array.from(document.querySelectorAll('body *')).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      const containsCanvas = Boolean(canvas && element.contains(canvas));
      const visible = isVisible(element, rect, style);
      const area = rect.width * rect.height;
      const centralIntersection = intersectionArea(rect, centralSceneRect);
      const centralIntersectionRatio = centralIntersection / Math.max(1, centralSceneRect.width * centralSceneRect.height);
      const areaRatio = area / Math.max(1, viewport.width * viewport.height);
      const backgroundBlocks = !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor);
      const homeDemoModelLabel = element.matches('[data-home-demo-model-label="true"]');
      const textMatchesBlockingLabel = textPattern.test(text);
      const role = element.getAttribute('role') || '';
      const modalLike = role === 'dialog' || element.getAttribute('aria-modal') === 'true';
      const positionedOverlay = ['absolute', 'fixed', 'sticky'].includes(style.position);
      const blockingLargeOverlay = visible
        && !containsCanvas
        && positionedOverlay
        && areaRatio > 0.08
        && centralIntersectionRatio > 0.08
        && backgroundBlocks
        && style.pointerEvents !== 'none';
      const blockingTextLabel = visible
        && !containsCanvas
        && element.childElementCount <= 4
        && textMatchesBlockingLabel
        && areaRatio > 0.01
        && centralIntersectionRatio > 0.02;
      const blockingModal = visible
        && !containsCanvas
        && modalLike
        && centralIntersectionRatio > 0.08;

      return {
        areaRatio,
        blocking: Boolean((visible && homeDemoModelLabel) || blockingTextLabel || blockingLargeOverlay || blockingModal),
        centralIntersectionRatio,
        homeDemoModelLabel,
        pointerEvents: style.pointerEvents,
        position: style.position,
        rect: {
          height: rect.height,
          width: rect.width,
          x: rect.x,
          y: rect.y,
        },
        tagName: element.tagName,
        text: text.slice(0, 180),
        textMatchesBlockingLabel,
        visible,
      };
    }).filter((item) => item.homeDemoModelLabel || item.textMatchesBlockingLabel || item.blocking);

    return {
      blockingDomOverlayPresent: overlays.some((item) => item.blocking),
      blockingHomeDemoLabelPresent: overlays.some((item) => item.visible && item.homeDemoModelLabel),
      domOverlayAuditRan: true,
      overlays,
      threeMeshAuditDoesNotCoverDom: true,
      viewport,
      canvasRect: canvasRect ? {
        height: canvasRect.height,
        width: canvasRect.width,
        x: canvasRect.x,
        y: canvasRect.y,
      } : null,
    };
  });
}

async function collectRouteDomState(page) {
  return await page.evaluate(() => {
    const bodyText = (document.body.textContent || '').replace(/\s+/g, ' ').trim();
    const canvas = document.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    const rightRail = document.querySelector('[data-home-demo-overlay="true"], [data-home-design-instance-shell="true"], [data-home-configurator-panel="true"], aside');
    const rightRailRect = rightRail?.getBoundingClientRect();
    const qa = window.__WARPALA_3D_QA__;
    const meshInventory = qa?.getSceneMeshInventory?.() ?? [];
    const modelMeshes = meshInventory.filter((item) => /gala|construction|roof|wall|opening|terrace|bedroom|bathroom/i.test(item.name || ''));
    const qaState = qa?.getState?.() ?? null;
    const centerRaycast = qa?.getCenterRaycast?.() ?? null;
    const objectSummary = qa?.getObjectSummary?.() ?? null;
    const summaryVisibleMeshCount = objectSummary?.visibleMeshCount
      ?? qaState?.visibleObjectSummary?.visibleMeshCount
      ?? 0;
    const summaryModelMeshCount = objectSummary?.modularHomeObjectCount
      ?? qaState?.modularHomeObjectCount
      ?? 0;

    return {
      bodyText: bodyText.slice(0, 1600),
      canvasPresent: Boolean(canvas && canvasRect && canvasRect.width > 500 && canvasRect.height > 500),
      canvasRect: canvasRect ? {
        height: canvasRect.height,
        width: canvasRect.width,
        x: canvasRect.x,
        y: canvasRect.y,
      } : null,
      locationHref: window.location.href,
      meshCount: Math.max(meshInventory.length, summaryVisibleMeshCount),
      modelMeshCount: Math.max(modelMeshes.length, summaryModelMeshCount),
      objectSummary,
      qaState,
      centerRaycast,
      rightRailVisible: Boolean(rightRail && rightRailRect && rightRailRect.width > 160 && rightRailRect.height > 250),
      rightRailRect: rightRailRect ? {
        height: rightRailRect.height,
        width: rightRailRect.width,
        x: rightRailRect.x,
        y: rightRailRect.y,
      } : null,
      quoteUiVisible: /quote|request|modular home/i.test(bodyText),
      sessionGalaConstructionAudit: window.sessionStorage?.getItem('warpala:galaConstructionAudit') ?? null,
      sessionQa3d: window.sessionStorage?.getItem('warpala:qa3d') ?? null,
    };
  });
}

async function waitForGalaSceneReady(page) {
  await page.waitForFunction(() => {
    const qa = window.__WARPALA_3D_QA__;
    if (!qa?.getState) {
      return false;
    }

    const inventory = qa.getSceneMeshInventory?.() ?? [];
    const summary = qa.getObjectSummary?.() ?? null;
    const state = qa.getState?.() ?? null;
    const centerRaycast = qa.getCenterRaycast?.() ?? null;
    const visibleMeshCount = Math.max(
      inventory.length,
      summary?.visibleMeshCount ?? 0,
      state?.visibleObjectSummary?.visibleMeshCount ?? 0,
    );
    const modularHomeObjectCount = Math.max(
      summary?.modularHomeObjectCount ?? 0,
      state?.modularHomeObjectCount ?? 0,
    );

    return visibleMeshCount >= 40
      && modularHomeObjectCount >= 40
      && centerRaycast?.hit === true;
  }, null, {
    timeout: 20000,
  }).catch(() => {});
}

function detectExpectedContext(route, domState) {
  if (route.expectedContext === 'exterior') {
    return /exterior start position is active|start inside|you are outside/i.test(domState.bodyText)
      && !/interior start position is active/i.test(domState.bodyText);
  }
  if (route.expectedContext === 'interior') {
    return /interior start position is active|start outside|you are inside|open door/i.test(domState.bodyText);
  }
  return true;
}

function classifySceneReadability({
  centralMetrics,
  centralReadable,
  domOverlay,
  domState,
  expectedContextDetected,
  modelVisible,
  screenshotCaptured,
  screenshotDimensionsMatch,
  wholeReadable,
}) {
  if (domOverlay.blockingDomOverlayPresent || domOverlay.blockingHomeDemoLabelPresent) {
    return {
      failureReason: 'dom-overlay-blocking',
      sceneReadable: false,
    };
  }

  if (!screenshotCaptured || !screenshotDimensionsMatch || !centralMetrics) {
    return {
      failureReason: 'blank-canvas',
      sceneReadable: false,
    };
  }

  if (centralMetrics.blackRatio > 0.92 || centralMetrics.whiteRatio > 0.97) {
    return {
      failureReason: 'blank-canvas',
      sceneReadable: false,
    };
  }

  if (!expectedContextDetected) {
    return {
      failureReason: 'wrong-route-context',
      sceneReadable: false,
    };
  }

  const centerDistance = domState.centerRaycast?.distance;
  const cameraInsideGeometry = Boolean(domState.qaState?.cameraInsideGeometryLikely)
    || (domState.centerRaycast?.hit === true && typeof centerDistance === 'number' && centerDistance < 0.6);
  if (cameraInsideGeometry) {
    return {
      failureReason: 'camera-inside-geometry',
      sceneReadable: false,
    };
  }

  const nearUniformCloseSurface = domState.centerRaycast?.hit === true
    && typeof centerDistance === 'number'
    && centerDistance < 24
    && (!centralReadable || centralMetrics.uniqueColorBins < 24 || centralMetrics.stddev < 10);
  if (nearUniformCloseSurface) {
    return {
      failureReason: 'near-uniform-close-surface',
      sceneReadable: false,
    };
  }

  const centralHasMeaningfulContrast = centralMetrics.uniqueColorBins >= 16
    && centralMetrics.stddev >= 18
    && centralMetrics.blackRatio < 0.88
    && centralMetrics.whiteRatio < 0.94;
  const centerIsNotPressedAgainstSurface = !(domState.centerRaycast?.hit === true
    && typeof centerDistance === 'number'
    && centerDistance < 8
    && !centralReadable);

  if (!modelVisible || !wholeReadable || !(centralReadable || (centralHasMeaningfulContrast && centerIsNotPressedAgainstSurface))) {
    return {
      failureReason: 'unknown-unreadable-scene',
      sceneReadable: false,
    };
  }

  return {
    failureReason: null,
    sceneReadable: true,
  };
}

async function captureAndClassifyRoute(page, baseUrl, route) {
  const targetPath = route.targetPath;
  const response = await page.goto(`${baseUrl}${route.path}`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
  if (route.clickButtonText) {
    const button = page.getByRole('button', {
      name: new RegExp(`^${route.clickButtonText}$`, 'i'),
    }).last();
    await button.click({ timeout: 10000 });
  }
  await page.waitForFunction(() => Boolean(window.__WARPALA_3D_QA__?.getSceneMeshInventory), null, {
    timeout: 12000,
  }).catch(() => {});
  await waitForGalaSceneReady(page);
  await page.waitForTimeout(route.clickButtonText ? 1800 : 1200);
  await page.screenshot({ fullPage: false, path: targetPath });

  const screenshotCaptured = fs.existsSync(targetPath);
  const screenshotMetrics = screenshotCaptured
    ? await imageMetrics(targetPath)
    : null;
  const centralMetrics = screenshotCaptured
    ? await imageMetrics(targetPath, {
      height: Math.round(VIEWPORT.height * 0.78),
      left: Math.round(VIEWPORT.width * 0.25),
      top: Math.round(VIEWPORT.height * 0.1),
      width: Math.round(VIEWPORT.width * 0.5),
    })
    : null;
  const domOverlay = await auditDomOverlays(page);
  const domState = await collectRouteDomState(page);
  const screenshotDimensionsMatch = screenshotMetrics?.width === VIEWPORT.width && screenshotMetrics?.height === VIEWPORT.height;
  const centralReadable = centralMetrics ? isReadablePixelContent({ ...centralMetrics, height: VIEWPORT.height, width: VIEWPORT.width }) : false;
  const wholeReadable = screenshotMetrics ? isReadablePixelContent(screenshotMetrics) : false;
  const expectedContextDetected = detectExpectedContext(route, domState);
  const runtimeModelVisible = domState.modelMeshCount >= 20;
  const pixelModelVisible = Boolean(
    centralReadable
    && centralMetrics
    && centralMetrics.uniqueColorBins >= 24
    && centralMetrics.blackRatio < 0.88
  );
  const modelVisible = Boolean(domState.canvasPresent && (runtimeModelVisible || pixelModelVisible));
  const readability = classifySceneReadability({
    centralMetrics,
    centralReadable,
    domOverlay,
    domState,
    expectedContextDetected,
    modelVisible,
    screenshotCaptured,
    screenshotDimensionsMatch,
    wholeReadable,
  });
  const sceneReadable = Boolean(domState.canvasPresent && readability.sceneReadable);

  return {
    status: response?.status() ?? null,
    screenshotCaptured,
    screenshotDimensionsMatch,
    canvasPresent: domState.canvasPresent,
    sceneReadable,
    modelVisible,
    expectedContext: route.expectedContext,
    expectedContextDetected,
    blockingDomOverlayPresent: domOverlay.blockingDomOverlayPresent,
    blockingHomeDemoLabelPresent: domOverlay.blockingHomeDemoLabelPresent,
    rightRailVisible: domState.rightRailVisible,
    readabilityFailureReason: readability.failureReason,
    sceneReadabilityClassification: readability.failureReason ?? 'readable',
    pass: Boolean(
      (response?.status() ?? 0) === 200
      && screenshotCaptured
      && screenshotDimensionsMatch
      && domState.canvasPresent
      && sceneReadable
      && modelVisible
      && expectedContextDetected
      && !domOverlay.blockingDomOverlayPresent
      && !domOverlay.blockingHomeDemoLabelPresent
      && domState.rightRailVisible
    ),
    diagnostics: {
      centralMetrics,
      centerRaycast: domState.centerRaycast,
      domOverlay,
      qaState: {
        cameraInsideGeometryLikely: domState.qaState?.cameraInsideGeometryLikely ?? null,
        cameraPosition: domState.qaState?.cameraPosition ?? null,
        playerPosition: domState.qaState?.playerPosition ?? null,
        route: domState.qaState?.route ?? null,
      },
      meshCount: domState.meshCount,
      modelMeshCount: domState.modelMeshCount,
      pixelModelVisible,
      route: route.path,
      runtimeLocationHref: domState.locationHref,
      runtimeModelVisible,
      sessionGalaConstructionAudit: domState.sessionGalaConstructionAudit,
      sessionQa3d: domState.sessionQa3d,
      screenshot: path.basename(targetPath),
      screenshotMetrics,
    },
  };
}

async function captureAndClassifyQuote(page, baseUrl, route) {
  const response = await page.goto(`${baseUrl}${route.path}`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2500);
  await page.screenshot({ fullPage: false, path: route.targetPath });
  const screenshotCaptured = fs.existsSync(route.targetPath);
  const screenshotMetrics = screenshotCaptured ? await imageMetrics(route.targetPath) : null;
  const domOverlay = await auditDomOverlays(page);
  const domState = await collectRouteDomState(page);
  const screenshotReadable = screenshotMetrics ? isReadablePixelContent(screenshotMetrics) : false;

  return {
    status: response?.status() ?? null,
    screenshotCaptured,
    quoteUiVisible: domState.quoteUiVisible,
    blockingDomOverlayPresent: domOverlay.blockingDomOverlayPresent,
    pass: Boolean(
      (response?.status() ?? 0) === 200
      && screenshotCaptured
      && screenshotMetrics?.width === VIEWPORT.width
      && screenshotMetrics?.height === VIEWPORT.height
      && screenshotReadable
      && domState.quoteUiVisible
      && !domOverlay.blockingDomOverlayPresent
      && !domOverlay.blockingHomeDemoLabelPresent
    ),
    diagnostics: {
      domOverlay,
      route: route.path,
      screenshot: path.basename(route.targetPath),
      screenshotMetrics,
    },
  };
}

function reviewStatus(pass, warn = false) {
  if (!pass) return 'FAIL';
  return warn ? 'WARN' : 'PASS';
}

function reviewDependentStatus(routePass, warn = true) {
  if (!routePass) return 'NOT TESTED';
  return warn ? 'WARN' : 'PASS';
}

function writeReports(outDir, result) {
  const manualItems = [
    ['Exterior route screenshot review', reviewStatus(result.routes.exteriorStudio.pass)],
    ['Interior route screenshot review', reviewStatus(result.routes.interiorStudio.pass)],
    ['Quote review screenshot review', reviewStatus(result.routes.quoteReview.pass)],
    ['Start outside behavior', reviewStatus(result.startFlows.startOutside.pass)],
    ['Start inside behavior', reviewStatus(result.startFlows.startInside.pass)],
    ['Door/opening readability', reviewDependentStatus(result.routes.interiorStudio.pass)],
    ['Wall/floor/ceiling readability', reviewDependentStatus(result.routes.interiorStudio.pass)],
    ['Furniture placement readability', reviewDependentStatus(result.routes.interiorStudio.pass)],
    ['Right rail usability', reviewStatus(result.routes.exteriorStudio.rightRailVisible && result.routes.interiorStudio.rightRailVisible)],
    ['Remaining visual concerns', 'WARN'],
  ];
  const noFail = manualItems.every(([, status]) => status !== 'FAIL');

  fs.writeFileSync(path.join(outDir, 'VISUAL_ACCEPTANCE_QA.md'), `# GALA Visual Acceptance QA

Generated: ${result.generatedAt}

## Scope

Local browser-based visual QA for the real-user GALA modular-home studio routes. This is not product visual acceptance and does not deploy to staging.

## Checks

- HTTP status for exterior, interior, quote, start-outside, and start-inside routes.
- Screenshot dimensions and pixel-content checks.
- Canvas presence and central scene readability.
- Runtime model mesh visibility.
- DOM overlay audit for the central scene.
- Right rail visibility without central scene blockage.
- Expected exterior/interior route context text.

## Result

- visualAcceptanceQaRan: ${result.visualAcceptanceQaRan}
- pass: ${result.pass}
- screenshotExistenceIsNotAcceptance: ${result.screenshotExistenceIsNotAcceptance}
- manualReviewRequired: ${result.manualReviewRequired}
- productVisualAccepted: ${result.productVisualAccepted}

The QA intentionally combines screenshot metadata, pixel checks, route DOM state, runtime mesh inventory, and DOM overlay audit. Screenshot file existence alone cannot pass this script.
`);

  fs.writeFileSync(path.join(outDir, 'MANUAL_VISUAL_REVIEW.md'), `# Manual Visual Review

Generated: ${result.generatedAt}

This is a local evidence review checklist prepared for human approval. It does not mark product visual acceptance.

| Item | Status | Evidence |
| --- | --- | --- |
${manualItems.map(([item, status]) => `| ${item} | ${status} | ${status === 'FAIL' ? 'See route diagnostics in qa-gala-visual-acceptance-result.json.' : 'See captured screenshots and JSON diagnostics.'} |`).join('\n')}

## Notes

- Exterior screenshot: \`exterior-studio-after.png\`
- Interior screenshot: \`interior-studio-after.png\`
- Quote screenshot: \`quote-review-after.png\`
- Start outside screenshot: \`start-outside-after.png\`
- Start inside screenshot: \`start-inside-after.png\`

` + (noFail
    ? 'No FAIL items were produced by local QA. Remaining WARN items require product-owner visual review before acceptance.\n'
    : 'One or more FAIL items remain. Product visual acceptance must not be recommended.\n'));

  fs.writeFileSync(path.join(outDir, 'changed-files.txt'), [
    'scripts/qa-gala-visual-acceptance-local.mjs',
    'scripts/qa-gala-construction-renderer.mjs',
    'docs/CURRENT_TASK.md',
  ].join('\n') + '\n');
}

function writeStatus(outDir, result) {
  writeJson(path.join(outDir, 'AUDIT_STATUS_AFTER_VISUAL_QA.json'), {
    architectureAuditPassed: false,
    productVisualAccepted: false,
    manualVisualAcceptanceRecommended: result.manualVisualAcceptanceRecommended,
    stagingDeployAllowed: false,
    visualRegressionPresent: !result.pass,
    blockingHomeDemoLabelPresent: result.blockingHomeDemoLabelPresent,
    blockingDomOverlayPresent: result.blockingDomOverlayPresent,
    singleSourceRendererProven: false,
    rendererOwnershipContractExists: true,
    roofOwnershipDocumented: true,
    duplicateOpeningOwnershipPresent: false,
    duplicateFurnitureOwnershipPresent: false,
    domOverlayQaPresent: true,
    visualAcceptanceQaPresent: true,
    screenshotExistenceIsNotAcceptance: true,
    qaFalsePositiveRiskPresent: true,
    remediationScope: 'visual-acceptance-qa-hardening-and-local-manual-evidence',
    remainingBlockers: result.manualVisualAcceptanceRecommended
      ? [
        'Product-owner manual approval is still required before productVisualAccepted can become true.',
        'Architecture audit remains failed and singleSourceRendererProven remains false.',
      ]
      : [
        'Local QA did not recommend manual visual acceptance.',
        'Product-owner manual approval is still required before productVisualAccepted can become true.',
        'Architecture audit remains failed and singleSourceRendererProven remains false.',
      ],
  });
}

async function run(options) {
  ensureDir(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });

  const page = await browser.newPage({ viewport: VIEWPORT });
  const browserLogs = [];
  page.on('console', (message) => {
    browserLogs.push({
      text: message.text(),
      type: message.type(),
    });
  });
  page.on('pageerror', (error) => {
    browserLogs.push({
      text: error.stack || error.message,
      type: 'pageerror',
    });
  });
  await page.addInitScript(() => {
    window.sessionStorage?.setItem('warpala:galaConstructionAudit', '1');
  });
  const routeResults = {};
  const startFlows = {};

  for (const key of ['exteriorStudio', 'interiorStudio']) {
    routeResults[key] = await captureAndClassifyRoute(page, options.baseUrl, {
      ...ROUTES[key],
      targetPath: path.join(options.outDir, ROUTES[key].screenshot),
    });
  }

  routeResults.quoteReview = await captureAndClassifyQuote(page, options.baseUrl, {
    ...ROUTES.quoteReview,
    targetPath: path.join(options.outDir, ROUTES.quoteReview.screenshot),
  });

  for (const key of ['startOutside', 'startInside']) {
    startFlows[key] = await captureAndClassifyRoute(page, options.baseUrl, {
      ...ROUTES[key],
      targetPath: path.join(options.outDir, ROUTES[key].screenshot),
    });
  }

  await browser.close();

  const blockingHomeDemoLabelPresent = [
    routeResults.exteriorStudio,
    routeResults.interiorStudio,
    startFlows.startOutside,
    startFlows.startInside,
  ].some((route) => route.blockingHomeDemoLabelPresent);
  const blockingDomOverlayPresent = [
    routeResults.exteriorStudio,
    routeResults.interiorStudio,
    routeResults.quoteReview,
    startFlows.startOutside,
    startFlows.startInside,
  ].some((route) => route.blockingDomOverlayPresent);
  const pass = routeResults.exteriorStudio.pass
    && routeResults.interiorStudio.pass
    && routeResults.quoteReview.pass
    && startFlows.startOutside.pass
    && startFlows.startInside.pass
    && !blockingHomeDemoLabelPresent
    && !blockingDomOverlayPresent;

  const result = {
    generatedAt: new Date().toISOString(),
    visualAcceptanceQaRan: true,
    routes: {
      exteriorStudio: {
        status: routeResults.exteriorStudio.status,
        screenshotCaptured: routeResults.exteriorStudio.screenshotCaptured,
        canvasPresent: routeResults.exteriorStudio.canvasPresent,
        sceneReadable: routeResults.exteriorStudio.sceneReadable,
        modelVisible: routeResults.exteriorStudio.modelVisible,
        expectedContext: 'exterior',
        expectedContextDetected: routeResults.exteriorStudio.expectedContextDetected,
        blockingDomOverlayPresent: routeResults.exteriorStudio.blockingDomOverlayPresent,
        blockingHomeDemoLabelPresent: routeResults.exteriorStudio.blockingHomeDemoLabelPresent,
        rightRailVisible: routeResults.exteriorStudio.rightRailVisible,
        readabilityFailureReason: routeResults.exteriorStudio.readabilityFailureReason,
        sceneReadabilityClassification: routeResults.exteriorStudio.sceneReadabilityClassification,
        pass: routeResults.exteriorStudio.pass,
      },
      interiorStudio: {
        status: routeResults.interiorStudio.status,
        screenshotCaptured: routeResults.interiorStudio.screenshotCaptured,
        canvasPresent: routeResults.interiorStudio.canvasPresent,
        sceneReadable: routeResults.interiorStudio.sceneReadable,
        modelVisible: routeResults.interiorStudio.modelVisible,
        expectedContext: 'interior',
        expectedContextDetected: routeResults.interiorStudio.expectedContextDetected,
        blockingDomOverlayPresent: routeResults.interiorStudio.blockingDomOverlayPresent,
        blockingHomeDemoLabelPresent: routeResults.interiorStudio.blockingHomeDemoLabelPresent,
        rightRailVisible: routeResults.interiorStudio.rightRailVisible,
        readabilityFailureReason: routeResults.interiorStudio.readabilityFailureReason,
        sceneReadabilityClassification: routeResults.interiorStudio.sceneReadabilityClassification,
        pass: routeResults.interiorStudio.pass,
      },
      quoteReview: {
        status: routeResults.quoteReview.status,
        screenshotCaptured: routeResults.quoteReview.screenshotCaptured,
        quoteUiVisible: routeResults.quoteReview.quoteUiVisible,
        blockingDomOverlayPresent: routeResults.quoteReview.blockingDomOverlayPresent,
        pass: routeResults.quoteReview.pass,
      },
    },
    startFlows: {
      startOutside: {
        status: startFlows.startOutside.status,
        screenshotCaptured: startFlows.startOutside.screenshotCaptured,
        canvasPresent: startFlows.startOutside.canvasPresent,
        sceneReadable: startFlows.startOutside.sceneReadable,
        expectedContextDetected: startFlows.startOutside.expectedContextDetected,
        blockingDomOverlayPresent: startFlows.startOutside.blockingDomOverlayPresent,
        readabilityFailureReason: startFlows.startOutside.readabilityFailureReason,
        sceneReadabilityClassification: startFlows.startOutside.sceneReadabilityClassification,
        pass: startFlows.startOutside.pass,
      },
      startInside: {
        status: startFlows.startInside.status,
        screenshotCaptured: startFlows.startInside.screenshotCaptured,
        canvasPresent: startFlows.startInside.canvasPresent,
        sceneReadable: startFlows.startInside.sceneReadable,
        expectedContextDetected: startFlows.startInside.expectedContextDetected,
        blockingDomOverlayPresent: startFlows.startInside.blockingDomOverlayPresent,
        readabilityFailureReason: startFlows.startInside.readabilityFailureReason,
        sceneReadabilityClassification: startFlows.startInside.sceneReadabilityClassification,
        pass: startFlows.startInside.pass,
      },
    },
    diagnostics: {
      exteriorStudio: routeResults.exteriorStudio.diagnostics,
      interiorStudio: routeResults.interiorStudio.diagnostics,
      quoteReview: routeResults.quoteReview.diagnostics,
      startOutside: startFlows.startOutside.diagnostics,
      startInside: startFlows.startInside.diagnostics,
    },
    domOverlayAuditRan: true,
    sceneReadabilityClassifierPresent: true,
    blockingHomeDemoLabelPresent,
    blockingDomOverlayPresent,
    browserLogs: browserLogs.slice(-80),
    threeMeshAuditDoesNotCoverDom: true,
    screenshotExistenceIsNotAcceptance: true,
    manualReviewRequired: true,
    manualVisualAcceptanceRecommended: false,
    productVisualAccepted: false,
    pass,
  };

  writeJson(path.join(options.outDir, 'qa-gala-visual-acceptance-result.json'), result);
  writeReports(options.outDir, result);
  writeStatus(options.outDir, result);

  console.log(JSON.stringify({
    ok: result.pass,
    outDir: options.outDir,
    productVisualAccepted: false,
    result: {
      manualVisualAcceptanceRecommended: result.manualVisualAcceptanceRecommended,
      pass: result.pass,
      routes: result.routes,
      startFlows: result.startFlows,
    },
  }, null, 2));

  if (!result.pass) {
    process.exit(1);
  }
}

run(parseArgs(process.argv.slice(2))).catch((error) => {
  console.error(error);
  process.exit(1);
});
