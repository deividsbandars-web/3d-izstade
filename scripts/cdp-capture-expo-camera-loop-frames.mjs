import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DEFAULT_BROWSER_JSON_URL = 'http://127.0.0.1:9230/json';
const DEFAULT_SITE_URL = 'https://staging.30sek24.com/expo-3d?operator=1&expoData=review&quality=high';
const DEFAULT_OUTPUT_DIR = 'public/expo/media/city-camera-loop';
const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 432;

const DEFAULT_CAMERA_ZONES = [
  'arrival-gate',
  'arrival-civic-axis',
  'center-spine',
  'center-spine-side',
  'mid-start-deep',
  'left-marquee',
  'left-marquee-close',
  'left-edge-far',
  'right-marquee',
  'right-marquee-close',
  'right-edge-far',
  'sponsor-boulevard-left',
  'sponsor-boulevard-left-close',
  'sponsor-boulevard-right',
  'sponsor-boulevard-right-medium',
  'array-band',
  'array-band-south',
  'sky-market-spine',
  'sky-market-spine-access',
  'tower-cluster',
  'tower-cluster-mega-skyline',
  'tower-cluster-television-tower-crown',
  'ai-reactor-core',
  'ai-oracle-chamber',
  'center-sky-compass',
  'stadium-approach',
  'rear-campus-entry-pulse-arches',
  'rear-campus-center',
  'stadium-feed-axis',
  'rear-campus-orbital-scoregate',
  'rear-campus-mega-hall',
];

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function readIntArg(name, fallback) {
  const value = Number(readArg(name, String(fallback)));
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function escapeForJs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function parseZones() {
  const zonesArg = readArg('zones', '');
  if (!zonesArg.trim()) {
    return DEFAULT_CAMERA_ZONES;
  }

  return zonesArg
    .split(',')
    .map((zone) => zone.trim())
    .filter(Boolean);
}

async function resolveWebSocketUrl(browserJsonUrl, preferredUrl) {
  const response = await fetch(browserJsonUrl);
  if (!response.ok) {
    throw new Error(`Could not read Chrome targets from ${browserJsonUrl}: ${response.status}`);
  }

  const targets = await response.json();
  const pages = targets.filter((target) => target.type === 'page' && target.webSocketDebuggerUrl);
  const preferred = pages.find((target) => target.url === preferredUrl);
  const expoPage = pages.find((target) => String(target.url || '').includes('/expo-3d'));
  const fallback = preferred ?? expoPage ?? pages[0] ?? targets.find((target) => target.webSocketDebuggerUrl);

  if (!fallback?.webSocketDebuggerUrl) {
    throw new Error(`No CDP page target found in ${browserJsonUrl}`);
  }

  return fallback.webSocketDebuggerUrl;
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let nextId = 0;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id || !pending.has(message.id)) {
      return;
    }

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(`${message.error.message || 'CDP error'} (${JSON.stringify(message.error)})`));
      return;
    }

    resolve(message);
  });

  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => {
      const send = (method, params = {}) => new Promise((methodResolve, methodReject) => {
        const id = ++nextId;
        pending.set(id, { resolve: methodResolve, reject: methodReject });
        ws.send(JSON.stringify({ id, method, params }));
      });

      resolve({ send, ws });
    });
    ws.addEventListener('error', reject);
  });
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression,
    returnByValue: true,
  });

  return result.result.result?.value;
}

async function waitFor(send, expression, label, attempts = 80, delayMs = 500) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await evaluate(send, expression)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Timed out waiting for ${label}`);
}

async function preparePage(send, siteUrl) {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    deviceScaleFactor: 1,
    height: 960,
    mobile: false,
    width: 1600,
  });
  await send('Page.navigate', { url: siteUrl });
  await new Promise((resolve) => setTimeout(resolve, 7000));
  await evaluate(send, `
(() => {
  const nodes = [...document.querySelectorAll('button, [role="button"], a')];
  const target = nodes.find((node) => {
    const text = ((node.innerText || node.textContent || '').trim()).toLowerCase();
    return text.includes('walk lite') || text.includes('enter') || text.includes('start');
  });
  if (target) {
    target.click();
    return true;
  }
  return false;
})()
`);
  await waitFor(send, `
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  return Boolean(api && typeof api.reviewZone === 'function' && typeof api.getSnapshot === 'function');
})()
`, 'review operator API', 100, 500);
}

async function selectZone(send, zoneId) {
  const zoneLiteral = escapeForJs(zoneId);
  await evaluate(send, `
(() => {
  const api = window.__WARPALA_EXPO_REVIEW_OPERATOR__;
  if (!api || typeof api.reviewZone !== 'function') {
    return false;
  }
  api.reviewZone('${zoneLiteral}');
  return true;
})()
`);

  await waitFor(send, `
(() => {
  const snapshot = window.__WARPALA_EXPO_REVIEW_OPERATOR__?.getSnapshot?.();
  return snapshot?.operatorZoneId === '${zoneLiteral}';
})()
`, `zone ${zoneId}`, 50, 300);

  await new Promise((resolve) => setTimeout(resolve, 650));
}

async function setOverlayVisibility(send, visible) {
  const visibility = visible ? 'visible' : 'hidden';
  const display = visible ? '' : 'none';
  const pointerEvents = visible ? 'auto' : 'none';
  await evaluate(send, `
(() => {
  const nodes = [
    document.querySelector('[data-expo-operator-overlay="true"]'),
    document.querySelector('[data-expo-operator-build-stamp="true"]'),
    document.querySelector('[data-expo-world-hud-top="true"]'),
    document.querySelector('[data-expo-world-hud-radar="true"]'),
  ].filter(Boolean);
  const chatButton = document.querySelector('[aria-label="Open global chat"]');
  if (chatButton) {
    nodes.push(chatButton.parentElement || chatButton);
  }
  for (const node of nodes) {
    node.style.visibility = '${visibility}';
    node.style.pointerEvents = '${pointerEvents}';
    node.style.display = '${display}';
  }
  return nodes.length;
})()
`);
}

async function captureZone(send, outputDir, zoneId, index, width, height) {
  await selectZone(send, zoneId);
  await setOverlayVisibility(send, false);
  await new Promise((resolve) => setTimeout(resolve, 450));

  const screenshot = await send('Page.captureScreenshot', {
    captureBeyondViewport: false,
    format: 'png',
    fromSurface: true,
  });
  const rawBytes = Buffer.from(screenshot.result.data, 'base64');
  const fileName = `${String(index + 1).padStart(2, '0')}-${zoneId}.png`;
  const filePath = path.join(outputDir, fileName);

  await sharp(rawBytes)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(filePath);

  await setOverlayVisibility(send, true);

  return {
    file: filePath.replace(/\\/g, '/'),
    url: `/expo/media/city-camera-loop/${fileName}`,
    zoneId,
  };
}

async function main() {
  const browserJsonUrl = readArg('browser', DEFAULT_BROWSER_JSON_URL);
  const siteUrl = readArg('site', DEFAULT_SITE_URL);
  const outputDir = readArg('out', DEFAULT_OUTPUT_DIR);
  const width = readIntArg('width', DEFAULT_WIDTH);
  const height = readIntArg('height', DEFAULT_HEIGHT);
  const zones = parseZones();

  if (zones.length !== 31) {
    console.warn(`Capturing ${zones.length} zones. Default city camera loop uses 31 zones.`);
  }

  await fs.mkdir(outputDir, { recursive: true });
  const wsUrl = await resolveWebSocketUrl(browserJsonUrl, siteUrl);
  const { send, ws } = await connectCdp(wsUrl);

  try {
    await preparePage(send, siteUrl);
    const frames = [];
    for (let index = 0; index < zones.length; index += 1) {
      const zoneId = zones[index];
      console.log(`Capturing ${index + 1}/${zones.length}: ${zoneId}`);
      frames.push(await captureZone(send, outputDir, zoneId, index, width, height));
    }

    const manifest = {
      capturedAt: new Date().toISOString(),
      frameCount: frames.length,
      height,
      siteUrl,
      width,
      frames,
    };
    await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    ws.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
