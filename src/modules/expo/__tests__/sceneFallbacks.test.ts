import assert from 'node:assert/strict';
import { buildSponsorBoothPresentation } from '../lib/sponsorBoothPresentation.js';
import { buildDevFallbackScene, buildProductionSafeFallbackScene } from '../lib/sceneFallbacks.js';

const productionFallback = buildProductionSafeFallbackScene();

assert.equal(productionFallback.sceneVersion, 'expo-scene-production-safe-fallback');
assert.equal(productionFallback.releaseMode, 'sponsor-boulevard');
assert.ok(productionFallback.sectors.length > 0);
assert.ok(productionFallback.companies.length > 0);
assert.ok(productionFallback.companies.every((company) => company.website || company.bookingUrl || company.slug || company.id));

const productionPresentations = productionFallback.companies.map((company) => (
  buildSponsorBoothPresentation(company, company.booth, company.boothType)
));

assert.ok(productionPresentations.every((presentation) => presentation.actions.length > 0));
assert.ok(productionPresentations.every((presentation) => presentation.posterUrl === null));
assert.ok(productionPresentations.every((presentation) => presentation.videoUrl === null));
assert.ok(productionPresentations.every((presentation) => presentation.logoUrl === null));

const devFallback = buildDevFallbackScene();

assert.equal(devFallback.sceneVersion, 'expo-scene-dev-fallback');
assert.ok(devFallback.sectors.length > 0);
assert.ok(devFallback.companies.length > 0);
