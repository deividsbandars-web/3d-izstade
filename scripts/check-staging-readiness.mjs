#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const DEFAULTS = {
  apiBase: 'https://api-staging.30sek24.com',
  expectedDopplerConfig: 'stg',
  timeoutMs: 15000,
};

function parseArgs(argv) {
  const options = {
    apiBase: DEFAULTS.apiBase,
    failFast: false,
    help: false,
    json: false,
    skipPublicationSmoke: false,
    skipSupabaseDryRun: false,
  };

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--fail-fast') {
      options.failFast = true;
    } else if (arg === '--skip-publication-smoke') {
      options.skipPublicationSmoke = true;
    } else if (arg === '--skip-supabase-dry-run') {
      options.skipSupabaseDryRun = true;
    } else if (arg.startsWith('--api-base=')) {
      options.apiBase = arg.slice('--api-base='.length).replace(/\/+$/, '');
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Staging readiness check

Usage:
  npm run check:staging-readiness
  npm run check:staging-readiness -- --json

Checks:
  - Doppler scope is -3d-izstade / stg
  - Doppler stg points the core frontend runtime to api-staging and the optional legacy runtime to signaling-staging
  - Vercel app-staging responds on staging.30sek24.com
  - Hetzner API health and scene endpoints respond
  - Supabase db push dry-run is clean
  - Expo publication staging smoke test passes
  - Legacy runtime gateway/TURN check passes, streamer absence is warning-level in baseline mode

Options:
  --fail-fast
  --json
  --skip-publication-smoke
  --skip-supabase-dry-run
  --api-base=https://api-staging.30sek24.com

This script does not print secrets. The publication smoke test creates and archives one temporary booth.`);
}

function commandName(name) {
  if (process.platform !== 'win32') return name;
  if (name === 'npm') return 'npm.cmd';
  if (name === 'npx') return 'npx.cmd';
  return name;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(commandName(command), args, {
    encoding: 'utf8',
    timeout: options.timeoutMs ?? 120000,
    windowsHide: true,
  });

  return {
    command: [command, ...args].join(' '),
    error: result.error ? result.error.message : null,
    output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
    status: result.status ?? (result.error ? 1 : 0),
  };
}

function truncate(value, length = 1200) {
  const text = String(value || '');
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function parseDopplerPlain(output) {
  const lines = String(output || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return {
    project: lines[0] || null,
    config: lines[1] || null,
  };
}

function safeJsonScript() {
  return `
const safe = (value) => value ? String(value).trim() : null;
const ref = (value) => { try { return new URL(value).hostname.split('.')[0]; } catch { return null; } };
console.log(JSON.stringify({
  config: process.env.DOPPLER_CONFIG || null,
  environment: process.env.DOPPLER_ENVIRONMENT || null,
  apiBase: safe(process.env.VITE_PUBLIC_API_BASE_URL),
  signaling: safe(process.env.VITE_SIGNALING_SERVER_URL),
  supabaseRef: ref(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
  hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
  hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  hasTurn: Boolean((process.env.TURN_USERNAME || process.env.VITE_TURN_USERNAME) && (process.env.TURN_SERVER_URLS || process.env.VITE_TURN_SERVER_URLS)),
}));`;
}

function tryParseJson(output) {
  const text = String(output || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function fetchStatus(url, timeoutMs = DEFAULTS.timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return { ok: response.ok, status: response.status };
  } finally {
    clearTimeout(timeout);
  }
}

function addResult(results, result) {
  results.push(result);
  return result.ok;
}

function resultFromCommand(name, commandResult, options = {}) {
  const ok = options.ok ? options.ok(commandResult) : commandResult.status === 0;
  return {
    details: options.details ? options.details(commandResult) : truncate(commandResult.output),
    name,
    ok,
  };
}

async function run(options) {
  const results = [];
  const warnings = [];

  function push(result) {
    addResult(results, result);
    if (!result.ok && options.failFast) {
      const error = new Error(`${result.name} failed`);
      error.results = results;
      error.warnings = warnings;
      throw error;
    }
  }

  const dopplerScope = runCommand('doppler', ['configure', 'get', 'project', 'config', '--plain'], { timeoutMs: 30000 });
  const dopplerParsed = parseDopplerPlain(dopplerScope.output);
  push({
    details: dopplerParsed,
    name: 'doppler scope is staging',
    ok: dopplerScope.status === 0 && dopplerParsed.project === '-3d-izstade' && dopplerParsed.config === DEFAULTS.expectedDopplerConfig,
  });

  const dopplerEnv = runCommand('doppler', ['run', '--', 'node', '-e', safeJsonScript()], { timeoutMs: 60000 });
  const dopplerEnvJson = tryParseJson(dopplerEnv.output);
  push({
    details: dopplerEnvJson || truncate(dopplerEnv.output),
    name: 'doppler stg runtime endpoints',
    ok: dopplerEnv.status === 0
      && dopplerEnvJson?.apiBase === options.apiBase
      && dopplerEnvJson?.signaling === 'wss://api-staging.30sek24.com/ws/'
      && dopplerEnvJson?.hasAnonKey === true
      && dopplerEnvJson?.hasServiceKey === true
      && dopplerEnvJson?.hasTurn === true,
  });

  for (const [name, url] of [
    ['frontend staging route', 'https://staging.30sek24.com/expo-3d?salesDemo=1'],
    ['api staging health', `${options.apiBase}/health`],
    ['api staging scene', `${options.apiBase}/api/expo/scene`],
  ]) {
    try {
      const status = await fetchStatus(url);
      push({ details: { status: status.status, url }, name, ok: status.ok });
    } catch (error) {
      push({ details: { error: error instanceof Error ? error.message : String(error), url }, name, ok: false });
    }
  }

  if (!options.skipSupabaseDryRun) {
    const dryRun = runCommand('doppler', ['run', '--', 'npx', '-y', 'supabase', 'db', 'push', '--linked', '--dry-run'], { timeoutMs: 180000 });
    push(resultFromCommand('supabase db push dry-run clean', dryRun, {
      ok: (result) => result.status === 0 && /Remote database is up to date/i.test(result.output),
      details: (result) => truncate(result.output),
    }));
  } else {
    warnings.push({ name: 'supabase db push dry-run skipped', reason: 'requested by flag' });
  }

  if (!options.skipPublicationSmoke) {
    const smoke = runCommand('doppler', ['run', '--', 'npm.cmd', 'run', 'check:expo-publication-staging', '--', '--json'], { timeoutMs: 240000 });
    const smokeJson = tryParseJson(smoke.output);
    push({
      details: smokeJson ? { checkCount: smokeJson.checks?.length ?? null, ok: smokeJson.ok } : truncate(smoke.output),
      name: 'expo publication staging smoke',
      ok: smoke.status === 0 && smokeJson?.ok === true,
    });
  } else {
    warnings.push({ name: 'expo publication staging smoke skipped', reason: 'requested by flag' });
  }

  const pixel = runCommand('doppler', ['run', '--', 'npm.cmd', 'run', 'check:expo:legacy-runtime', '--', '--mode', 'baseline'], { timeoutMs: 120000 });
  const pixelOutput = pixel.output;
  const pixelHardOk = pixel.status === 0
    && pixelOutput.includes('[PASS] backend-status-endpoint')
    && pixelOutput.includes('[PASS] gateway-status')
    && pixelOutput.includes('[PASS] turn-status');
  if (pixelOutput.includes('[WARN] streamer-status') || pixelOutput.includes('[WARN] session-readiness')) {
    warnings.push({ name: 'legacy runtime active streamer', reason: 'Legacy streamer is not required for baseline readiness' });
  }
  push({
    details: truncate(pixelOutput),
    name: 'legacy runtime baseline gateway/turn',
    ok: pixelHardOk,
  });

  return {
    ok: results.every((result) => result.ok),
    results,
    warnings,
  };
}

function printText(report) {
  console.log(`Staging readiness: ${report.ok ? 'PASS' : 'FAIL'}`);
  for (const result of report.results) {
    console.log(`[${result.ok ? 'PASS' : 'FAIL'}] ${result.name}: ${JSON.stringify(result.details)}`);
  }
  for (const warning of report.warnings) {
    console.log(`[WARN] ${warning.name}: ${warning.reason}`);
  }
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

try {
  const report = await run(options);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }
  process.exitCode = report.ok ? 0 : 1;
} catch (error) {
  const report = {
    error: error instanceof Error ? error.message : String(error),
    ok: false,
    results: error.results || [],
    warnings: error.warnings || [],
  };
  if (options.json) console.error(JSON.stringify(report, null, 2));
  else printText(report);
  process.exitCode = 1;
}
