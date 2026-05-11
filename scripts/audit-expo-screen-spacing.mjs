import fs from 'node:fs';
import path from 'node:path';

const SCREEN_LAYERS = new Set(['city-screen-surface', 'stadium-screen-surface']);
const DEFAULT_MIN_CENTER_DISTANCE = 220;
const DEFAULT_MIN_SAME_FACING_DISTANCE = 320;
const HIGH_DISTANCE = 120;
const HIGH_OVERLAP_AREA = 900;

function printUsageAndExit() {
  console.error('Usage: node scripts/audit-expo-screen-spacing.mjs <snapshot.json|full-city-run-dir> [--out <report.json>] [--md <report.md>]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = { inputPath: null, markdownPath: null, outPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.outPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (value === '--md') {
      args.markdownPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (!args.inputPath) {
      args.inputPath = value;
      continue;
    }
    printUsageAndExit();
  }

  if (!args.inputPath) {
    printUsageAndExit();
  }

  return args;
}

function resolveSnapshotPath(inputPath) {
  const resolved = path.resolve(inputPath);
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    return path.join(resolved, 'screens', 'ground-seam-overhead.snapshot.json');
  }

  return resolved;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function tuple3(value) {
  return Array.isArray(value)
    && value.length >= 3
    && value.slice(0, 3).every(isFiniteNumber)
    ? [value[0], value[1], value[2]]
    : null;
}

function positiveTuple3(value) {
  const tuple = tuple3(value);
  return tuple && tuple.every((entry) => entry > 0) ? tuple : null;
}

function uniqueRegistryEntries(snapshot) {
  const byId = new Map();
  if (snapshot?.registryById && typeof snapshot.registryById === 'object') {
    for (const entry of Object.values(snapshot.registryById)) {
      if (entry?.id && !byId.has(entry.id)) {
        byId.set(entry.id, entry);
      }
    }
  }

  for (const bucket of Object.values(snapshot?.registry ?? {})) {
    if (!Array.isArray(bucket)) {
      continue;
    }
    for (const entry of bucket) {
      if (entry?.id && !byId.has(entry.id)) {
        byId.set(entry.id, entry);
      }
    }
  }

  return [...byId.values()];
}

function resolveBounds(entry) {
  const position = tuple3(entry.position);
  const size = positiveTuple3(entry.size);
  if (!position || !size) {
    return null;
  }

  const yaw = tuple3(entry.rotation)?.[1] ?? 0;
  const halfX = (Math.abs(Math.cos(yaw)) * size[0] * 0.5) + (Math.abs(Math.sin(yaw)) * size[2] * 0.5);
  const halfY = size[1] * 0.5;
  const halfZ = (Math.abs(Math.sin(yaw)) * size[0] * 0.5) + (Math.abs(Math.cos(yaw)) * size[2] * 0.5);

  return {
    maxX: position[0] + halfX,
    maxY: position[1] + halfY,
    maxZ: position[2] + halfZ,
    minX: position[0] - halfX,
    minY: position[1] - halfY,
    minZ: position[2] - halfZ,
    size,
  };
}

function overlap1d(aMin, aMax, bMin, bMax) {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin);
}

function overlapAreaXZ(left, right) {
  const overlapX = overlap1d(left.minX, left.maxX, right.minX, right.maxX);
  const overlapZ = overlap1d(left.minZ, left.maxZ, right.minZ, right.maxZ);
  return overlapX > 0 && overlapZ > 0 ? overlapX * overlapZ : 0;
}

function normalizeYawDelta(left, right) {
  return Math.abs(Math.atan2(Math.sin(left - right), Math.cos(left - right)));
}

function inferHostId(screenId) {
  if (screenId === 'rear-campus-bowl-feed-surface') {
    return 'rear-campus-bowl-center-deck';
  }
  if (screenId.endsWith('-host-surface')) {
    return screenId.slice(0, -'-host-surface'.length);
  }
  if (screenId.endsWith('-rear-campus-feed-surface')) {
    return screenId.slice(0, -'-rear-campus-feed-surface'.length);
  }
  if (screenId.startsWith('rear-campus-') && screenId.endsWith('-feed-surface')) {
    return screenId.slice(0, -'-feed-surface'.length);
  }
  if (screenId.endsWith('-tower-ribbon')) {
    return screenId.slice(0, -'-tower-ribbon'.length);
  }
  if (screenId.endsWith('-crown-beacon')) {
    return screenId.slice(0, -'-crown-beacon'.length);
  }
  if (screenId.startsWith('screen-')) {
    return `${screenId}-host`;
  }
  return null;
}

function buildIssue(left, right) {
  const leftPosition = tuple3(left.position);
  const rightPosition = tuple3(right.position);
  const leftRotation = tuple3(left.rotation) ?? [0, 0, 0];
  const rightRotation = tuple3(right.rotation) ?? [0, 0, 0];
  const leftBounds = resolveBounds(left);
  const rightBounds = resolveBounds(right);
  if (!leftPosition || !rightPosition || !leftBounds || !rightBounds) {
    return null;
  }

  const distanceXZ = Math.hypot(leftPosition[0] - rightPosition[0], leftPosition[2] - rightPosition[2]);
  const yDelta = Math.abs(leftPosition[1] - rightPosition[1]);
  const yawDelta = normalizeYawDelta(leftRotation[1], rightRotation[1]);
  const sameFacing = yawDelta < 0.35;
  const sameHost = inferHostId(left.id) && inferHostId(left.id) === inferHostId(right.id);
  const verticalOverlap = overlap1d(leftBounds.minY, leftBounds.maxY, rightBounds.minY, rightBounds.maxY);
  const xzOverlapArea = overlapAreaXZ(leftBounds, rightBounds);

  if (sameHost && yDelta > 80 && xzOverlapArea < HIGH_OVERLAP_AREA) {
    return null;
  }

  const minDistance = sameFacing ? DEFAULT_MIN_SAME_FACING_DISTANCE : DEFAULT_MIN_CENTER_DISTANCE;
  if (distanceXZ >= minDistance && xzOverlapArea < HIGH_OVERLAP_AREA) {
    return null;
  }

  const high = (distanceXZ < HIGH_DISTANCE && yDelta < 180)
    || (xzOverlapArea >= HIGH_OVERLAP_AREA && verticalOverlap > 0);

  return {
    code: high ? 'screen-spacing-high-risk' : sameFacing ? 'same-facing-screen-cluster' : 'screen-spacing-warning',
    distanceXZ: Math.round(distanceXZ),
    ids: [left.id, right.id],
    layers: [left.layer, right.layer],
    minDistance,
    positions: [leftPosition, rightPosition],
    sameFacing,
    sameHost,
    severity: high ? 'high' : 'medium',
    verticalOverlap: Math.round(Math.max(0, verticalOverlap)),
    xzOverlapArea: Math.round(xzOverlapArea),
    yawDelta: Number(yawDelta.toFixed(3)),
  };
}

function buildMarkdown(report) {
  const lines = [
    '# Expo Screen Spacing Audit',
    '',
    `Snapshot: \`${report.snapshotPath}\``,
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- screens: ${report.summary.screenCount}`,
    `- issues: ${report.summary.totalIssues}`,
    `- high: ${report.summary.bySeverity.high}`,
    `- medium: ${report.summary.bySeverity.medium}`,
    '',
    '## Policy',
    '',
    `- min center distance: ${report.policy.minCenterDistance}`,
    `- min same-facing distance: ${report.policy.minSameFacingDistance}`,
    '- same host stacked screens are allowed only when separated vertically and not overlapping heavily.',
    '',
    '## Issues',
    '',
  ];

  if (report.issues.length === 0) {
    lines.push('No screen spacing issues found.');
    return `${lines.join('\n')}\n`;
  }

  for (const issue of report.issues) {
    lines.push(`### ${issue.severity.toUpperCase()} ${issue.code}`);
    lines.push('');
    lines.push(`- ids: ${issue.ids.join(' / ')}`);
    lines.push(`- distanceXZ: ${issue.distanceXZ}`);
    lines.push(`- requiredDistance: ${issue.minDistance}`);
    lines.push(`- sameFacing: ${issue.sameFacing}`);
    lines.push(`- sameHost: ${issue.sameHost}`);
    lines.push(`- xzOverlapArea: ${issue.xzOverlapArea}`);
    lines.push(`- verticalOverlap: ${issue.verticalOverlap}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

const args = parseArgs(process.argv);
const snapshotPath = resolveSnapshotPath(args.inputPath);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8').replace(/^\uFEFF/, ''));
const entries = uniqueRegistryEntries(snapshot);
const screens = entries.filter((entry) => SCREEN_LAYERS.has(entry.layer));
const issues = [];

for (let leftIndex = 0; leftIndex < screens.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < screens.length; rightIndex += 1) {
    const issue = buildIssue(screens[leftIndex], screens[rightIndex]);
    if (issue) {
      issues.push(issue);
    }
  }
}

issues.sort((left, right) => {
  const severityDelta = (right.severity === 'high' ? 1 : 0) - (left.severity === 'high' ? 1 : 0);
  return severityDelta || left.distanceXZ - right.distanceXZ || left.ids.join('/').localeCompare(right.ids.join('/'));
});

const report = {
  generatedAt: new Date().toISOString(),
  snapshotPath,
  policy: {
    minCenterDistance: DEFAULT_MIN_CENTER_DISTANCE,
    minSameFacingDistance: DEFAULT_MIN_SAME_FACING_DISTANCE,
  },
  summary: {
    bySeverity: {
      high: issues.filter((issue) => issue.severity === 'high').length,
      medium: issues.filter((issue) => issue.severity === 'medium').length,
    },
    screenCount: screens.length,
    totalIssues: issues.length,
  },
  issues,
};

if (args.outPath) {
  fs.mkdirSync(path.dirname(path.resolve(args.outPath)), { recursive: true });
  fs.writeFileSync(args.outPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (args.markdownPath) {
  fs.mkdirSync(path.dirname(path.resolve(args.markdownPath)), { recursive: true });
  fs.writeFileSync(args.markdownPath, buildMarkdown(report));
}

console.log('screen spacing audit');
console.log(`snapshot: ${snapshotPath}`);
console.log(`screens: ${report.summary.screenCount}`);
console.log(`issues: ${report.summary.totalIssues}`);
console.log(`high: ${report.summary.bySeverity.high}`);
console.log(`medium: ${report.summary.bySeverity.medium}`);
