import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const LEGACY_REF = '7f50cac^';
const DEFAULT_REAR_CAMPUS_CENTER_Z = -2880;
const OUTPUT_DIR = path.resolve('diagnostics/expo/structure-recovery');
const SOURCE_FILES = [
  'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
  'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
];

const DYNAMIC_LEGACY_FAMILIES = [
  {
    family: 'rear-campus-gateway',
    ids: ['rear-campus-gateway--1', 'rear-campus-gateway-1'],
    position: (side) => [side * 1260, 0, 980],
    size: [126, 336, 126],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-fan-court',
    ids: ['rear-campus-fan-court--1', 'rear-campus-fan-court-1'],
    position: (side) => [side * 486, 0, 1188],
    size: [164, 112, 84],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-forecourt-blade',
    ids: ['rear-campus-forecourt-blade--1', 'rear-campus-forecourt-blade-1'],
    position: (side) => [side * 248, 0, 1260],
    size: [34, 188, 28],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-event-blade',
    ids: ['rear-campus-event-blade--1', 'rear-campus-event-blade-1'],
    position: (side) => [side * 540, 0, 820],
    size: [34, 188, 28],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-axis-pylon',
    ids: ['rear-campus-axis-pylon--1', 'rear-campus-axis-pylon-1'],
    position: (side) => [side * 188, 0, 1328],
    size: [36, 172, 28],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-axis-canopy',
    ids: ['rear-campus-axis-canopy--1', 'rear-campus-axis-canopy-1'],
    position: (side) => [side * 286, 0, 1210],
    size: [176, 72, 84],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-axis-front-node',
    ids: ['rear-campus-axis-front-node--1', 'rear-campus-axis-front-node-1'],
    position: (side) => [side * 224, 0, 1258],
    size: [72, 86, 52],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-axis-beacon',
    ids: ['rear-campus-axis-beacon--1', 'rear-campus-axis-beacon-1'],
    position: (side) => [side * 156, 0, 1468],
    size: [30, 124, 30],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-axis-terminal',
    ids: ['rear-campus-axis-terminal--1', 'rear-campus-axis-terminal-1'],
    position: (side) => [side * 238, 0, 1540],
    size: [94, 72, 66],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-center-node',
    ids: ['rear-campus-center-node--1', 'rear-campus-center-node-1'],
    position: (side) => [side * 286, 0, 928],
    size: [84, 74, 64],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-center-threshold',
    ids: ['rear-campus-center-threshold--1', 'rear-campus-center-threshold-1'],
    position: (side) => [side * 118, 0, 1042],
    size: [64, 42, 38],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-inner-portal',
    ids: ['rear-campus-inner-portal--1', 'rear-campus-inner-portal-1'],
    position: (side) => [side * 518, 0, 934],
    size: [96, 184, 48],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
  {
    family: 'rear-campus-entry-plinth',
    ids: ['rear-campus-entry-plinth--1', 'rear-campus-entry-plinth-1'],
    position: (side) => [side * 420, 0, 1080],
    size: [142, 52, 96],
    sourceFile: 'src/modules/expo/runtime/world/ExpoRearCampusStructures.tsx',
  },
];

function gitShow(filePath) {
  return execFileSync('git', ['show', `${LEGACY_REF}:${filePath}`], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function readCurrentWorldSources() {
  const worldDir = path.resolve('src/modules/expo/runtime/world');
  return fs.readdirSync(worldDir)
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => fs.readFileSync(path.join(worldDir, name), 'utf8'))
    .join('\n');
}

function extractHiddenStructureIds(source) {
  const ids = new Set();
  const hiddenBlocks = source.match(/HIDDEN_[\s\S]*?new Set\(\[[\s\S]*?\]\)/g) ?? [];
  const localHidden = source.match(/hiddenStructureIds\s*=\s*new Set\(\[[\s\S]*?\]\)/g) ?? [];

  for (const block of [...hiddenBlocks, ...localHidden]) {
    for (const match of block.matchAll(/'stadium-structure:([^']+)'/g)) {
      ids.add(match[1]);
    }
  }

  return ids;
}

function parsePositionExpression(expression) {
  const parts = expression.split(',').map((part) => part.trim());
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const zPart = parts[2] ?? '';
  const zNumber = Number(zPart);
  const rearCampusZMatch = zPart.match(/rearCampusZ\((-?\d+(?:\.\d+)?)\)/);

  if (rearCampusZMatch) {
    const authoredZ = Number(rearCampusZMatch[1]);
    return {
      authoredZ,
      relativeZToCampusCenter: authoredZ - DEFAULT_REAR_CAMPUS_CENTER_Z,
      source: `[${expression}]`,
      x,
      y,
      zExpression: zPart,
    };
  }

  return {
    authoredZ: Number.isFinite(zNumber) ? DEFAULT_REAR_CAMPUS_CENTER_Z + zNumber : null,
    relativeZToCampusCenter: Number.isFinite(zNumber) ? zNumber : null,
    source: `[${expression}]`,
    x,
    y,
    zExpression: zPart,
  };
}

function estimateBoundsFromChunk(chunk) {
  const boxes = [...chunk.matchAll(/boxGeometry\s+args=\{\[([^\]]+)\]\}/g)]
    .map((match) => match[1].split(',').slice(0, 3).map((part) => Number(part.trim())))
    .filter((values) => values.length === 3 && values.every(Number.isFinite));
  const cylinders = [...chunk.matchAll(/cylinderGeometry\s+args=\{\[([^\]]+)\]\}/g)]
    .map((match) => match[1].split(',').slice(0, 3).map((part) => Number(part.trim())))
    .filter((values) => values.length >= 3 && values.every(Number.isFinite))
    .map(([radiusTop, radiusBottom, height]) => {
      const diameter = Math.max(radiusTop, radiusBottom) * 2;
      return [diameter, height, diameter];
    });
  const toruses = [...chunk.matchAll(/torusGeometry\s+args=\{\[([^\]]+)\]\}/g)]
    .map((match) => match[1].split(',').slice(0, 2).map((part) => Number(part.trim())))
    .filter((values) => values.length >= 2 && values.every(Number.isFinite))
    .map(([radius, tube]) => {
      const diameter = (radius + tube) * 2;
      return [diameter, tube * 2, diameter];
    });
  const dimensions = [...boxes, ...cylinders, ...toruses];

  if (dimensions.length === 0) {
    return null;
  }

  return dimensions.reduce((max, values) => [
    Math.max(max[0], values[0]),
    Math.max(max[1], values[1]),
    Math.max(max[2], values[2]),
  ], [0, 0, 0]);
}

function findMatchingGroupEnd(source, startIndex) {
  const groupTokenPattern = /<\/?group\b/g;
  groupTokenPattern.lastIndex = startIndex;
  let depth = 0;

  for (let match = groupTokenPattern.exec(source); match; match = groupTokenPattern.exec(source)) {
    const token = match[0];
    if (token === '<group') {
      depth += 1;
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      const closingEnd = source.indexOf('>', match.index);
      return closingEnd >= 0 ? closingEnd + 1 : match.index + token.length;
    }
  }

  return source.length;
}

function extractStaticGroups(source, sourceFile) {
  const matches = [...source.matchAll(/<group\s+name="stadium-structure:([^"]+)"\s+position=\{\[([^\]]+)\]\}>/g)];

  return matches.map((match) => {
    const chunk = source.slice(match.index, findMatchingGroupEnd(source, match.index));
    return {
      id: match[1],
      position: parsePositionExpression(match[2]),
      sourceFile,
      type: 'static-group',
      estimatedSize: estimateBoundsFromChunk(chunk),
    };
  });
}

function buildDynamicFamilyEntries(hiddenIds) {
  return DYNAMIC_LEGACY_FAMILIES.flatMap((family) => family.ids.map((id) => {
    const side = id.endsWith('--1') ? -1 : 1;
    const [x, y, z] = family.position(side);
    return {
      family: family.family,
      id,
      legacyHidden: hiddenIds.has(id),
      position: {
        authoredZ: DEFAULT_REAR_CAMPUS_CENTER_Z + z,
        relativeZToCampusCenter: z,
        source: `[${x}, ${y}, ${z}]`,
        x,
        y,
        zExpression: String(z),
      },
      sourceFile: family.sourceFile,
      type: 'dynamic-family',
      estimatedSize: family.size,
    };
  }));
}

function classifyCandidate(entry, currentSources) {
  const id = entry.id;
  const lowerId = id.toLowerCase();
  const relativeZ = entry.position.relativeZToCampusCenter ?? 0;
  const absX = Math.abs(entry.position.x ?? 0);
  const currentReferenced = currentSources.includes(id) || currentSources.includes(`stadium-structure:${id}`);

  const isLegacyHidden = entry.legacyHidden === true;
  const isAxisClutter = /axis|fan-court|forecourt-blade|event-blade|entry-plinth|gateway|center-node|center-threshold|inner-portal/.test(lowerId);
  const isOldSmallCampusStructure = entry.sourceFile.endsWith('ExpoRearCampusStructures.tsx');
  const isLargeScenic = entry.sourceFile.endsWith('ExpoRearCampus.tsx');
  const isApproachRisk = relativeZ > 1100 && absX < 1900;
  const isCentralRisk = absX < 900;

  if (currentReferenced) {
    return {
      recommendation: 'already-current',
      risk: 'already-referenced',
      reason: 'ID still exists in current runtime source; do not duplicate it.',
    };
  }

  if (isLegacyHidden) {
    return {
      recommendation: 'reject',
      risk: 'legacy-hidden',
      reason: 'This structure was already hidden before the cleanup commit, so restoring it would reintroduce known clutter.',
    };
  }

  if (isAxisClutter || isOldSmallCampusStructure) {
    return {
      recommendation: 'reject',
      risk: 'central-axis-clutter',
      reason: 'Small stadium-axis pieces caused crowded approach views and weak screen readability.',
    };
  }

  if (isLargeScenic && (isApproachRisk || isCentralRisk)) {
    return {
      recommendation: 'move-candidate',
      risk: 'approach-or-center-risk',
      reason: 'Large scenic mass is valuable, but old placement is too close to the approach/center and should be re-spaced before render.',
    };
  }

  if (isLargeScenic) {
    return {
      recommendation: 'keep-candidate',
      risk: 'spacing-review-required',
      reason: 'Large scenic mass is a plausible recovery candidate if it passes spacing, perimeter, and screen-occlusion checks.',
    };
  }

  return {
    recommendation: 'manual-review',
    risk: 'unknown',
    reason: 'Candidate could not be safely classified automatically.',
  };
}

function severityRank(recommendation) {
  return {
    'keep-candidate': 1,
    'move-candidate': 2,
    'manual-review': 3,
    'already-current': 4,
    reject: 5,
  }[recommendation] ?? 6;
}

function buildMarkdown(report) {
  const lines = [
    '# Expo Structure Recovery Audit',
    '',
    `Legacy ref: \`${report.legacyRef}\``,
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- candidates: ${report.summary.total}`,
    `- keep candidates: ${report.summary.byRecommendation['keep-candidate'] ?? 0}`,
    `- move candidates: ${report.summary.byRecommendation['move-candidate'] ?? 0}`,
    `- reject: ${report.summary.byRecommendation.reject ?? 0}`,
    `- already current: ${report.summary.byRecommendation['already-current'] ?? 0}`,
    '',
    '## Rules',
    '',
    '- Do not restore old ground planes, rings, circles, or forecourt color layers.',
    '- Do not restore central-axis micro structures or previously hidden structures.',
    '- Restore large landmarks only through a new controlled manifest with spacing and screen-occlusion checks.',
    '- Every restored object must have one registry ID, one source owner, bounds, and review camera coverage.',
    '',
    '## Candidates',
    '',
  ];

  for (const candidate of report.candidates) {
    lines.push(`### ${candidate.id}`);
    lines.push('');
    lines.push(`- recommendation: ${candidate.recommendation}`);
    lines.push(`- risk: ${candidate.risk}`);
    lines.push(`- source: ${candidate.sourceFile}`);
    lines.push(`- old position: \`${candidate.position.source}\``);
    lines.push(`- relativeZToCampusCenter: ${candidate.position.relativeZToCampusCenter ?? 'unknown'}`);
    lines.push(`- estimatedSize: ${candidate.estimatedSize ? `[${candidate.estimatedSize.join(', ')}]` : 'unknown'}`);
    lines.push(`- reason: ${candidate.reason}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

const legacySources = new Map(SOURCE_FILES.map((sourceFile) => [sourceFile, gitShow(sourceFile)]));
const hiddenIds = new Set([...legacySources.values()].flatMap((source) => [...extractHiddenStructureIds(source)]));
const currentSources = readCurrentWorldSources();
const staticEntries = SOURCE_FILES.flatMap((sourceFile) => extractStaticGroups(legacySources.get(sourceFile), sourceFile));
const dynamicEntries = buildDynamicFamilyEntries(hiddenIds);
const allEntriesById = new Map();

for (const entry of [...staticEntries, ...dynamicEntries]) {
  allEntriesById.set(entry.id, {
    ...entry,
    legacyHidden: entry.legacyHidden ?? hiddenIds.has(entry.id),
  });
}

const candidates = [...allEntriesById.values()]
  .map((entry) => ({
    ...entry,
    ...classifyCandidate(entry, currentSources),
  }))
  .sort((a, b) => (
    severityRank(a.recommendation) - severityRank(b.recommendation)
    || a.sourceFile.localeCompare(b.sourceFile)
    || a.id.localeCompare(b.id)
  ));

const byRecommendation = candidates.reduce((acc, candidate) => {
  acc[candidate.recommendation] = (acc[candidate.recommendation] ?? 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  legacyRef: LEGACY_REF,
  sourceFiles: SOURCE_FILES,
  summary: {
    byRecommendation,
    total: candidates.length,
  },
  screenSpacingPolicy: {
    minScreenCenterDistance: 220,
    minSameFacingScreenCenterDistance: 320,
    minApproachAxisClearWidth: 520,
    mustHaveHostId: true,
    mustHaveRegistryBounds: true,
    mustPassOcclusionReview: true,
  },
  candidates,
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const jsonPath = path.join(OUTPUT_DIR, 'structure-recovery-audit.json');
const markdownPath = path.join(OUTPUT_DIR, 'structure-recovery-audit.md');
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(markdownPath, buildMarkdown(report));

console.log(`structure recovery audit`);
console.log(`json: ${jsonPath}`);
console.log(`markdown: ${markdownPath}`);
console.log(`candidates: ${report.summary.total}`);
for (const [recommendation, count] of Object.entries(byRecommendation)) {
  console.log(`${recommendation}: ${count}`);
}
