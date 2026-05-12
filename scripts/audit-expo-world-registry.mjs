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
const BOOTH_SOLID_CLEARANCE_LAYERS = SOLID_LAYERS;

const STRUCTURAL_GROUND_LAYERS = new Set(['city-plane', 'stadium-plane']);
const GROUND_METADATA_LAYERS = new Set(['city-plane', 'stadium-plane', 'ground-base', 'ground-detail']);
const SCREEN_LAYERS = new Set(['city-screen-surface', 'stadium-screen-surface']);
const STADIUM_SCREEN_FACE_HOST_LAYERS = new Set(['stadium-pavilion', 'stadium-structure', 'stadium-tower']);
const SOCKET_LAYER_BY_SCREEN_LAYER = {
  'city-screen-surface': 'city-screen-socket',
  'stadium-screen-surface': 'stadium-screen-socket',
};
const AXIS_ALIGNED_YAW_TOLERANCE = 0.12;
const GROUND_PLANE_SAME_LAYER_HIGH_OVERLAP_AREA = 32000;
const GROUND_PLANE_SAME_LAYER_WARNING_OVERLAP_AREA = 4096;
const SCREEN_HOST_FACE_GAP_TOLERANCE = 16;
const SCREEN_HOST_VERTICAL_FLOAT_TOLERANCE = 24;
const SCREEN_HOST_PLANAR_GAP_TOLERANCE = 18;
const SCREEN_HOST_PLANAR_EMBED_TOLERANCE = 18;
const SCREEN_HOST_MIN_LATERAL_OVERLAP_RATIO = 0.18;
const MEDIA_WALL_SCREEN_HOST_MIN_WIDTH_RATIO = 1.04;
const CITY_SOLID_OVERLAP_WARNING_AREA = 600;
const CITY_SOLID_OVERLAP_HIGH_VOLUME = 100000;
const CITY_SOLID_NEAR_GAP_WARNING_DISTANCE = 28;
const CITY_SMALL_BLOCK_MAX_HEIGHT = 8;
const CITY_SMALL_BLOCK_MAX_FOOTPRINT_AREA = 900;
const CITY_SMALL_BLOCK_MAX_ASPECT_RATIO = 3;
const CITY_NON_RENDERABLE_DECORATIVE_MASS_PATTERNS = [
  'boulevard-edge-',
  'media-wall-flank-',
];
const GROUND_DETAIL_MAX_OPACITY = 0.12;
const STRUCTURAL_GROUND_MAX_OPACITY = 0.18;
const VALID_GROUND_OWNERS = new Set(['city', 'stadium', 'transition']);
const VALID_CITY_OBJECT_PLANNING_ZONES = new Set([
  'arrival',
  'left-district',
  'center-spine',
  'right-district',
  'tower-cluster',
]);
const GENERIC_CITY_WORLD_PLAN_SOURCE = 'src/modules/expo/runtime/planning/world-plan/buildCanonicalWorldPlan.ts';
const SOURCE_TRACE_CITY_LAYERS = new Set(['city-mass', 'city-tower']);

function resolveRearCampusScreenHostId(screenId) {
  let baseId = null;
  if (screenId === 'rear-campus-bowl-feed-surface') {
    baseId = 'rear-campus-bowl-center-deck';
  } else if (screenId.endsWith('-host-surface')) {
    baseId = screenId.slice(0, -'-host-surface'.length);
  } else if (screenId.endsWith('-rear-campus-feed-surface')) {
    baseId = screenId.slice(0, -'-rear-campus-feed-surface'.length);
  } else {
    const terminalFeedMatch = screenId.match(/^rear-campus-axis-terminal-(left|right)-feed-surface$/);
    if (terminalFeedMatch) {
      baseId = `rear-campus-terminal-${terminalFeedMatch[1]}`;
    } else if (screenId.startsWith('rear-campus-') && screenId.endsWith('-feed-surface')) {
      baseId = screenId.slice(0, -'-feed-surface'.length);
    }
  }

  return baseId ? `${baseId}-screen-host-shell` : null;
}

function resolveScreenHostBinding(screenId) {
  const rearCampusHostId = resolveRearCampusScreenHostId(screenId);
  if (rearCampusHostId) {
    const maxDistanceXZ = screenId === 'rear-campus-bowl-feed-surface'
      ? 180
      : screenId.endsWith('-host-surface')
        ? 260
        : screenId.endsWith('-rear-campus-feed-surface')
          ? 220
          : 90;
    return {
      hostId: rearCampusHostId,
      maxDistanceXZ,
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

  const yaw = tuple3(entry.rotation)?.[1] ?? 0;
  const halfX = (Math.abs(Math.cos(yaw)) * size[0] * 0.5) + (Math.abs(Math.sin(yaw)) * size[2] * 0.5);
  const halfY = size[1] * 0.5;
  const halfZ = (Math.abs(Math.sin(yaw)) * size[0] * 0.5) + (Math.abs(Math.cos(yaw)) * size[2] * 0.5);
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

function isMediaWallScreen(screenId) {
  return screenId.startsWith('screen-marquee-')
    || screenId.startsWith('screen-array-')
    || screenId.startsWith('screen-spine-');
}

function isMediaWallScreenHost(entry) {
  return entry?.id?.startsWith('screen-') && entry.id.endsWith('-host');
}

function resolveRearCampusScreenHostShellBaseId(entry) {
  return entry?.planningRole === 'screen-host-shell' && typeof entry.id === 'string' && entry.id.endsWith('-screen-host-shell')
    ? entry.id.slice(0, -'-screen-host-shell'.length)
    : null;
}

function isAllowedScreenHostFacadeOverlap(left, right) {
  const leftScreenHost = isMediaWallScreenHost(left);
  const rightScreenHost = isMediaWallScreenHost(right);
  if (leftScreenHost && rightScreenHost) {
    return false;
  }

  const leftRearCampusHostBaseId = resolveRearCampusScreenHostShellBaseId(left);
  const rightRearCampusHostBaseId = resolveRearCampusScreenHostShellBaseId(right);
  if (leftRearCampusHostBaseId && rightRearCampusHostBaseId) {
    return false;
  }
  return leftRearCampusHostBaseId === right.id || rightRearCampusHostBaseId === left.id;
}

function overlapVolume(a, b) {
  const overlapX = overlap1d(a.minX, a.maxX, b.minX, b.maxX);
  const overlapY = overlap1d(a.minY, a.maxY, b.minY, b.maxY);
  const overlapZ = overlap1d(a.minZ, a.maxZ, b.minZ, b.maxZ);
  return overlapX > 0 && overlapY > 0 && overlapZ > 0 ? overlapX * overlapY * overlapZ : 0;
}

function gapXZ(a, b) {
  const gapX = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const gapZ = Math.max(0, Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ));
  return Math.hypot(gapX, gapZ);
}

function distanceXZ(a, b) {
  return Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
}

function normalizeYawDelta(left, right) {
  return Math.abs(Math.atan2(Math.sin(left - right), Math.cos(left - right)));
}

function resolveYawNormal(yaw) {
  return {
    x: Math.sin(yaw),
    z: Math.cos(yaw),
  };
}

function resolveYawTangent(yaw) {
  return {
    x: Math.cos(yaw),
    z: -Math.sin(yaw),
  };
}

function dotXZ(left, right) {
  return (left.x * right.x) + (left.z * right.z);
}

function projectedHalfExtentXZ(entry, axis) {
  const size = positiveTuple3(entry.size);
  if (!size) {
    return null;
  }

  const yaw = tuple3(entry.rotation)?.[1] ?? 0;
  const localX = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const localZ = { x: Math.sin(yaw), z: Math.cos(yaw) };

  return (Math.abs(dotXZ(localX, axis)) * size[0] * 0.5)
    + (Math.abs(dotXZ(localZ, axis)) * size[2] * 0.5);
}

function resolveAxisAlignedFacing(rotation) {
  const yaw = tuple3(rotation)?.[1];
  if (!isFiniteNumber(yaw)) {
    return null;
  }

  const candidates = [
    { axis: 'positive-z', yaw: 0 },
    { axis: 'negative-z', yaw: Math.PI },
    { axis: 'positive-x', yaw: Math.PI / 2 },
    { axis: 'negative-x', yaw: -Math.PI / 2 },
  ].map((candidate) => ({
    ...candidate,
    delta: normalizeYawDelta(yaw, candidate.yaw),
  })).sort((left, right) => left.delta - right.delta);

  const best = candidates[0];
  return best && best.delta <= AXIS_ALIGNED_YAW_TOLERANCE ? best : null;
}

function resolveFaceAttachmentMetrics(screenBounds, hostBounds, facing) {
  switch (facing.axis) {
    case 'positive-z':
      return {
        faceGap: Math.abs(screenBounds.maxZ - hostBounds.maxZ),
        hostFaceWidth: hostBounds.maxX - hostBounds.minX,
        lateralOverlap: overlap1d(screenBounds.minX, screenBounds.maxX, hostBounds.minX, hostBounds.maxX),
      };
    case 'negative-z':
      return {
        faceGap: Math.abs(screenBounds.minZ - hostBounds.minZ),
        hostFaceWidth: hostBounds.maxX - hostBounds.minX,
        lateralOverlap: overlap1d(screenBounds.minX, screenBounds.maxX, hostBounds.minX, hostBounds.maxX),
      };
    case 'positive-x':
      return {
        faceGap: Math.abs(screenBounds.maxX - hostBounds.maxX),
        hostFaceWidth: hostBounds.maxZ - hostBounds.minZ,
        lateralOverlap: overlap1d(screenBounds.minZ, screenBounds.maxZ, hostBounds.minZ, hostBounds.maxZ),
      };
    case 'negative-x':
      return {
        faceGap: Math.abs(screenBounds.minX - hostBounds.minX),
        hostFaceWidth: hostBounds.maxZ - hostBounds.minZ,
        lateralOverlap: overlap1d(screenBounds.minZ, screenBounds.maxZ, hostBounds.minZ, hostBounds.maxZ),
      };
    default:
      return null;
  }
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

function isIntentionalCityStadiumPerimeterJoint(left, right) {
  const pairs = [
    [left, right],
    [right, left],
  ];

  return pairs.some(([city, stadium]) => (
    typeof city.id === 'string'
    && typeof stadium.id === 'string'
    && city.layer === 'city-mass'
    && stadium.layer === 'stadium-structure'
    && city.id.startsWith('city-perimeter-')
    && (
      stadium.id.startsWith('rear-campus-front-left-connector')
      || stadium.id.startsWith('rear-campus-front-right-connector')
    )
  ));
}

function isIntentionalCitySolidOverlap(left, right) {
  if (isAllowedScreenHostFacadeOverlap(left, right)) {
    return true;
  }

  if (
    typeof left.id === 'string'
    && typeof right.id === 'string'
    && left.id.startsWith('city-perimeter')
    && right.id.startsWith('city-perimeter')
  ) {
    return true;
  }

  if (
    typeof left.id === 'string'
    && typeof right.id === 'string'
    && (left.id.includes('-tower-cluster-') || right.id.includes('-tower-cluster-'))
  ) {
    return true;
  }

  const pairs = [
    [left.id, right.id],
    [right.id, left.id],
  ];

  return pairs.some(([candidate, host]) => (
    typeof candidate === 'string'
    && typeof host === 'string'
    && candidate.endsWith('-tower-cluster-plinth')
    && candidate.slice(0, -'-tower-cluster-plinth'.length) === host
  ));
}

function auditGroundOwnershipMetadata(entries) {
  const issues = [];

  for (const entry of entries) {
    if (!GROUND_METADATA_LAYERS.has(entry.layer)) {
      continue;
    }

    if (!VALID_GROUND_OWNERS.has(entry.groundOwner)) {
      pushIssue(
        issues,
        'high',
        'ground-owner-missing',
        `${entry.layer} ${entry.id} has no explicit groundOwner; ground seams need city/stadium/transition ownership.`,
        [entry.id],
        {
          sourceFile: entry.sourceFile ?? null,
          sourceKind: entry.sourceKind ?? null,
        },
      );
    }

    if (entry.layer === 'ground-base' && entry.groundRole !== 'base') {
      pushIssue(
        issues,
        'high',
        'ground-base-role-missing',
        `${entry.layer} ${entry.id} must be marked as groundRole=base.`,
        [entry.id],
        { groundRole: entry.groundRole ?? null },
      );
    }

    if (entry.layer === 'ground-detail' && entry.groundRole !== 'detail') {
      pushIssue(
        issues,
        'high',
        'ground-detail-role-missing',
        `${entry.layer} ${entry.id} must be marked as groundRole=detail so visible guide ribbons stay auditable.`,
        [entry.id],
        { groundRole: entry.groundRole ?? null },
      );
    }
  }

  return issues;
}

function resolveMaterialOpacity(entry) {
  const opacity = entry?.material?.opacity;
  return isFiniteNumber(opacity) ? opacity : null;
}

function auditGroundVisualContinuity(entries) {
  const issues = [];

  for (const entry of entries) {
    if (entry.layer === 'ground-detail') {
      const opacity = resolveMaterialOpacity(entry);
      if (opacity === null || entry.material?.transparent !== true || opacity > GROUND_DETAIL_MAX_OPACITY) {
        pushIssue(
          issues,
          'high',
          'ground-detail-too-opaque',
          `${entry.layer} ${entry.id} must stay as a subtle transparent guide layer so it does not create visible color seams across the city.`,
          [entry.id],
          {
            maxOpacity: GROUND_DETAIL_MAX_OPACITY,
            opacity,
            transparent: entry.material?.transparent ?? null,
          },
        );
      }
      continue;
    }

    if (STRUCTURAL_GROUND_LAYERS.has(entry.layer)) {
      const opacity = resolveMaterialOpacity(entry);
      if (opacity === null || entry.material?.transparent !== true || opacity > STRUCTURAL_GROUND_MAX_OPACITY) {
        pushIssue(
          issues,
          'high',
          'structural-ground-too-opaque',
          `${entry.layer} ${entry.id} must be a transparent structural ground overlay, not an opaque competing ground layer.`,
          [entry.id],
          {
            maxOpacity: STRUCTURAL_GROUND_MAX_OPACITY,
            opacity,
            transparent: entry.material?.transparent ?? null,
          },
        );
      }
    }
  }

  return issues;
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

      const leftGround = STRUCTURAL_GROUND_LAYERS.has(left.entry.layer);
      const rightGround = STRUCTURAL_GROUND_LAYERS.has(right.entry.layer);
      if (
        area >= GROUND_PLANE_SAME_LAYER_WARNING_OVERLAP_AREA
        && leftGround
        && rightGround
        && left.entry.layer === right.entry.layer
      ) {
        pushIssue(
          issues,
          area >= GROUND_PLANE_SAME_LAYER_HIGH_OVERLAP_AREA ? 'high' : 'medium',
          'ground-plane-layer-overlap',
          `${left.entry.layer} ${left.entry.id} overlaps ${right.entry.id}; same-layer ground should have one clear owner per footprint.`,
          [left.entry.id, right.entry.id],
          { overlapAreaXZ: Math.round(area) },
        );
        continue;
      }

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
        if (isIntentionalCityStadiumPerimeterJoint(left.entry, right.entry)) {
          continue;
        }

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
          if (isIntentionalCityStadiumPerimeterJoint(left.entry, right.entry)) {
            continue;
          }

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

function auditCitySolidOverlaps(entries) {
  const issues = [];
  const solids = entries
    .filter((entry) => isCityLayer(entry.layer) && SOLID_LAYERS.has(entry.layer))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }))
    .filter((item) => item.bounds);

  for (let leftIndex = 0; leftIndex < solids.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < solids.length; rightIndex += 1) {
      const left = solids[leftIndex];
      const right = solids[rightIndex];
      const area = overlapAreaXZ(left.bounds, right.bounds);
      if (area < CITY_SOLID_OVERLAP_WARNING_AREA) {
        continue;
      }

      const volume = overlapVolume(left.bounds, right.bounds);
      if (volume <= 0 || isIntentionalCitySolidOverlap(left.entry, right.entry)) {
        continue;
      }

      pushIssue(
        issues,
        volume >= CITY_SOLID_OVERLAP_HIGH_VOLUME ? 'high' : 'medium',
        'city-solid-overlap',
        `${left.entry.layer} ${left.entry.id} overlaps ${right.entry.layer} ${right.entry.id}; city solid objects need explicit clearance unless they are an intentional host/plinth pair.`,
        [left.entry.id, right.entry.id],
        {
          overlapAreaXZ: Math.round(area),
          overlapVolume: Math.round(volume),
        },
      );
    }
  }

  return issues;
}

function auditCitySolidClearance(entries) {
  const issues = [];
  const solids = entries
    .filter((entry) => isCityLayer(entry.layer) && SOLID_LAYERS.has(entry.layer))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }))
    .filter((item) => item.bounds);

  for (let leftIndex = 0; leftIndex < solids.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < solids.length; rightIndex += 1) {
      const left = solids[leftIndex];
      const right = solids[rightIndex];
      if (isIntentionalCitySolidOverlap(left.entry, right.entry)) {
        continue;
      }

      if (overlapVolume(left.bounds, right.bounds) > 0) {
        continue;
      }

      const gap = gapXZ(left.bounds, right.bounds);
      if (gap > CITY_SOLID_NEAR_GAP_WARNING_DISTANCE) {
        continue;
      }

      pushIssue(
        issues,
        'medium',
        'city-solid-near-gap',
        `${left.entry.layer} ${left.entry.id} is only ${Math.round(gap)} units from ${right.entry.layer} ${right.entry.id}; city structures need readable clearance.`,
        [left.entry.id, right.entry.id],
        {
          gapXZ: Math.round(gap),
          minGapXZ: CITY_SOLID_NEAR_GAP_WARNING_DISTANCE,
          sourceA: left.entry.sourceFile ?? null,
          sourceB: right.entry.sourceFile ?? null,
        },
      );
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

function auditCitySmallBlockClutter(entries) {
  const issues = [];

  for (const entry of entries) {
    const size = positiveTuple3(entry.size);
    if (entry.layer !== 'city-mass' || !size) {
      continue;
    }

    const footprintArea = size[0] * size[2];
    const footprintAspectRatio = Math.max(size[0], size[2]) / Math.max(1, Math.min(size[0], size[2]));
    const planningRole = entry.planningRole ?? null;
    const isAllowedLowStrip = footprintAspectRatio > CITY_SMALL_BLOCK_MAX_ASPECT_RATIO;
    const isExplicitGroundSupport = planningRole === 'ground' || planningRole === 'support-strip';
    if (
      size[1] <= CITY_SMALL_BLOCK_MAX_HEIGHT
      && footprintArea <= CITY_SMALL_BLOCK_MAX_FOOTPRINT_AREA
      && !isAllowedLowStrip
      && !isExplicitGroundSupport
    ) {
      pushIssue(
        issues,
        'medium',
        'city-small-block-clutter',
        `${entry.layer} ${entry.id} is a low isolated block (${Math.round(size[0])}x${Math.round(size[1])}x${Math.round(size[2])}); demote it from structural city massing or convert it to ground detail.`,
        [entry.id],
        {
          footprintArea: Math.round(footprintArea),
          footprintAspectRatio: Number(footprintAspectRatio.toFixed(2)),
          height: Math.round(size[1]),
          planningRole,
        },
      );
    }
  }

  return issues;
}

function auditResidualDecorativeCityMasses(entries) {
  const issues = [];

  for (const entry of entries) {
    if (entry.layer !== 'city-mass') {
      continue;
    }

    const matchedPattern = CITY_NON_RENDERABLE_DECORATIVE_MASS_PATTERNS.find((pattern) => entry.id?.includes(pattern));
    if (!matchedPattern) {
      continue;
    }

    pushIssue(
      issues,
      'medium',
      'city-residual-decorative-mass',
      `${entry.layer} ${entry.id} matches residual decorative mass pattern "${matchedPattern}" and should not render as a solid city object.`,
      [entry.id],
      { matchedPattern },
    );
  }

  return issues;
}

function auditCityObjectOwnership(entries) {
  const issues = [];
  const ownedCityLayers = new Set([
    'city-mass',
    'city-screen-assignment',
    'city-screen-socket',
    'city-screen-surface',
    'city-tower',
    'mega-landmark',
  ]);

  for (const entry of entries) {
    if (!ownedCityLayers.has(entry.layer) || entry.planningRole === 'city-perimeter') {
      continue;
    }

    if (!VALID_CITY_OBJECT_PLANNING_ZONES.has(entry.planningZone)) {
      pushIssue(
        issues,
        'medium',
        'city-object-zone-owner-missing',
        `${entry.layer} ${entry.id} must expose a concrete planning zone owner instead of ${entry.planningZone ?? 'missing'}.`,
        [entry.id],
        {
          planningZone: entry.planningZone ?? null,
          sourceFile: entry.sourceFile ?? null,
        },
      );
    }
  }

  return issues;
}

function auditCityObjectSourceTrace(entries) {
  const issues = [];

  for (const entry of entries) {
    if (!SOURCE_TRACE_CITY_LAYERS.has(entry.layer) || entry.planningRole === 'city-perimeter') {
      continue;
    }

    if (entry.sourceFile === GENERIC_CITY_WORLD_PLAN_SOURCE || entry.sourceFunction === 'buildCanonicalWorldPlan') {
      pushIssue(
        issues,
        'medium',
        'city-object-source-owner-generic',
        `${entry.layer} ${entry.id} must expose its concrete geometry source pool instead of generic buildCanonicalWorldPlan.`,
        [entry.id],
        {
          sourceFile: entry.sourceFile ?? null,
          sourceFunction: entry.sourceFunction ?? null,
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

function auditBoothSolidClearance(entries) {
  const issues = [];
  const booths = entries
    .filter((entry) => entry.layer === 'booth')
    .map((entry) => ({ bounds: resolveBounds(entry), entry }))
    .filter((item) => item.bounds);
  const solids = entries
    .filter((entry) => BOOTH_SOLID_CLEARANCE_LAYERS.has(entry.layer))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }))
    .filter((item) => item.bounds);

  for (const booth of booths) {
    for (const solid of solids) {
      const overlapArea = overlapAreaXZ(booth.bounds, solid.bounds);
      if (overlapArea > 0) {
        pushIssue(
          issues,
          overlapArea >= 600 ? 'high' : 'medium',
          'booth-solid-overlap',
          `Booth ${booth.entry.id} overlaps ${solid.entry.layer} ${solid.entry.id} on the XZ footprint.`,
          [booth.entry.id, solid.entry.id],
          { overlapAreaXZ: Math.round(overlapArea) },
        );
        continue;
      }

      const gap = gapXZ(booth.bounds, solid.bounds);
      if (gap <= 8) {
        pushIssue(
          issues,
          'medium',
          'booth-solid-near-gap',
          `Booth ${booth.entry.id} is ${Math.round(gap)} units from ${solid.entry.layer} ${solid.entry.id}; booth frontage needs clearer separation.`,
          [booth.entry.id, solid.entry.id],
          { gapXZ: Math.round(gap) },
        );
      }
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

function auditScreenHostVerticalAttachment(entries) {
  const registryById = new Map(entries.map((entry) => [entry.id, entry]));
  const screens = entries
    .filter((entry) => SCREEN_LAYERS.has(entry.layer) && tuple3(entry.position))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }));
  const issues = [];

  for (const screen of screens) {
    const binding = resolveScreenHostBinding(screen.entry.id);
    if (!binding || !screen.bounds) {
      continue;
    }

    const host = registryById.get(binding.hostId);
    const hostBounds = host ? resolveBounds(host) : null;
    const yaw = tuple3(screen.entry.rotation)?.[1];
    if (!host || !hostBounds || !isFiniteNumber(yaw)) {
      continue;
    }

    const verticalOverlap = overlap1d(screen.bounds.minY, screen.bounds.maxY, hostBounds.minY, hostBounds.maxY);
    const minVerticalOverlap = Math.min(screen.entry.size[1] * 0.34, hostBounds.size[1] * 0.5, 72);
    if (verticalOverlap < minVerticalOverlap) {
      pushIssue(
        issues,
        verticalOverlap <= 0 ? 'high' : 'medium',
        'screen-host-vertical-miss',
        `Screen ${screen.entry.id} has only ${Math.round(Math.max(0, verticalOverlap))} units of vertical overlap with host ${host.id}; it can read as floating.`,
        [screen.entry.id, host.id],
        {
          minVerticalOverlap: Math.round(minVerticalOverlap),
          verticalOverlap: Math.round(Math.max(0, verticalOverlap)),
        },
      );
      continue;
    }

    if (screen.bounds.minY > hostBounds.maxY + SCREEN_HOST_VERTICAL_FLOAT_TOLERANCE) {
      pushIssue(
        issues,
        'high',
        'screen-floating-above-host',
        `Screen ${screen.entry.id} starts ${Math.round(screen.bounds.minY - hostBounds.maxY)} units above host ${host.id}.`,
        [screen.entry.id, host.id],
        {
          hostTopY: Math.round(hostBounds.maxY),
          screenBottomY: Math.round(screen.bounds.minY),
        },
      );
      continue;
    }

    const normal = resolveYawNormal(yaw);
    const tangent = resolveYawTangent(yaw);
    const delta = {
      x: screen.entry.position[0] - host.position[0],
      z: screen.entry.position[2] - host.position[2],
    };
    const forwardGap = dotXZ(delta, normal);
    if (forwardGap < -SCREEN_HOST_VERTICAL_FLOAT_TOLERANCE) {
      pushIssue(
        issues,
        'high',
        'screen-host-facing-behind',
        `Screen ${screen.entry.id} is behind host ${host.id} relative to its facing direction.`,
        [screen.entry.id, host.id],
        { forwardGap: Math.round(forwardGap) },
      );
      continue;
    }

    const hostTangentHalfExtent = projectedHalfExtentXZ(host, tangent);
    if (!hostTangentHalfExtent) {
      continue;
    }

    const tangentDelta = Math.abs(dotXZ(delta, tangent));
    const screenTangentHalfExtent = screen.entry.size[0] * 0.5;
    const lateralOverflow = tangentDelta + (screenTangentHalfExtent * 0.42) - (hostTangentHalfExtent + 18);
    if (lateralOverflow > 36) {
      pushIssue(
        issues,
        lateralOverflow > 72 ? 'high' : 'medium',
        'screen-host-lateral-miss',
        `Screen ${screen.entry.id} is laterally misaligned with host ${host.id}.`,
        [screen.entry.id, host.id],
        {
          lateralOverflow: Math.round(lateralOverflow),
          tangentDelta: Math.round(tangentDelta),
        },
      );
    }
  }

  return issues;
}

function auditScreenHostPlanarAttachment(entries) {
  const registryById = new Map(entries.map((entry) => [entry.id, entry]));
  const screens = entries
    .filter((entry) => SCREEN_LAYERS.has(entry.layer) && tuple3(entry.position))
    .map((entry) => ({ bounds: resolveBounds(entry), entry }));
  const issues = [];

  for (const screen of screens) {
    const binding = resolveScreenHostBinding(screen.entry.id);
    const host = binding ? registryById.get(binding.hostId) : null;
    const yaw = tuple3(screen.entry.rotation)?.[1];
    if (!binding || !host || !screen.bounds || !isFiniteNumber(yaw)) {
      continue;
    }

    const normal = resolveYawNormal(yaw);
    const tangent = resolveYawTangent(yaw);
    const delta = {
      x: screen.entry.position[0] - host.position[0],
      z: screen.entry.position[2] - host.position[2],
    };
    const forwardGap = dotXZ(delta, normal);
    const hostNormalHalfExtent = projectedHalfExtentXZ(host, normal);
    const hostTangentHalfExtent = projectedHalfExtentXZ(host, tangent);
    if (!hostNormalHalfExtent || !hostTangentHalfExtent) {
      continue;
    }

    const screenDepthHalfExtent = screen.entry.size[2] * 0.5;
    const planarGap = forwardGap - hostNormalHalfExtent - screenDepthHalfExtent;
    if (planarGap > SCREEN_HOST_PLANAR_GAP_TOLERANCE) {
      pushIssue(
        issues,
        planarGap > 42 ? 'high' : 'medium',
        'screen-host-planar-gap',
        `Screen ${screen.entry.id} is ${Math.round(planarGap)} units in front of host ${host.id}; it can read as detached from the wall.`,
        [screen.entry.id, host.id],
        {
          forwardGap: Math.round(forwardGap),
          hostNormalHalfExtent: Math.round(hostNormalHalfExtent),
          planarGap: Math.round(planarGap),
        },
      );
      continue;
    }

    if (planarGap < -SCREEN_HOST_PLANAR_EMBED_TOLERANCE) {
      pushIssue(
        issues,
        planarGap < -42 ? 'high' : 'medium',
        'screen-host-planar-embed',
        `Screen ${screen.entry.id} is embedded ${Math.round(Math.abs(planarGap))} units into host ${host.id}; it should sit on the host face.`,
        [screen.entry.id, host.id],
        {
          forwardGap: Math.round(forwardGap),
          hostNormalHalfExtent: Math.round(hostNormalHalfExtent),
          planarGap: Math.round(planarGap),
        },
      );
      continue;
    }

    const screenTangentHalfExtent = screen.entry.size[0] * 0.5;
    const tangentDelta = Math.abs(dotXZ(delta, tangent));
    const lateralOverlap = hostTangentHalfExtent + screenTangentHalfExtent - tangentDelta;
    const minLateralOverlap = screen.entry.size[0] * SCREEN_HOST_MIN_LATERAL_OVERLAP_RATIO;
    if (isMediaWallScreen(screen.entry.id) && hostTangentHalfExtent < screenTangentHalfExtent * MEDIA_WALL_SCREEN_HOST_MIN_WIDTH_RATIO) {
      pushIssue(
        issues,
        'high',
        'screen-host-planar-backdrop-narrow',
        `Screen ${screen.entry.id} is wider than its mounted host ${host.id}; it can read as hanging in the air.`,
        [screen.entry.id, host.id],
        {
          hostWidth: Math.round(hostTangentHalfExtent * 2),
          minHostWidth: Math.round(screenTangentHalfExtent * 2 * MEDIA_WALL_SCREEN_HOST_MIN_WIDTH_RATIO),
          screenWidth: Math.round(screenTangentHalfExtent * 2),
        },
      );
    }
    if (lateralOverlap < minLateralOverlap) {
      pushIssue(
        issues,
        lateralOverlap <= 0 ? 'high' : 'medium',
        'screen-host-planar-lateral-miss',
        `Screen ${screen.entry.id} has only ${Math.round(Math.max(0, lateralOverlap))} units of lateral overlap with host ${host.id}.`,
        [screen.entry.id, host.id],
        {
          lateralOverlap: Math.round(Math.max(0, lateralOverlap)),
          minLateralOverlap: Math.round(minLateralOverlap),
          tangentDelta: Math.round(tangentDelta),
        },
      );
    }
  }

  return issues;
}

function auditStadiumScreenHostFaceAttachment(entries) {
  const registryById = new Map(entries.map((entry) => [entry.id, entry]));
  const screens = entries
    .filter((entry) => entry.layer === 'stadium-screen-surface')
    .map((entry) => ({ bounds: resolveBounds(entry), entry }));
  const issues = [];

  for (const screen of screens) {
    const binding = resolveScreenHostBinding(screen.entry.id);
    if (!binding || !screen.bounds) {
      continue;
    }

    const host = registryById.get(binding.hostId);
    if (!host || !STADIUM_SCREEN_FACE_HOST_LAYERS.has(host.layer)) {
      continue;
    }

    const hostBounds = resolveBounds(host);
    const facing = resolveAxisAlignedFacing(screen.entry.rotation);
    if (!hostBounds || !facing) {
      continue;
    }

    const metrics = resolveFaceAttachmentMetrics(screen.bounds, hostBounds, facing);
    if (!metrics) {
      continue;
    }

    if (metrics.lateralOverlap <= 0) {
      pushIssue(
        issues,
        'high',
        'stadium-screen-host-face-miss',
        `Stadium screen ${screen.entry.id} does not overlap the mounted face of host ${host.id}.`,
        [screen.entry.id, host.id],
        {
          axis: facing.axis,
          lateralOverlap: Math.round(metrics.lateralOverlap),
          yawDelta: Number(facing.delta.toFixed(3)),
        },
      );
      continue;
    }

    if (metrics.faceGap > SCREEN_HOST_FACE_GAP_TOLERANCE) {
      pushIssue(
        issues,
        metrics.faceGap > 48 ? 'high' : 'medium',
        'stadium-screen-host-face-gap',
        `Stadium screen ${screen.entry.id} is ${Math.round(metrics.faceGap)} units from the ${facing.axis} face of host ${host.id}.`,
        [screen.entry.id, host.id],
        {
          axis: facing.axis,
          faceGap: Math.round(metrics.faceGap),
          lateralOverlap: Math.round(metrics.lateralOverlap),
          maxFaceGap: SCREEN_HOST_FACE_GAP_TOLERANCE,
          yawDelta: Number(facing.delta.toFixed(3)),
        },
      );
    }

    if (metrics.hostFaceWidth < screen.entry.size[0] * MEDIA_WALL_SCREEN_HOST_MIN_WIDTH_RATIO) {
      pushIssue(
        issues,
        'high',
        'stadium-screen-host-face-backdrop-narrow',
        `Stadium screen ${screen.entry.id} is wider than the mounted face of host ${host.id}; it can read as hanging in the air.`,
        [screen.entry.id, host.id],
        {
          hostFaceWidth: Math.round(metrics.hostFaceWidth),
          minHostFaceWidth: Math.round(screen.entry.size[0] * MEDIA_WALL_SCREEN_HOST_MIN_WIDTH_RATIO),
          screenWidth: Math.round(screen.entry.size[0]),
        },
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

function incrementCount(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}

function summarizeCoverage(entries) {
  const byLayer = {};
  const groundByOwner = {};
  const groundByRole = {};
  let screenHostBindings = 0;
  let screenSurfaces = 0;

  for (const entry of entries) {
    incrementCount(byLayer, entry.layer ?? 'unknown');

    if (SCREEN_LAYERS.has(entry.layer)) {
      screenSurfaces += 1;
      if (resolveScreenHostBinding(entry.id)) {
        screenHostBindings += 1;
      }
    }

    if (GROUND_METADATA_LAYERS.has(entry.layer)) {
      incrementCount(groundByOwner, entry.groundOwner ?? 'missing');
      incrementCount(groundByRole, entry.groundRole ?? 'missing');
    }
  }

  return {
    byLayer,
    ground: {
      byOwner: groundByOwner,
      byRole: groundByRole,
      total: Object.values(groundByOwner).reduce((sum, count) => sum + count, 0),
    },
    screens: {
      hostBindings: screenHostBindings,
      surfaces: screenSurfaces,
    },
  };
}

const args = parseArgs(process.argv);
const snapshotPath = path.resolve(args.snapshotPath);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8').replace(/^\uFEFF/, ''));
const entries = uniqueRegistryEntries(snapshot);
const issues = [
  ...auditSolidBoundsCoverage(entries),
  ...auditGroundOwnershipMetadata(entries),
  ...auditGroundVisualContinuity(entries),
  ...auditGroundAndCrossLayerOverlaps(entries),
  ...auditCitySolidOverlaps(entries),
  ...auditCitySolidClearance(entries),
  ...auditCitySmallBlockClutter(entries),
  ...auditResidualDecorativeCityMasses(entries),
  ...auditCityObjectOwnership(entries),
  ...auditCityObjectSourceTrace(entries),
  ...auditBoothSpacing(entries),
  ...auditBoothSolidClearance(entries),
  ...auditScreenSocketAttachment(entries),
  ...auditScreenHostAttachment(entries),
  ...auditScreenHostVerticalAttachment(entries),
  ...auditScreenHostPlanarAttachment(entries),
  ...auditStadiumScreenHostFaceAttachment(entries),
].sort((left, right) => {
  const severityDelta = SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }
  return left.code.localeCompare(right.code);
});

const report = {
  coverage: summarizeCoverage(entries),
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
  coverage: report.coverage,
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
