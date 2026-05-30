#!/usr/bin/env node

const DEFAULTS = {
  backendUrl: 'https://api-staging.30sek24.com',
  limit: 50,
  sponsor: 'sponsor-concierge',
  timeoutMs: 8000,
};

const TOKEN_ENV_NAMES = [
  'SPONSOR_LEAD_INBOX_ACCESS_TOKEN',
  'SPONSOR_OPS_ACCESS_TOKEN',
  'SUPABASE_ACCESS_TOKEN',
];

function parseArgs(argv) {
  const options = {
    ...DEFAULTS,
    accessToken: '',
    json: false,
    publicOnly: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--public') {
      options.publicOnly = true;
    } else if (arg.startsWith('--access-token=')) {
      options.accessToken = arg.slice('--access-token='.length);
    } else if (arg.startsWith('--backend-url=')) {
      options.backendUrl = arg.slice('--backend-url='.length);
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number.parseInt(arg.slice('--limit='.length), 10) || DEFAULTS.limit;
    } else if (arg.startsWith('--sponsor=')) {
      options.sponsor = arg.slice('--sponsor='.length);
    } else if (arg.startsWith('--timeout-ms=')) {
      options.timeoutMs = Number.parseInt(arg.slice('--timeout-ms='.length), 10) || DEFAULTS.timeoutMs;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.limit = Math.min(Math.max(options.limit, 1), 100);
  options.accessToken = options.accessToken || getAccessTokenFromEnv();

  return options;
}

function getAccessTokenFromEnv() {
  for (const envName of TOKEN_ENV_NAMES) {
    const value = process.env[envName];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function normalizeSponsorSlug(value) {
  const sponsor = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(sponsor)) {
    throw new Error(`Invalid sponsor slug: ${value}`);
  }

  return sponsor;
}

function helpText() {
  return `
Authenticated Expo Sponsor Lead Inbox check

Usage:
  npm run check:expo-sponsor-inbox-auth -- [options]

Read-only authenticated mode:
  $env:SPONSOR_LEAD_INBOX_ACCESS_TOKEN="<supabase-access-token>"
  npm run check:expo-sponsor-inbox-auth -- --backend-url=https://api-staging.30sek24.com --sponsor=sponsor-concierge

Public auth-gate mode:
  npm run check:expo-sponsor-inbox-auth -- --public

Options:
  --backend-url=https://api-staging.30sek24.com
  --sponsor=sponsor-concierge
  --limit=50
  --access-token=<token>
  --public       verify that the protected endpoint rejects unauthenticated requests
  --timeout-ms=8000
  --json

Token env aliases:
  ${TOKEN_ENV_NAMES.join(', ')}

This script is read-only. It does not create leads, update statuses, write ops
notes, open browser sessions, or store tokens.
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

async function readJsonResponse(response) {
  const body = await response.text();

  try {
    return {
      body,
      json: body ? JSON.parse(body) : null,
    };
  } catch {
    return {
      body,
      json: null,
    };
  }
}

function buildInboxUrl({ backendUrl, limit, sponsor }) {
  const baseUrl = normalizeBaseUrl(backendUrl);
  const encodedSponsor = encodeURIComponent(normalizeSponsorSlug(sponsor));
  return `${baseUrl}/api/expo/lead-inbox/${encodedSponsor}?limit=${encodeURIComponent(String(limit))}`;
}

function validateInboxPayload(payload, expectedSponsor) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('payload is not an object');
    return errors;
  }

  if (!Array.isArray(payload.leads)) {
    errors.push('leads is not an array');
  }

  if (!payload.summary || typeof payload.summary !== 'object') {
    errors.push('summary is missing');
  } else {
    for (const key of ['closed', 'contacted', 'needsAction', 'pending', 'rejected', 'total']) {
      if (typeof payload.summary[key] !== 'number') {
        errors.push(`summary.${key} is not a number`);
      }
    }
  }

  if (!payload.sponsor || typeof payload.sponsor !== 'object') {
    errors.push('sponsor is missing');
  } else if (payload.sponsor.slug !== expectedSponsor) {
    errors.push(`sponsor.slug expected ${expectedSponsor}, got ${String(payload.sponsor.slug)}`);
  }

  return errors;
}

async function checkPublicAuthGate(options) {
  const url = buildInboxUrl(options);
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
    },
    method: 'GET',
  }, options.timeoutMs);
  const body = await readJsonResponse(response);

  return {
    bodyPreview: body.body.slice(0, 220),
    expectedStatus: 401,
    name: 'sponsor lead inbox auth gate',
    ok: response.status === 401,
    status: response.status,
    url,
  };
}

async function checkAuthenticatedInbox(options) {
  const sponsor = normalizeSponsorSlug(options.sponsor);
  const url = buildInboxUrl({ ...options, sponsor });
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
    },
    method: 'GET',
  }, options.timeoutMs);
  const body = await readJsonResponse(response);
  const validationErrors = response.ok ? validateInboxPayload(body.json, sponsor) : [];

  return {
    bodyPreview: body.body.slice(0, 220),
    leadCount: Array.isArray(body.json?.leads) ? body.json.leads.length : null,
    name: 'authenticated sponsor lead inbox read',
    ok: response.status === 200 && validationErrors.length === 0,
    sponsor: body.json?.sponsor ?? null,
    status: response.status,
    summary: body.json?.summary ?? null,
    url,
    validationErrors,
  };
}

async function run(options) {
  if (options.publicOnly) {
    const check = await checkPublicAuthGate(options);
    return {
      checks: [check],
      generatedAt: new Date().toISOString(),
      mode: 'public-auth-gate',
      ok: check.ok,
    };
  }

  if (!options.accessToken) {
    return {
      checks: [{
        missingEnv: TOKEN_ENV_NAMES,
        name: 'authenticated sponsor lead inbox read',
        ok: false,
        status: 'missing-token',
      }],
      generatedAt: new Date().toISOString(),
      mode: 'authenticated-read',
      ok: false,
      tokenMissing: true,
    };
  }

  const check = await checkAuthenticatedInbox(options);
  return {
    checks: [check],
    generatedAt: new Date().toISOString(),
    mode: 'authenticated-read',
    ok: check.ok,
  };
}

function printHumanReport(result) {
  console.log(`Expo sponsor lead inbox auth check: ${result.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Generated: ${result.generatedAt}`);

  for (const check of result.checks) {
    const status = check.ok ? 'PASS' : 'FAIL';
    console.log(`- ${status}: ${check.name} -> ${check.status}`);

    if (check.url) {
      console.log(`  url: ${check.url}`);
    }

    if (check.summary) {
      console.log(`  summary: total ${check.summary.total}, pending ${check.summary.pending}, contacted ${check.summary.contacted}, needsAction ${check.summary.needsAction}`);
    }

    if (check.leadCount !== null && check.leadCount !== undefined) {
      console.log(`  leads returned: ${check.leadCount}`);
    }

    if (check.validationErrors?.length) {
      console.log(`  validation: ${check.validationErrors.join('; ')}`);
    }

    if (check.tokenMissing) {
      console.log(`  token env: ${check.missingEnv.join(' or ')}`);
    } else if (check.missingEnv) {
      console.log(`  token env required: ${check.missingEnv.join(' or ')}`);
    }

    if (!check.ok && check.bodyPreview) {
      console.log(`  body: ${check.bodyPreview}`);
    }
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      console.log(helpText());
      return;
    }

    const result = await run(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printHumanReport(result);
    }

    process.exitCode = result.ok ? 0 : result.tokenMissing ? 2 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

await main();
