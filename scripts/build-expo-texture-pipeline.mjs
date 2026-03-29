import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(repoRoot, 'public', 'textures', 'expo');
const runtimeRoot = path.join(repoRoot, 'public', 'textures', 'expo-runtime');
const runtimeManifestPath = path.join(runtimeRoot, 'asset-manifest.json');

const SOURCE_MANIFEST_IGNORES = new Set(['asset-manifest.json']);

function detectKtxTool() {
  const ktxResult = spawnSync('ktx', ['--version'], { encoding: 'utf8' });
  if (ktxResult.status === 0) {
    return { command: 'ktx', enabled: true, mode: 'ktx-suite' };
  }

  const toktxResult = spawnSync('toktx', ['--version'], { encoding: 'utf8' });
  if (toktxResult.status === 0) {
    return { command: 'toktx', enabled: true, mode: 'toktx-legacy' };
  }

  return { command: null, enabled: false, mode: 'unavailable' };
}

function inferProfile(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').toLowerCase();

  if (normalized.includes('hero-facade-screen-8k')) {
    return { lossless: false, maxWidth: 4096, maxHeight: 4096, quality: 88, type: 'hero-screen' };
  }

  if (normalized.includes('screen-placeholders-4k/horizontal-16x9')) {
    return { lossless: false, maxWidth: 1920, maxHeight: 1080, quality: 86, type: 'screen-placeholder-horizontal' };
  }

  if (normalized.includes('screen-placeholders-4k/vertical-9x16')) {
    return { lossless: false, maxWidth: 1080, maxHeight: 1920, quality: 86, type: 'screen-placeholder-vertical' };
  }

  if (normalized.includes('_nor_')) {
    return { lossless: true, maxWidth: 2048, maxHeight: 2048, quality: 100, type: 'normal-map' };
  }

  if (normalized.includes('_ao_') || normalized.includes('_rough_')) {
    return { lossless: false, maxWidth: 2048, maxHeight: 2048, quality: 84, type: 'utility-map' };
  }

  return { lossless: false, maxWidth: 2048, maxHeight: 2048, quality: 82, type: 'base-color' };
}

async function collectPngFiles(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectPngFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (SOURCE_MANIFEST_IGNORES.has(entry.name)) {
      continue;
    }

    if (entry.name.toLowerCase().endsWith('.png')) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRuntimeRelativePath(sourceFile) {
  const sourceRelative = path.relative(sourceRoot, sourceFile);
  return sourceRelative.replace(/\.png$/i, '.webp');
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function buildRuntimeTexture(sourceFile) {
  const sourceRelative = path.relative(sourceRoot, sourceFile).replaceAll('\\', '/');
  const runtimeRelative = toRuntimeRelativePath(sourceFile).replaceAll('\\', '/');
  const outputPath = path.join(runtimeRoot, runtimeRelative);
  const profile = inferProfile(sourceRelative);
  const sourceStat = await fs.stat(sourceFile);
  const sourceMetadata = await sharp(sourceFile).metadata();

  await ensureParentDir(outputPath);

  let image = sharp(sourceFile, { animated: false });
  if ((sourceMetadata.width || 0) > profile.maxWidth || (sourceMetadata.height || 0) > profile.maxHeight) {
    image = image.resize({
      fit: 'inside',
      height: profile.maxHeight,
      kernel: sharp.kernel.lanczos3,
      width: profile.maxWidth,
      withoutEnlargement: true,
    });
  }

  if (profile.lossless) {
    image = image.webp({ effort: 6, lossless: true });
  } else {
    image = image.webp({ effort: 6, quality: profile.quality });
  }

  await image.toFile(outputPath);

  const outputStat = await fs.stat(outputPath);
  const outputMetadata = await sharp(outputPath).metadata();

  return {
    profile: profile.type,
    runtimePath: `/textures/expo-runtime/${runtimeRelative.replaceAll('\\', '/')}`,
    runtimeSizeBytes: outputStat.size,
    runtimeWidth: outputMetadata.width ?? null,
    runtimeHeight: outputMetadata.height ?? null,
    sourcePath: `/textures/expo/${sourceRelative}`,
    sourceSizeBytes: sourceStat.size,
    sourceWidth: sourceMetadata.width ?? null,
    sourceHeight: sourceMetadata.height ?? null,
  };
}

async function main() {
  const ktxTool = detectKtxTool();
  const pngFiles = await collectPngFiles(sourceRoot);
  const outputs = [];

  await fs.rm(runtimeRoot, { force: true, recursive: true });
  await fs.mkdir(runtimeRoot, { recursive: true });

  for (const sourceFile of pngFiles) {
    outputs.push(await buildRuntimeTexture(sourceFile));
  }

  const totalSourceBytes = outputs.reduce((sum, entry) => sum + entry.sourceSizeBytes, 0);
  const totalRuntimeBytes = outputs.reduce((sum, entry) => sum + entry.runtimeSizeBytes, 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    ktx2: {
      enabled: false,
      note: ktxTool.enabled
        ? `Detected ${ktxTool.command}, but KTX2 encoding is not yet wired into the runtime loader. WebP runtime derivatives were generated instead.`
        : 'No KTX encoder detected on PATH. WebP runtime derivatives generated as the active release pipeline.',
      tool: ktxTool.command,
    },
    runtimeRoot: '/textures/expo-runtime',
    stats: {
      sourceBytes: totalSourceBytes,
      runtimeBytes: totalRuntimeBytes,
      savingsBytes: totalSourceBytes - totalRuntimeBytes,
      savingsRatio: totalSourceBytes > 0 ? Number(((totalSourceBytes - totalRuntimeBytes) / totalSourceBytes).toFixed(4)) : 0,
      textureCount: outputs.length,
    },
    textures: outputs,
  };

  await fs.writeFile(runtimeManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Built Expo runtime textures: ${outputs.length}`);
  console.log(`Source bytes: ${totalSourceBytes}`);
  console.log(`Runtime bytes: ${totalRuntimeBytes}`);
  console.log(`Saved bytes: ${totalSourceBytes - totalRuntimeBytes}`);
  console.log(`KTX tool: ${ktxTool.command ?? 'not detected'}`);
}

main().catch((error) => {
  console.error('Failed to build Expo texture pipeline.', error);
  process.exitCode = 1;
});

