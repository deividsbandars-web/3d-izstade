import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import createIgnore from 'ignore';

const MiB = 1024 * 1024;
const MAX_RELEASE_PUBLIC_PAYLOAD_BYTES = 850 * MiB;
const MAX_DIST_PAYLOAD_BYTES = 850 * MiB;
const MAX_RELEASE_FILE_BYTES = 90 * MiB;
const RAW_EXPO_SOURCE_DIR = 'public/textures/expo';
const DIST_RAW_EXPO_SOURCE_DIR = 'dist/textures/expo';
const RUNTIME_EXPO_DIR = 'public/textures/expo-runtime';
const RUNTIME_MANIFEST = 'public/textures/expo-runtime/asset-manifest.json';
const ACTIVE_EXPO_RUNTIME_SOURCE_DIRS = [
  'src/modules/expo/lib',
  'src/modules/expo/runtime',
  'src/modules/expo/state',
];
const ALLOWED_SOURCE_TEXTURE_REFERENCE_FILES = new Set([
  'src/modules/expo/lib/expoTexturePipeline.ts',
]);
const RAW_TEXTURE_SAMPLES = [
  'public/textures/expo/asset-manifest.json',
  'public/textures/expo/hero-paver-4k/pavement_01_diff_4k.png',
  'public/textures/expo/urban-grass-4k/sparse_grass_nor_gl_4k.png',
];

function bytesToMiB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

function readRequired(rootDirectory, relativePath) {
  const absolutePath = path.join(rootDirectory, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`[check-release-static-payload] missing ${relativePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function collectFiles(rootDirectory, relativeDirectory) {
  const absoluteDirectory = path.join(rootDirectory, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDirectory, entry.name);
    const relativePath = path.relative(rootDirectory, absolutePath).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      files.push(...collectFiles(rootDirectory, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

function sumFileBytes(rootDirectory, relativeFiles) {
  return relativeFiles.reduce((total, relativePath) => (
    total + fs.statSync(path.join(rootDirectory, relativePath)).size
  ), 0);
}

function collectActiveExpoRuntimeSourceFiles(rootDirectory) {
  return ACTIVE_EXPO_RUNTIME_SOURCE_DIRS
    .flatMap((relativeDirectory) => collectFiles(rootDirectory, relativeDirectory))
    .filter((relativePath) => ['.ts', '.tsx'].includes(path.extname(relativePath)));
}

function assertIgnored(failures, ignoreName, ignoreSource, samples) {
  const matcher = createIgnore().add(ignoreSource);
  for (const sample of samples) {
    if (!matcher.ignores(sample)) {
      failures.push(`${ignoreName} does not exclude raw release source asset: ${sample}.`);
    }
  }
}

function largestFiles(rootDirectory, relativeFiles, limit = 5) {
  return relativeFiles
    .map((relativePath) => ({
      relativePath,
      sizeBytes: fs.statSync(path.join(rootDirectory, relativePath)).size,
    }))
    .sort((left, right) => right.sizeBytes - left.sizeBytes)
    .slice(0, limit);
}

function formatFileList(files) {
  return files
    .map((file) => `${file.relativePath} (${bytesToMiB(file.sizeBytes)} MiB)`)
    .join(', ');
}

function overBudgetFiles(rootDirectory, relativeFiles) {
  return relativeFiles
    .map((relativePath) => ({
      relativePath,
      sizeBytes: fs.statSync(path.join(rootDirectory, relativePath)).size,
    }))
    .filter((file) => file.sizeBytes > MAX_RELEASE_FILE_BYTES)
    .sort((left, right) => right.sizeBytes - left.sizeBytes);
}

export function verifyReleaseStaticPayload(rootDirectory = process.cwd()) {
  const failures = [];
  const vercelIgnore = readRequired(rootDirectory, '.vercelignore');
  const vercelMatcher = createIgnore().add(vercelIgnore);
  const dockerIgnore = readRequired(rootDirectory, '.dockerignore');
  const viteConfig = readRequired(rootDirectory, 'vite.config.ts');
  const texturePipeline = readRequired(rootDirectory, 'src/modules/expo/lib/expoTexturePipeline.ts');
  const runtimeManifest = JSON.parse(readRequired(rootDirectory, RUNTIME_MANIFEST));
  const rawSourceFiles = collectFiles(rootDirectory, RAW_EXPO_SOURCE_DIR);
  const runtimeFiles = collectFiles(rootDirectory, RUNTIME_EXPO_DIR);
  const rawDistFiles = collectFiles(rootDirectory, DIST_RAW_EXPO_SOURCE_DIR);
  const activeExpoRuntimeSourceFiles = collectActiveExpoRuntimeSourceFiles(rootDirectory);
  const publicFiles = collectFiles(rootDirectory, 'public');
  const releasePublicFiles = publicFiles.filter((relativePath) => !vercelMatcher.ignores(relativePath));
  const distFiles = collectFiles(rootDirectory, 'dist');
  const distExists = fs.existsSync(path.join(rootDirectory, 'dist', 'index.html'));

  assertIgnored(failures, '.vercelignore', vercelIgnore, RAW_TEXTURE_SAMPLES);
  assertIgnored(failures, '.dockerignore', dockerIgnore, RAW_TEXTURE_SAMPLES);

  if (!viteConfig.includes("const RELEASE_PRUNED_PUBLIC_PATHS = ['textures/expo']")) {
    failures.push('vite.config.ts does not declare textures/expo as a pruned release public path.');
  }
  if (!viteConfig.includes("globIgnores: ['**/textures/expo/**']")) {
    failures.push('vite.config.ts does not exclude raw texture sources from the PWA precache scan.');
  }
  if (!texturePipeline.includes('VITE_EXPO_ALLOW_SOURCE_TEXTURE_FALLBACK')) {
    failures.push('expoTexturePipeline does not gate source texture fallback behind an explicit development flag.');
  }
  if (/\breturn\s+\[\s*runtimeUrl\s*,\s*url\s*\]/.test(texturePipeline)) {
    failures.push('expoTexturePipeline still returns raw source texture fallback by default.');
  }

  for (const relativePath of activeExpoRuntimeSourceFiles) {
    if (ALLOWED_SOURCE_TEXTURE_REFERENCE_FILES.has(relativePath)) {
      continue;
    }
    const source = fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8');
    if (source.includes('/textures/expo/')) {
      failures.push(`Active Expo runtime source still references raw texture source paths: ${relativePath}.`);
    }
  }

  if (!Array.isArray(runtimeManifest.textures) || runtimeManifest.textures.length === 0) {
    failures.push('Expo runtime texture manifest has no generated runtime textures.');
  }

  for (const texture of runtimeManifest.textures ?? []) {
    if (!String(texture.runtimePath ?? '').startsWith('/textures/expo-runtime/')) {
      failures.push(`Runtime texture path is outside expo-runtime: ${texture.runtimePath}.`);
    }
    if (!String(texture.runtimePath ?? '').endsWith('.webp')) {
      failures.push(`Runtime texture path is not WebP: ${texture.runtimePath}.`);
    }
    const runtimeRelativePath = `public${texture.runtimePath}`;
    if (!fs.existsSync(path.join(rootDirectory, runtimeRelativePath))) {
      failures.push(`Runtime texture file is missing: ${runtimeRelativePath}.`);
    }
  }

  if (rawDistFiles.length > 0) {
    failures.push(
      `Raw source texture files are present in dist and would be deployed: ${rawDistFiles.slice(0, 5).join(', ')}${rawDistFiles.length > 5 ? ', ...' : ''}.`,
    );
  }

  const releasePublicBytes = sumFileBytes(rootDirectory, releasePublicFiles);
  if (releasePublicBytes > MAX_RELEASE_PUBLIC_PAYLOAD_BYTES) {
    failures.push(
      `Release public payload is ${bytesToMiB(releasePublicBytes)} MiB; budget is ${bytesToMiB(MAX_RELEASE_PUBLIC_PAYLOAD_BYTES)} MiB. Largest files: ${formatFileList(largestFiles(rootDirectory, releasePublicFiles))}.`,
    );
  }

  if (distExists) {
    const distBytes = sumFileBytes(rootDirectory, distFiles);
    if (distBytes > MAX_DIST_PAYLOAD_BYTES) {
      failures.push(
        `Built dist payload is ${bytesToMiB(distBytes)} MiB; budget is ${bytesToMiB(MAX_DIST_PAYLOAD_BYTES)} MiB. Largest files: ${formatFileList(largestFiles(rootDirectory, distFiles))}.`,
      );
    }
  }

  const oversizedReleasePublicFiles = overBudgetFiles(rootDirectory, releasePublicFiles);
  if (oversizedReleasePublicFiles.length > 0) {
    failures.push(
      `Release public payload has files over ${bytesToMiB(MAX_RELEASE_FILE_BYTES)} MiB: ${formatFileList(oversizedReleasePublicFiles.slice(0, 5))}.`,
    );
  }

  if (distExists) {
    const oversizedDistFiles = overBudgetFiles(rootDirectory, distFiles);
    if (oversizedDistFiles.length > 0) {
      failures.push(
        `Built dist payload has files over ${bytesToMiB(MAX_RELEASE_FILE_BYTES)} MiB: ${formatFileList(oversizedDistFiles.slice(0, 5))}.`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `[check-release-static-payload] failed\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
    );
  }

  return {
    rawSourceBytes: sumFileBytes(rootDirectory, rawSourceFiles),
    rawSourceFiles: rawSourceFiles.length,
    releaseFileBudgetBytes: MAX_RELEASE_FILE_BYTES,
    releasePublicBudgetBytes: MAX_RELEASE_PUBLIC_PAYLOAD_BYTES,
    releasePublicBytes,
    releasePublicFiles: releasePublicFiles.length,
    distBudgetBytes: MAX_DIST_PAYLOAD_BYTES,
    distBytes: distExists ? sumFileBytes(rootDirectory, distFiles) : null,
    distFiles: distExists ? distFiles.length : null,
    runtimeBytes: sumFileBytes(rootDirectory, runtimeFiles),
    runtimeFiles: runtimeFiles.length,
    scannedExpoRuntimeSourceFiles: activeExpoRuntimeSourceFiles.length,
  };
}

export function printReleaseStaticPayloadReport(report) {
  console.log('[check-release-static-payload] passed');
  console.log(`- Raw source texture pack excluded from release contexts: ${report.rawSourceFiles} files, ${bytesToMiB(report.rawSourceBytes)} MiB.`);
  console.log(`- Runtime texture pack available for release: ${report.runtimeFiles} files, ${bytesToMiB(report.runtimeBytes)} MiB.`);
  console.log(`- Release public payload: ${report.releasePublicFiles} files, ${bytesToMiB(report.releasePublicBytes)} MiB / ${bytesToMiB(report.releasePublicBudgetBytes)} MiB.`);
  if (report.distBytes === null) {
    console.log('- Built dist payload: not present; run npm.cmd run build for dist budget enforcement.');
  } else {
    console.log(`- Built dist payload: ${report.distFiles} files, ${bytesToMiB(report.distBytes)} MiB / ${bytesToMiB(report.distBudgetBytes)} MiB.`);
  }
  console.log(`- Per-file release payload budget: ${bytesToMiB(report.releaseFileBudgetBytes)} MiB.`);
  console.log(`- Active Expo runtime source files checked for raw texture references: ${report.scannedExpoRuntimeSourceFiles}.`);
  console.log('- dist/textures/expo is absent when a dist build exists.');
}

try {
  printReleaseStaticPayloadReport(verifyReleaseStaticPayload());
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
