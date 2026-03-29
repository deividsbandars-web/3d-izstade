import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'textures', 'expo-runtime', 'asset-manifest.json');

async function main() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const errors = [];

  if (!Array.isArray(manifest.textures) || manifest.textures.length === 0) {
    errors.push('No runtime textures recorded in expo-runtime manifest.');
  }

  for (const texture of manifest.textures ?? []) {
    if (!texture.runtimePath?.endsWith('.webp')) {
      errors.push(`Runtime texture is not WebP: ${texture.runtimePath}`);
    }
    if (!(texture.runtimeSizeBytes > 0)) {
      errors.push(`Runtime texture has invalid size: ${texture.runtimePath}`);
    }
    if (!(texture.sourceSizeBytes > texture.runtimeSizeBytes)) {
      errors.push(`Runtime texture did not shrink: ${texture.sourcePath}`);
    }
  }

  if (errors.length > 0) {
    console.error('Expo texture pipeline check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Expo texture pipeline check passed for ${manifest.textures.length} textures.`);
  console.log(`Savings ratio: ${manifest.stats?.savingsRatio ?? 'n/a'}`);
}

main().catch((error) => {
  console.error('Failed to check Expo texture pipeline.', error);
  process.exitCode = 1;
});

