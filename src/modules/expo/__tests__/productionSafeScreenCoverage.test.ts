import assert from 'node:assert/strict';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';
import { buildCanonicalWorldPlanFromWorldContract } from '../runtime/planning/index.js';
import type { CanonicalPrimitiveTexturePlane } from '../runtime/planning/types/index.js';
import { PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS } from '../state/expoRuntime.js';

const world = buildExpoWorldContract({
  companies: PRODUCTION_SAFE_COMPANIES,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const plan = buildCanonicalWorldPlanFromWorldContract(world);
const assignmentBySocketId = new Map(plan.screenAssignments.map((assignment) => [assignment.socketId, assignment]));

function isTexturePrimitive(primitive: { kind: string }): primitive is CanonicalPrimitiveTexturePlane {
  return primitive.kind === 'texture-plane';
}

for (const socket of plan.screenSockets) {
  const assignment = assignmentBySocketId.get(socket.id);
  assert.ok(assignment, `${socket.id} must have a screen assignment in production-safe review data`);
  assert.equal(assignment.renderIntent?.fullBleed, true, `${assignment.id} must be full-bleed`);

  const texturePrimitive = assignment.renderIntent?.primitives?.find(isTexturePrimitive);
  assert.ok(texturePrimitive, `${assignment.id} must render a texture primitive`);
  assert.ok(
    (texturePrimitive.url ?? '').startsWith('generated-billboard:'),
    `${assignment.id} must use generated billboard texture instead of live text/remote image fallback`,
  );
  assert.ok(
    texturePrimitive.size[0] >= assignment.renderIntent.frameWidth * 0.96,
    `${assignment.id} must fill the screen width`,
  );
  assert.ok(
    texturePrimitive.size[1] >= assignment.renderIntent.frameHeight * 0.96,
    `${assignment.id} must fill the screen height`,
  );
}

const rightDistrictSockets = plan.screenSockets.filter((socket) => socket.planningZone === 'right-district');
assert.equal(rightDistrictSockets.length, 10);
assert.equal(rightDistrictSockets.filter((socket) => assignmentBySocketId.has(socket.id)).length, 10);

const rightDistrictLabels = rightDistrictSockets.map((socket) => assignmentBySocketId.get(socket.id)?.label ?? '');
const labelCounts = new Map<string, number>();
for (const label of rightDistrictLabels) {
  labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
}
for (const [label, count] of labelCounts) {
  assert.ok(count <= 2, `right-district screen label "${label}" is repeated ${count} times`);
}
