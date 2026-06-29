const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const repoRoot = process.cwd();
const backendTsconfigPath = path.join(repoRoot, 'backend-server', 'tsconfig.json');

const SCAN_ROOTS = [
  path.join(repoRoot, 'src', 'backend'),
  path.join(repoRoot, 'src', 'lib'),
  path.join(repoRoot, 'src', 'core'),
  path.join(repoRoot, 'src', 'services'),
];

const IMPORT_PATTERN =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`]*?\s+from\s+)?['"`]([^'"`]+)['"`]|\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const BROWSER_GLOBAL_PATTERN = /\b(window|document|navigator|localStorage|sessionStorage)\b/g;

const PROHIBITED_IMPORTS = [
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'three',
  '@react-three/fiber',
  '@react-three/drei',
  '@react-three/rapier',
];

const BROAD_BACKEND_TSCONFIG_INCLUDE_PATTERNS = [
  '../src/**/*.ts',
  '../src/backend/**/*.ts',
  '../src/lib/**/*.ts',
  '../src/core/**/*.ts',
  '../src/services/**/*.ts',
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isScannedFile(filePath) {
  return path.extname(filePath) === '.ts';
}

function walkFiles(rootDir) {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolute);
        continue;
      }

      if (entry.isFile() && isScannedFile(absolute)) {
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

function stripCommentsAndStrings(contents) {
  let result = '';
  let index = 0;

  while (index < contents.length) {
    const char = contents[index];
    const next = contents[index + 1];

    if (char === '/' && next === '/') {
      result += '  ';
      index += 2;
      while (index < contents.length && contents[index] !== '\n') {
        result += ' ';
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      result += '  ';
      index += 2;
      while (index < contents.length) {
        if (contents[index] === '*' && contents[index + 1] === '/') {
          result += '  ';
          index += 2;
          break;
        }
        result += contents[index] === '\n' ? '\n' : ' ';
        index += 1;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      const quote = char;
      result += ' ';
      index += 1;
      while (index < contents.length) {
        const current = contents[index];
        if (current === '\\') {
          result += ' ';
          if (index + 1 < contents.length) {
            result += contents[index + 1] === '\n' ? '\n' : ' ';
          }
          index += 2;
          continue;
        }
        result += current === '\n' ? '\n' : ' ';
        index += 1;
        if (current === quote) {
          break;
        }
      }
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

function lineAndColumn(contents, index) {
  const before = contents.slice(0, index);
  const lines = before.split(/\r?\n/);

  return {
    column: lines[lines.length - 1].length + 1,
    line: lines.length,
  };
}

function createViolation(filePath, reason, detail, location) {
  return {
    detail,
    filePath,
    location,
    reason,
  };
}

function isProhibitedImport(specifier) {
  if (specifier.startsWith('@react-three/')) {
    return true;
  }

  return PROHIBITED_IMPORTS.some((blocked) => (
    specifier === blocked || specifier.startsWith(`${blocked}/`)
  ));
}

function isTypeOnlyGlobalReference(source, index, name) {
  const before = source.slice(Math.max(0, index - 80), index);
  const after = source.slice(index + name.length, index + name.length + 80);

  if (
    /\b(?:interface|type)\s+[A-Za-z0-9_$<>,\s]*[=:][^;\n{}]*\btypeof\s+$/.test(before) ||
    /[:<|&]\s*[A-Za-z0-9_$<>,\s|&\[\]{}?:]*\btypeof\s+$/.test(before)
  ) {
    return true;
  }

  if (/\b(?:interface|type)\s+[A-Za-z0-9_$<>,\s]*[=:][^;\n{}]*$/.test(before)) {
    return true;
  }

  if (/^\s*(?:[;,\)\]\}>]|$)/.test(after) && /[:<|&]\s*[A-Za-z0-9_$<>,\s|&\[\]{}?:]*$/.test(before)) {
    return true;
  }

  return false;
}

function collectBrowserGlobalViolations(filePath, contents) {
  const source = stripCommentsAndStrings(contents);
  const violations = [];
  let match;

  while ((match = BROWSER_GLOBAL_PATTERN.exec(source)) !== null) {
    const name = match[1];
    const index = match.index;

    if (isTypeOnlyGlobalReference(source, index, name)) {
      continue;
    }

    violations.push(createViolation(
      filePath,
      'backend-shared source must not directly use browser globals',
      name,
      lineAndColumn(contents, index),
    ));
  }

  return violations;
}

function checkFile(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  for (const specifier of extractImports(contents)) {
    if (isProhibitedImport(specifier)) {
      violations.push(createViolation(
        filePath,
        'backend-shared source must not import frontend/rendering packages',
        specifier,
        null,
      ));
    }
  }

  violations.push(...collectBrowserGlobalViolations(filePath, contents));

  return violations;
}

function collectBackendTsconfigIncludeViolations() {
  if (!fs.existsSync(backendTsconfigPath)) {
    return [
      createViolation(
        backendTsconfigPath,
        'backend release tsconfig must exist for shared-boundary enforcement',
        'missing backend-server/tsconfig.json',
        null,
      ),
    ];
  }

  const contents = fs.readFileSync(backendTsconfigPath, 'utf8');
  const config = JSON.parse(contents);
  const includes = Array.isArray(config.include) ? config.include : [];

  return includes
    .filter((includePattern) => BROAD_BACKEND_TSCONFIG_INCLUDE_PATTERNS.includes(includePattern))
    .map((includePattern) => createViolation(
      backendTsconfigPath,
      'backend release tsconfig must not include broad root src globs; let backend-server imports pull the minimal shared graph',
      includePattern,
      null,
    ));
}

function printViolations(violations) {
  if (violations.length === 0) {
    return;
  }

  console.error('\nBackend-shared boundary violations:');
  for (const violation of violations) {
    const relativePath = toPosix(path.relative(repoRoot, violation.filePath));
    const location = violation.location
      ? `:${violation.location.line}:${violation.location.column}`
      : '';
    console.error(`- ${relativePath}${location}: ${violation.reason} (${violation.detail})`);
  }
}

const files = SCAN_ROOTS.flatMap((rootDir) => walkFiles(rootDir));
const tsconfigIncludeViolations = collectBackendTsconfigIncludeViolations();
const sourceViolations = files.flatMap((filePath) => checkFile(filePath));
const violations = [...tsconfigIncludeViolations, ...sourceViolations];

printViolations(violations);

console.log('Backend-shared boundary check summary');
console.log(`- src/backend files scanned: ${walkFiles(SCAN_ROOTS[0]).length}`);
console.log(`- src/lib files scanned: ${walkFiles(SCAN_ROOTS[1]).length}`);
console.log(`- src/core files scanned: ${walkFiles(SCAN_ROOTS[2]).length}`);
console.log(`- src/services files scanned: ${walkFiles(SCAN_ROOTS[3]).length}`);
console.log(`- backend tsconfig broad include violations: ${tsconfigIncludeViolations.length}`);
console.log(`- violations: ${violations.length}`);

if (violations.length > 0) {
  process.exitCode = 1;
} else {
  console.log('- status: PASS');
}
