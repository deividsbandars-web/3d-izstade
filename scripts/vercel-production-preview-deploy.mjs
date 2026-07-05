import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  printVercelSourceContextReport,
  verifyVercelSourceContext,
} from './check-vercel-source-context.mjs';

const scope = 'esaukans-6934s-projects';
const project = 'app';
const projectJsonPath = '.vercel/project.json';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const DEFAULT_PRODUCTION_BRANCHES = ['main'];
const DEFAULT_PRODUCTION_BRANCH_PREFIXES = ['release/'];
const PRODUCTION_CONFIRM_OPTION = '--confirm-production-preview';

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

export function resolveProductionBranchPolicy(env = process.env) {
  const exactBranch = env.PRODUCTION_DEPLOY_BRANCH?.trim();
  if (exactBranch) {
    return {
      exactBranch,
      mode: 'exact',
    };
  }

  return {
    allowedBranches: DEFAULT_PRODUCTION_BRANCHES,
    allowedPrefixes: DEFAULT_PRODUCTION_BRANCH_PREFIXES,
    mode: 'default-release-policy',
  };
}

export function isProductionBranchAllowed(branch, policy = resolveProductionBranchPolicy()) {
  if (policy.mode === 'exact') {
    return branch === policy.exactBranch;
  }

  return policy.allowedBranches.includes(branch)
    || policy.allowedPrefixes.some((prefix) => branch.startsWith(prefix));
}

export function describeProductionBranchPolicy(policy = resolveProductionBranchPolicy()) {
  if (policy.mode === 'exact') {
    return `PRODUCTION_DEPLOY_BRANCH=${policy.exactBranch}`;
  }

  return [
    ...policy.allowedBranches,
    ...policy.allowedPrefixes.map((prefix) => `${prefix}*`),
  ].join(', ');
}

export function resolveProductionAuthorization(options, env = process.env) {
  if (options.has(PRODUCTION_CONFIRM_OPTION)) {
    return {
      authorized: true,
      source: PRODUCTION_CONFIRM_OPTION,
    };
  }

  if (['1', 'true', 'yes'].includes(env.PRODUCTION_PREVIEW_DEPLOY_AUTHORIZED?.trim().toLowerCase())) {
    return {
      authorized: true,
      source: 'PRODUCTION_PREVIEW_DEPLOY_AUTHORIZED',
    };
  }

  return {
    authorized: false,
    source: null,
  };
}

export function assertSafeGitState({
  env = process.env,
  options = new Set(),
  runCommand = run,
} = {}) {
  const branch = runCommand('git', ['branch', '--show-current'], { capture: true });
  const branchPolicy = resolveProductionBranchPolicy(env);
  const branchPolicyDescription = describeProductionBranchPolicy(branchPolicy);
  const branchAllowed = isProductionBranchAllowed(branch, branchPolicy);

  if (!branchAllowed && !options.has('--allow-branch')) {
    throw new Error(
      `Refusing production deploy from branch ${branch}. Allowed branch policy: ${branchPolicyDescription}. `
      + 'Pass --allow-branch only for an intentional release exception.',
    );
  }

  const status = runCommand('git', ['status', '--short', '--untracked-files=no'], { capture: true });
  if (status && !options.has('--allow-dirty')) {
    throw new Error(
      'Refusing production deploy with modified tracked files. '
      + 'Commit or revert changes first, or pass --allow-dirty intentionally.',
    );
  }

  const authorization = resolveProductionAuthorization(options, env);
  if (!authorization.authorized) {
    throw new Error(
      `Refusing production preview deploy without explicit authorization. Pass ${PRODUCTION_CONFIRM_OPTION} `
      + 'or set PRODUCTION_PREVIEW_DEPLOY_AUTHORIZED=true for this run.',
    );
  }

  const head = runCommand('git', ['rev-parse', 'HEAD'], { capture: true });
  console.log(`Production deploy source: ${branch} @ ${head}`);
  console.log(`Production branch policy: ${branchPolicyDescription}`);
  if (!branchAllowed) {
    console.log(`Production branch override: --allow-branch accepted ${branch}.`);
  }
  console.log(`Production authorization: ${authorization.source}`);
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

export function main(argv = process.argv.slice(2)) {
  const options = new Set(argv);
  const previousProjectJson = readProjectLink();

  console.log('Creating an app production deployment without moving www.30sek24.com yet.');
  console.log('This script temporarily links .vercel to project app, then restores the previous link.');
  console.log('After review, promote explicitly with: npm run promote:production -- <deployment-url>');

  try {
    if (!options.has('--prebuilt')) {
      printVercelSourceContextReport(verifyVercelSourceContext());
    }
    assertSafeGitState({ options });
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
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main();
}
