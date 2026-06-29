#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BACKEND_DIR = path.resolve(process.cwd(), 'backend-server');
const TEST_DIRS = [
  path.join(BACKEND_DIR, '__tests__'),
  path.join(BACKEND_DIR, 'routes', '__tests__'),
];

function listTestFiles() {
  const testFiles = [];
  for (const dir of TEST_DIRS) {
    if (!existsSync(dir)) {
      continue;
    }
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        testFiles.push(path.join(dir, entry.name));
      }
    }
  }
  return testFiles.sort((left, right) => left.localeCompare(right));
}

const testFiles = listTestFiles();
if (testFiles.length === 0) {
  console.error('[backend-tests] no backend test files found');
  process.exit(1);
}

const runnerCommand = process.platform === 'win32' ? 'cmd.exe' : 'npx';
let failed = false;

for (const testFile of testFiles) {
  const relativeTestFile = path.relative(BACKEND_DIR, testFile);
  console.log(`[backend-tests] running ${relativeTestFile}`);
  const runnerArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx.cmd', 'tsx', relativeTestFile]
    : ['tsx', relativeTestFile];
  const result = spawnSync(runnerCommand, runnerArgs, {
    cwd: BACKEND_DIR,
    env: process.env,
    shell: false,
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`[backend-tests] failed ${relativeTestFile}`);
    break;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`[backend-tests] passed ${testFiles.length} test files`);
