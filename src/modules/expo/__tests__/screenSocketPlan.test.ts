import assert from 'node:assert/strict';
import { buildZoneScreenSocketPlan } from '../runtime/planning/screens/buildScreenSocketPlan.js';
import type { CityScreenSurface } from '../runtime/planning/types/index.js';

const heroWallSurface: CityScreenSurface = {
  color: '#091320',
  glowColor: '#7dd3fc',
  id: 'screen-hero-wall',
  position: [0, 140, -420],
  role: 'hero-wall',
  rotation: [0, Math.PI, 0],
  size: [156, 184, 3.4],
  type: 'wall',
};

const input = [heroWallSurface];
const before = JSON.stringify(input);
const sockets = buildZoneScreenSocketPlan(input, 1, 'center-spine');

assert.equal(JSON.stringify(input), before);
assert.equal(sockets.length, 1);

const [socket] = sockets;

assert.equal(socket.kind, 'hero_wall');
assert.ok(socket.renderIntent);
assert.equal(socket.renderIntent?.frameDepth, 2.8);
assert.equal(socket.renderIntent?.braceDepth, 2.8 * 0.72);

const housingPrimitive = socket.renderIntent?.primitives?.[0];
const leftColumnPrimitive = socket.renderIntent?.primitives?.[1];

assert.ok(housingPrimitive);
assert.equal(housingPrimitive?.kind, 'box');
if (housingPrimitive?.kind === 'box') {
  assert.equal(housingPrimitive.size[2], 2.8 * 0.4);
}

assert.ok(leftColumnPrimitive);
assert.equal(leftColumnPrimitive?.kind, 'box');
if (leftColumnPrimitive?.kind === 'box') {
  assert.equal(leftColumnPrimitive.size[2], 2.8 * 0.72);
}
