import assert from 'node:assert/strict';
import { sanitizeSkylinePlacements } from '../lib/skylinePlacement.js';
import type { ExpoWalkRegion } from '../sceneWorld.js';

const walkRegions: ExpoWalkRegion[] = [
  { id: 'arrival', maxX: 36, maxZ: 42, minX: -36, minZ: -12, type: 'arrival' },
  { id: 'spine', maxX: 24, maxZ: 24, minX: -24, minZ: -240, type: 'spine' },
];

const sanitized = sanitizeSkylinePlacements([
  {
    asset: 'atlanta',
    boundsSize: [120, 160, 90],
    id: 'atlanta-left',
    position: [-20, 0, -80],
    rotationY: 0.3,
    scale: 8.4,
  },
  {
    asset: 'bridge',
    boundsSize: [90, 70, 80],
    id: 'bridge-right',
    position: [18, 0, -40],
    rotationY: -0.2,
    scale: 6.4,
  },
], walkRegions);

assert.equal(sanitized.length, 2);
assert.ok(sanitized.every((placement) => placement.wasAdjusted));
assert.ok(sanitized[0].position[0] < walkRegions[1].minX);
assert.ok(sanitized[1].position[0] > walkRegions[1].maxX || sanitized[1].position[2] < walkRegions[1].minZ);
