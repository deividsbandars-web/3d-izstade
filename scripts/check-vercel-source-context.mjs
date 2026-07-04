import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import createIgnore from 'ignore';

const MAX_INCLUDED_BUILD_SCRIPT_BYTES = 128 * 1024;
const REQUIRED_SOURCE_INPUTS = [
  '.vercelignore',
  'index.html',
  'package-lock.json',
  'package.json',
  'public/vite.svg',
  'src/main.tsx',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vercel.json',
  'vite.config.ts',
];

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function collectFiles(rootDirectory, relativeDirectory) {
  const absoluteDirectory = path.join(rootDirectory, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  return fs.readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = normalizePath(path.join(relativeDirectory, entry.name));
      if (entry.isDirectory()) {
        return collectFiles(rootDirectory, relativePath);
      }
      return entry.isFile() ? [relativePath] : [];
    });
}

function deriveBuildScriptPaths(packageJson, failures) {
  const packageScripts = packageJson.scripts ?? {};
  const visited = new Set();
  const buildScriptPaths = new Set();

  function visit(scriptName) {
    if (visited.has(scriptName)) {
      return;
    }
    visited.add(scriptName);

    const command = packageScripts[scriptName];
    if (typeof command !== 'string' || !command.trim()) {
      failures.push(`package.json is missing the npm script ${scriptName}.`);
      return;
    }

    for (const match of command.matchAll(/\bnpm(?:\.cmd)?\s+run\s+([A-Za-z0-9:_-]+)/g)) {
      visit(match[1]);
    }
    for (const match of command.matchAll(/\bscripts\/[A-Za-z0-9_./-]+\.(?:cjs|mjs|js|ts)\b/g)) {
      buildScriptPaths.add(match[0]);
    }
  }

  visit('build');
  return [...buildScriptPaths].sort();
}

export function verifyVercelSourceContext(rootDirectory = process.cwd()) {
  const failures = [];
  const packageJsonPath = path.join(rootDirectory, 'package.json');
  const ignorePath = path.join(rootDirectory, '.vercelignore');

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('[check-vercel-source-context] failed\n- package.json is missing.');
  }
  if (!fs.existsSync(ignorePath)) {
    throw new Error('[check-vercel-source-context] failed\n- .vercelignore is missing.');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const matcher = createIgnore().add(fs.readFileSync(ignorePath, 'utf8'));
  const buildScriptPaths = deriveBuildScriptPaths(packageJson, failures);
  const requiredFiles = [...new Set([...REQUIRED_SOURCE_INPUTS, ...buildScriptPaths])].sort();

  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(rootDirectory, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      failures.push(`Required remote-build input is missing: ${relativePath}.`);
    } else if (matcher.ignores(relativePath)) {
      failures.push(`Required remote-build input is excluded by .vercelignore: ${relativePath}.`);
    }
  }

  const scriptFiles = collectFiles(rootDirectory, 'scripts').sort();
  const includedScriptFiles = scriptFiles.filter((relativePath) => !matcher.ignores(relativePath));
  const expectedIncludedScripts = new Set(buildScriptPaths);
  const unexpectedIncludedScripts = includedScriptFiles
    .filter((relativePath) => !expectedIncludedScripts.has(relativePath));

  if (unexpectedIncludedScripts.length > 0) {
    failures.push(
      `Non-build scripts would be uploaded: ${unexpectedIncludedScripts.join(', ')}.`,
    );
  }

  const includedBuildScriptBytes = buildScriptPaths.reduce((total, relativePath) => {
    const absolutePath = path.join(rootDirectory, relativePath);
    return fs.existsSync(absolutePath) ? total + fs.statSync(absolutePath).size : total;
  }, 0);
  if (includedBuildScriptBytes > MAX_INCLUDED_BUILD_SCRIPT_BYTES) {
    failures.push(
      `Included build scripts use ${includedBuildScriptBytes} bytes; limit is ${MAX_INCLUDED_BUILD_SCRIPT_BYTES}.`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `[check-vercel-source-context] failed\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
  }

  return {
    buildScriptBytes: includedBuildScriptBytes,
    buildScripts: buildScriptPaths,
    ignoredScriptCount: scriptFiles.length - includedScriptFiles.length,
    requiredInputCount: requiredFiles.length,
  };
}

export function printVercelSourceContextReport(report) {
  console.log('[check-vercel-source-context] passed');
  console.log(`- Required remote-build inputs included: ${report.requiredInputCount}.`);
  console.log(`- Included build scripts: ${report.buildScripts.join(', ')} (${report.buildScriptBytes} bytes).`);
  console.log(`- Other scripts excluded: ${report.ignoredScriptCount}.`);
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    const report = verifyVercelSourceContext();
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printVercelSourceContextReport(report);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
