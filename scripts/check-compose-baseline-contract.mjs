import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';

const BASELINE_SERVICES = ['frontend', 'redis', 'backend'];
const OPTIONAL_PIXEL_STREAMING_SERVICES = ['signaling', 'turn', 'sync-server'];
const REQUIRED_FRONTEND_ENV = [
  'VITE_PUBLIC_API_BASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];
const OPTIONAL_FRONTEND_ENV = [
  'VITE_SIGNALING_SERVER_URL',
  'VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS',
  'VITE_STUN_SERVER_URLS',
  'VITE_TURN_SERVER_URLS',
  'VITE_TURN_USERNAME',
  'VITE_TURN_PASSWORD',
];
const REQUIRED_EMPTY_PIXEL_STREAMING_EXAMPLE_ENV = [
  'UE5_SECRET_KEY',
  'TURN_USERNAME',
  'TURN_PASSWORD',
  'TURN_REALM',
  'TURN_PUBLIC_IP',
  'TURN_SERVER_URLS',
];

function read(rootDirectory, relativePath) {
  const absolutePath = path.join(rootDirectory, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`[check-compose-baseline-contract] missing ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function parseEnvExample(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }
    const equalsIndex = trimmed.indexOf('=');
    values.set(trimmed.slice(0, equalsIndex), trimmed.slice(equalsIndex + 1));
  }
  return values;
}

function dependsOnService(service, dependencyName) {
  const dependsOn = service?.depends_on;
  if (!dependsOn) {
    return false;
  }
  if (Array.isArray(dependsOn)) {
    return dependsOn.includes(dependencyName);
  }
  return Object.prototype.hasOwnProperty.call(dependsOn, dependencyName);
}

function getReadmeFrontendRequiredBlock(readme) {
  const start = readme.indexOf('Frontend release builds must use:');
  const end = readme.indexOf('Optional Pixel Streaming/operator frontend settings:');
  if (start < 0 || end < 0 || end <= start) {
    return '';
  }
  return readme.slice(start, end);
}

export function verifyComposeBaselineContract(rootDirectory = process.cwd()) {
  const failures = [];
  const baseComposeSource = read(rootDirectory, 'docker-compose.yml');
  const pixelComposeSource = read(rootDirectory, 'docker-compose.pixel-streaming.yml');
  const envExample = parseEnvExample(read(rootDirectory, '.env.docker.example'));
  const readme = read(rootDirectory, 'README.md');
  const baseCompose = parseYaml(baseComposeSource);
  const pixelCompose = parseYaml(pixelComposeSource);
  const baseServices = baseCompose?.services ?? {};
  const pixelServices = pixelCompose?.services ?? {};

  for (const serviceName of BASELINE_SERVICES) {
    if (!baseServices[serviceName]) {
      failures.push(`Baseline docker-compose.yml is missing service: ${serviceName}.`);
    }
  }

  for (const serviceName of OPTIONAL_PIXEL_STREAMING_SERVICES) {
    if (baseServices[serviceName]) {
      failures.push(`Optional Pixel Streaming service must not be in baseline compose: ${serviceName}.`);
    }
    if (!pixelServices[serviceName]) {
      failures.push(`docker-compose.pixel-streaming.yml is missing optional service: ${serviceName}.`);
    }
  }

  for (const dependencyName of OPTIONAL_PIXEL_STREAMING_SERVICES) {
    if (dependsOnService(baseServices.frontend, dependencyName)) {
      failures.push(`Baseline frontend depends on optional service: ${dependencyName}.`);
    }
    if (dependsOnService(baseServices.backend, dependencyName)) {
      failures.push(`Baseline backend depends on optional service: ${dependencyName}.`);
    }
  }

  const backendEnv = baseServices.backend?.environment ?? {};
  if (backendEnv.PIXEL_STREAMING_ROUTES_ENABLED !== '${PIXEL_STREAMING_ROUTES_ENABLED:-false}') {
    failures.push('Baseline backend must default PIXEL_STREAMING_ROUTES_ENABLED to false.');
  }
  if (backendEnv.SIGNALING_STATUS_BASE_URL !== '${SIGNALING_STATUS_BASE_URL:-}') {
    failures.push('Baseline backend must not default SIGNALING_STATUS_BASE_URL to the signaling service.');
  }

  if (!dependsOnService(pixelServices.frontend, 'signaling')) {
    failures.push('Pixel Streaming override must wire frontend to signaling.');
  }
  if (!dependsOnService(pixelServices.backend, 'signaling')) {
    failures.push('Pixel Streaming override must wire backend to signaling.');
  }

  const pixelBackendEnv = pixelServices.backend?.environment ?? {};
  if (pixelBackendEnv.PIXEL_STREAMING_ROUTES_ENABLED !== '${PIXEL_STREAMING_ROUTES_ENABLED:-true}') {
    failures.push('Pixel Streaming override must default backend Pixel Streaming routes to true.');
  }
  if (pixelBackendEnv.SIGNALING_STATUS_BASE_URL !== '${SIGNALING_STATUS_BASE_URL:-http://signaling}') {
    failures.push('Pixel Streaming override must default backend signaling status to the signaling service.');
  }
  if (!String(pixelBackendEnv.UE5_SECRET_KEY ?? '').includes(':?')) {
    failures.push('Pixel Streaming override must require UE5_SECRET_KEY.');
  }

  const signalingEnv = pixelServices.signaling?.environment ?? {};
  for (const name of ['TURN_SERVER_URLS', 'TURN_USERNAME', 'TURN_PASSWORD']) {
    if (!String(signalingEnv[name] ?? '').includes(':?')) {
      failures.push(`Pixel Streaming signaling service must require ${name}.`);
    }
  }

  const turnCommand = (pixelServices.turn?.command ?? []).join('\n');
  for (const requiredSnippet of [
    '--realm=${TURN_REALM:?',
    '--external-ip=${TURN_PUBLIC_IP:?',
    '--user=${TURN_USERNAME:?',
    ':${TURN_PASSWORD:?',
  ]) {
    if (!turnCommand.includes(requiredSnippet)) {
      failures.push(`Pixel Streaming TURN command is missing required interpolation: ${requiredSnippet}.`);
    }
  }

  for (const forbiddenSnippet of ['TURN_PASSWORD:-change-me', 'warpala.local']) {
    if (baseComposeSource.includes(forbiddenSnippet)
      || pixelComposeSource.includes(forbiddenSnippet)
      || read(rootDirectory, '.env.docker.example').includes(forbiddenSnippet)) {
      failures.push(`Weak Pixel Streaming default remains present: ${forbiddenSnippet}.`);
    }
  }

  for (const name of REQUIRED_EMPTY_PIXEL_STREAMING_EXAMPLE_ENV) {
    if (envExample.get(name) !== '') {
      failures.push(`.env.docker.example must leave optional ${name} blank.`);
    }
  }

  const frontendRequiredBlock = getReadmeFrontendRequiredBlock(readme);
  if (!frontendRequiredBlock) {
    failures.push('README does not separate required frontend env from optional Pixel Streaming env.');
  } else {
    for (const name of REQUIRED_FRONTEND_ENV) {
      if (!frontendRequiredBlock.includes(`\`${name}\``)) {
        failures.push(`README frontend required env block is missing ${name}.`);
      }
    }
    for (const name of OPTIONAL_FRONTEND_ENV) {
      if (frontendRequiredBlock.includes(`\`${name}\``)) {
        failures.push(`README frontend required env block still lists optional ${name}.`);
      }
    }
  }

  if (!readme.includes('docker-compose.pixel-streaming.yml')) {
    failures.push('README does not document the optional Pixel Streaming compose override.');
  }
  if (!readme.includes('scripts/check-frontend-env.mjs')) {
    failures.push('README does not cite the frontend env checker as source of truth.');
  }

  if (failures.length > 0) {
    throw new Error(
      `[check-compose-baseline-contract] failed\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
  }

  return {
    baselineServices: BASELINE_SERVICES.length,
    optionalPixelStreamingServices: OPTIONAL_PIXEL_STREAMING_SERVICES.length,
    requiredFrontendEnv: REQUIRED_FRONTEND_ENV.length,
  };
}

export function printComposeBaselineContractReport(report) {
  console.log('[check-compose-baseline-contract] passed');
  console.log(`- Baseline compose services: ${report.baselineServices}.`);
  console.log(`- Optional Pixel Streaming services moved to override: ${report.optionalPixelStreamingServices}.`);
  console.log(`- Required frontend env values documented: ${report.requiredFrontendEnv}.`);
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    printComposeBaselineContractReport(verifyComposeBaselineContract());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
