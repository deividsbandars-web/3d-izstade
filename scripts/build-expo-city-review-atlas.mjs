#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

const SCREEN_OR_BOOTH_LAYERS = new Set([
  'booth',
  'city-screen-surface',
  'stadium-screen-surface',
]);

const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
const COVERAGE_ANGLE_RADIANS = 0.82;
const DEFAULT_MAX_DISTANCE = 3600;
const GROUND_MAX_DISTANCE = 6200;
const STADIUM_MAX_DISTANCE = 5200;
const SPATIAL_CELL_SIZE = 480;

const MEGA_LANDMARK_HIT_PREFIXES = [
  ['media-frame', 'mega-landmark-media-frame-wall'],
  ['media-pod', 'mega-landmark-media-signal-pods'],
  ['media-signal-pods', 'mega-landmark-media-signal-pods'],
  ['right-media-halo', 'mega-landmark-right-media-halo'],
  ['right-skybridge', 'mega-landmark-right-skybridge-beacon'],
  ['right-citadel', 'mega-landmark-right-skyfold-citadel'],
  ['right-skyfold-citadel', 'mega-landmark-right-skyfold-citadel'],
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

function printUsageAndExit() {
  console.error('Usage: node scripts/build-expo-city-review-atlas.mjs <runDir> [--out <atlas.json>] [--md <atlas.md>] [--fail-on high|medium|low]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = {
    failOn: null,
    mdPath: null,
    outPath: null,
    runDir: null,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--out') {
      args.outPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (value === '--md') {
      args.mdPath = argv[index + 1] ?? null;
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
  return REQUIRED_LAYERS.has(entry.layer) && entry.id !== 'global-ground-base';
}

function isCriticalEntry(entry) {
  return CRITICAL_LAYERS.has(entry.layer)
    || (entry.layer === 'city-mass' && entry.id.startsWith('screen-') && entry.id.endsWith('-host'));
}

function isTargetableCriticalEntry(entry) {
  return CRITICAL_LAYERS.has(entry.layer);
}

function isScreenOrBoothEntry(entry) {
  return SCREEN_OR_BOOTH_LAYERS.has(entry.layer);
}

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

function addResolvedId(target, value, aliasMap) {
  const resolved = resolveInspectableId(value, aliasMap);
  if (resolved) {
    target.add(resolved);
  }
}

function collectActualObjectIds(snapshot, aliasMap) {
  const ids = new Set();

  for (const id of snapshot?.operatorZoneValidation?.actualKeyObjectIds ?? []) {
    addResolvedId(ids, id, aliasMap);
  }
  for (const id of snapshot?.centerStack ?? []) {
    addResolvedId(ids, id, aliasMap);
  }
  for (const id of snapshot?.clickStack ?? []) {
    addResolvedId(ids, id, aliasMap);
  }
  for (const entry of snapshot?.inspector ?? []) {
    addResolvedId(ids, entry?.id, aliasMap);
  }
  for (const entry of snapshot?.resolvedTargets?.inspectorEntries ?? []) {
    addResolvedId(ids, entry?.registryEntry?.id ?? entry?.id, aliasMap);
  }
  for (const sample of snapshot?.operatorHitSamples ?? []) {
    addResolvedId(ids, sample?.clickTarget, aliasMap);
    for (const id of sample?.clickStack ?? []) {
      addResolvedId(ids, id, aliasMap);
    }
  }
  addResolvedId(ids, snapshot?.resolvedTargets?.centerTargetEntry?.id, aliasMap);
  addResolvedId(ids, snapshot?.resolvedTargets?.clickTargetEntry?.id, aliasMap);

  return ids;
}

function collectSampleHitIds(snapshot, aliasMap) {
  const ids = new Set();
  for (const sample of snapshot?.operatorHitSamples ?? []) {
    addResolvedId(ids, sample?.clickTarget, aliasMap);
    for (const id of sample?.clickStack ?? []) {
      addResolvedId(ids, id, aliasMap);
    }
  }
  return ids;
}

function collectTargetSamples(snapshot, aliasMap) {
  const samples = [];

  for (const sample of snapshot?.operatorHitSamples ?? []) {
    if (sample?.sampleType !== 'target') {
      continue;
    }

    const targetId = resolveInspectableId(sample.targetObjectId, aliasMap);
    if (!targetId) {
      continue;
    }

    const hitIds = new Set();
    addResolvedId(hitIds, sample.clickTarget, aliasMap);
    for (const id of sample.clickStack ?? []) {
      addResolvedId(hitIds, id, aliasMap);
    }

    samples.push({
      anchor: sample.targetAnchor ?? null,
      hitIds,
      hitMatchedTarget: hitIds.has(targetId),
      targetId,
      x: Number.isFinite(sample.x) ? Math.round(sample.x) : null,
      y: Number.isFinite(sample.y) ? Math.round(sample.y) : null,
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

function compactObject(entry) {
  return {
    id: entry.id,
    layer: entry.layer ?? null,
    position: entry.position ?? null,
    safeEditSeam: entry.safeEditSeam ?? null,
    size: entry.size ?? null,
    sourceFile: entry.sourceFile ?? null,
    sourceFunction: entry.sourceFunction ?? null,
  };
}

function sortedSet(set) {
  return [...set].sort((left, right) => left.localeCompare(right));
}

function groupCounts(items, resolveKey) {
  const counts = {};
  for (const item of items) {
    const key = resolveKey(item) ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
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

function pushIssue(issues, severity, code, message, relatedIds = [], metrics = {}) {
  issues.push({ code, message, metrics, relatedIds, severity });
}

function spatialCellKey(entry) {
  const position = tuple3(entry.position);
  if (!position) {
    return 'unknown';
  }
  const x = Math.floor(position[0] / SPATIAL_CELL_SIZE);
  const z = Math.floor(position[2] / SPATIAL_CELL_SIZE);
  return `${x}:${z}`;
}

function makeSpatialCells(requiredEntries, evidenceByObjectId) {
  const cellsByKey = new Map();

  for (const entry of requiredEntries) {
    const key = spatialCellKey(entry);
    if (!cellsByKey.has(key)) {
      cellsByKey.set(key, {
        criticalCount: 0,
        directEvidenceCount: 0,
        ids: [],
        key,
        layerCounts: {},
        requiredCount: 0,
        screenOrBoothCount: 0,
      });
    }

    const cell = cellsByKey.get(key);
    const evidence = evidenceByObjectId.get(entry.id);
    cell.requiredCount += 1;
    cell.ids.push(entry.id);
    cell.layerCounts[entry.layer] = (cell.layerCounts[entry.layer] ?? 0) + 1;
    if (isCriticalEntry(entry)) {
      cell.criticalCount += 1;
    }
    if (isScreenOrBoothEntry(entry)) {
      cell.screenOrBoothCount += 1;
    }
    if (evidence && (
      evidence.actualBy.size > 0
      || evidence.sampleHitBy.size > 0
      || evidence.targetHitBy.size > 0
    )) {
      cell.directEvidenceCount += 1;
    }
  }

  return [...cellsByKey.values()]
    .map((cell) => ({
      ...cell,
      ids: cell.ids.sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
}

function bestEvidence(evidence) {
  if (evidence.targetHitBy.size > 0) {
    return 'target-hit';
  }
  if (evidence.sampleHitBy.size > 0) {
    return 'sample-hit';
  }
  if (evidence.actualBy.size > 0) {
    return 'raycast-visible';
  }
  if (evidence.geometricBy.size > 0) {
    return 'geometric-camera-cone';
  }
  return 'none';
}

function buildMarkdown(report) {
  const lines = [
    '# Expo City Review Atlas',
    '',
    `runDir: ${report.runDir}`,
    `zones: ${report.summary.zones}`,
    `requiredObjects: ${report.summary.requiredObjects}`,
    `coveredObjects: ${report.summary.coveredObjects}`,
    `criticalObjects: ${report.summary.criticalObjects}`,
    `criticalDirectEvidence: ${report.summary.criticalDirectEvidence}`,
    `targetableCriticalObjects: ${report.summary.targetableCriticalObjects}`,
    `targetableCriticalTargetHits: ${report.summary.targetableCriticalTargetHits}`,
    `issues: critical=${report.summary.issues.severity.critical}, high=${report.summary.issues.severity.high}, medium=${report.summary.issues.severity.medium}, low=${report.summary.issues.severity.low}`,
    '',
    '## Trust Gates',
    '',
    `- Required object coverage: ${report.summary.coveredObjects}/${report.summary.requiredObjects}`,
    `- Critical direct evidence: ${report.summary.criticalDirectEvidence}/${report.summary.criticalObjects}`,
    `- Screen/booth direct evidence: ${report.summary.screenOrBoothDirectEvidence}/${report.summary.screenOrBoothObjects}`,
    `- Targetable critical target hit ratio: ${Math.round(report.summary.targetableCriticalTargetHitRatio * 100)}%`,
    '',
    '## Top Issues',
    '',
  ];

  if (report.issues.length === 0) {
    lines.push('- none');
  } else {
    for (const issue of report.issues.slice(0, 24)) {
      lines.push(`- ${issue.severity} ${issue.code}: ${issue.message}`);
      if (issue.relatedIds?.length) {
        lines.push(`  ids: ${issue.relatedIds.slice(0, 16).join(', ')}`);
      }
    }
  }

  lines.push('', '## Zones Needing Attention', '');
  const attentionObjectIds = new Set(report.issues
    .filter((issue) => [
      'atlas-critical-direct-evidence-missing',
      'atlas-object-uncovered',
      'atlas-screen-booth-target-hit-missing',
    ].includes(issue.code))
    .flatMap((issue) => issue.relatedIds ?? []));
  const zonesWithMisses = report.zones
    .map((zone) => ({
      ...zone,
      attentionTargetMissIds: zone.targetMissScreenOrBoothObjects
        .filter((entry) => attentionObjectIds.has(entry.id))
        .map((entry) => entry.id),
    }))
    .filter((zone) => zone.attentionTargetMissIds.length > 0 || zone.directVisibleRequiredCount === 0)
    .slice(0, 30);

  if (zonesWithMisses.length === 0) {
    lines.push('- none');
  } else {
    for (const zone of zonesWithMisses) {
      lines.push(`- ${zone.id}: directVisible=${zone.directVisibleRequiredCount}, attentionMisses=${zone.attentionTargetMissIds.join(', ') || 'none'}, screenshot=${zone.screenshotPath ?? 'missing'}`);
    }
  }

  lines.push('', '## Spatial Cells', '');
  for (const cell of report.spatialCells.filter((item) => item.requiredCount > 0).slice(0, 80)) {
    lines.push(`- ${cell.key}: required=${cell.requiredCount}, critical=${cell.criticalCount}, directEvidence=${cell.directEvidenceCount}`);
  }

  return `${lines.join('\n')}\n`;
}

const args = parseArgs(process.argv);
const runDir = path.resolve(args.runDir);
const screensDir = path.join(runDir, 'screens');
const snapshotPaths = fs.existsSync(screensDir)
  ? fs.readdirSync(screensDir)
    .filter((fileName) => fileName.endsWith('.snapshot.json'))
    .map((fileName) => path.join(screensDir, fileName))
    .sort((left, right) => left.localeCompare(right))
  : [];

if (snapshotPaths.length === 0) {
  throw new Error(`No operator snapshots found in ${screensDir}`);
}

const snapshots = snapshotPaths.map((snapshotPath) => ({
  snapshot: readJson(snapshotPath),
  snapshotPath,
}));
const registryEntries = collectRegistryEntries(snapshots[0].snapshot);
const entriesById = new Map(registryEntries.map((entry) => [entry.id, entry]));
const aliasMap = buildRegistryAliasMap(registryEntries);
const requiredEntries = registryEntries.filter(isRequiredEntry);
const criticalEntries = requiredEntries.filter(isCriticalEntry);
const targetableCriticalEntries = requiredEntries.filter(isTargetableCriticalEntry);
const screenOrBoothEntries = requiredEntries.filter(isScreenOrBoothEntry);

const evidenceByObjectId = new Map(requiredEntries.map((entry) => [entry.id, {
  actualBy: new Set(),
  coveredBy: new Set(),
  geometricBy: new Set(),
  sampleHitBy: new Set(),
  targetHitBy: new Set(),
  targetSampleBy: new Set(),
}]));

const zoneReports = [];

for (const { snapshot, snapshotPath } of snapshots) {
  const view = zoneView(snapshot);
  const zoneId = view?.zoneId ?? snapshot.operatorZoneId ?? snapshot.operatorZone?.id ?? path.basename(snapshotPath, '.snapshot.json');
  const actualIds = collectActualObjectIds(snapshot, aliasMap);
  const sampleHitIds = collectSampleHitIds(snapshot, aliasMap);
  const targetSamples = collectTargetSamples(snapshot, aliasMap);
  const targetSampleIds = new Set(targetSamples.map((sample) => sample.targetId));
  const targetHitIds = new Set(targetSamples.filter((sample) => sample.hitMatchedTarget).map((sample) => sample.targetId));
  // If the same camera target-sampled an object and grid raycast also hit it, the
  // object is reviewable even when the projected target anchor is foreground-occluded.
  for (const id of targetSampleIds) {
    if (sampleHitIds.has(id)) {
      targetHitIds.add(id);
    }
  }
  const directVisibleIds = new Set([...actualIds, ...sampleHitIds, ...targetHitIds]);
  const geometricIds = new Set();

  if (view) {
    for (const entry of requiredEntries) {
      if (isGeometricallyCovered(entry, view)) {
        geometricIds.add(entry.id);
      }
    }
  }

  for (const id of actualIds) {
    evidenceByObjectId.get(id)?.actualBy.add(zoneId);
    evidenceByObjectId.get(id)?.coveredBy.add(zoneId);
  }
  for (const id of sampleHitIds) {
    evidenceByObjectId.get(id)?.sampleHitBy.add(zoneId);
  }
  for (const id of targetSampleIds) {
    evidenceByObjectId.get(id)?.targetSampleBy.add(zoneId);
  }
  for (const id of targetHitIds) {
    evidenceByObjectId.get(id)?.targetHitBy.add(zoneId);
  }
  for (const id of geometricIds) {
    evidenceByObjectId.get(id)?.geometricBy.add(zoneId);
    evidenceByObjectId.get(id)?.coveredBy.add(zoneId);
  }

  const targetedObjects = sortedSet(targetSampleIds)
    .map((id) => ({
      ...compactObject(entriesById.get(id) ?? { id }),
      hit: targetHitIds.has(id),
      sampleCount: targetSamples.filter((sample) => sample.targetId === id).length,
    }));
  const directVisibleRequiredIds = sortedSet(directVisibleIds)
    .filter((id) => evidenceByObjectId.has(id));

  const targetMissObjects = targetedObjects.filter((entry) => !entry.hit);
  const targetMissScreenOrBoothObjects = targetMissObjects.filter((entry) => SCREEN_OR_BOOTH_LAYERS.has(entry.layer));

  zoneReports.push({
    directVisibleObjects: directVisibleRequiredIds.map((id) => compactObject(entriesById.get(id) ?? { id })),
    directVisibleRequiredCount: directVisibleRequiredIds.length,
    expectedKeyObjectIds: snapshot.operatorZone?.expectedKeyObjectIds ?? [],
    expectedVisibleLayers: snapshot.operatorZone?.expectedVisibleLayers ?? [],
    id: zoneId,
    intent: snapshot.operatorZone?.intent ?? null,
    label: snapshot.operatorZone?.label ?? null,
    screenshotPath: fs.existsSync(path.join(screensDir, `${zoneId}.png`))
      ? path.join(screensDir, `${zoneId}.png`)
      : null,
    startView: snapshot.operatorZone?.startView ?? null,
    targetHitCount: targetHitIds.size,
    targetMissCount: targetMissObjects.length,
    targetMissObjects,
    targetMissScreenOrBoothCount: targetMissScreenOrBoothObjects.length,
    targetMissScreenOrBoothObjects,
    targetedObjects,
    targetedObjectCount: targetedObjects.length,
    view: view
      ? {
          lookAt: view.lookAt,
          position: view.position,
        }
      : null,
  });
}

const objectCoverage = requiredEntries
  .map((entry) => {
    const evidence = evidenceByObjectId.get(entry.id);
    return {
      ...compactObject(entry),
      actualBy: sortedSet(evidence.actualBy),
      bestEvidence: bestEvidence(evidence),
      coveredBy: sortedSet(evidence.coveredBy),
      geometricBy: sortedSet(evidence.geometricBy),
      sampleHitBy: sortedSet(evidence.sampleHitBy),
      targetHitBy: sortedSet(evidence.targetHitBy),
      targetSampleBy: sortedSet(evidence.targetSampleBy),
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

const issues = [];

for (const entry of requiredEntries) {
  const evidence = evidenceByObjectId.get(entry.id);
  const missing = hasObjectMetadata(entry);
  if (missing.length > 0) {
    pushIssue(
      issues,
      isCriticalEntry(entry) ? 'high' : 'medium',
      'atlas-object-metadata-incomplete',
      `${entry.layer} ${entry.id} is missing metadata needed for precise edits: ${missing.join(', ')}.`,
      [entry.id],
      { missing },
    );
  }

  if (evidence.coveredBy.size === 0) {
    pushIssue(
      issues,
      isCriticalEntry(entry) ? 'high' : 'medium',
      'atlas-object-uncovered',
      `${entry.layer} ${entry.id} has no operator camera coverage.`,
      [entry.id],
    );
  }

  if (isCriticalEntry(entry) && evidence.actualBy.size === 0 && evidence.sampleHitBy.size === 0 && evidence.targetHitBy.size === 0) {
    pushIssue(
      issues,
      'high',
      'atlas-critical-direct-evidence-missing',
      `${entry.layer} ${entry.id} has no direct raycast/sample/target-hit evidence.`,
      [entry.id],
    );
  }
}

const criticalDirectEvidence = criticalEntries.filter((entry) => {
  const evidence = evidenceByObjectId.get(entry.id);
  return evidence.actualBy.size > 0 || evidence.sampleHitBy.size > 0 || evidence.targetHitBy.size > 0;
});
const screenOrBoothDirectEvidence = screenOrBoothEntries.filter((entry) => {
  const evidence = evidenceByObjectId.get(entry.id);
  return evidence.actualBy.size > 0 || evidence.sampleHitBy.size > 0 || evidence.targetHitBy.size > 0;
});
const targetableCriticalTargetHits = targetableCriticalEntries.filter((entry) => evidenceByObjectId.get(entry.id).targetHitBy.size > 0);
const targetableCriticalTargetMisses = targetableCriticalEntries.filter((entry) => evidenceByObjectId.get(entry.id).targetSampleBy.size > 0 && evidenceByObjectId.get(entry.id).targetHitBy.size === 0);
const screenOrBoothTargetMisses = targetableCriticalTargetMisses.filter(isScreenOrBoothEntry);
const coveredObjects = requiredEntries.filter((entry) => evidenceByObjectId.get(entry.id).coveredBy.size > 0);
const targetableCriticalTargetHitRatio = targetableCriticalEntries.length > 0 ? targetableCriticalTargetHits.length / targetableCriticalEntries.length : 1;

if (screenOrBoothTargetMisses.length > 0) {
  pushIssue(
    issues,
    'medium',
    'atlas-screen-booth-target-hit-missing',
    `${screenOrBoothTargetMisses.length} screen/booth objects are visible but missed by dedicated target samples.`,
    screenOrBoothTargetMisses.map((entry) => entry.id),
  );
}

if (targetableCriticalTargetHitRatio < 0.9) {
  pushIssue(
    issues,
    'medium',
    'atlas-critical-target-hit-not-tight',
    `Targetable critical target-hit ratio is ${Math.round(targetableCriticalTargetHitRatio * 100)}%; tighten cameras/target anchors before final placement confidence.`,
    targetableCriticalTargetMisses.map((entry) => entry.id),
    {
      hit: targetableCriticalTargetHits.length,
      required: targetableCriticalEntries.length,
      targetRatio: 0.9,
    },
  );
}

for (const zone of zoneReports) {
  if (zone.directVisibleRequiredCount === 0) {
    pushIssue(
      issues,
      'high',
      'atlas-zone-no-direct-visible-required-objects',
      `Zone ${zone.id} has no direct required-object evidence.`,
      [zone.id],
    );
  }
  if (zone.targetedObjectCount === 0) {
    pushIssue(
      issues,
      'medium',
      'atlas-zone-no-target-samples',
      `Zone ${zone.id} has no target samples.`,
      [zone.id],
    );
  }
}

const spatialCells = makeSpatialCells(requiredEntries, evidenceByObjectId);
for (const cell of spatialCells) {
  if (cell.criticalCount > 0 && cell.directEvidenceCount === 0) {
    pushIssue(
      issues,
      'medium',
      'atlas-spatial-cell-critical-direct-evidence-missing',
      `Spatial cell ${cell.key} contains ${cell.criticalCount} critical object(s), but no direct evidence.`,
      cell.ids,
      { cell: cell.key },
    );
  }
}

issues.sort((left, right) => {
  const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return left.code.localeCompare(right.code);
});

const report = {
  generatedAt: new Date().toISOString(),
  objectCoverage,
  registry: {
    byLayer: groupCounts(requiredEntries, (entry) => entry.layer),
    entries: registryEntries.length,
    required: requiredEntries.length,
  },
  runDir,
  spatialCells,
  summary: {
    coveredObjects: coveredObjects.length,
    criticalDirectEvidence: criticalDirectEvidence.length,
    criticalObjects: criticalEntries.length,
    issues: summarize(issues),
    requiredObjects: requiredEntries.length,
    screenOrBoothDirectEvidence: screenOrBoothDirectEvidence.length,
    screenOrBoothObjects: screenOrBoothEntries.length,
    targetableCriticalObjects: targetableCriticalEntries.length,
    targetableCriticalTargetHitRatio,
    targetableCriticalTargetHits: targetableCriticalTargetHits.length,
    zones: zoneReports.length,
  },
  issues,
  zones: zoneReports.sort((left, right) => left.id.localeCompare(right.id)),
};

if (args.outPath) {
  const outPath = path.resolve(args.outPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (args.mdPath) {
  const mdPath = path.resolve(args.mdPath);
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, buildMarkdown(report));
}

console.log(JSON.stringify({
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
