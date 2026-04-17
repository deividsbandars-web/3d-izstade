import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const browserScopeFiles = [
  'src/agents/baseAgent.ts',
  ...walkFiles(path.join(repoRoot, 'src', 'services')).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx')),
];

const duplicateJsFiles = walkFiles(path.join(repoRoot, 'src')).filter((file) => {
  if (!file.endsWith('.js')) {
    return false;
  }

  const tsSibling = file.slice(0, -3) + '.ts';
  const tsxSibling = file.slice(0, -3) + '.tsx';
  return fs.existsSync(tsSibling) || fs.existsSync(tsxSibling);
});

const backendImportViolations = [];

for (const file of browserScopeFiles) {
  if (!fs.existsSync(file)) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/from\s+['"].*backend\//.test(line) || /require\(['"].*backend\//.test(line)) {
      backendImportViolations.push({
        file: path.relative(repoRoot, file),
        line: index + 1,
        source: line.trim(),
      });
    }
  });
}

if (backendImportViolations.length || duplicateJsFiles.length) {
  if (backendImportViolations.length) {
    console.error('Browser/backend boundary violations found:');
    backendImportViolations.forEach((entry) => {
      console.error(`- ${entry.file}:${entry.line} ${entry.source}`);
    });
  }

  if (duplicateJsFiles.length) {
    console.error('Duplicate JS source artifacts found inside src:');
    duplicateJsFiles
      .map((file) => path.relative(repoRoot, file))
      .sort()
      .forEach((file) => console.error(`- ${file}`));
  }

  process.exit(1);
}

console.log('Source boundary check passed.');

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(resolved));
    } else {
      files.push(resolved);
    }
  }

  return files;
}
