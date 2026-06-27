#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEFAULT_BASE_URL = 'http://127.0.0.1:5173';
const DEFAULT_OUT_DIR = 'artifacts/phase3-gala-pbr/devtools-trace';

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    cycles: 1,
    outDir: path.resolve(DEFAULT_OUT_DIR),
    route: '/modular-homes/studio?view=interior&homeStudio=1&qa3d=1',
    straight: false,
  };
  argv.forEach((arg) => {
    if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
    } else if (arg.startsWith('--cycles=')) {
      options.cycles = Math.max(1, Number.parseInt(arg.slice('--cycles='.length), 10) || 1);
    } else if (arg.startsWith('--out-dir=')) {
      options.outDir = path.resolve(arg.slice('--out-dir='.length));
    } else if (arg.startsWith('--route=')) {
      options.route = arg.slice('--route='.length);
    } else if (arg === '--straight') {
      options.straight = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  });
  return options;
}

async function readProtocolStream(session, handle) {
  const chunks = [];
  let eof = false;
  while (!eof) {
    const result = await session.send('IO.read', { handle });
    chunks.push(result.base64Encoded
      ? Buffer.from(result.data, 'base64')
      : Buffer.from(result.data));
    eof = result.eof;
  }
  await session.send('IO.close', { handle });
  return Buffer.concat(chunks);
}

const options = parseArgs(process.argv.slice(2));
fs.mkdirSync(options.outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});

try {
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } });
  const session = await page.context().newCDPSession(page);
  await page.goto(`${options.baseUrl}${options.route}`, {
    timeout: 60000,
    waitUntil: 'domcontentloaded',
  });
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction(
    () => (window.__WARPALA_3D_QA__?.getSceneMeshInventory?.().length ?? 0) > 100,
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(1500);

  await session.send('Tracing.start', {
    categories: [
      'blink.user_timing',
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-v8.gc',
      'gpu',
      'toplevel',
      'v8',
    ].join(','),
    options: 'sampling-frequency=10000',
    transferMode: 'ReturnAsStream',
  });

  await page.locator('canvas').click({ position: { x: 720, y: 450 }, timeout: 5000 }).catch(() => {});
  for (let cycle = 0; cycle < options.cycles; cycle += 1) {
    await page.keyboard.down('w');
    if (!options.straight) {
      await page.keyboard.down('ArrowRight');
    }
    await page.waitForTimeout(2000);
    if (!options.straight) {
      await page.keyboard.up('ArrowRight');
    }
    await page.keyboard.up('w');
    await page.keyboard.down('s');
    await page.waitForTimeout(1200);
    await page.keyboard.up('s');
  }

  const rendererInfo = await page.evaluate(() => window.__WARPALA_3D_QA__?.getRendererInfo?.() ?? null);
  const tracingComplete = new Promise((resolve) => session.once('Tracing.tracingComplete', resolve));
  await session.send('Tracing.end');
  const traceEvent = await tracingComplete;
  const trace = await readProtocolStream(session, traceEvent.stream);
  const tracePath = path.join(options.outDir, 'gala-interior-motion-trace.json');
  fs.writeFileSync(tracePath, trace);

  const traceJson = JSON.parse(trace.toString('utf8'));
  const events = Array.isArray(traceJson.traceEvents) ? traceJson.traceEvents : [];
  const gcEvents = events.filter((event) => event.name === 'MinorGC' || event.name === 'MajorGC');
  const gcDurationMs = gcEvents.reduce((total, event) => total + Number(event.dur ?? 0), 0) / 1000;
  const result = {
    gcDurationMs: Number(gcDurationMs.toFixed(2)),
    gcEventCount: gcEvents.length,
    movementCycles: options.cycles,
    straightMovement: options.straight,
    majorGcEventCount: gcEvents.filter((event) => event.name === 'MajorGC').length,
    minorGcEventCount: gcEvents.filter((event) => event.name === 'MinorGC').length,
    rendererInfo,
    route: options.route,
    traceEventCount: events.length,
    tracePath,
  };
  fs.writeFileSync(path.join(options.outDir, 'gala-phase3-trace-summary.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
