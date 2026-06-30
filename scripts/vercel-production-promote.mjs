import { spawnSync } from 'node:child_process';

const scope = 'esaukans-6934s-projects';
const productionAliases = ['www.30sek24.com', '30sek24.com'];
const deploymentUrl = process.argv[2];

if (!deploymentUrl) {
  console.error('Usage: npm run promote:production -- https://app-<id>-esaukans-6934s-projects.vercel.app');
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

if (hostname.startsWith('app-staging-')) {
  console.error(`Refusing to promote a staging deployment to production: ${hostname}`);
  console.error('Production must be deployed from Vercel project app, not app-staging.');
  process.exit(1);
}

if (!hostname.startsWith('app-') || !hostname.endsWith('-esaukans-6934s-projects.vercel.app')) {
  console.error(`Refusing to promote a non app production deployment: ${hostname}`);
  console.error('Expected a URL like https://app-<id>-esaukans-6934s-projects.vercel.app');
  process.exit(1);
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

for (const alias of productionAliases) {
  const result = spawnSync(
    npx,
    ['vercel', 'alias', 'set', `https://${hostname}`, alias, '--scope', scope],
    {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      windowsHide: true,
    },
  );

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Production aliases now point to https://${hostname}`);
