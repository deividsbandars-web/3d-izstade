import { spawnSync } from 'node:child_process';

const scope = 'esaukans-6934s-projects';
const stagingAlias = 'staging.30sek24.com';
const deploymentUrl = process.argv[2];

if (!deploymentUrl) {
  console.error('Usage: npm run promote:staging -- https://app-staging-<id>-esaukans-6934s-projects.vercel.app');
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(deploymentUrl.startsWith('http') ? deploymentUrl : `https://${deploymentUrl}`);
} catch {
  console.error(`Invalid deployment URL: ${deploymentUrl}`);
  process.exit(1);
}

const hostname = parsed.hostname;

if (!hostname.startsWith('app-staging-') || !hostname.endsWith('-esaukans-6934s-projects.vercel.app')) {
  console.error(`Refusing to promote a non app-staging deployment: ${hostname}`);
  console.error('This guard prevents accidentally aliasing production app deployments to staging.');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  ['vercel', 'alias', 'set', `https://${hostname}`, stagingAlias, '--scope', scope],
  {
    stdio: 'inherit',
    shell: false,
  },
);

process.exit(result.status ?? 1);
