#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'C:\\qa\\visual-evidence\\gala-label-overlay-remediation-local';
const AUDIT_REFERENCE_DIR = 'C:\\qa\\visual-evidence\\20260625-192859-gala-full-architecture-audit-local';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORT = { height: 900, width: 1440 };

const ROUTES = {
  exterior: '/modular-homes/studio?view=exterior&homeStudio=1',
  interior: '/modular-homes/studio?view=interior&homeStudio=1',
  quoteReview: '/modular-homes/quotes',
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

function copyAuditReference(outDir) {
  const source = path.join(AUDIT_REFERENCE_DIR, 'manual-repro', 'current-exterior.png');
  if (!fs.existsSync(source)) {
    return null;
  }

  const targetDir = path.join(outDir, 'before');
  ensureDir(targetDir);
  const target = path.join(targetDir, 'exterior-before-audit-reference.png');
  fs.copyFileSync(source, target);
  return path.relative(outDir, target).replace(/\\/g, '/');
}

async function captureRoute(page, url, target) {
  const response = await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  await page.screenshot({ fullPage: false, path: target });
  return response?.status() ?? null;
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
    const textPattern = /(40\s*(m²|mÂ²|m2|M²|M2)|Compact Timber 40|40\s*m|MODULAR\s+LAYOUT)/i;

    function rectObject(rect) {
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      };
    }

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

    const elements = Array.from(document.querySelectorAll('body *'));
    const overlays = elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      const containsCanvas = Boolean(canvas && element.contains(canvas));
      const backgroundBlocks = !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor);
      const area = rect.width * rect.height;
      const centralIntersection = intersectionArea(rect, centralSceneRect);
      const canvasIntersection = canvasRect ? intersectionArea(rect, canvasRect) : 0;
      const homeDemoModelLabel = element.matches('[data-home-demo-model-label="true"]');
      const textMatchesBlockingLabel = textPattern.test(text);
      const positionedOverlay = ['absolute', 'fixed', 'sticky'].includes(style.position);
      const largeOverlay = area / Math.max(1, viewport.width * viewport.height) > 0.08;
      const centralIntersectionRatio = centralIntersection / Math.max(1, centralSceneRect.width * centralSceneRect.height);
      const centrallyBlocking = centralIntersectionRatio > 0.08;
      const visible = isVisible(element, rect, style);
      const blockingHomeDemoLabel = visible && homeDemoModelLabel;
      const blockingTextLabel = visible
        && !containsCanvas
        && element.childElementCount <= 4
        && textMatchesBlockingLabel
        && area / Math.max(1, viewport.width * viewport.height) > 0.01
        && centralIntersectionRatio > 0.02;
      const blockingLargeOverlay = visible
        && !containsCanvas
        && positionedOverlay
        && largeOverlay
        && centrallyBlocking
        && backgroundBlocks
        && style.pointerEvents !== 'none';

      return {
        areaRatio: area / Math.max(1, viewport.width * viewport.height),
        attributes: Array.from(element.attributes).reduce((acc, attr) => {
          if (attr.name.startsWith('data-') || attr.name === 'class' || attr.name === 'id') {
            acc[attr.name] = attr.value;
          }
          return acc;
        }, {}),
        blocking: Boolean(blockingHomeDemoLabel || blockingTextLabel || blockingLargeOverlay),
        blockingHomeDemoLabel,
        blockingLargeOverlay,
        blockingTextLabel,
        containsCanvas,
        canvasIntersection,
        centralIntersection,
        homeDemoModelLabel,
        pointerEvents: style.pointerEvents,
        position: style.position,
        rect: rectObject(rect),
        tagName: element.tagName,
        text: text.slice(0, 240),
        textMatchesBlockingLabel,
        visible,
        zIndex: style.zIndex,
      };
    }).filter((item) => (
      item.homeDemoModelLabel
      || item.textMatchesBlockingLabel
      || item.blockingLargeOverlay
      || item.blocking
      || (item.visible && !item.containsCanvas && item.canvasIntersection > 0 && item.areaRatio > 0.12)
    ));

    const blockingOverlays = overlays.filter((item) => item.blocking);

    return {
      blockingDomOverlayPresent: blockingOverlays.length > 0,
      blockingHomeDemoLabelPresent: overlays.some((item) => item.blockingHomeDemoLabel),
      blockingOverlays,
      canvasRect: canvasRect ? rectObject(canvasRect) : null,
      centralSceneRect,
      domOverlayAuditRan: true,
      overlays,
      threeMeshAuditDoesNotCoverDom: true,
      viewport,
    };
  });
}

function writeMarkdownReports(outDir, result, beforeReference) {
  const routeRows = Object.entries(result.routes).map(([name, route]) => (
    `| ${name} | ${route.status} | ${route.blockingHomeDemoLabelPresent} | ${route.blockingDomOverlayPresent} | ${route.screenshot} |`
  )).join('\n');

  fs.writeFileSync(path.join(outDir, 'BEFORE_AFTER_SUMMARY.md'), `# GALA Label Overlay Remediation

Generated: ${result.generatedAt}

## Scope

This remediation only gates the large floating home-demo model summary label in real-user modular home studio views and adds DOM overlay QA. It does not change cameras, FOV, lookAt targets, routes, backend, auth, quote, payment, physics, or model geometry.

## Gating Rule

\`ModularHomeModel.tsx\` now uses \`shouldShowFloatingHomeDemoModelLabel(homeStudioEnabled)\`. The label renders only when \`homeStudioEnabled === false\`; therefore it is hidden on \`/modular-homes/studio?view=exterior&homeStudio=1\` and \`/modular-homes/studio?view=interior&homeStudio=1\`.

## Evidence

- Before reference: ${beforeReference ?? 'not available'}
- Exterior after: \`after/exterior-after.png\`
- Interior after: \`after/interior-after.png\`
- Quote review after: \`after/quote-review-after.png\`

## Route Results

| Route | HTTP status | Home-demo label present | Blocking DOM overlay present | Screenshot |
| --- | ---: | --- | --- | --- |
${routeRows}

\`productVisualAccepted=false\`. This phase only closes the blocking label regression.
`);

  fs.writeFileSync(path.join(outDir, 'DOM_OVERLAY_QA.md'), `# DOM Overlay QA

Generated: ${result.generatedAt}

The QA inspects browser DOM rectangles in real-user studio routes. It explicitly checks \`[data-home-demo-model-label="true"]\`, visible text matching \`40 m² modular layout\`, \`Compact Timber 40\`, and large positioned overlays that intersect the central scene area.

## Result

- domOverlayAuditRan: ${result.domOverlayAuditRan}
- blockingHomeDemoLabelPresent: ${result.blockingHomeDemoLabelPresent}
- blockingDomOverlayPresent: ${result.blockingDomOverlayPresent}
- threeMeshAuditDoesNotCoverDom: ${result.threeMeshAuditDoesNotCoverDom}
- productVisualAccepted: ${result.productVisualAccepted}

## Classification

This is a real DOM runtime check, not a mesh count and not screenshot existence. Three.js scene traversal does not cover Drei Html/DOM overlays; this is why the previous renderer QA missed the large label.
`);
}

function writeStatus(outDir, result) {
  writeJson(path.join(outDir, 'AUDIT_STATUS_AFTER_REMEDIATION.json'), {
    architectureAuditPassed: false,
    productVisualAccepted: false,
    stagingDeployAllowed: false,
    visualRegressionPresent: Boolean(result.blockingHomeDemoLabelPresent || result.blockingDomOverlayPresent),
    blockingHomeDemoLabelPresent: Boolean(result.blockingHomeDemoLabelPresent),
    blockingDomOverlayPresent: Boolean(result.blockingDomOverlayPresent),
    singleSourceRendererProven: false,
    qaFalsePositiveRiskPresent: true,
    remediationScope: 'label-overlay-and-dom-qa-only',
    remainingBlockers: [
      'Renderer is still not proven single-source.',
      'QA still has broader false-positive risk outside the DOM overlay check.',
      'Product visual acceptance still requires manual review after architecture remediation.',
    ],
  });
}

function writeValidationPlaceholder(outDir) {
  fs.writeFileSync(path.join(outDir, 'VALIDATION.md'), `# Validation

Validation is appended by the remediation runner after commands complete.
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureDir(options.outDir);
  ensureDir(path.join(options.outDir, 'after'));
  ensureDir(path.join(options.outDir, 'debug'));

  const beforeReference = copyAuditReference(options.outDir);
  const browser = await chromium.launch({
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
    headless: true,
  });
  const page = await browser.newPage({ viewport: VIEWPORT });
  const generatedAt = new Date().toISOString();
  const routeResults = {};

  try {
    for (const [name, route] of Object.entries(ROUTES)) {
      const screenshot = name === 'quoteReview'
        ? 'after/quote-review-after.png'
        : `after/${name}-after.png`;
      const status = await captureRoute(page, `${options.baseUrl}${route}`, path.join(options.outDir, screenshot));
      const audit = name === 'quoteReview'
        ? {
            blockingDomOverlayPresent: false,
            blockingHomeDemoLabelPresent: false,
            blockingOverlays: [],
            domOverlayAuditRan: false,
            overlays: [],
            threeMeshAuditDoesNotCoverDom: true,
          }
        : await auditDomOverlays(page);

      routeResults[name] = {
        ...audit,
        route,
        screenshot,
        status,
      };

      writeJson(path.join(options.outDir, 'debug', `${name}-dom-overlay-inventory.json`), audit);
    }
  } finally {
    await browser.close();
  }

  const result = {
    generatedAt,
    repairScope: 'label-overlay-and-dom-qa-only',
    domOverlayAuditRan: true,
    blockingHomeDemoLabelPresent: Object.values(routeResults).some((route) => route.blockingHomeDemoLabelPresent),
    blockingDomOverlayPresent: Object.values(routeResults).some((route) => route.blockingDomOverlayPresent),
    threeMeshAuditDoesNotCoverDom: true,
    routes: routeResults,
    productVisualAccepted: false,
  };

  writeJson(path.join(options.outDir, 'qa-dom-overlay-result.json'), result);
  writeMarkdownReports(options.outDir, result, beforeReference);
  writeStatus(options.outDir, result);
  writeValidationPlaceholder(options.outDir);

  console.log(JSON.stringify({
    ok: !result.blockingHomeDemoLabelPresent && !result.blockingDomOverlayPresent,
    outDir: options.outDir,
    result: {
      domOverlayAuditRan: result.domOverlayAuditRan,
      blockingHomeDemoLabelPresent: result.blockingHomeDemoLabelPresent,
      blockingDomOverlayPresent: result.blockingDomOverlayPresent,
      threeMeshAuditDoesNotCoverDom: result.threeMeshAuditDoesNotCoverDom,
      productVisualAccepted: result.productVisualAccepted,
    },
    routeStatuses: Object.fromEntries(Object.entries(routeResults).map(([name, route]) => [name, route.status])),
  }, null, 2));

  if (result.blockingHomeDemoLabelPresent || result.blockingDomOverlayPresent) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
