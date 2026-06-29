import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const modularHomeRoot = path.join(repoRoot, 'src', 'modules', 'expo', 'runtime', 'modularHome');
const contractPath = path.join(repoRoot, 'docs', 'GALA_RENDERER_OWNERSHIP_CONTRACT.md');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const ACTIVE_ENTRY_FILES = [
  path.join(modularHomeRoot, 'ModularHomeModel.tsx'),
  path.join(modularHomeRoot, 'GalaHouseShell.tsx'),
  path.join(modularHomeRoot, 'construction', 'GalaConstructionRenderer.tsx'),
];

const CONTRACT_LEGACY_FILES = new Set([
  path.join(modularHomeRoot, 'GalaInterior.tsx'),
  path.join(modularHomeRoot, 'GalaInteriorConstruction.tsx'),
  path.join(modularHomeRoot, 'GalaOpenings.tsx'),
  path.join(modularHomeRoot, 'GalaCeiling.tsx'),
]);

const MIXED_HELPER_FILE = path.join(modularHomeRoot, 'GalaInteriorFurniture.tsx');
const ALLOWED_MIXED_HELPER_EXPORTS = new Set([
  'GalaLivingSofaModel',
  'GalaCoffeeTableModel',
  'GalaBedFabricBox',
  'GalaBedWoodBox',
]);
const FORBIDDEN_MIXED_ROOM_EXPORTS = new Set([
  'GalaKitchenFurniture',
  'GalaLivingFurniture',
  'GalaBathroomFurniture',
  'GalaBedroomFurniture',
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relative(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function isSourceFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath));
}

function normalize(filePath) {
  return path.resolve(filePath);
}

function samePath(left, right) {
  return normalize(left) === normalize(right);
}

function resolveRelativeImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const extension = path.extname(base);
  const stem = extension ? base.slice(0, -extension.length) : base;
  const candidates = [
    base,
    extension === '.js' ? `${stem}.ts` : null,
    extension === '.js' ? `${stem}.tsx` : null,
    extension === '.ts' ? `${stem}.js` : null,
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
    if (!candidate) {
      continue;
    }
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalize(candidate);
    }
  }

  return normalize(base);
}

function extractImportRecords(contents) {
  const records = [];
  const importFromPattern = /\bimport\s+(type\s+)?([\s\S]*?)\s+from\s+['"`]([^'"`]+)['"`]/g;
  const exportFromPattern = /\bexport\s+(type\s+)?([\s\S]*?)\s+from\s+['"`]([^'"`]+)['"`]/g;
  const sideEffectImportPattern = /\bimport\s+['"`]([^'"`]+)['"`]/g;
  const dynamicImportPattern = /\bimport\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

  let match;
  while ((match = importFromPattern.exec(contents)) !== null) {
    records.push({
      clause: match[2].trim(),
      kind: 'import',
      specifier: match[3],
      typeOnly: Boolean(match[1]),
    });
  }
  while ((match = exportFromPattern.exec(contents)) !== null) {
    records.push({
      clause: match[2].trim(),
      kind: 'export',
      specifier: match[3],
      typeOnly: Boolean(match[1]),
    });
  }
  while ((match = sideEffectImportPattern.exec(contents)) !== null) {
    records.push({
      clause: '',
      kind: 'side-effect-import',
      specifier: match[1],
      typeOnly: false,
    });
  }
  while ((match = dynamicImportPattern.exec(contents)) !== null) {
    records.push({
      clause: '',
      kind: 'dynamic-import',
      specifier: match[1],
      typeOnly: false,
    });
  }

  return records;
}

function getNamedSpecifiers(clause) {
  const namedMatch = clause.match(/\{([\s\S]*?)\}/);
  if (!namedMatch) {
    return [];
  }

  return namedMatch[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/^type\s+/, '').split(/\s+as\s+/i)[0].trim())
    .filter(Boolean);
}

function hasNamespaceImport(clause) {
  return /\*\s+as\s+/.test(clause);
}

function hasDefaultImport(clause) {
  const withoutNamed = clause.replace(/\{[\s\S]*?\}/, '').replace(/,\s*$/, '').trim();
  return withoutNamed.length > 0 && !hasNamespaceImport(withoutNamed);
}

function readContract() {
  if (!fs.existsSync(contractPath)) {
    return {
      contract: '',
      violations: [{
        filePath: contractPath,
        reason: 'ownership contract is missing',
      }],
    };
  }

  const contract = fs.readFileSync(contractPath, 'utf8');
  const violations = [];
  const activeSection = sectionBetween(contract, 'Current active render owners:', 'Current runtime owners:');
  const legacySection = sectionBetween(contract, 'Legacy or inactive in the current route:', 'These legacy files');

  if (!activeSection) {
    violations.push({
      filePath: contractPath,
      reason: 'contract is missing the active render owners section',
    });
  }
  if (!legacySection) {
    violations.push({
      filePath: contractPath,
      reason: 'contract is missing the legacy or inactive section',
    });
  }

  for (const legacyFile of CONTRACT_LEGACY_FILES) {
    const token = path.basename(legacyFile);
    if (!legacySection.includes(token)) {
      violations.push({
        filePath: contractPath,
        reason: `contract no longer marks ${token} as legacy/inactive`,
      });
    }
  }

  for (const exportName of ALLOWED_MIXED_HELPER_EXPORTS) {
    if (!activeSection.includes(exportName)) {
      violations.push({
        filePath: contractPath,
        reason: `contract active section does not allow ${exportName}`,
      });
    }
  }

  for (const exportName of FORBIDDEN_MIXED_ROOM_EXPORTS) {
    if (!legacySection.includes(exportName)) {
      violations.push({
        filePath: contractPath,
        reason: `contract legacy section does not mark ${exportName} inactive`,
      });
    }
  }

  return { contract, violations };
}

function sectionBetween(contents, startNeedle, endNeedle) {
  const start = contents.indexOf(startNeedle);
  if (start === -1) {
    return '';
  }
  const end = contents.indexOf(endNeedle, start + startNeedle.length);
  if (end === -1) {
    return contents.slice(start);
  }
  return contents.slice(start, end);
}

function collectActiveGraph() {
  const files = [];
  const imports = [];
  const seen = new Set();
  const queue = ACTIVE_ENTRY_FILES.map(normalize);
  const violations = [];

  while (queue.length > 0) {
    const filePath = queue.shift();
    if (!filePath || seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);

    if (!fs.existsSync(filePath)) {
      violations.push({
        filePath,
        reason: 'active renderer entry/dependency file is missing',
      });
      continue;
    }

    files.push(filePath);
    const contents = fs.readFileSync(filePath, 'utf8');

    for (const record of extractImportRecords(contents)) {
      if (!record.specifier.startsWith('.')) {
        continue;
      }

      const resolved = resolveRelativeImport(filePath, record.specifier);
      imports.push({
        ...record,
        fromFile: filePath,
        resolved,
      });

      if (
        fs.existsSync(resolved)
        && fs.statSync(resolved).isFile()
        && isSourceFile(resolved)
        && resolved.startsWith(modularHomeRoot)
        && !seen.has(resolved)
      ) {
        queue.push(resolved);
      }
    }
  }

  return { files, imports, violations };
}

function checkLegacyImports(imports) {
  const violations = [];

  for (const record of imports) {
    const legacyMatch = [...CONTRACT_LEGACY_FILES].find((legacyFile) => samePath(record.resolved, legacyFile));
    if (legacyMatch) {
      violations.push({
        filePath: record.fromFile,
        reason: `active GALA render path imports contract legacy module ${relative(legacyMatch)}`,
        specifier: record.specifier,
      });
      continue;
    }

    if (samePath(record.resolved, MIXED_HELPER_FILE)) {
      violations.push(...checkMixedHelperImport(record));
    }
  }

  return violations;
}

function checkMixedHelperImport(record) {
  const violations = [];
  const namedSpecifiers = getNamedSpecifiers(record.clause);

  if (record.kind === 'side-effect-import' || record.kind === 'dynamic-import') {
    return [{
      filePath: record.fromFile,
      reason: `${record.kind} of mixed active/legacy ${relative(MIXED_HELPER_FILE)} is forbidden; import allowed helpers by name`,
      specifier: record.specifier,
    }];
  }

  if (hasNamespaceImport(record.clause) || hasDefaultImport(record.clause) || namedSpecifiers.length === 0) {
    violations.push({
      filePath: record.fromFile,
      reason: `broad import from mixed active/legacy ${relative(MIXED_HELPER_FILE)} is forbidden; import allowed helpers by name`,
      specifier: record.specifier,
    });
  }

  for (const specifier of namedSpecifiers) {
    if (!ALLOWED_MIXED_HELPER_EXPORTS.has(specifier)) {
      const status = FORBIDDEN_MIXED_ROOM_EXPORTS.has(specifier)
        ? 'contract legacy full-room export'
        : 'unapproved helper export';
      violations.push({
        filePath: record.fromFile,
        reason: `active GALA render path imports ${status} ${specifier} from ${relative(MIXED_HELPER_FILE)}`,
        specifier: record.specifier,
      });
    }
  }

  return violations;
}

function printViolations(label, violations) {
  if (violations.length === 0) {
    return;
  }

  console.error(`\n${label}:`);
  for (const violation of violations) {
    const fileLabel = violation.filePath.startsWith(repoRoot)
      ? relative(violation.filePath)
      : toPosix(violation.filePath);
    const specifier = violation.specifier ? ` (${violation.specifier})` : '';
    console.error(`- ${fileLabel}: ${violation.reason}${specifier}`);
  }
}

const { violations: contractViolations } = readContract();
const graph = collectActiveGraph();
const legacyImportViolations = checkLegacyImports(graph.imports);
const violations = [
  ...contractViolations,
  ...graph.violations,
  ...legacyImportViolations,
];

printViolations('GALA ownership contract violations', contractViolations);
printViolations('GALA active render graph violations', graph.violations);
printViolations('GALA legacy import violations', legacyImportViolations);

console.log('GALA renderer ownership check summary');
console.log(`- active files scanned: ${graph.files.length}`);
console.log(`- relative imports scanned: ${graph.imports.length}`);
console.log(`- contract legacy files guarded: ${CONTRACT_LEGACY_FILES.size}`);
console.log(`- mixed helper allowlist: ${[...ALLOWED_MIXED_HELPER_EXPORTS].join(', ')}`);
console.log(`- violations: ${violations.length}`);

if (violations.length > 0) {
  process.exitCode = 1;
} else {
  console.log('- status: PASS');
}
