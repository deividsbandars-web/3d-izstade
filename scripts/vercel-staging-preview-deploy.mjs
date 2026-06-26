import { spawnSync } from 'node:child_process';

const scope = 'esaukans-6934s-projects';
const project = 'app-staging';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(args) {
  const result = spawnSync(npx, args, {
    env: {
      ...process.env,
      NO_UPDATE_NOTIFIER: '1',
    },
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

console.log('Creating an app-staging preview deployment.');
console.log('This does NOT move staging.30sek24.com.');
console.log('After review, promote explicitly with: npm run promote:staging -- <deployment-url>');

run(['vercel', 'link', '--yes', '--project', project, '--scope', scope]);
run(['vercel', '--prod', '--skip-domain', '--yes', '--scope', scope]);
