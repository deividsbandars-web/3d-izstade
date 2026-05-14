import assert from 'node:assert/strict';
import { getBoothColliderSegments } from '../components/BoothArchitectureKit.js';
import { getBoothArchitectureMetrics } from '../components/BoothArchitectureKit.js';
import { resolveOpenBoothPavilionLayout } from '../runtime/booths/OpenBoothPavilion.js';

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

const premiumLayout = resolveOpenBoothPavilionLayout(getBoothArchitectureMetrics('premium_portal'), 'premium');
assert.equal(premiumLayout.isScreenFirstPremium, true);
assert.equal(premiumLayout.showFullRoof, false);
assert.equal(premiumLayout.showFrontageCanopy, false);
assert.equal(premiumLayout.showFrontageFins, false);
assert.equal(premiumLayout.showPremiumOrEliteBlades, false);
assert.equal(premiumLayout.showPremiumPortalShell, false);
assert.equal(premiumLayout.showScreenTrimOverlays, false);
assert.equal(premiumLayout.showTierSideBanners, false);
assert.equal(premiumLayout.mediaSurfaceCount, 1);
assert.ok(premiumLayout.screenFrameWidth / premiumLayout.width >= 0.93);
assert.ok(premiumLayout.screenSurfaceWidth / premiumLayout.screenFrameWidth >= 0.96);
assert.ok(premiumLayout.screenSurfaceHeight / premiumLayout.screenFrameHeight >= 0.93);

const eliteLayout = resolveOpenBoothPavilionLayout(getBoothArchitectureMetrics('premium_spine'), 'elite');
assert.equal(eliteLayout.isScreenFirstBooth, true);
assert.equal(eliteLayout.showFullRoof, false);
assert.equal(eliteLayout.showFrontageCanopy, false);
assert.equal(eliteLayout.showTierSideBanners, false);
assert.equal(eliteLayout.mediaSurfaceCount, 1);
assert.ok(eliteLayout.screenSurfaceWidth / eliteLayout.screenFrameWidth >= 0.96);
