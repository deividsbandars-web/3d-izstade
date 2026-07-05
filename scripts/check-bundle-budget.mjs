import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST_ASSETS_DIR = join(process.cwd(), 'dist', 'assets');

const BUNDLE_BUDGETS = [
  {
    name: 'react-three-vendor',
    pattern: /^react-three-vendor-[\w-]+\.js$/,
    baselineGzipKb: 469.45,
  },
  {
    name: 'three-core',
    pattern: /^three-core-[\w-]+\.js$/,
    baselineGzipKb: 187.82,
  },
  {
    name: 'Expo3D',
    pattern: /^Expo3D-[\w-]+\.js$/,
    baselineGzipKb: 162.47,
  },
  {
    name: 'modular-home',
    pattern: /^modular-home-[\w-]+\.js$/,
    baselineGzipKb: 128.0,
  },
  {
    name: 'react-vendor',
    pattern: /^react-vendor-[\w-]+\.js$/,
    baselineGzipKb: 73.72,
  },
].map((budget) => ({
  ...budget,
  budgetGzipKb: Number((budget.baselineGzipKb * 1.1).toFixed(2)),
}));

function formatKb(value) {
  return `${value.toFixed(2)} kB`;
}

function gzipSizeKb(filePath) {
  return gzipSync(readFileSync(filePath)).byteLength / 1000;
}

if (!existsSync(DIST_ASSETS_DIR)) {
  console.error('[bundle-budget] dist/assets not found. Run npm.cmd run build first.');
  process.exit(1);
}

const assetNames = readdirSync(DIST_ASSETS_DIR);
const failures = [];
const rows = [];

for (const budget of BUNDLE_BUDGETS) {
  const matches = assetNames.filter((assetName) => budget.pattern.test(assetName));
  if (matches.length !== 1) {
    failures.push(`${budget.name}: expected exactly 1 matching asset, found ${matches.length}`);
    continue;
  }

  const assetName = matches[0];
  const actualGzipKb = gzipSizeKb(join(DIST_ASSETS_DIR, assetName));
  const pass = actualGzipKb <= budget.budgetGzipKb;
  rows.push({
    actualGzipKb,
    assetName,
    budgetGzipKb: budget.budgetGzipKb,
    name: budget.name,
    pass,
  });

  if (!pass) {
    failures.push(
      `${budget.name}: ${formatKb(actualGzipKb)} gzip exceeds ${formatKb(budget.budgetGzipKb)} budget (${assetName})`,
    );
  }
}

console.log('[bundle-budget] gzip chunk budgets');
for (const row of rows) {
  const status = row.pass ? 'PASS' : 'FAIL';
  console.log(
    `- ${status} ${row.name}: ${formatKb(row.actualGzipKb)} / ${formatKb(row.budgetGzipKb)} (${row.assetName})`,
  );
}

if (failures.length > 0) {
  console.error('[bundle-budget] failures:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}
