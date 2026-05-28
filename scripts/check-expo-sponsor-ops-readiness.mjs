#!/usr/bin/env node

const DEFAULTS = {
  backendUrl: 'http://127.0.0.1:3000',
  frontendUrl: 'http://127.0.0.1:5173',
  publicApiUrl: 'https://api-staging.30sek24.com',
  stagingBackendUrl: 'http://127.0.0.1:3001',
  timeoutMs: 8000,
};

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    json: false,
    skipFrontend: false,
    skipPublic: true,
    writeLead: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--skip-frontend') {
      options.skipFrontend = true;
    } else if (arg === '--public') {
      options.skipPublic = false;
    } else if (arg === '--skip-public') {
      options.skipPublic = true;
    } else if (arg === '--write-lead') {
      options.writeLead = true;
    } else if (arg.startsWith('--frontend-url=')) {
      options.frontendUrl = arg.slice('--frontend-url='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--staging-backend-url=')) {
      options.stagingBackendUrl = arg.slice('--staging-backend-url='.length);
    } else if (arg.startsWith('--public-api-url=')) {
      options.publicApiUrl = arg.slice('--public-api-url='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10) || DEFAULTS.timeoutMs;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function helpText() {
  return `
Expo sponsor ops readiness check

Usage:
  npm run check:expo-sponsor-ops -- [options]

Options:
  --frontend-url=http://127.0.0.1:5173
  --backend-url=http://127.0.0.1:3000
  --staging-backend-url=http://127.0.0.1:3001
  --public-api-url=https://api-staging.30sek24.com
  --public              also check public staging API
  --skip-public         skip public API check (default)
  --skip-frontend       skip local frontend check
  --write-lead          POST a synthetic health-check lead to /api/expo/lead
  --timeout-ms=8000
  --json

Default mode does not write to the database. Use --write-lead only when you
intend to create a test lead record.
`.trim();
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHttpStatus({ expectedStatuses, init, name, timeoutMs, url }) {
  try {
    const response = await fetchWithTimeout(url, init, timeoutMs);
    const body = await response.text();
    const passed = expectedStatuses.includes(response.status);

    return {
      bodyPreview: body.slice(0, 180),
      expectedStatuses,
      name,
      ok: passed,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      expectedStatuses,
      name,
      ok: false,
      status: null,
      url,
    };
  }
}

function buildSyntheticLeadPayload() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    clientEmail: `expo-healthcheck-${timestamp}@example.invalid`,
    clientName: 'Expo Sponsor Ops Healthcheck',
    companyId: 'sponsor-concierge',
    companySlug: 'sponsor-concierge',
    message: 'Synthetic sponsor ops readiness check lead.',
    sourcePath: '/scripts/check-expo-sponsor-ops-readiness.mjs',
  };
}

async function checkLeadWrite({ baseUrl, name, timeoutMs, writeLead }) {
  if (!writeLead) {
    return {
      name,
      ok: true,
      skipped: true,
      status: 'skipped',
      url: `${baseUrl}/api/expo/lead`,
    };
  }

  return await checkHttpStatus({
    expectedStatuses: [201],
    init: {
      body: JSON.stringify(buildSyntheticLeadPayload()),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    name,
    timeoutMs,
    url: `${baseUrl}/api/expo/lead`,
  });
}

async function runChecks(options) {
  const frontendUrl = normalizeBaseUrl(options.frontendUrl);
  const backendUrl = normalizeBaseUrl(options.backendUrl);
  const stagingBackendUrl = normalizeBaseUrl(options.stagingBackendUrl);
  const publicApiUrl = normalizeBaseUrl(options.publicApiUrl);

  const checks = [];

  if (!options.skipFrontend) {
    checks.push(await checkHttpStatus({
      expectedStatuses: [200],
      name: 'local frontend sales demo route',
      timeoutMs: options.timeoutMs,
      url: `${frontendUrl}/expo-3d?salesDemo=1`,
    }));
  } else {
    checks.push({
      name: 'local frontend sales demo route',
      ok: true,
      skipped: true,
      status: 'skipped',
      url: `${frontendUrl}/expo-3d?salesDemo=1`,
    });
  }

  checks.push(await checkHttpStatus({
    expectedStatuses: [200],
    name: 'local docker-minimal backend health',
    timeoutMs: options.timeoutMs,
    url: `${backendUrl}/health`,
  }));

  checks.push(await checkLeadWrite({
    baseUrl: backendUrl,
    name: 'local docker-minimal lead capture write',
    timeoutMs: options.timeoutMs,
    writeLead: options.writeLead,
  }));

  checks.push(await checkHttpStatus({
    expectedStatuses: [200],
    name: 'local staging backend health',
    timeoutMs: options.timeoutMs,
    url: `${stagingBackendUrl}/health`,
  }));

  checks.push(await checkHttpStatus({
    expectedStatuses: [401],
    name: 'local staging lead inbox auth gate',
    timeoutMs: options.timeoutMs,
    url: `${stagingBackendUrl}/api/expo/lead-inbox/sponsor-concierge`,
  }));

  checks.push(await checkLeadWrite({
    baseUrl: stagingBackendUrl,
    name: 'local staging lead capture write',
    timeoutMs: options.timeoutMs,
    writeLead: options.writeLead,
  }));

  if (!options.skipPublic) {
    checks.push(await checkHttpStatus({
      expectedStatuses: [200],
      name: 'public staging API health',
      timeoutMs: options.timeoutMs,
      url: `${publicApiUrl}/health`,
    }));
  } else {
    checks.push({
      name: 'public staging API health',
      ok: true,
      skipped: true,
      status: 'skipped',
      url: `${publicApiUrl}/health`,
    });
  }

  return {
    checks,
    generatedAt: new Date().toISOString(),
    ok: checks.every((check) => check.ok),
    writeLead: options.writeLead,
  };
}

function printHumanReport(result) {
  console.log(`Expo sponsor ops readiness: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Generated: ${result.generatedAt}`);
  console.log(`Lead write checks: ${result.writeLead ? 'enabled' : 'skipped'}`);

  for (const check of result.checks) {
    const status = check.skipped ? 'SKIP' : check.ok ? 'PASS' : 'FAIL';
    console.log(`- ${status}: ${check.name} -> ${check.status} ${check.url}`);
    if (!check.ok && check.error) {
      console.log(`  error: ${check.error}`);
    }
    if (!check.ok && check.bodyPreview) {
      console.log(`  body: ${check.bodyPreview}`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  const result = await runChecks(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanReport(result);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
