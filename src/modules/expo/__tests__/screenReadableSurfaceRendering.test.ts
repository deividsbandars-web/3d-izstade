import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/modules/expo/runtime/world/WorldCityScreenAssignments.tsx', 'utf8');

const texturePrimitiveStart = source.indexOf("if (primitive.kind === 'texture-plane')");
const textPrimitiveStart = source.indexOf("if (primitive.kind === 'text')");
assert.ok(texturePrimitiveStart > 0, 'texture-plane render block should exist');
assert.ok(textPrimitiveStart > texturePrimitiveStart, 'text render block should follow texture-plane render block');

const texturePrimitiveBlock = source.slice(texturePrimitiveStart, textPrimitiveStart);
assert.equal(
  texturePrimitiveBlock.includes('doubleSided={doubleSidedTexture}'),
  false,
  'city screen texture planes must not use one DoubleSide material because rear views mirror sponsor text',
);
assert.ok(
  texturePrimitiveBlock.includes('rotation={[0, Math.PI, 0]}'),
  'double-sided city screen texture content should use a separate rear-facing plane',
);
assert.ok(
  texturePrimitiveBlock.includes('doubleSided={false}'),
  'city screen texture planes should keep each material front-sided for readable text',
);

const rearTextureStart = source.indexOf('function renderRearTexturePrimitive');
const assignmentsStart = source.indexOf('export function WorldCityScreenAssignments');
assert.ok(rearTextureStart > 0, 'rear texture render helper should exist');
assert.ok(assignmentsStart > rearTextureStart, 'assignment component should follow rear texture helper');

const rearTextureBlock = source.slice(rearTextureStart, assignmentsStart);
assert.equal(
  /^\s*doubleSided\s*$/m.test(rearTextureBlock),
  false,
  'rear screen clones must not use bare doubleSided materials that can reveal mirrored text',
);
assert.ok(
  rearTextureBlock.includes('doubleSided={false}'),
  'rear screen clones should be front-sided after being rotated toward the rear view',
);
