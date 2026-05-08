#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SOLID_LAYERS = new Set([
  'city-mass',
  'city-tower',
  'mega-landmark',
  'stadium-pavilion',
  'stadium-structure',
  'stadium-tower',
]);

const GROUND_LAYERS = new Set(['city-plane', 'stadium-plane']);
const SCREEN_LAYERS = new Set(['city-screen-surface', 'stadium-screen-surface']);
const SOCKET_LAYER_BY_SCREEN_LAYER = {
  'city-screen-surface': 'city-screen-socket',
  'stadium-screen-surface': 'stadium-screen-socket',
};

function resolveScreenHostBinding(screenId) {
  if (screenId === 'rear-campus-bowl-feed-surface') {
    return { hostId: 'rear-campus-bowl-center-deck', maxDistanceXZ: 180 };
  }

  if (screenId.endsWith('-host-surface')) {
    return {
      hostId: screenId.slice(0, -'-host-surface'.length),
      maxDistanceXZ: 260,
    };
  }

  if (screenId.endsWith('-rear-campus-feed-surface')) {
    return {
      hostId: screenId.slice(0, -'-rear-campus-feed-surface'.length),
      maxDistanceXZ: 220,
    };
  }

  const terminalFeedMatch = screenId.match(/^rear-campus-axis-terminal-(left|right)-feed-surface$/);
  if (terminalFeedMatch) {
    return {
      hostId: `rear-campus-terminal-${terminalFeedMatch[1]}`,
      maxDistanceXZ: 90,
    };
  }

  if (screenId.startsWith('rear-campus-') && screenId.endsWith('-feed-surface')) {
    return {
      hostId: screenId.slice(0, -'-feed-surface'.length),
      maxDistanceXZ: 90,
    };
  }

  if (screenId.startsWith('screen-marquee-') || screenId.startsWith('screen-array-') || screenId.startsWith('screen-spine-')) {
    return {
      hostId: `${screenId}-host`,
      maxDistanceXZ: 72,
    };
  }

  if (screenId.endsWith('-tower-ribbon')) {
    return {
      hostId: screenId.slice(0, -'-tower-ribbon'.length),
      maxDistanceXZ: 140,
    };
  }

  if (screenId.endsWith('-crown-beacon')) {
    return {
      hostId: screenId.slice(0, -'-crown-beacon'.length),
      maxDistanceXZ: 120,
    };
  }

  return null;
}

function printUsageAndExit() {
  console.error('Usage: node scripts/audit-expo-world-registry.mjs <snapshot.json> [--out <report.json>] [--fail-on high|medium|low]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = { failOn: null, outPath: null, snapshotPath: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.outPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (value === '--fail-on') {
      args.failOn = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (!args.snapshotPath) {
      args.snapshotPath = value;
      continue;
    }
    printUsageAndExit();
  }

  if (!args.snapshotPath) {
    printUsageAndExit();
  }

  return args;
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

  const halfX = size[0] * 0.5;
  const halfY = size[1] * 0.5;
  const halfZ = size[2] * 0.5;
  return {
    centerX: position[0],
    centerY: position[1],
    centerZ: position[2],
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

function overlapAreaXZ(a, b) {
  const overlapX = overlap1d(a.minX, a.maxX, b.minX, b.maxX);
  const overlapZ = overlap1d(a.minZ, a.maxZ, b.minZ, b.maxZ);
  return overlapX > 0 && overlapZ > 0 ? overlapX * overlapZ : 0;
}

function gapXZ(a, b) {
  const gapX = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const gapZ = Math.max(0, Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ));
  return Math.hypot(gapX, gapZ);
}

function distanceXZ(a, b) {
  return Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
}

function pushIssue(issues, severity, code, message, relatedIds, metrics = {}) {
  issues.push({
    code,
    message,
    metrics,
    relatedIds,
    severity,
  });
}

function isCityLayer(layer) {
  return layer?.startsWith('city-') || layer === 'mega-landmark';
}

function isStadiumLayer(layer) {
  return layer?.startsWith('stadium-');
}

function auditGroundAndCrossLayerOverlaps(entries) {
  const issues = [];
  const bounded = entries
    .map((entry) => ({ bounds: resolveBounds(entry), entry }))
    .filter((item) => item.bounds);

  for (let leftIndex = 0; leftIndex < bounded.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < bounded.length; rightIndex += 1) {
      const left = bounded[leftIndex];
      const right = bounded[rightIndex];
      const area = overlapAreaXZ(left.bounds, right.bounds);

      const leftGround = GROUND_LAYERS.has(left.entry.layer);
      const rightGround = GROUND_LAYERS.has(right.entry.layer);
      if (
        area > 0
        && leftGround
        && rightGround
        && left.entry.layer !== right.entry.layer
        && area >= 1800
      ) {
        pushIssue(
          issues,
          area >= 16000 ? 'high' : 'medium',
          'mixed-ground-plane-overlap',
          `${left.entry.layer} ${left.entry.id} overlaps ${right.entry.layer} ${right.entry.id} on the XZ footprint.`,
          [left.entry.id, right.entry.id],
          { overlapAreaXZ: Math.round(area) },
        );
        continue;
      }

      const cityVsStadium =
        (isCityLayer(left.entry.layer) && isStadiumLayer(right.entry.layer))
        || (isStadiumLayer(left.entry.layer) && isCityLayer(right.entry.layer));
      if (
        cityVsStadium
        && SOLID_LAYERS.has(left.entry.layer)
        && SOLID_LAYERS.has(right.entry.layer)
        && area >= 1000
      ) {
        pushIssue(
          issues,
          area >= 20000 ? 'high' : 'medium',
          'city-stadium-solid-overlap',
          `${left.entry.layer} ${left.entry.id} overlaps ${right.entry.layer} ${right.entry.id}; this can read as two layout systems colliding.`,
          [left.entry.id, right.entry.id],
          { overlapAreaXZ: Math.round(area) },
        );
        continue;
      }

      if (
        cityVsStadium
        && SOLID_LAYERS.has(left.entry.layer)
        && SOLID_LAYERS.has(right.entry.layer)
        && area <= 0
      ) {
        const gap = gapXZ(left.bounds, right.bounds);
        if (gap <= 18) {
          pushIssue(
            issues,
            'medium',
            'city-stadium-solid-near-gap',
            `${left.entry.layer} ${left.entry.id} is ${Math.round(gap)} units from ${right.entry.layer} ${right.entry.id}; this is too tight for a clean city/stadium split.`,
            [left.entry.id, right.entry.id],
            { gapXZ: Math.round(gap) },
          );
        }
      }
    }
  }

  return issues;
}

function auditSolidBoundsCoverage(entries) {
  const issues = [];

  for (const entry of entries) {
    if (!SOLID_LAYERS.has(entry.layer)) {
      continue;
    }

    if (!resolveBounds(entry)) {
      pushIssue(
        issues,
        'high',
        'solid-missing-bounds',
        `${entry.layer} ${entry.id} has no usable size bounds, so overlap/attachment audits cannot control it.`,
        [entry.id],
        {
          sourceFile: entry.sourceFile ?? null,
          sourceKind: entry.sourceKind ?? null,
        },
      );
    }
  }

  return issues;
}

function auditBoothSpacing(entries) {
  const booths = entries
    .filter((entry) => entry.layer === 'booth' && tuple3(entry.position))
    .map((entry) => ({ ...entry, position: tuple3(entry.position) }));
  const issues = [];

  for (let leftIndex = 0; leftIndex < booths.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < booths.length; rightIndex += 1) {
      const left = booths[leftIndex];
      const right = booths[rightIndex];
      const distance = distanceXZ(left, right);
      if (distance >= 130) {
        continue;
      }

      pushIssue(
        issues,
        distance < 90 ? 'high' : 'medium',
        'booth-too-close',
        `Booths ${left.id} and ${right.id} are ${Math.round(distance)} units apart on XZ.`,
        [left.id, right.id],
        { distanceXZ: Math.round(distance) },
      );
    }
  }

  return issues;
}

function auditScreenSocketAttachment(entries) {
  const registryById = new Map(entries.map((entry) => [entry.id, entry]));
  const screens = entries
    .filter((entry) => SCREEN_LAYERS.has(entry.layer) && resolveBounds(entry))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }));
  const issues = [];

  for (const screen of screens) {
    const expectedSocketLayer = SOCKET_LAYER_BY_SCREEN_LAYER[screen.entry.layer];
    const socket = registryById.get(`${screen.entry.id}-socket`);
    if (!socket || socket.layer !== expectedSocketLayer) {
      pushIssue(
        issues,
        'high',
        'screen-missing-socket',
        `Screen ${screen.entry.id} is missing expected socket ${screen.entry.id}-socket.`,
        [screen.entry.id, `${screen.entry.id}-socket`],
      );
      continue;
    }

    const socketBounds = resolveBounds(socket);
    if (!socketBounds) {
      pushIssue(
        issues,
        'medium',
        'screen-socket-missing-bounds',
        `Screen socket ${socket.id} has no usable bounds for attachment audit.`,
        [screen.entry.id, socket.id],
      );
      continue;
    }

    const gap = gapXZ(screen.bounds, socketBounds);
    const yDelta = Math.abs(screen.entry.position[1] - socket.position[1]);
    if (gap > 14 || yDelta > 8) {
      pushIssue(
        issues,
        gap > 40 || yDelta > 24 ? 'high' : 'medium',
        'screen-socket-gap',
        `Screen ${screen.entry.id} is not tightly attached to socket ${socket.id}.`,
        [screen.entry.id, socket.id],
        { gapXZ: Math.round(gap), yDelta: Math.round(yDelta) },
      );
    }
  }

  return issues;
}

function auditScreenHostAttachment(entries) {
  const registryById = new Map(entries.map((entry) => [entry.id, entry]));
  const screens = entries
    .filter((entry) => SCREEN_LAYERS.has(entry.layer) && tuple3(entry.position))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }));
  const issues = [];

  for (const screen of screens) {
    const binding = resolveScreenHostBinding(screen.entry.id);
    if (!binding) {
      pushIssue(
        issues,
        'high',
        'screen-host-binding-missing',
        `Screen ${screen.entry.id} has no host binding; it cannot be audited for wall/tower attachment.`,
        [screen.entry.id],
      );
      continue;
    }

    const host = registryById.get(binding.hostId);
    if (!host) {
      pushIssue(
        issues,
        'high',
        'screen-host-missing',
        `Screen ${screen.entry.id} expects host ${binding.hostId}, but that host is missing from the registry.`,
        [screen.entry.id, binding.hostId],
      );
      continue;
    }

    const distance = distanceXZ(screen.entry, host);
    if (distance > binding.maxDistanceXZ) {
      pushIssue(
        issues,
        distance > binding.maxDistanceXZ * 1.8 ? 'high' : 'medium',
        'screen-host-gap',
        `Screen ${screen.entry.id} is ${Math.round(distance)} units from host ${host.id}.`,
        [screen.entry.id, host.id],
        { distanceXZ: Math.round(distance), maxDistanceXZ: binding.maxDistanceXZ },
      );
    }

    const hostBounds = resolveBounds(host);
    if (!screen.bounds || !hostBounds) {
      continue;
    }

    const faceGap = gapXZ(screen.bounds, hostBounds);
    if (faceGap > 64) {
      pushIssue(
        issues,
        faceGap > 140 ? 'high' : 'medium',
        'screen-host-face-gap',
        `Screen ${screen.entry.id} does not share a tight XZ footprint with host ${host.id}.`,
        [screen.entry.id, host.id],
        { faceGapXZ: Math.round(faceGap) },
      );
    }
  }

  return issues;
}

function summarize(issues) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  const byCode = {};
  for (const issue of issues) {
    counts[issue.severity] += 1;
    byCode[issue.code] = (byCode[issue.code] ?? 0) + 1;
  }

  return {
    byCode,
    severity: counts,
    totalIssues: issues.length,
  };
}

const args = parseArgs(process.argv);
const snapshotPath = path.resolve(args.snapshotPath);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8').replace(/^\uFEFF/, ''));
const entries = uniqueRegistryEntries(snapshot);
const issues = [
  ...auditSolidBoundsCoverage(entries),
  ...auditGroundAndCrossLayerOverlaps(entries),
  ...auditBoothSpacing(entries),
  ...auditScreenSocketAttachment(entries),
  ...auditScreenHostAttachment(entries),
].sort((left, right) => {
  const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return left.code.localeCompare(right.code);
});

const report = {
  generatedAt: new Date().toISOString(),
  registryEntryCount: entries.length,
  snapshot: snapshotPath,
  summary: summarize(issues),
  issues,
};

if (args.outPath) {
  const outPath = path.resolve(args.outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify({
  registryEntryCount: report.registryEntryCount,
  summary: report.summary,
  topIssues: report.issues.slice(0, 12),
}, null, 2));

if (args.failOn) {
  const threshold = SEVERITY_RANK[args.failOn];
  if (!threshold) {
    console.error(`Unknown --fail-on severity: ${args.failOn}`);
    process.exit(2);
  }
  if (issues.some((issue) => SEVERITY_RANK[issue.severity] >= threshold)) {
    process.exit(1);
  }
}
