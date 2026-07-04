import assert from 'node:assert/strict';
import { resolveExpoQualitySettings } from '../runtime/world/quality/expoQualitySettings';
import {
  buildExpoZoneRuntimeStateSignature,
  resolveExpoZoneRuntimeState,
  resolveStableExpoZoneRuntimeState,
} from '../runtime/world/zones/expoZoneRuntimeState';

const qualitySettings = resolveExpoQualitySettings({
  isTouchDevice: false,
  runtimeCaptureSafe: false,
});

const current = resolveExpoZoneRuntimeState({
  externalActiveZoneId: 'center-spine',
  playerPosition: [0, 5, -680],
  previousActiveZoneId: null,
  qualitySettings,
  runtimeCaptureSafe: false,
});

const unchangedZone = resolveExpoZoneRuntimeState({
  externalActiveZoneId: 'center-spine',
  playerPosition: [120, 5, -540],
  previousActiveZoneId: current.previousActiveZoneId,
  qualitySettings,
  runtimeCaptureSafe: false,
});

assert.equal(unchangedZone.activeZoneId, current.activeZoneId);
assert.notEqual(unchangedZone.playerPosition, current.playerPosition);
assert.equal(resolveStableExpoZoneRuntimeState(current, unchangedZone), current);
assert.equal(
  buildExpoZoneRuntimeStateSignature(current),
  buildExpoZoneRuntimeStateSignature(unchangedZone),
);

const changedZone = resolveExpoZoneRuntimeState({
  externalActiveZoneId: 'tower-cluster',
  playerPosition: [740, 5, -1040],
  previousActiveZoneId: current.activeZoneId,
  qualitySettings,
  runtimeCaptureSafe: false,
});

assert.notEqual(changedZone.activeZoneId, current.activeZoneId);
assert.equal(resolveStableExpoZoneRuntimeState(current, changedZone), changedZone);
assert.notEqual(
  buildExpoZoneRuntimeStateSignature(current),
  buildExpoZoneRuntimeStateSignature(changedZone),
);
