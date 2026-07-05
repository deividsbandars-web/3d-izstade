import assert from 'node:assert/strict';
import {
  MODULAR_HOME_PORTAL_DEFAULT_POSITION,
  MODULAR_HOME_PORTAL_DEFAULT_ROTATION_Y,
  MODULAR_HOME_PORTAL_DEFAULT_SCALE,
} from '../runtime/world/ModularHomeEntrancePortalLayout.js';
import {
  ARRIVAL_GATE_FLOOR_ANCHOR,
  CENTER_SPINE_FLOOR_GUIDE,
  GROUND_DETAIL_RIBBONS,
  GROUND_SURFACE_MARKER_Y,
} from '../runtime/world/WorldGroundLayout.js';
import { FLOOR_MATERIAL_INTENTS } from '../runtime/world/floor/FloorVisualLanguage.js';
import { buildCanonicalWorldPlanFromWorldContract } from '../runtime/planning/index.js';
import { PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS } from '../state/expoRuntime.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';

function hexLuma(hex: string) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16) / 255;
  return (channel(0) * 0.2126) + (channel(2) * 0.7152) + (channel(4) * 0.0722);
}

assert.ok(
  Math.abs(MODULAR_HOME_PORTAL_DEFAULT_POSITION[0]) >= 180,
  'modular-home destination portal should not block the center sponsor boulevard start view',
);
assert.ok(
  MODULAR_HOME_PORTAL_DEFAULT_POSITION[2] >= 80 && MODULAR_HOME_PORTAL_DEFAULT_POSITION[2] <= 150,
  'modular-home portal should remain visible near the arrival destination band',
);
assert.ok(
  MODULAR_HOME_PORTAL_DEFAULT_SCALE >= 2.4 && MODULAR_HOME_PORTAL_DEFAULT_SCALE <= 3.1,
  'modular-home portal should read as a destination without becoming a foreground wall',
);
assert.ok(
  MODULAR_HOME_PORTAL_DEFAULT_ROTATION_Y < 0,
  'right-side modular-home portal should angle back toward the walking lane',
);

assert.equal(CENTER_SPINE_FLOOR_GUIDE.id, 'center-spine-floor-guide');
assert.ok(CENTER_SPINE_FLOOR_GUIDE.size[0] >= 300 && CENTER_SPINE_FLOOR_GUIDE.size[0] <= 380);
assert.ok(CENTER_SPINE_FLOOR_GUIDE.size[1] >= 1000);
assert.equal(CENTER_SPINE_FLOOR_GUIDE.position[0], 0);
assert.ok(
  ARRIVAL_GATE_FLOOR_ANCHOR.size[1] >= 520,
  'arrival floor anchor should cover the first walk view with an intentional boulevard surface',
);
assert.ok(
  hexLuma(FLOOR_MATERIAL_INTENTS.arrivalAnchor.color) >= 0.52,
  'arrival floor material should stay light enough to avoid a dark first-view foreground',
);
assert.ok(
  hexLuma(FLOOR_MATERIAL_INTENTS.centerSpineGuide.color) >= 0.58,
  'center spine guide should read as a visible boulevard cue in the first walk view',
);

const ribbonIds = GROUND_DETAIL_RIBBONS.map((ribbon) => ribbon.id);
assert.equal(new Set(ribbonIds).size, ribbonIds.length);
assert.ok(ribbonIds.includes('arrival-to-seam-spine'));
assert.ok(ribbonIds.includes('arrival-commercial-apron'));
assert.ok(ribbonIds.includes('arrival-commercial-apron-front-edge'));
assert.ok(ribbonIds.includes('arrival-commercial-apron-mid-crosswalk'));
assert.ok(ribbonIds.includes('arrival-commercial-apron-back-edge'));
assert.ok(ribbonIds.includes('arrival-clear-lane-left-edge'));
assert.ok(ribbonIds.includes('arrival-clear-lane-right-edge'));
assert.ok(ribbonIds.includes('arrival-clear-lane-threshold'));
assert.ok(ribbonIds.includes('sponsor-left-forecourt-ribbon'));
assert.ok(ribbonIds.includes('sponsor-right-forecourt-ribbon'));

const arrivalCommercialApron = GROUND_DETAIL_RIBBONS.find((ribbon) => ribbon.id === 'arrival-commercial-apron');
assert.ok(arrivalCommercialApron);
assert.equal(arrivalCommercialApron.position[1], GROUND_SURFACE_MARKER_Y);
assert.ok(
  arrivalCommercialApron.size[0] >= 1000 && arrivalCommercialApron.size[1] >= 700,
  'first-view commercial apron should break up the broad empty ground foreground',
);
assert.ok(
  (arrivalCommercialApron.opacity ?? 0) >= 0.18 && (arrivalCommercialApron.opacity ?? 0) <= 0.22,
  'first-view commercial apron should be visible without becoming a stripe-heavy graphic plane',
);

const arrivalCommercialApronFrontEdge = GROUND_DETAIL_RIBBONS.find((ribbon) => ribbon.id === 'arrival-commercial-apron-front-edge');
assert.ok(arrivalCommercialApronFrontEdge);
assert.ok(
  (arrivalCommercialApronFrontEdge.opacity ?? 0) >= 0.2 && (arrivalCommercialApronFrontEdge.opacity ?? 0) <= 0.26,
  'first-view commercial apron should have a readable but restrained front paver edge',
);

const commercialWorld = buildExpoWorldContract({
  companies: PRODUCTION_SAFE_COMPANIES,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const commercialCanonicalPlan = buildCanonicalWorldPlanFromWorldContract(commercialWorld);
const skyMarketSpine = commercialCanonicalPlan.filteredMasses.find((mass) => mass.id === 'sky-market-spine-primitive-rig');
const broadCenteredOverheadPlates = skyMarketSpine?.renderIntent?.primitives?.filter((primitive) => (
  primitive.kind === 'box'
  && Math.abs(primitive.position[0]) < 120
  && primitive.position[1] >= 450
  && primitive.position[1] <= 960
  && primitive.size[0] > 180
  && primitive.size[2] > 800
)) ?? [];
assert.equal(
  broadCenteredOverheadPlates.length,
  0,
  'center-spine scenic rig should use open side rails, not a broad overhead slab in the first sponsor boulevard view',
);
assert.ok(
  commercialWorld.startView.position[2] <= commercialWorld.plan.arrivalNode.position[2] + 40,
  'first walk view should start close to the boulevard threshold instead of leaving a large empty foreground',
);
assert.ok(
  commercialWorld.startView.lookAt[1] - commercialWorld.startView.position[1] >= 28,
  'first walk view should frame sponsor signage and screens, not look down at dark ground',
);
assert.ok(
  Math.abs(commercialWorld.startView.lookAt[0] - commercialWorld.startView.position[0]) <= 8,
  'first walk view should look along the boulevard lane instead of yawing into one foreground screen wall',
);
assert.ok(
  commercialWorld.startView.position[0] > 36,
  'first walk view should be slightly off-axis from the right lane so foreground screen slabs do not dominate',
);
