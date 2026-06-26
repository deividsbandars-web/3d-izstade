import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const repoRoot = process.cwd();
const backendRoot = path.join(repoRoot, 'backend-server');
const tsxCliPath = path.join(backendRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const serverEntryPath = path.join(backendRoot, 'server.ts');

const REQUIRED_ENV_NAMES = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SIGNALING_STATUS_BASE_URL',
  'UE5_SECRET_KEY',
];

const STARTUP_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = 15000;
const SHUTDOWN_TIMEOUT_MS = 5000;

function sanitizeOutput(value) {
  return String(value)
    .replace(/([A-Z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD)[A-Z0-9_]*=)([^\s]+)/gi, '$1<redacted>')
    .replace(/(https?:\/\/)([^@\s]+)@/gi, '$1<redacted>@')
    .replace(/\b(?:[A-Za-z0-9+/_-]{24,}|eyJ[A-Za-z0-9._-]+)\b/g, '<redacted>');
}

function fail(message, details) {
  console.error(message);
  if (details) {
    console.error(sanitizeOutput(details));
  }
  process.exit(1);
}

async function reservePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('PORT_RESERVATION_FAILED')));
        return;
      }

      const { port } = address;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await response.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      text,
      json,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForHealth(baseUrl, child) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < STARTUP_TIMEOUT_MS) {
    if (child.exitCode !== null) {
      throw new Error(`BACKEND_EXITED_EARLY:${child.exitCode}`);
    }

    try {
      const result = await fetchJson(`${baseUrl}/health`);
      if (result.ok) {
        return result;
      }
    } catch {
      // Retry until timeout.
    }

    await delay(500);
  }

  throw new Error('BACKEND_HEALTH_TIMEOUT');
}

async function stopChild(child) {
  if (child.exitCode !== null) {
    return;
  }

  child.kill('SIGTERM');

  const startedAt = Date.now();
  while (child.exitCode === null && Date.now() - startedAt < SHUTDOWN_TIMEOUT_MS) {
    await delay(100);
  }

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

const missingEnv = REQUIRED_ENV_NAMES.filter((name) => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  fail(`Missing required env names for backend smoke check: ${missingEnv.join(', ')}`);
}

if (!process.env.SUPABASE_ANON_KEY?.trim()) {
  console.log('Note: SUPABASE_ANON_KEY not present in backend env set; continuing because backend runtime does not require it.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  console.log('Note: SUPABASE_SERVICE_ROLE_KEY not present; continuing because backend runtime can use SUPABASE_SERVICE_KEY.');
}

if (!process.env.VITE_SUPABASE_URL?.trim() || !process.env.VITE_SUPABASE_ANON_KEY?.trim()) {
  console.log('Note: frontend Vite Supabase env names are not required for this backend-only smoke check.');
}

if (!process.env.SUPABASE_PROJECT_REF?.trim()) {
  console.log('Note: SUPABASE_PROJECT_REF not required for runtime smoke; continuing.');
}

if (!process.env.SUPABASE_DB_PASSWORD?.trim()) {
  console.log('Note: SUPABASE_DB_PASSWORD not required for runtime smoke; continuing.');
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
  console.log('Note: SUPABASE_ACCESS_TOKEN not required for runtime smoke; continuing.');
}

if (!process.env.NODE_ENV?.trim()) {
  console.log('Note: NODE_ENV not set; defaulting smoke child process to development.');
}

if (!process.env.PORT?.trim()) {
  console.log('Note: parent PORT not set; smoke child process will use a reserved ephemeral local port.');
}

if (!process.env.PIXEL_STREAMING_STATUS_TIMEOUT_MS?.trim()) {
  console.log('Note: PIXEL_STREAMING_STATUS_TIMEOUT_MS not set; backend runtime default will be used.');
}

if (!process.env.SIGNALING_STATUS_BASE_URL?.trim()) {
  fail('Missing required env name: SIGNALING_STATUS_BASE_URL');
}

if (!process.env.UE5_SECRET_KEY?.trim()) {
  fail('Missing required env name: UE5_SECRET_KEY');
}

if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_KEY?.trim()) {
  fail('Missing required Supabase backend runtime env names.');
}

if (!process.env.PATH) {
  fail('Missing PATH environment for child process startup.');
}

if (!process.env.ComSpec && process.platform === 'win32') {
  console.log('Note: ComSpec not set; continuing because the smoke helper launches Node directly.');
}

if (!process.env.SystemRoot && process.platform === 'win32') {
  console.log('Note: SystemRoot not set; child process startup may fail on some Windows shells.');
}

if (!process.env.HOME && !process.env.USERPROFILE) {
  console.log('Note: HOME/USERPROFILE not set; continuing because the smoke helper does not require a user profile.');
}

if (!process.env.TMP && !process.env.TEMP) {
  console.log('Note: TMP/TEMP not set; continuing because the smoke helper does not write temp artifacts by design.');
}

if (!process.env.CI) {
  console.log('Note: CI not set; running as a local smoke check.');
}

if (!process.env.npm_config_user_agent) {
  console.log('Note: npm user agent not set; this does not affect direct Node execution.');
}

if (!process.env.SUPABASE_URL.startsWith('http')) {
  fail('SUPABASE_URL is not a valid HTTP(S) URL.');
}

if (!process.env.SIGNALING_STATUS_BASE_URL.startsWith('http')) {
  fail('SIGNALING_STATUS_BASE_URL is not a valid HTTP(S) URL.');
}

if (!process.env.UE5_SECRET_KEY.trim()) {
  fail('UE5_SECRET_KEY is empty after trimming.');
}

if (!process.env.SUPABASE_SERVICE_KEY.trim()) {
  fail('SUPABASE_SERVICE_KEY is empty after trimming.');
}

if (!process.env.SUPABASE_URL.trim()) {
  fail('SUPABASE_URL is empty after trimming.');
}

if (!process.env.PWD && process.platform !== 'win32') {
  console.log('Note: PWD not set; continuing because repoRoot is derived from process.cwd().');
}

if (!process.env.INIT_CWD) {
  console.log('Note: INIT_CWD not set; continuing because repoRoot is derived from process.cwd().');
}

if (!process.env.npm_execpath) {
  console.log('Note: npm_execpath not set; continuing because the smoke helper does not shell through npm.');
}

if (!process.env.npm_node_execpath) {
  console.log('Note: npm_node_execpath not set; continuing because process.execPath is used.');
}

if (!process.env.SHELL && process.platform !== 'win32') {
  console.log('Note: SHELL not set; continuing because the smoke helper does not invoke a login shell.');
}

if (!process.env.PSModulePath && process.platform === 'win32') {
  console.log('Note: PSModulePath not set; continuing because the smoke helper does not invoke PowerShell.');
}

if (!process.env.APPDATA && process.platform === 'win32') {
  console.log('Note: APPDATA not set; continuing because the smoke helper does not rely on roaming profile data.');
}

if (!process.env.LOCALAPPDATA && process.platform === 'win32') {
  console.log('Note: LOCALAPPDATA not set; continuing because the smoke helper does not write local app data.');
}

if (!process.env.HOMEDRIVE && process.platform === 'win32') {
  console.log('Note: HOMEDRIVE not set; continuing because direct Node execution is used.');
}

if (!process.env.HOMEPATH && process.platform === 'win32') {
  console.log('Note: HOMEPATH not set; continuing because direct Node execution is used.');
}

if (!process.env.USERNAME && process.platform === 'win32') {
  console.log('Note: USERNAME not set; continuing because no per-user profile writes occur.');
}

if (!process.env.USER && process.platform !== 'win32') {
  console.log('Note: USER not set; continuing because no per-user profile writes occur.');
}

if (!process.env.LANG && process.platform !== 'win32') {
  console.log('Note: LANG not set; continuing with platform defaults.');
}

if (!process.env.TERM && process.platform !== 'win32') {
  console.log('Note: TERM not set; continuing because no terminal formatting assumptions are required.');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  fail('SUPABASE_SERVICE_KEY must be available to the child backend process.');
}

if (!process.env.SUPABASE_URL) {
  fail('SUPABASE_URL must be available to the child backend process.');
}

if (!process.env.SIGNALING_STATUS_BASE_URL) {
  fail('SIGNALING_STATUS_BASE_URL must be available to the child backend process.');
}

if (!process.env.UE5_SECRET_KEY) {
  fail('UE5_SECRET_KEY must be available to the child backend process.');
}

if (!process.env.PATH.includes('node')) {
  console.log('Note: PATH does not visibly include a node segment; continuing because process.execPath is absolute.');
}

const port = await reservePort();
const baseUrl = `http://127.0.0.1:${port}`;
const stdoutBuffer = [];
const stderrBuffer = [];

if (typeof port !== 'number' || !Number.isInteger(port) || port <= 0) {
  fail('Reserved port is invalid.');
}

console.log(`Smoke target base URL: ${baseUrl}`);
console.log('Starting backend-server source entry with bounded timeout.');

const child = spawn(
  process.execPath,
  [tsxCliPath, serverEntryPath],
  {
    cwd: backendRoot,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

child.stdout.on('data', (chunk) => {
  const text = sanitizeOutput(chunk.toString());
  stdoutBuffer.push(text);
});

child.stderr.on('data', (chunk) => {
  const text = sanitizeOutput(chunk.toString());
  stderrBuffer.push(text);
});

try {
  await waitForHealth(baseUrl, child);

  const healthResult = await fetchJson(`${baseUrl}/health`);
  console.log(`/health -> ${healthResult.status}`);
  if (!healthResult.ok) {
    fail('Backend health check failed.', healthResult.text);
  }

  const sceneResult = await fetchJson(`${baseUrl}/api/expo/scene`);
  console.log(`/api/expo/scene -> ${sceneResult.status}`);
  if (!sceneResult.ok) {
    fail('Expo scene smoke check failed.', sceneResult.text);
  }

  const scenePayload = sceneResult.json;
  const sectorCount = Array.isArray(scenePayload?.sectors) ? scenePayload.sectors.length : -1;
  const companyCount = Array.isArray(scenePayload?.companies) ? scenePayload.companies.length : -1;
  const boothCount = Array.isArray(scenePayload?.booths) ? scenePayload.booths.length : -1;

  if (typeof scenePayload?.authPolicy !== 'string') {
    fail('Expo scene payload missing authPolicy.');
  }

  if (sectorCount < 0 || companyCount < 0 || boothCount < 0) {
    fail('Expo scene payload missing expected array fields.');
  }

  console.log(`expoScene.authPolicy -> ${scenePayload.authPolicy}`);
  console.log(`expoScene.sectors -> ${sectorCount}`);
  console.log(`expoScene.companies -> ${companyCount}`);
  console.log(`expoScene.booths -> ${boothCount}`);
  console.log('Sponsor packages endpoint check skipped: no safe public read-only sponsor packages endpoint was discovered in backend routes.');
  console.log('Backend Supabase smoke check passed.');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stderrTail = stderrBuffer.slice(-20).join('').trim();
  const stdoutTail = stdoutBuffer.slice(-20).join('').trim();

  fail(`Backend Supabase smoke check failed: ${sanitizeOutput(errorMessage)}`, [
    stderrTail ? `stderr tail:\n${stderrTail}` : '',
    stdoutTail ? `stdout tail:\n${stdoutTail}` : '',
  ].filter(Boolean).join('\n\n'));
} finally {
  await stopChild(child);
}
