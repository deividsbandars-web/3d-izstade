import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const reportDirectory = path.join(repoRoot, 'diagnostics', 'reports');
const reportPath = path.join(reportDirectory, 'expo-release-asset-budget.json');

const criticalAssets = [
  { path: 'public/models/modern_evening_street_4k.exr', budgetBytes: 84 * 1024 * 1024, type: 'environment_exr' },
  { path: 'public/textures/pergola_walkway_4k.exr', budgetBytes: 84 * 1024 * 1024, type: 'ground_surface_exr' },
  { path: 'public/models/simple_grass_chunks.glb', budgetBytes: 20 * 1024 * 1024, type: 'ground_framing' },
  { path: 'public/models/construction_assets.glb', budgetBytes: 10 * 1024 * 1024, type: 'release_fallback_model' },
];

const advisoryAssets = [
  { path: 'public/models/realistic_city.glb', type: 'legacy_city_backdrop' },
  { path: 'public/models/default_booth.glb', type: 'legacy_fallback_model' },
];

const TOTAL_CRITICAL_BUDGET_MIB = 200;

function bytesToMiB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

function statAsset(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const exists = fs.existsSync(absolutePath);
  const sizeBytes = exists ? fs.statSync(absolutePath).size : 0;

  return {
    absolutePath,
    exists,
    relativePath,
    sizeBytes,
    sizeMiB: bytesToMiB(sizeBytes),
  };
}

const criticalResults = criticalAssets.map((asset) => {
  const stat = statAsset(asset.path);
  return {
    ...asset,
    ...stat,
    overBudget: stat.sizeBytes > asset.budgetBytes,
    zeroByte: stat.exists && stat.sizeBytes === 0,
  };
});

const advisoryResults = advisoryAssets.map((asset) => {
  const stat = statAsset(asset.path);
  return {
    ...asset,
    ...stat,
    zeroByte: stat.exists && stat.sizeBytes === 0,
  };
});

const releasePathAssetBudgetMiB = criticalResults.reduce((total, asset) => total + asset.sizeMiB, 0);
const failingAssets = criticalResults.filter((asset) => !asset.exists || asset.zeroByte || asset.overBudget);
const failingAdvisories = advisoryResults.filter((asset) => asset.zeroByte);
const report = {
  advisoryAssets: advisoryResults,
  criticalAssets: criticalResults,
  generatedAt: new Date().toISOString(),
  releasePathAssetBudgetMiB,
  advisoryIssueCount: failingAdvisories.length,
  status: failingAssets.length === 0 && releasePathAssetBudgetMiB <= TOTAL_CRITICAL_BUDGET_MIB ? 'pass' : 'fail',
  totalCriticalBudgetMiB: TOTAL_CRITICAL_BUDGET_MIB,
};

fs.mkdirSync(reportDirectory, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`Expo release asset report written to ${reportPath}`);

if (failingAssets.length > 0 || releasePathAssetBudgetMiB > TOTAL_CRITICAL_BUDGET_MIB) {
  console.error('Expo release asset budget check failed.');
  failingAssets.forEach((asset) => {
    console.error(`- ${asset.relativePath}: exists=${asset.exists} zeroByte=${asset.zeroByte} overBudget=${asset.overBudget} sizeMiB=${asset.sizeMiB}`);
  });
  if (releasePathAssetBudgetMiB > TOTAL_CRITICAL_BUDGET_MIB) {
    console.error(`- total critical release path budget exceeded: ${releasePathAssetBudgetMiB} MiB > ${TOTAL_CRITICAL_BUDGET_MIB} MiB`);
  }
  process.exit(1);
}

if (failingAdvisories.length > 0) {
  console.warn('Expo release asset advisories:');
  failingAdvisories.forEach((asset) => {
    console.warn(`- advisory ${asset.relativePath}: zeroByte=${asset.zeroByte} sizeMiB=${asset.sizeMiB}`);
  });
}
