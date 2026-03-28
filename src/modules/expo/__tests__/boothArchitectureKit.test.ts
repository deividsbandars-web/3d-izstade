import assert from 'node:assert/strict';
import { getBoothColliderSegments } from '../components/BoothArchitectureKit.js';

const templates = [
  'hero_forum',
  'hero_gallery',
  'premium_portal',
  'premium_spine',
  'standard_arcade',
  'standard_studio',
] as const;

templates.forEach((template) => {
  const segments = getBoothColliderSegments(template);
  assert.deepEqual(segments.map((segment) => segment.id).sort(), ['left', 'rear', 'right']);
  assert.ok(segments.every((segment) => segment.size[1] > 0));
  assert.ok(segments.every((segment) => segment.position[2] <= 0.1));
  assert.ok(segments.every((segment) => segment.id === 'rear' || Math.abs(segment.position[0]) > 1));
  assert.ok(segments.every((segment) => segment.id !== 'rear' || segment.position[2] < 0));
});
