#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const REQUIRED_LAYERS = new Set([
  'booth',
  'city-mass',
  'city-screen-surface',
  'city-tower',
  'ground-detail',
  'mega-landmark',
  'stadium-pavilion',
  'stadium-screen-surface',
  'stadium-structure',
  'stadium-tower',
]);
const CRITICAL_LAYERS = new Set([
  'booth',
  'city-screen-surface',
  'mega-landmark',
  'stadium-screen-surface',
]);
const RAYCAST_CRITICAL_LAYERS = CRITICAL_LAYERS;
const COVERAGE_ANGLE_RADIANS = 0.82;
const DEFAULT_MAX_DISTANCE = 3600;
const GROUND_MAX_DISTANCE = 6200;
const STADIUM_MAX_DISTANCE = 5200;

function printUsageAndExit() {
  console.error('Usage: node scripts/audit-expo-review-coverage.mjs <runDir> [--out <report.json>] [--fail-on high|medium|low]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = { failOn: null, outPath: null, runDir: null };
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
    if (!args.runDir) {
      args.runDir = value;
      continue;
    }
    printUsageAndExit();
  }
  if (!args.runDir) {
    printUsageAndExit();
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function tuple3(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite) ? value : null;
}

function positiveTuple3(value) {
  const tuple = tuple3(value);
  return tuple && tuple.every((item) => item > 0) ? tuple : null;
}

function vectorBetween(from, to) {
  return [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
}

function vectorLength(vector) {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function normalize(vector) {
  const length = vectorLength(vector);
  if (length <= 0) {
    return null;
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function dot(left, right) {
  return (left[0] * right[0]) + (left[1] * right[1]) + (left[2] * right[2]);
}

function entryRadius(entry) {
  const size = positiveTuple3(entry.size);
  if (!size) {
    return 0;
  }
  return Math.hypot(size[0], size[1], size[2]) * 0.5;
}

function maxDistanceForLayer(layer) {
  if (layer?.startsWith('stadium-')) {
    return STADIUM_MAX_DISTANCE;
  }
  if (layer?.startsWith('ground-')) {
    return GROUND_MAX_DISTANCE;
  }
  return DEFAULT_MAX_DISTANCE;
}

function isRequiredEntry(entry) {
  if (!REQUIRED_LAYERS.has(entry.layer)) {
    return false;
  }
  if (entry.id === 'global-ground-base') {
    return false;
  }
  return true;
}

function isCriticalEntry(entry) {
  return CRITICAL_LAYERS.has(entry.layer)
    || (entry.layer === 'city-mass' && entry.id.startsWith('screen-') && entry.id.endsWith('-host'));
}

function isRaycastCriticalEntry(entry) {
  return RAYCAST_CRITICAL_LAYERS.has(entry.layer);
}

const MEGA_LANDMARK_HIT_PREFIXES = [
  ['media-frame', 'mega-landmark-media-frame-wall'],
  ['media-pod', 'mega-landmark-media-signal-pods'],
  ['media-signal-pods', 'mega-landmark-media-signal-pods'],
  ['right-media-halo', 'mega-landmark-right-media-halo'],
  ['right-skybridge', 'mega-landmark-right-skybridge-beacon'],
  ['right-skyfold-citadel', 'mega-landmark-right-skyfold-citadel'],
  ['right-citadel', 'mega-landmark-right-skyfold-citadel'],
  ['right-support-spire', 'mega-landmark-right-support-spire'],
  ['left-split-crown', 'mega-landmark-left-split-crown-gate'],
  ['left-rampart', 'mega-landmark-left-grand-rampart'],
  ['left-cantilever', 'mega-landmark-left-cantilever-forum'],
  ['left-disc', 'mega-landmark-left-disc-habitat'],
  ['left-monolith', 'mega-landmark-left-split-monolith-pair'],
  ['left-broken-wall', 'mega-landmark-left-broken-wall-monument'],
  ['arrival', 'mega-landmark-arrival'],
  ['showcase', 'mega-landmark-showcase'],
  ['media', 'mega-landmark-media'],
];

function resolveMegaLandmarkInspectableId(id, aliasMap) {
  if (!id.startsWith('mega-landmark:')) {
    return null;
  }
  const suffix = id.slice('mega-landmark:'.length);
  for (const [prefix, parentId] of MEGA_LANDMARK_HIT_PREFIXES) {
    if ((suffix === prefix || suffix.startsWith(`${prefix}-`)) && aliasMap.has(parentId)) {
      return parentId;
    }
  }
  return null;
}

function resolveScreenRelatedInspectableId(id, aliasMap) {
  const parts = id.split(':').filter(Boolean);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    for (const suffix of ['-socket-assignment', '-socket']) {
      if (part.endsWith(suffix)) {
        const surfaceId = part.slice(0, -suffix.length);
        if (aliasMap.has(surfaceId)) {
          return surfaceId;
        }
      }
    }
  }
  return null;
}

function resolveInspectableId(id, aliasMap) {
  if (typeof id !== 'string' || !id) {
    return null;
  }

  const screenSurfaceId = resolveScreenRelatedInspectableId(id, aliasMap);
  if (screenSurfaceId) {
    return screenSurfaceId;
  }

  if (aliasMap.has(id)) {
    return aliasMap.get(id);
  }

  const megaLandmarkId = resolveMegaLandmarkInspectableId(id, aliasMap);
  if (megaLandmarkId) {
    return megaLandmarkId;
  }

  const parts = id.split(':').filter(Boolean);
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const candidate = parts[index];
    if (aliasMap.has(candidate)) {
      return aliasMap.get(candidate);
    }
  }

  return null;
}

function collectRegistryEntries(snapshot) {
  const byId = new Map();
  const addEntry = (entry) => {
    if (!entry?.id || byId.has(entry.id)) {
      return;
    }
    byId.set(entry.id, entry);
  };

  if (snapshot?.registryById && typeof snapshot.registryById === 'object') {
    for (const entry of Object.values(snapshot.registryById)) {
      addEntry(entry);
    }
  }

  for (const bucket of Object.values(snapshot?.registry ?? {})) {
    if (Array.isArray(bucket)) {
      bucket.forEach(addEntry);
    }
  }

  return [...byId.values()];
}

function buildRegistryAliasMap(entries) {
  const byId = new Map();
  for (const entry of entries) {
    byId.set(entry.id, entry.id);
    for (const alias of entry.aliases ?? []) {
      if (alias && !byId.has(alias)) {
        byId.set(alias, entry.id);
      }
    }
  }
  return byId;
}

function collectActualObjectIds(snapshot, aliasMap) {
  const ids = new Set();
  const add = (value) => {
    const resolved = resolveInspectableId(value, aliasMap);
    if (resolved) {
      ids.add(resolved);
    }
  };

  for (const id of snapshot?.operatorZoneValidation?.actualKeyObjectIds ?? []) {
    add(id);
  }
  for (const id of snapshot?.centerStack ?? []) {
    add(id);
  }
  for (const id of snapshot?.clickStack ?? []) {
    add(id);
  }
  for (const entry of snapshot?.inspector ?? []) {
    add(entry?.id);
  }
  for (const entry of snapshot?.resolvedTargets?.inspectorEntries ?? []) {
    add(entry?.registryEntry?.id ?? entry?.id);
  }
  for (const sample of snapshot?.operatorHitSamples ?? []) {
    add(sample?.clickTarget);
    for (const id of sample?.clickStack ?? []) {
      add(id);
    }
  }
  add(snapshot?.resolvedTargets?.centerTargetEntry?.id);
  add(snapshot?.resolvedTargets?.clickTargetEntry?.id);

  return ids;
}

function collectSampleHitIds(snapshot, aliasMap) {
  const ids = new Set();
  const add = (value) => {
    const resolved = resolveInspectableId(value, aliasMap);
    if (resolved) {
      ids.add(resolved);
    }
  };

  for (const sample of snapshot?.operatorHitSamples ?? []) {
    add(sample?.clickTarget);
    for (const id of sample?.clickStack ?? []) {
      add(id);
    }
  }

  return ids;
}

function collectTargetSamples(snapshot, aliasMap) {
  const samples = [];
  const resolve = (value) => resolveInspectableId(value, aliasMap);

  for (const sample of snapshot?.operatorHitSamples ?? []) {
    if (sample?.sampleType !== 'target') {
      continue;
    }
    const targetId = resolve(sample.targetObjectId);
    if (!targetId) {
      continue;
    }
    const hitIds = new Set();
    const clickTargetId = resolve(sample.clickTarget);
    if (clickTargetId) {
      hitIds.add(clickTargetId);
    }
    for (const id of sample.clickStack ?? []) {
      const hitId = resolve(id);
      if (hitId) {
        hitIds.add(hitId);
      }
    }
    samples.push({
      hitIds,
      targetId,
    });
  }

  return samples;
}

function zoneView(snapshot) {
  const startView = snapshot?.operatorZone?.startView;
  const position = tuple3(startView?.position);
  const lookAt = tuple3(startView?.lookAt);
  if (!position || !lookAt) {
    return null;
  }
  const direction = normalize(vectorBetween(position, lookAt));
  if (!direction) {
    return null;
  }
  return {
    direction,
    lookAt,
    position,
    zoneId: snapshot.operatorZoneId ?? snapshot.operatorZone?.id ?? 'unknown-zone',
  };
}

function isGeometricallyCovered(entry, view) {
  const position = tuple3(entry.position);
  if (!position || !view) {
    return false;
  }

  const toEntry = vectorBetween(view.position, position);
  const distance = vectorLength(toEntry);
  if (distance <= 0 || distance > maxDistanceForLayer(entry.layer)) {
    return false;
  }

  const normalized = normalize(toEntry);
  if (!normalized) {
    return false;
  }

  const angle = Math.acos(Math.max(-1, Math.min(1, dot(view.direction, normalized))));
  const radiusBoost = Math.atan2(entryRadius(entry), Math.max(1, distance));
  return angle <= COVERAGE_ANGLE_RADIANS + radiusBoost;
}

function hasObjectMetadata(entry) {
  const missing = [];
  if (!entry.id) missing.push('id');
  if (!entry.layer) missing.push('layer');
  if (!tuple3(entry.position)) missing.push('position');
  if (!positiveTuple3(entry.size)) missing.push('size');
  if (!entry.sourceFile) missing.push('sourceFile');
  if (!entry.sourceFunction) missing.push('sourceFunction');
  if (!entry.safeEditSeam) missing.push('safeEditSeam');
  return missing;
}

function pushIssue(issues, severity, code, message, relatedIds, metrics = {}) {
  issues.push({ code, message, metrics, relatedIds, severity });
}

function summarize(issues) {
  const summary = {
    byCode: {},
    severity: { critical: 0, high: 0, medium: 0, low: 0 },
    totalIssues: issues.length,
  };
  for (const issue of issues) {
    summary.byCode[issue.code] = (summary.byCode[issue.code] ?? 0) + 1;
    summary.severity[issue.severity] = (summary.severity[issue.severity] ?? 0) + 1;
  }
  return summary;
}

function groupCounts(items, resolveKey) {
  const counts = {};
  for (const item of items) {
    const key = resolveKey(item) ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const args = parseArgs(process.argv);
const runDir = path.resolve(args.runDir);
const screensDir = path.join(runDir, 'screens');
const snapshotPaths = fs.existsSync(screensDir)
  ? fs.readdirSync(screensDir)
    .filter((fileName) => fileName.endsWith('.snapshot.json'))
    .map((fileName) => path.join(screensDir, fileName))
  : [];

if (snapshotPaths.length === 0) {
  throw new Error(`No operator snapshots found in ${screensDir}`);
}

const snapshots = snapshotPaths.map((snapshotPath) => ({ snapshot: readJson(snapshotPath), snapshotPath }));
const registryEntries = collectRegistryEntries(snapshots[0].snapshot);
const aliasMap = buildRegistryAliasMap(registryEntries);
const requiredEntries = registryEntries.filter(isRequiredEntry);
const zoneViews = snapshots
  .map(({ snapshot }) => ({
    actualIds: collectActualObjectIds(snapshot, aliasMap),
    sampleHitIds: collectSampleHitIds(snapshot, aliasMap),
    sampleCount: Array.isArray(snapshot?.operatorHitSamples) ? snapshot.operatorHitSamples.length : 0,
    targetSamples: collectTargetSamples(snapshot, aliasMap),
    view: zoneView(snapshot),
  }))
  .filter((zone) => zone.view);
const coverageByObjectId = new Map(requiredEntries.map((entry) => [entry.id, []]));
const actualCoverageByObjectId = new Map(requiredEntries.map((entry) => [entry.id, []]));
const sampleHitCoverageByObjectId = new Map(requiredEntries.map((entry) => [entry.id, []]));
const targetSampleCoverageByObjectId = new Map(requiredEntries.map((entry) => [entry.id, []]));
const targetSampleHitByObjectId = new Map(requiredEntries.map((entry) => [entry.id, []]));

for (const entry of requiredEntries) {
  const coveredBy = coverageByObjectId.get(entry.id);
  const actuallyCoveredBy = actualCoverageByObjectId.get(entry.id);
  const sampleHitBy = sampleHitCoverageByObjectId.get(entry.id);
  const targetedBy = targetSampleCoverageByObjectId.get(entry.id);
  const targetHitBy = targetSampleHitByObjectId.get(entry.id);
  for (const zone of zoneViews) {
    let targetedInZone = false;
    let targetHitInZone = false;
    for (const sample of zone.targetSamples) {
      if (sample.targetId === entry.id) {
        targetedInZone = true;
        if (sample.hitIds.has(entry.id)) {
          targetHitInZone = true;
        }
      }
    }
    if (targetedInZone) {
      targetedBy.push(zone.view.zoneId);
      // A target anchor can land on foreground geometry while the same camera's grid raycast
      // directly hits the object. Treat that as resolved target evidence instead of
      // forcing camera movement for already-visible objects.
      if (targetHitInZone || zone.sampleHitIds.has(entry.id)) {
        targetHitBy.push(zone.view.zoneId);
      }
    }
    if (zone.actualIds.has(entry.id)) {
      actuallyCoveredBy.push(zone.view.zoneId);
      coveredBy.push(zone.view.zoneId);
    }
    if (zone.sampleHitIds.has(entry.id)) {
      sampleHitBy.push(zone.view.zoneId);
    }
    if (zone.actualIds.has(entry.id)) {
      continue;
    }
    if (isGeometricallyCovered(entry, zone.view)) {
      coveredBy.push(zone.view.zoneId);
    }
  }
}

const issues = [];
for (const entry of requiredEntries) {
  const missing = hasObjectMetadata(entry);
  if (missing.length > 0) {
    pushIssue(
      issues,
      isCriticalEntry(entry) ? 'high' : 'medium',
      'object-metadata-incomplete',
      `${entry.layer} ${entry.id} is missing registry metadata needed for precise fixes: ${missing.join(', ')}.`,
      [entry.id],
      { missing },
    );
  }

  const coveredBy = coverageByObjectId.get(entry.id) ?? [];
  if (coveredBy.length === 0) {
    pushIssue(
      issues,
      isCriticalEntry(entry) ? 'high' : 'medium',
      'review-object-uncovered',
      `${entry.layer} ${entry.id} is not covered by any operator review camera.`,
      [entry.id],
      {
        position: entry.position ?? null,
        size: entry.size ?? null,
      },
    );
  }
}

const coveredRequired = requiredEntries.filter((entry) => (coverageByObjectId.get(entry.id) ?? []).length > 0);
const coveredCritical = requiredEntries.filter((entry) => isCriticalEntry(entry) && (coverageByObjectId.get(entry.id) ?? []).length > 0);
const criticalEntries = requiredEntries.filter(isCriticalEntry);
const raycastCriticalEntries = requiredEntries.filter(isRaycastCriticalEntry);
const sampleHitCritical = raycastCriticalEntries.filter((entry) => (sampleHitCoverageByObjectId.get(entry.id) ?? []).length > 0);
const actualHitCritical = raycastCriticalEntries.filter((entry) => (actualCoverageByObjectId.get(entry.id) ?? []).length > 0);
const targetSampledCritical = raycastCriticalEntries.filter((entry) => (targetSampleCoverageByObjectId.get(entry.id) ?? []).length > 0);
const targetHitCritical = raycastCriticalEntries.filter((entry) => (targetSampleHitByObjectId.get(entry.id) ?? []).length > 0);
const actualMissCritical = raycastCriticalEntries.filter((entry) => (actualCoverageByObjectId.get(entry.id) ?? []).length === 0);
const targetUnsampledCritical = raycastCriticalEntries.filter((entry) => (targetSampleCoverageByObjectId.get(entry.id) ?? []).length === 0);
const targetMissCritical = raycastCriticalEntries.filter((entry) => (targetSampleHitByObjectId.get(entry.id) ?? []).length === 0);
const targetMissScreenOrBoothCritical = targetMissCritical.filter((entry) => (
  entry.layer === 'booth'
  || entry.layer === 'city-screen-surface'
  || entry.layer === 'stadium-screen-surface'
));
const directSampleMissScreenOrBoothCritical = targetMissScreenOrBoothCritical.filter((entry) => (
  (sampleHitCoverageByObjectId.get(entry.id) ?? []).length === 0
));
const targetOnlyMissScreenOrBoothCritical = targetMissScreenOrBoothCritical.filter((entry) => (
  (sampleHitCoverageByObjectId.get(entry.id) ?? []).length > 0
));
const targetMissLandmarkCritical = targetMissCritical.filter((entry) => entry.layer === 'mega-landmark');
const coverageRatio = requiredEntries.length > 0 ? coveredRequired.length / requiredEntries.length : 1;
const criticalCoverageRatio = criticalEntries.length > 0 ? coveredCritical.length / criticalEntries.length : 1;
const criticalSampleHitRatio = raycastCriticalEntries.length > 0 ? sampleHitCritical.length / raycastCriticalEntries.length : 1;
const criticalRaycastEvidenceRatio = raycastCriticalEntries.length > 0 ? actualHitCritical.length / raycastCriticalEntries.length : 1;
const criticalTargetSampleRatio = raycastCriticalEntries.length > 0 ? targetSampledCritical.length / raycastCriticalEntries.length : 1;
const criticalTargetHitRatio = raycastCriticalEntries.length > 0 ? targetHitCritical.length / raycastCriticalEntries.length : 1;
const totalHitSamples = zoneViews.reduce((total, zone) => total + zone.sampleCount, 0);
const totalTargetSamples = zoneViews.reduce((total, zone) => total + zone.targetSamples.length, 0);

if (coverageRatio < 0.92) {
  pushIssue(
    issues,
    'high',
    'review-coverage-ratio-low',
    `Operator review cameras cover ${Math.round(coverageRatio * 100)}% of required city objects; target is at least 92%.`,
    [],
    {
      covered: coveredRequired.length,
      required: requiredEntries.length,
      targetRatio: 0.92,
    },
  );
}

if (criticalCoverageRatio < 1) {
  pushIssue(
    issues,
    'high',
    'review-critical-coverage-incomplete',
    `Operator review cameras cover ${Math.round(criticalCoverageRatio * 100)}% of critical objects; every screen, screen host, booth, and landmark needs coverage.`,
    [],
    {
      covered: coveredCritical.length,
      required: criticalEntries.length,
      targetRatio: 1,
    },
  );
}

if (actualMissCritical.length > 0) {
  pushIssue(
    issues,
    'high',
    'review-critical-object-raycast-missing',
    `${actualMissCritical.length} visible critical objects have no resolved raycast evidence from any review zone.`,
    actualMissCritical.map((entry) => entry.id),
    {
      missing: actualMissCritical.length,
      required: raycastCriticalEntries.length,
    },
  );
}

if (targetUnsampledCritical.length > 0) {
  pushIssue(
    issues,
    'high',
    'review-critical-object-target-unsampled',
    `${targetUnsampledCritical.length} visible critical objects were never selected for targeted review sampling.`,
    targetUnsampledCritical.map((entry) => entry.id),
    {
      missing: targetUnsampledCritical.length,
      required: raycastCriticalEntries.length,
    },
  );
}

if (directSampleMissScreenOrBoothCritical.length > 0) {
  pushIssue(
    issues,
    'high',
    'review-screen-booth-direct-hit-missing',
    `${directSampleMissScreenOrBoothCritical.length} screen/booth critical objects have no direct hit sample; camera framing, occlusion, or placement needs review.`,
    directSampleMissScreenOrBoothCritical.map((entry) => entry.id),
    {
      missing: directSampleMissScreenOrBoothCritical.length,
      required: raycastCriticalEntries.length,
    },
  );
}

if (targetOnlyMissScreenOrBoothCritical.length > 0) {
  pushIssue(
    issues,
    'medium',
    'review-screen-booth-target-hit-missing',
    `${targetOnlyMissScreenOrBoothCritical.length} screen/booth critical objects have direct sample hits, but their dedicated target samples missed; tighten projection or camera framing.`,
    targetOnlyMissScreenOrBoothCritical.map((entry) => entry.id),
    {
      missing: targetOnlyMissScreenOrBoothCritical.length,
      required: raycastCriticalEntries.length,
    },
  );
}

if (targetMissLandmarkCritical.length > 0) {
  pushIssue(
    issues,
    'medium',
    'review-landmark-target-hit-missing',
    `${targetMissLandmarkCritical.length} landmark critical objects were target-sampled but not directly hit; object centers/corners may be occluded by stronger foreground geometry.`,
    targetMissLandmarkCritical.map((entry) => entry.id),
    {
      missing: targetMissLandmarkCritical.length,
      required: raycastCriticalEntries.length,
    },
  );
}

if (criticalRaycastEvidenceRatio < 0.9) {
  pushIssue(
    issues,
    'high',
    'review-critical-raycast-evidence-low',
    `Operator raycast evidence only directly hit ${Math.round(criticalRaycastEvidenceRatio * 100)}% of visible critical objects; this is too low to trust occlusion visibility.`,
    [],
    {
      hit: actualHitCritical.length,
      required: raycastCriticalEntries.length,
      targetRatio: 0.9,
      totalHitSamples,
    },
  );
} else if (totalTargetSamples > 0 && criticalTargetHitRatio < 0.75) {
  pushIssue(
    issues,
    'high',
    'review-critical-target-hit-thin',
    `Targeted object sampling directly hit ${Math.round(criticalTargetHitRatio * 100)}% of visible critical objects; increase targeted samples or add camera zones for occlusion confidence.`,
    [],
    {
      hit: targetHitCritical.length,
      required: raycastCriticalEntries.length,
      sampled: targetSampledCritical.length,
      targetRatio: 0.75,
      totalTargetSamples,
    },
  );
} else if (criticalTargetHitRatio < 0.9) {
  pushIssue(
    issues,
    'medium',
    'review-critical-target-hit-not-tight',
    `Targeted object sampling directly hit ${Math.round(criticalTargetHitRatio * 100)}% of visible critical objects; this is usable but not yet tight enough for final camera/placement confidence.`,
    [],
    {
      hit: targetHitCritical.length,
      required: raycastCriticalEntries.length,
      sampled: targetSampledCritical.length,
      targetRatio: 0.9,
      totalTargetSamples,
    },
  );
} else if (criticalSampleHitRatio < 0.85) {
  pushIssue(
    issues,
    'medium',
    'review-critical-raycast-sample-thin',
    `Operator hit sampling raycast-hit ${Math.round(criticalSampleHitRatio * 100)}% of visible critical objects; coverage exists, but denser or targeted sampling is recommended.`,
    [],
    {
      hit: sampleHitCritical.length,
      required: raycastCriticalEntries.length,
      targetRatio: 0.85,
      totalHitSamples,
    },
  );
}

const uncovered = requiredEntries.filter((entry) => (coverageByObjectId.get(entry.id) ?? []).length === 0);
const report = {
  coverage: {
    byLayer: groupCounts(coveredRequired, (entry) => entry.layer),
    criticalCoverageRatio,
    criticalCovered: coveredCritical.length,
    criticalRequired: criticalEntries.length,
    criticalSampleHitRatio,
    criticalSampleHit: sampleHitCritical.length,
    criticalRaycastEvidenceRatio,
    criticalRaycastEvidence: actualHitCritical.length,
    criticalTargetSampleRatio,
    criticalTargetSampled: targetSampledCritical.length,
    criticalTargetHitRatio,
    criticalTargetHit: targetHitCritical.length,
    criticalTargetMiss: targetMissCritical.length,
    criticalTargetMissByLayer: groupCounts(targetMissCritical, (entry) => entry.layer),
    directSampleMissScreenOrBooth: directSampleMissScreenOrBoothCritical.length,
    raycastCriticalRequired: raycastCriticalEntries.length,
    coverageRatio,
    covered: coveredRequired.length,
    required: requiredEntries.length,
    sampleHitTotal: totalHitSamples,
    targetSampleTotal: totalTargetSamples,
    uncovered: uncovered.length,
    uncoveredByLayer: groupCounts(uncovered, (entry) => entry.layer),
    zones: zoneViews.length,
  },
  generatedAt: new Date().toISOString(),
  issues: issues.sort((left, right) => {
    const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.code.localeCompare(right.code);
  }),
  objectCoverage: requiredEntries.map((entry) => ({
    coveredBy: coverageByObjectId.get(entry.id) ?? [],
    actuallyTargetedBy: actualCoverageByObjectId.get(entry.id) ?? [],
    id: entry.id,
    layer: entry.layer,
    position: entry.position ?? null,
    safeEditSeam: entry.safeEditSeam ?? null,
    sampleHitBy: sampleHitCoverageByObjectId.get(entry.id) ?? [],
    targetSampleBy: targetSampleCoverageByObjectId.get(entry.id) ?? [],
    targetHitBy: targetSampleHitByObjectId.get(entry.id) ?? [],
    size: entry.size ?? null,
    sourceFile: entry.sourceFile ?? null,
    sourceFunction: entry.sourceFunction ?? null,
  })),
  runDir,
  summary: null,
};
report.summary = summarize(report.issues);

if (args.outPath) {
  const outPath = path.resolve(args.outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify({
  coverage: report.coverage,
  summary: report.summary,
  topIssues: report.issues.slice(0, 12),
}, null, 2));

if (args.failOn) {
  const threshold = SEVERITY_RANK[args.failOn];
  if (!threshold) {
    console.error(`Unknown --fail-on severity: ${args.failOn}`);
    process.exit(2);
  }
  if (report.issues.some((issue) => SEVERITY_RANK[issue.severity] >= threshold)) {
    process.exit(1);
  }
}
