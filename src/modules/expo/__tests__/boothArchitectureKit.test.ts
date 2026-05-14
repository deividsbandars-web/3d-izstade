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
assert.equal(premiumLayout.isScreenFirstBooth, true);
assert.equal(premiumLayout.showFullRoof, false);
assert.equal(premiumLayout.showFrontageCanopy, false);
assert.equal(premiumLayout.showFrontageFins, false);
assert.equal(premiumLayout.showPremiumOrEliteBlades, false);
assert.equal(premiumLayout.showPremiumPortalShell, false);
assert.equal(premiumLayout.showScreenTrimOverlays, false);
assert.equal(premiumLayout.showTierSideBanners, false);
assert.equal(premiumLayout.mediaSurfaceCount, 1);
assert.ok(premiumLayout.screenFrameWidth / premiumLayout.width >= 0.93);
assert.ok(premiumLayout.screenFrameWidth / premiumLayout.width <= 1);
assert.ok(premiumLayout.depth / getBoothArchitectureMetrics('premium_portal').footprintSize[1] <= 0.44);
assert.ok(premiumLayout.screenFrameHeight >= 13);
assert.ok(premiumLayout.screenSurfaceWidth / premiumLayout.screenFrameWidth >= 0.99);
assert.ok(premiumLayout.screenSurfaceHeight / premiumLayout.screenFrameHeight >= 0.98);
assert.ok(premiumLayout.screenSurfaceWidth / premiumLayout.screenSurfaceHeight <= 2.4);

const standardLayout = resolveOpenBoothPavilionLayout(getBoothArchitectureMetrics('standard_arcade'), 'standard');
assert.equal(standardLayout.isScreenFirstBooth, true);
assert.equal(standardLayout.showFullRoof, false);
assert.equal(standardLayout.showFrontageCanopy, false);
assert.equal(standardLayout.mediaSurfaceCount, 1);
assert.ok(standardLayout.depth / getBoothArchitectureMetrics('standard_arcade').footprintSize[1] <= 0.48);
assert.ok(standardLayout.screenFrameWidth / standardLayout.width <= 1);
assert.ok(standardLayout.screenFrameHeight >= 8);
assert.ok(standardLayout.screenSurfaceWidth / standardLayout.screenFrameWidth >= 0.99);
assert.ok(standardLayout.screenSurfaceHeight / standardLayout.screenFrameHeight >= 0.98);

const eliteLayout = resolveOpenBoothPavilionLayout(getBoothArchitectureMetrics('premium_spine'), 'elite');
assert.equal(eliteLayout.isScreenFirstBooth, true);
assert.equal(eliteLayout.showFullRoof, false);
assert.equal(eliteLayout.showFrontageCanopy, false);
assert.equal(eliteLayout.showTierSideBanners, false);
assert.equal(eliteLayout.mediaSurfaceCount, 1);
assert.ok(eliteLayout.screenFrameWidth / eliteLayout.width <= 1);
assert.ok(eliteLayout.depth / getBoothArchitectureMetrics('premium_spine').footprintSize[1] <= 0.44);
assert.ok(eliteLayout.screenFrameHeight >= 14);
assert.ok(eliteLayout.screenSurfaceWidth / eliteLayout.screenFrameWidth >= 0.99);
assert.ok(eliteLayout.screenSurfaceHeight / eliteLayout.screenFrameHeight >= 0.98);
assert.ok(eliteLayout.screenSurfaceWidth / eliteLayout.screenSurfaceHeight <= 2.4);

const heroLayout = resolveOpenBoothPavilionLayout(getBoothArchitectureMetrics('hero_gallery'), 'hero');
assert.equal(heroLayout.isScreenFirstBooth, true);
assert.equal(heroLayout.showFullRoof, false);
assert.equal(heroLayout.showFrontageCanopy, false);
assert.equal(heroLayout.showTierSideBanners, false);
assert.equal(heroLayout.mediaSurfaceCount, 1);
assert.ok(heroLayout.depth / getBoothArchitectureMetrics('hero_gallery').footprintSize[1] <= 0.46);
assert.ok(heroLayout.screenFrameHeight >= 16);
assert.ok(heroLayout.screenSurfaceWidth / heroLayout.screenFrameWidth >= 0.99);
assert.ok(heroLayout.screenSurfaceHeight / heroLayout.screenFrameHeight >= 0.98);
assert.ok(heroLayout.screenSurfaceWidth / heroLayout.screenSurfaceHeight <= 2.4);
