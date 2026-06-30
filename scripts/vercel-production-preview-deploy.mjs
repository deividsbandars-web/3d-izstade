import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const scope = 'esaukans-6934s-projects';
const project = 'app';
const expectedBranch = process.env.PRODUCTION_DEPLOY_BRANCH || 'feat/booth-camera-screen-feed-current';
const projectJsonPath = '.vercel/project.json';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const options = new Set(process.argv.slice(2));

function run(command, args, runOptions = {}) {
  const result = spawnSync(command, args, {
    encoding: runOptions.capture ? 'utf8' : undefined,
    env: buildEnv(),
    shell: process.platform === 'win32',
    stdio: runOptions.capture ? 'pipe' : 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.status !== 0) {
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    throw new Error(output || `${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }

  return `${result.stdout || ''}${result.stderr || ''}`.trim();
}

function readProjectLink() {
  if (!fs.existsSync(projectJsonPath)) {
    return null;
  }

  return fs.readFileSync(projectJsonPath, 'utf8');
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

function restoreProjectLink(previousProjectJson) {
  if (previousProjectJson === null) {
    return;
  }

  fs.mkdirSync('.vercel', { recursive: true });
  fs.writeFileSync(projectJsonPath, previousProjectJson);
}

function assertSafeGitState() {
  const branch = run('git', ['branch', '--show-current'], { capture: true });
  if (branch !== expectedBranch && !options.has('--allow-branch')) {
    throw new Error(
      `Refusing production deploy from branch ${branch}. Expected ${expectedBranch}. `
      + 'Pass --allow-branch only for an intentional release exception.',
    );
  }

  const status = run('git', ['status', '--short', '--untracked-files=no'], { capture: true });
  if (status && !options.has('--allow-dirty')) {
    throw new Error(
      'Refusing production deploy with modified tracked files. '
      + 'Commit or revert changes first, or pass --allow-dirty intentionally.',
    );
  }

  const head = run('git', ['rev-parse', 'HEAD'], { capture: true });
  console.log(`Production deploy source: ${branch} @ ${head}`);
}

function assertRestoredStagingLink(previousProjectJson) {
  if (!previousProjectJson) {
    return;
  }

  const parsed = JSON.parse(previousProjectJson);
  if (parsed.projectName !== 'app-staging') {
    console.log(`Previous Vercel link was ${parsed.projectName}; restored that value.`);
    return;
  }

  const current = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
  if (current.projectName !== 'app-staging') {
    throw new Error('Safety restore failed: .vercel/project.json is not back on app-staging.');
  }
}

const previousProjectJson = readProjectLink();

console.log('Creating an app production deployment without moving www.30sek24.com yet.');
console.log('This script temporarily links .vercel to project app, then restores the previous link.');
console.log('After review, promote explicitly with: npm run promote:production -- <deployment-url>');

try {
  assertSafeGitState();
  run(npx, ['vercel', 'link', '--yes', '--project', project, '--scope', scope]);
  
  if (options.has('--prebuilt')) {
    run(npx, ['vercel', 'build', '--prod', '--yes', '--scope', scope]);
    run(npx, ['vercel', 'deploy', '--prebuilt', '--prod', '--skip-domain', '--yes', '--scope', scope]);
  } else {
    run(npx, ['vercel', '--prod', '--skip-domain', '--yes', '--scope', scope]);
  }
} finally {
  restoreProjectLink(previousProjectJson);
  assertRestoredStagingLink(previousProjectJson);
}
