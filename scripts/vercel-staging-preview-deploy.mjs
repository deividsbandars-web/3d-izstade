import { spawnSync } from 'node:child_process';
import {
  printVercelSourceContextReport,
  verifyVercelSourceContext,
} from './check-vercel-source-context.mjs';

const scope = 'esaukans-6934s-projects';
const project = 'app-staging';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const options = new Set(process.argv.slice(2));

function printHelp() {
  console.log(`Create an app-staging preview deployment.

Usage:
  npm run deploy:staging:preview
  npm run deploy:staging:preview:prebuilt
  node scripts/vercel-staging-preview-deploy.mjs --prebuilt

Modes:
  default     Upload source and let Vercel build remotely.
  --prebuilt  Run vercel build locally, then deploy .vercel/output.

This does not move staging.30sek24.com. Promote explicitly with:
  npm run promote:staging -- <deployment-url>`);
}

function buildEnv() {
  const env = {
    ...process.env,
    NO_UPDATE_NOTIFIER: '1',
  };

  if (process.platform === 'win32') {
    const pathValue = env.Path || env.PATH || '';
    const requiredPathParts = [
      'C:\\Windows\\System32',
      'C:\\Windows',
      'C:\\Windows\\System32\\Wbem',
      'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\',
      'C:\\Program Files\\nodejs\\',
      `${process.env.APPDATA || ''}\\npm`,
    ].filter(Boolean);
    const hardenedPath = [...requiredPathParts, pathValue].join(';');
    env.ComSpec = env.ComSpec || 'C:\\Windows\\System32\\cmd.exe';
    env.Path = hardenedPath;
    env.PATH = hardenedPath;
  }

  return env;
}

function run(args) {
  const result = spawnSync(npx, args, {
    env: buildEnv(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (options.has('--help') || options.has('-h')) {
  printHelp();
  process.exit(0);
}

const prebuilt = options.has('--prebuilt');

if (!prebuilt) {
  try {
    printVercelSourceContextReport(verifyVercelSourceContext());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

console.log(`Creating an app-staging ${prebuilt ? 'prebuilt ' : ''}preview deployment.`);
console.log('This does NOT move staging.30sek24.com.');
console.log('After review, promote explicitly with: npm run promote:staging -- <deployment-url>');

run(['vercel', 'link', '--yes', '--project', project, '--scope', scope]);

if (prebuilt) {
  run(['vercel', 'build', '--prod', '--yes', '--scope', scope]);
  run(['vercel', 'deploy', '--prebuilt', '--prod', '--skip-domain', '--yes', '--scope', scope]);
} else {
  run(['vercel', '--prod', '--skip-domain', '--yes', '--scope', scope]);
}
