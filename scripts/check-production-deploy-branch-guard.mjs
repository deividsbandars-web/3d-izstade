import assert from 'node:assert/strict';
import {
  assertSafeGitState,
  describeProductionBranchPolicy,
  isProductionBranchAllowed,
  resolveProductionAuthorization,
  resolveProductionBranchPolicy,
} from './vercel-production-preview-deploy.mjs';

function fakeGitRun({ branch, head = '0123456789abcdef', status = '' }) {
  return (command, args) => {
    assert.equal(command, 'git');
    const gitCommand = args.join(' ');
    if (gitCommand === 'branch --show-current') {
      return branch;
    }
    if (gitCommand === 'status --short --untracked-files=no') {
      return status;
    }
    if (gitCommand === 'rev-parse HEAD') {
      return head;
    }
    throw new Error(`Unexpected git command in production guard test: ${gitCommand}`);
  };
}

const defaultPolicy = resolveProductionBranchPolicy({});
assert.equal(defaultPolicy.mode, 'default-release-policy');
assert.equal(isProductionBranchAllowed('main', defaultPolicy), true);
assert.equal(isProductionBranchAllowed('release/v1-stabilization', defaultPolicy), true);
assert.equal(isProductionBranchAllowed('feat/unapproved-production-branch', defaultPolicy), false);
assert.equal(describeProductionBranchPolicy(defaultPolicy), 'main, release/*');

const exactPolicy = resolveProductionBranchPolicy({
  PRODUCTION_DEPLOY_BRANCH: 'release/v1-stabilization',
});
assert.equal(exactPolicy.mode, 'exact');
assert.equal(isProductionBranchAllowed('release/v1-stabilization', exactPolicy), true);
assert.equal(isProductionBranchAllowed('main', exactPolicy), false);

assert.equal(resolveProductionAuthorization(new Set(), {}).authorized, false);
assert.equal(resolveProductionAuthorization(new Set(['--confirm-production-preview']), {}).authorized, true);
assert.equal(resolveProductionAuthorization(new Set(), {
  PRODUCTION_PREVIEW_DEPLOY_AUTHORIZED: 'true',
}).authorized, true);

assert.doesNotThrow(() => assertSafeGitState({
  env: {},
  options: new Set(['--confirm-production-preview']),
  runCommand: fakeGitRun({ branch: 'release/v1-stabilization' }),
}));

assert.throws(
  () => assertSafeGitState({
    env: {},
    options: new Set(['--confirm-production-preview']),
    runCommand: fakeGitRun({ branch: 'feat/unapproved-production-branch' }),
  }),
  /Refusing production deploy from branch feat\/unapproved-production-branch/,
);

assert.throws(
  () => assertSafeGitState({
    env: {},
    options: new Set(),
    runCommand: fakeGitRun({ branch: 'release/v1-stabilization' }),
  }),
  /without explicit authorization/,
);

assert.throws(
  () => assertSafeGitState({
    env: {},
    options: new Set(['--confirm-production-preview']),
    runCommand: fakeGitRun({
      branch: 'release/v1-stabilization',
      status: ' M scripts/vercel-production-preview-deploy.mjs',
    }),
  }),
  /modified tracked files/,
);

console.log('[check-production-deploy-branch-guard] passed');
console.log('- Default policy allows main and release/* branches.');
console.log('- Stale feature branch is rejected by default.');
console.log('- Production preview deploy requires explicit authorization.');
