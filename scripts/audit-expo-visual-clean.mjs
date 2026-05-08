#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DEFAULT_OUTPUT_NAME = 'visual-clean-audit.json';
const DEFAULT_MARKDOWN_NAME = 'visual-clean-audit.md';

const SEVERITY_RANK = {
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

function isCityLayer(layer) {
  return layer?.startsWith('city-') || layer === 'mega-landmark';
}

function printUsageAndExit() {
  console.error('Usage: node scripts/audit-expo-visual-clean.mjs <full-city-clean-run-dir> [--out <report.json>] [--md <report.md>]');
  process.exit(2);
}

function parseArgs(argv) {
  const args = { mdPath: null, outPath: null, runDir: null };
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
    if (!args.runDir) {
      args.runDir = value;
      continue;
    }
    printUsageAndExit();
  }

  if (!args.runDir) {
    printUsageAndExit();
  }

  args.runDir = path.resolve(args.runDir);
  args.outPath = args.outPath ? path.resolve(args.outPath) : path.join(args.runDir, DEFAULT_OUTPUT_NAME);
  args.mdPath = args.mdPath ? path.resolve(args.mdPath) : path.join(args.runDir, DEFAULT_MARKDOWN_NAME);
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
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

function normalizeZoneIdFromFile(filePath) {
  return path.basename(filePath).replace(/\.png$/i, '');
}

function brightnessOf(r, g, b) {
  return ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
}

function saturationOf(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max <= 0) {
    return 0;
  }
  return (max - min) / max;
}

function bucketKey(r, g, b) {
  return `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
}

function newRegionStats() {
  return {
    brightnessAverage: 0,
    brightnessStdDev: 0,
    bucketCount: 0,
    darkRatio: 0,
    desaturatedRatio: 0,
    dominantBucketRatio: 0,
    sampleCount: 0,
    saturationAverage: 0,
  };
}

function finalizeRegionStats(samples) {
  if (samples.count === 0) {
    return newRegionStats();
  }

  const average = samples.brightnessSum / samples.count;
  const variance = Math.max(0, (samples.brightnessSquares / samples.count) - (average * average));
  const dominantBucketCount = Math.max(0, ...Object.values(samples.buckets));

  return {
    brightnessAverage: round(average * 100, 2),
    brightnessStdDev: round(Math.sqrt(variance) * 100, 2),
    bucketCount: Object.keys(samples.buckets).length,
    darkRatio: round(samples.darkCount / samples.count, 3),
    desaturatedRatio: round(samples.desaturatedCount / samples.count, 3),
    dominantBucketRatio: round(dominantBucketCount / samples.count, 3),
    sampleCount: samples.count,
    saturationAverage: round((samples.saturationSum / samples.count) * 100, 2),
  };
}

function addSample(samples, r, g, b) {
  const brightness = brightnessOf(r, g, b);
  const saturation = saturationOf(r, g, b);
  samples.brightnessSum += brightness;
  samples.brightnessSquares += brightness * brightness;
  samples.saturationSum += saturation;
  samples.count += 1;
  if (brightness < 0.24) {
    samples.darkCount += 1;
  }
  if (saturation < 0.14) {
    samples.desaturatedCount += 1;
  }
  const key = bucketKey(r, g, b);
  samples.buckets[key] = (samples.buckets[key] ?? 0) + 1;
}

function createSampleBucket() {
  return {
    brightnessSquares: 0,
    brightnessSum: 0,
    buckets: {},
    count: 0,
    darkCount: 0,
    desaturatedCount: 0,
    saturationSum: 0,
  };
}

async function analyzeImage(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize({ width: 160, height: 96, fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const regions = {
    bottom: createSampleBucket(),
    center: createSampleBucket(),
    full: createSampleBucket(),
    top: createSampleBucket(),
  };

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = ((y * info.width) + x) * info.channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      addSample(regions.full, r, g, b);

      if (y >= Math.floor(info.height * 0.66)) {
        addSample(regions.bottom, r, g, b);
      }
      if (y <= Math.floor(info.height * 0.34)) {
        addSample(regions.top, r, g, b);
      }
      if (
        x >= Math.floor(info.width * 0.25)
        && x <= Math.floor(info.width * 0.75)
        && y >= Math.floor(info.height * 0.25)
        && y <= Math.floor(info.height * 0.75)
      ) {
        addSample(regions.center, r, g, b);
      }
    }
  }

  return {
    height: info.height,
    regions: Object.fromEntries(Object.entries(regions).map(([key, value]) => [key, finalizeRegionStats(value)])),
    width: info.width,
  };
}

function pushFinding(findings, severity, code, message, suggestedFix, metrics = {}, sourceHints = [], requiresApproval = true) {
  findings.push({
    code,
    message,
    metrics,
    requiresApproval,
    severity,
    sourceHints,
    suggestedFix,
  });
}

function collectNearSolidHints(snapshot) {
  const inspectorEntries = snapshot?.resolvedTargets?.inspectorEntries;
  if (!Array.isArray(inspectorEntries)) {
    return [];
  }

  return inspectorEntries
    .filter((entry) => entry?.registryEntry && SOLID_LAYERS.has(entry.registryEntry.layer) && Number(entry.distance) <= 220)
    .slice(0, 5)
    .map((entry) => ({
      distance: Math.round(Number(entry.distance)),
      id: entry.registryEntry.id,
      layer: entry.registryEntry.layer,
      sourceFile: entry.registryEntry.sourceFile ?? null,
    }));
}

function uniqueSourceHints(...hintGroups) {
  return [...new Set(hintGroups.flat().filter(Boolean))];
}

function resolveRegistryEntries(snapshot) {
  const byId = new Map();
  if (snapshot?.registryById && typeof snapshot.registryById === 'object') {
    for (const entry of Object.values(snapshot.registryById)) {
      if (entry?.id && !byId.has(entry.id)) {
        byId.set(entry.id, entry);
      }
    }
  }
  return [...byId.values()];
}

function countLayersNearPlayer(snapshot, maxDistance) {
  const playerPos = tuple3(snapshot?.playerPos);
  if (!playerPos) {
    return {};
  }

  const counts = {};
  for (const entry of resolveRegistryEntries(snapshot)) {
    const position = tuple3(entry.position);
    if (!position) {
      continue;
    }
    const distance = Math.hypot(position[0] - playerPos[0], position[2] - playerPos[2]);
    if (distance > maxDistance) {
      continue;
    }
    counts[entry.layer] = (counts[entry.layer] ?? 0) + 1;
  }
  return counts;
}

function auditZone({ imageStats, manifestEntry, snapshot, zoneId }) {
  const findings = [];
  const full = imageStats.regions.full;
  const center = imageStats.regions.center;
  const bottom = imageStats.regions.bottom;
  const top = imageStats.regions.top;
  const zone = snapshot?.operatorZone;
  const nearSolidHints = collectNearSolidHints(snapshot);
  const nearestSolid = nearSolidHints[0] ?? null;
  const nearbyLayerCounts = countLayersNearPlayer(snapshot, 420);
  const expectedLayers = new Set(zone?.expectedVisibleLayers ?? []);
  const actualLayers = new Set(snapshot?.operatorZoneValidation?.actualVisibleLayers ?? []);

  if (bottom.dominantBucketRatio >= 0.82 && bottom.brightnessStdDev <= 6.5) {
    pushFinding(
      findings,
      bottom.dominantBucketRatio >= 0.94 && bottom.brightnessStdDev <= 3.5 ? 'high' : 'medium',
      'ground-dominance',
      'Bottom viewport is dominated by a flat low-variation ground or platform band.',
      'Inspect ground/camera composition in this zone; reduce foreground ground dominance before changing object placement.',
      { bottom },
      ['src/modules/expo/runtime/world/scene', 'src/modules/expo/runtime/planning/world-plan'],
    );
  }

  if (center.dominantBucketRatio >= 0.66 && center.brightnessStdDev <= 10) {
    pushFinding(
      findings,
      center.dominantBucketRatio >= 0.78 && center.brightnessStdDev <= 6 ? 'high' : 'medium',
      'center-flat-obstruction',
      'Center viewport is dominated by a single flat low-variation mass, likely blocking the scene read.',
      'Use the source hints to inspect the closest solid objects; move camera or reduce the obstructing block before deleting anything.',
      { center, nearSolidHints },
      nearSolidHints.map((entry) => entry.sourceFile).filter(Boolean),
    );
  }

  if (top.dominantBucketRatio >= 0.78 && full.bucketCount <= 34 && full.brightnessStdDev <= 16) {
    pushFinding(
      findings,
      'low',
      'low-visual-density',
      'Screenshot has low visual density with a dominant sky/backdrop band.',
      'Move the review camera closer to intended structures or add visual anchors in this zone if the composition is supposed to be dense.',
      { full, top },
    );
  }

  if (full.brightnessAverage <= 34 && full.brightnessStdDev <= 17) {
    pushFinding(
      findings,
      'medium',
      'flat-dark-composition',
      'Screenshot is globally dark and low-contrast.',
      'Inspect dark backdrop/stadium massing and lighting/material balance; add depth before screen/booth rebuild.',
      { full },
      ['src/modules/expo/runtime/world/ExpoRearCampus.tsx'],
    );
  }

  const expectedLayerVisible = [...expectedLayers].some((layer) => actualLayers.has(layer));
  if (zone && expectedLayers.size > 0 && !expectedLayerVisible) {
    pushFinding(
      findings,
      'high',
      'expected-layer-not-visible',
      'Operator snapshot did not see any expected layer for this review zone.',
      'Fix this camera or object visibility before trusting visual cleanup decisions in this zone.',
      {
        actualLayers: [...actualLayers],
        expectedLayers: [...expectedLayers],
      },
      [],
      false,
    );
  }

  if (
    nearestSolid
    && Number(nearestSolid.distance) <= 90
    && expectedLayers.has('city-screen-surface')
    && full.brightnessStdDev >= 24
  ) {
    pushFinding(
      findings,
      'medium',
      'near-foreground-solid-camera-risk',
      'Review camera is very close to a solid object while checking a city screen, so the view may be foreground-blocked.',
      'Move the review camera/look-at before deleting or moving city structures; inspect the closest solid source first.',
      {
        full,
        nearestSolid,
      },
      uniqueSourceHints(
        [nearestSolid.sourceFile],
        ['src/modules/expo/runtime/operator/model/reviewOperatorSession.ts'],
      ),
    );
  }

  if (
    (zoneId.includes('stadium') || zoneId.includes('rear-campus'))
    && expectedLayers.has('stadium-screen-surface')
    && full.bucketCount <= 36
    && full.brightnessStdDev <= 19
    && center.bucketCount <= 22
    && (center.dominantBucketRatio >= 0.32 || center.brightnessStdDev <= 16.5)
  ) {
    pushFinding(
      findings,
      'medium',
      'stadium-screen-low-composition-read',
      'Stadium screen review sees a screen layer, but the frame has low composition density and weak host context.',
      'Retune this review camera or host massing so the stadium screen reads attached to its structure with surrounding depth.',
      {
        center,
        full,
        nearSolidHints,
      },
      uniqueSourceHints(
        nearSolidHints.map((entry) => entry.sourceFile),
        [
          'src/modules/expo/runtime/operator/model/reviewOperatorSession.ts',
          'src/modules/expo/runtime/world/ExpoRearCampus.tsx',
        ],
      ),
    );
  }

  if (
    zoneId.includes('ground-seam')
    && bottom.dominantBucketRatio >= 0.58
    && center.dominantBucketRatio >= 0.42
    && center.brightnessStdDev <= 10.5
  ) {
    pushFinding(
      findings,
      'medium',
      'ground-seam-flat-band',
      'Ground seam review is dominated by flat same-color bands, so layer separation may still be visually exposed.',
      'Inspect the city/stadium ground transition and fix material/layer continuity before expanding screen or booth layout.',
      {
        bottom,
        center,
        full,
      },
      [
        'src/modules/expo/runtime/planning/legacy/worldCityGeometry.ts',
        'src/shared/expo/lib/boulevardLayout.ts',
      ],
    );
  }

  const cityNear = Object.entries(nearbyLayerCounts)
    .filter(([layer]) => layer.startsWith('city-') || layer === 'mega-landmark')
    .reduce((sum, [, count]) => sum + count, 0);
  const stadiumNear = Object.entries(nearbyLayerCounts)
    .filter(([layer]) => layer.startsWith('stadium-'))
    .reduce((sum, [, count]) => sum + count, 0);
  const actualCityLayerVisible = [...actualLayers].some((layer) => isCityLayer(layer));

  if (zoneId.includes('stadium') || zoneId.includes('rear-campus')) {
    if (
      cityNear >= 12
      && stadiumNear >= 12
      && (actualCityLayerVisible || full.bucketCount <= 52 || center.bucketCount <= 28)
    ) {
      pushFinding(
        findings,
        'medium',
        'city-stadium-near-field-mix',
        'Stadium review zone has a heavy near-field mix of city and stadium registry layers.',
        'Audit this zone for the "second city center" problem; push city leftovers away from stadium composition only after source ownership is clear.',
        { cityNear, nearbyLayerCounts, stadiumNear },
      );
    }
  }

  findings.sort((left, right) => (SEVERITY_RANK[right.severity] ?? 0) - (SEVERITY_RANK[left.severity] ?? 0));

  return {
    findings,
    image: {
      path: manifestEntry?.file ?? null,
      stats: imageStats,
    },
    label: zone?.label ?? zoneId,
    nearbyLayerCounts,
    playerPos: manifestEntry?.playerPos ?? snapshot?.playerPos ?? null,
    watchItems: zone?.watchItems ?? [],
    zoneId,
  };
}

function summarize(zones) {
  const severity = { high: 0, medium: 0, low: 0 };
  const byCode = {};
  let totalFindings = 0;
  for (const zone of zones) {
    for (const finding of zone.findings) {
      totalFindings += 1;
      severity[finding.severity] += 1;
      byCode[finding.code] = (byCode[finding.code] ?? 0) + 1;
    }
  }

  const topZones = zones
    .filter((zone) => zone.findings.length > 0)
    .sort((left, right) => {
      const leftRank = Math.max(0, ...left.findings.map((finding) => SEVERITY_RANK[finding.severity] ?? 0));
      const rightRank = Math.max(0, ...right.findings.map((finding) => SEVERITY_RANK[finding.severity] ?? 0));
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }
      return right.findings.length - left.findings.length;
    })
    .slice(0, 12)
    .map((zone) => ({
      findingCount: zone.findings.length,
      topCodes: zone.findings.slice(0, 3).map((finding) => finding.code),
      zoneId: zone.zoneId,
    }));

  return {
    byCode,
    severity,
    topZones,
    totalFindings,
    zoneCount: zones.length,
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Visual City Clean Audit',
    '',
    `Run dir: \`${report.runDir}\``,
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- zones: ${report.summary.zoneCount}`,
    `- findings: ${report.summary.totalFindings}`,
    `- severity: high=${report.summary.severity.high}, medium=${report.summary.severity.medium}, low=${report.summary.severity.low}`,
    '',
    '## Findings',
    '',
  ];

  const zonesWithFindings = report.zones
    .filter((zone) => zone.findings.length > 0)
    .sort((left, right) => {
      const leftRank = Math.max(0, ...left.findings.map((finding) => SEVERITY_RANK[finding.severity] ?? 0));
      const rightRank = Math.max(0, ...right.findings.map((finding) => SEVERITY_RANK[finding.severity] ?? 0));
      if (leftRank !== rightRank) {
        return rightRank - leftRank;
      }
      return right.findings.length - left.findings.length;
    });
  if (zonesWithFindings.length === 0) {
    lines.push('No visual clean findings from current heuristics.');
    return `${lines.join('\n')}\n`;
  }

  for (const zone of zonesWithFindings) {
    lines.push(`### ${zone.zoneId} - ${zone.label}`);
    lines.push('');
    for (const finding of zone.findings) {
      lines.push(`- ${finding.severity.toUpperCase()} ${finding.code}: ${finding.message}`);
      lines.push(`  Suggested fix: ${finding.suggestedFix}`);
      lines.push(`  Needs approval: ${finding.requiresApproval ? 'yes' : 'no'}`);
      if (finding.sourceHints.length > 0) {
        lines.push(`  Source hints: ${finding.sourceHints.join(', ')}`);
      }
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

async function main() {
  const args = parseArgs(process.argv);
  const manifestPath = path.join(args.runDir, 'screens', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing capture manifest: ${manifestPath}`);
  }

  const manifestRaw = readJson(manifestPath);
  const manifest = Array.isArray(manifestRaw) ? manifestRaw : [manifestRaw];
  const zones = [];
  for (const entry of manifest) {
    const imagePath = entry.file;
    if (!imagePath || !fs.existsSync(imagePath)) {
      continue;
    }
    const zoneId = entry.zoneId ?? normalizeZoneIdFromFile(imagePath);
    const snapshotPath = path.join(args.runDir, 'screens', `${zoneId}.snapshot.json`);
    const snapshot = fs.existsSync(snapshotPath) ? readJson(snapshotPath) : null;
    const imageStats = await analyzeImage(imagePath);
    zones.push(auditZone({
      imageStats,
      manifestEntry: entry,
      snapshot,
      zoneId,
    }));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runDir: args.runDir,
    summary: summarize(zones),
    zones,
  };

  fs.mkdirSync(path.dirname(args.outPath), { recursive: true });
  fs.writeFileSync(args.outPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(args.mdPath, renderMarkdown(report));

  console.log(JSON.stringify({
    markdown: args.mdPath,
    report: args.outPath,
    summary: report.summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exit(1);
});
