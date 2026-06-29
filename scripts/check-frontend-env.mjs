import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const mode = process.env.MODE?.trim() || process.env.NODE_ENV?.trim() || 'production';
const requiredEnv = [
  {
    consumer: 'root Vite SPA API client',
    name: 'VITE_PUBLIC_API_BASE_URL',
    protocols: ['http:', 'https:'],
  },
  {
    consumer: 'root Vite SPA Supabase auth/data client',
    name: 'VITE_SUPABASE_URL',
    protocols: ['http:', 'https:'],
  },
  {
    consumer: 'root Vite SPA Supabase auth/data client',
    name: 'VITE_SUPABASE_ANON_KEY',
  },
];
const optionalUrlEnv = [
  {
    name: 'VITE_PUBLIC_APP_URL',
    protocols: ['http:', 'https:'],
  },
  {
    name: 'VITE_SIGNALING_SERVER_URL',
    protocols: ['ws:', 'wss:'],
  },
];

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    parsed[key] = parseEnvValue(value);
  }

  return parsed;
}

function loadEnvFiles() {
  if (process.env.WARPALA_SKIP_ENV_FILE_LOAD === '1') {
    return {};
  }

  return [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
  ].reduce((env, fileName) => ({
    ...env,
    ...parseEnvFile(path.join(repoRoot, fileName)),
  }), {});
}

function normalizeValue(env, key) {
  return env[key]?.trim() || '';
}

function assertUrl(value, key, protocols, failures) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    failures.push(`${key} must be a valid URL.`);
    return;
  }

  if (!protocols.includes(parsed.protocol)) {
    failures.push(`${key} must use one of these protocols: ${protocols.join(', ')}.`);
  }
}

const env = {
  ...loadEnvFiles(),
  ...process.env,
};
const failures = [];

for (const entry of requiredEnv) {
  const value = normalizeValue(env, entry.name);
  if (!value) {
    failures.push(`Missing required frontend build env ${entry.name} for ${entry.consumer}.`);
    continue;
  }
  if (entry.protocols) {
    assertUrl(value, entry.name, entry.protocols, failures);
  }
}

for (const entry of optionalUrlEnv) {
  const value = normalizeValue(env, entry.name);
  if (value) {
    assertUrl(value, entry.name, entry.protocols, failures);
  }
}

const turnUsername = normalizeValue(env, 'VITE_TURN_USERNAME');
const turnPassword = normalizeValue(env, 'VITE_TURN_PASSWORD');
if ((turnUsername && !turnPassword) || (!turnUsername && turnPassword)) {
  failures.push('VITE_TURN_USERNAME and VITE_TURN_PASSWORD must be configured together.');
}

const probeTimeout = normalizeValue(env, 'VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS');
if (probeTimeout) {
  const parsed = Number(probeTimeout);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    failures.push('VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS must be a positive number when set.');
  }
}

if (failures.length > 0) {
  console.error('[check-frontend-env] failed');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error('- Set these values in Vercel project env, CI env, or a local .env.local file before running npm.cmd run build.');
  process.exit(1);
}

console.log(`[check-frontend-env] passed for mode=${mode}`);
console.log(`- Required frontend build env present: ${requiredEnv.map((entry) => entry.name).join(', ')}.`);
