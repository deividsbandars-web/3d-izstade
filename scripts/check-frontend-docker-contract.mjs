import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import createIgnore from 'ignore';
import { load as parseYaml } from 'js-yaml';

const REQUIRED_BUILD_ENV = [
  'VITE_PUBLIC_API_BASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];
const OPTIONAL_BUILD_ENV = [
  'VITE_PUBLIC_APP_URL',
  'VITE_SIGNALING_SERVER_URL',
  'VITE_PIXEL_STREAMING_PROBE_TIMEOUT_MS',
  'VITE_STUN_SERVER_URLS',
  'VITE_TURN_SERVER_URLS',
  'VITE_TURN_USERNAME',
  'VITE_TURN_PASSWORD',
];

function read(rootDirectory, relativePath) {
  const absolutePath = path.join(rootDirectory, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`[check-frontend-docker-contract] missing ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function parseDockerArgs(dockerfile) {
  const args = new Map();
  for (const line of dockerfile.split(/\r?\n/)) {
    const match = line.trim().match(/^ARG\s+([A-Z0-9_]+)(?:=(.*))?$/);
    if (match) {
      args.set(match[1], match[2] ?? '');
    }
  }
  return args;
}

function parseEnvNames(envFile) {
  return new Set(envFile.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim()));
}

export function verifyFrontendDockerContract(rootDirectory = process.cwd()) {
  const failures = [];
  const dockerfile = read(rootDirectory, 'Dockerfile');
  const compose = parseYaml(read(rootDirectory, 'docker-compose.yml'));
  const packageJson = JSON.parse(read(rootDirectory, 'package.json'));
  const frontendEnvChecker = read(rootDirectory, 'scripts/check-frontend-env.mjs');
  const dockerEnvNames = parseEnvNames(read(rootDirectory, '.env.docker.example'));
  const deploymentContract = read(rootDirectory, 'docs/release/WEB3D_EXPO_DEPLOYMENT_CONTRACT.md');
  const nginxConfig = read(rootDirectory, 'deployment/configs/nginx.conf');
  const dockerArgs = parseDockerArgs(dockerfile);
  const composeArgs = compose?.services?.frontend?.build?.args ?? {};

  for (const name of [...REQUIRED_BUILD_ENV, ...OPTIONAL_BUILD_ENV]) {
    if (!dockerArgs.has(name)) {
      failures.push(`Dockerfile is missing ARG ${name}.`);
    } else if (dockerArgs.get(name) !== '') {
      failures.push(`Dockerfile ARG ${name} must not have a baked-in default.`);
    }

    if (!new RegExp(`^ENV\\s+${name}=\\$\\{${name}\\}$`, 'm').test(dockerfile)) {
      failures.push(`Dockerfile is missing ENV propagation for ${name}.`);
    }

    if (!dockerEnvNames.has(name)) {
      failures.push(`.env.docker.example is missing ${name}.`);
    }
  }

  for (const name of REQUIRED_BUILD_ENV) {
    const expected = `\${${name}:?${name} is required}`;
    if (composeArgs[name] !== expected) {
      failures.push(`Compose must require ${name} with ${expected}.`);
    }
    if (!deploymentContract.includes(`\`${name}\``)) {
      failures.push(`Deployment contract does not document required ${name}.`);
    }
    if (!new RegExp(`name:\\s*['\"]${name}['\"]`).test(frontendEnvChecker)) {
      failures.push(`Frontend env checker does not require ${name}.`);
    }
  }

  for (const name of OPTIONAL_BUILD_ENV) {
    const expected = `\${${name}:-}`;
    if (composeArgs[name] !== expected) {
      failures.push(`Compose optional ${name} must default to empty with ${expected}.`);
    }
  }

  const lines = dockerfile.split(/\r?\n/).map((line) => line.trim());
  const checkerCopyIndex = lines.findIndex((line) => (
    /^COPY\s+scripts\/check-frontend-env\.mjs\s+\.\/scripts\/check-frontend-env\.mjs$/.test(line)
  ));
  const buildIndex = lines.findIndex((line) => line === 'RUN npm run build');
  if (checkerCopyIndex < 0) {
    failures.push('Dockerfile does not copy scripts/check-frontend-env.mjs.');
  } else if (buildIndex < 0 || checkerCopyIndex > buildIndex) {
    failures.push('Dockerfile must copy the frontend env checker before npm run build.');
  }

  if (!packageJson.scripts?.build?.includes('npm run check:frontend-env')) {
    failures.push('package.json build no longer invokes check:frontend-env.');
  }
  if (packageJson.scripts?.['check:frontend-env'] !== 'node scripts/check-frontend-env.mjs') {
    failures.push('package.json check:frontend-env does not use the Docker-copied checker.');
  }

  const dockerIgnore = createIgnore().add(read(rootDirectory, '.dockerignore'));
  if (dockerIgnore.ignores('scripts/check-frontend-env.mjs')) {
    failures.push('.dockerignore excludes scripts/check-frontend-env.mjs.');
  }

  if (!deploymentContract.includes('docker build `')
    || !deploymentContract.includes('check:frontend-docker-contract')) {
    failures.push('Deployment contract is missing the baseline Docker build or preflight command.');
  }

  if (!/^FROM\s+nginx:alpine\s+AS\s+runner$/m.test(dockerfile)
    || !dockerfile.includes('COPY --from=builder /app/dist /usr/share/nginx/html')) {
    failures.push('Docker runner does not serve the Vite dist from the NGINX document root.');
  }
  if (!nginxConfig.includes('root /usr/share/nginx/html;')
    || !nginxConfig.includes('try_files $uri $uri/ /index.html;')) {
    failures.push('NGINX config does not provide the Vite SPA document root and history fallback.');
  }

  if (failures.length > 0) {
    throw new Error(
      `[check-frontend-docker-contract] failed\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
  }

  return {
    optionalBuildArgs: OPTIONAL_BUILD_ENV.length,
    requiredBuildArgs: REQUIRED_BUILD_ENV.length,
  };
}

try {
  const report = verifyFrontendDockerContract();
  console.log('[check-frontend-docker-contract] passed');
  console.log(`- Required frontend build args: ${report.requiredBuildArgs}.`);
  console.log(`- Optional empty-default frontend build args: ${report.optionalBuildArgs}.`);
  console.log('- Env checker is copied before npm run build.');
  console.log('- NGINX serves the Vite dist with an index.html fallback.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
