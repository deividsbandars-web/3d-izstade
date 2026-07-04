import assert from 'node:assert/strict';
import {
  shouldRenderGalaExteriorCladding,
  shouldRenderGalaExteriorInteriorFace,
  shouldRenderGalaOpeningFineDetail,
  shouldRenderGalaRoofFineDetail,
  shouldRenderGalaRoomAssembly,
  shouldRenderGalaWallSegment,
} from '../runtime/modularHome/construction/GalaConstructionDetailPolicy';

assert.equal(
  shouldRenderGalaWallSegment({
    renderDetailLevel: 'reduced',
    viewMode: 'exterior',
    wallKind: 'partition',
  }),
  false,
);

assert.equal(
  shouldRenderGalaWallSegment({
    renderDetailLevel: 'reduced',
    viewMode: 'interior',
    wallKind: 'partition',
  }),
  true,
);

assert.equal(
  shouldRenderGalaWallSegment({
    renderDetailLevel: 'full',
    viewMode: 'exterior',
    wallKind: 'partition',
  }),
  true,
);

assert.equal(
  shouldRenderGalaExteriorInteriorFace({
    viewMode: 'exterior',
    wallKind: 'exterior',
  }),
  false,
);

assert.equal(
  shouldRenderGalaExteriorInteriorFace({
    viewMode: 'interior',
    wallKind: 'exterior',
  }),
  true,
);

assert.equal(
  shouldRenderGalaExteriorCladding({
    renderDetailLevel: 'reduced',
    viewMode: 'interior',
  }),
  false,
);

assert.equal(
  shouldRenderGalaExteriorCladding({
    renderDetailLevel: 'reduced',
    viewMode: 'exterior',
  }),
  true,
);

assert.equal(shouldRenderGalaOpeningFineDetail('reduced'), false);
assert.equal(shouldRenderGalaOpeningFineDetail('full'), true);
assert.equal(shouldRenderGalaRoofFineDetail('reduced'), false);
assert.equal(shouldRenderGalaRoofFineDetail('full'), true);

assert.equal(
  shouldRenderGalaRoomAssembly({
    renderDetailLevel: 'reduced',
    viewMode: 'exterior',
  }),
  false,
);

assert.equal(
  shouldRenderGalaRoomAssembly({
    renderDetailLevel: 'reduced',
    viewMode: 'interior',
  }),
  true,
);
