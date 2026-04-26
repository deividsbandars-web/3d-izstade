import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const SHARED_EXPO_ROOT = path.join(repoRoot, 'src', 'shared', 'expo');
const BACKEND_SERVER_ROOT = path.join(repoRoot, 'backend-server');
const BACKEND_EXPO_ROOT = path.join(repoRoot, 'src', 'backend', 'expo');
const MODULES_EXPO_ROOT = path.join(repoRoot, 'src', 'modules', 'expo');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?['"`]([^'"`]+)['"`]|\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

const SHARED_PACKAGE_BLOCKLIST = [
  'react',
  'react-dom',
  '@react-three',
];

const SHARED_PATH_BLOCKLIST = [
  path.join(repoRoot, 'src', 'modules'),
  path.join(repoRoot, 'src', 'components'),
  path.join(repoRoot, 'src', 'pages'),
  path.join(repoRoot, 'src', 'modules', 'expo', 'runtime'),
  path.join(repoRoot, 'src', 'modules', 'expo', 'components'),
  path.join(repoRoot, 'src', 'modules', 'expo', 'world-contract.ts'),
  path.join(repoRoot, 'src', 'modules', 'expo', 'layout-engine.ts'),
  path.join(repoRoot, 'src', 'modules', 'expo', 'sceneWorld.ts'),
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function walkFiles(rootDir) {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }
      if (entry.isFile() && isSourceFile(absolute)) {
        results.push(absolute);
      }
    }
  }

  return results.sort((left, right) => left.localeCompare(right));
}

function extractImports(contents) {
  const imports = [];
  let match;
  while ((match = IMPORT_PATTERN.exec(contents)) !== null) {
    const specifier = match[1] || match[2];
    if (specifier) {
      imports.push(specifier);
    }
  }
  return imports;
}

function resolveRelativeImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
    path.join(base, 'index.mjs'),
    path.join(base, 'index.cjs'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.resolve(candidate);
    }
  }

  return path.resolve(base);
}

function checkTree(rootDir, classifyViolation) {
  const violations = [];
  const files = walkFiles(rootDir);

  for (const filePath of files) {
    const contents = fs.readFileSync(filePath, 'utf8');
    const imports = extractImports(contents);

    for (const specifier of imports) {
      const violation = classifyViolation(filePath, specifier);
      if (violation) {
        violations.push(violation);
      }
    }
  }

  return { files, violations };
}

function createViolation(filePath, specifier, reason) {
  return {
    filePath,
    reason,
    specifier,
  };
}

function classifySharedViolation(filePath, specifier) {
  if (specifier.startsWith('.')) {
    const resolved = resolveRelativeImport(filePath, specifier);

    if (resolved.startsWith(MODULES_EXPO_ROOT)) {
      return createViolation(
        filePath,
        specifier,
        'shared expo domain must not import src/modules/expo/**',
      );
    }

    if (SHARED_PATH_BLOCKLIST.some((blockedPath) => resolved.startsWith(blockedPath))) {
      return createViolation(
        filePath,
        specifier,
        'shared expo domain must not import frontend/runtime/UI layers',
      );
    }

    return null;
  }

  if (SHARED_PACKAGE_BLOCKLIST.some((blockedPackage) => specifier === blockedPackage || specifier.startsWith(`${blockedPackage}/`))) {
    return createViolation(
      filePath,
      specifier,
      'shared expo domain must not import React/UI packages',
    );
  }

  return null;
}

function classifyBackendViolation(filePath, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const resolved = resolveRelativeImport(filePath, specifier);
  if (resolved.startsWith(MODULES_EXPO_ROOT)) {
    return createViolation(
      filePath,
      specifier,
      'backend expo code must not import src/modules/expo/**',
    );
  }

  return null;
}

function printViolations(label, violations) {
  if (violations.length === 0) {
    return;
  }

  console.error(`\n${label} violations:`);
  for (const violation of violations) {
    console.error(
      `- ${toPosix(path.relative(repoRoot, violation.filePath))}: ${violation.reason} (${violation.specifier})`,
    );
  }
}

const sharedResult = checkTree(SHARED_EXPO_ROOT, classifySharedViolation);
const backendServerResult = checkTree(BACKEND_SERVER_ROOT, classifyBackendViolation);
const backendExpoResult = checkTree(BACKEND_EXPO_ROOT, classifyBackendViolation);

const violations = [
  ...sharedResult.violations,
  ...backendServerResult.violations,
  ...backendExpoResult.violations,
];

printViolations('Shared expo boundary', sharedResult.violations);
printViolations('Backend-server expo boundary', backendServerResult.violations);
printViolations('Backend expo boundary', backendExpoResult.violations);

console.log('Expo boundary check summary');
console.log(`- shared files scanned: ${sharedResult.files.length}`);
console.log(`- backend-server files scanned: ${backendServerResult.files.length}`);
console.log(`- src/backend/expo files scanned: ${backendExpoResult.files.length}`);
console.log(`- violations: ${violations.length}`);

if (violations.length > 0) {
  process.exitCode = 1;
} else {
  console.log('- status: PASS');
}
