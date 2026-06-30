import assert from 'node:assert/strict';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';
import { buildManagedScreenAssignmentOverrides } from '../runtime/world/managedScreenContentAssignments.js';
import { buildCanonicalWorldPlanFromWorldContract } from '../runtime/planning/index.js';
import { PRODUCTION_SAFE_COMPANIES, PRODUCTION_SAFE_SECTORS } from '../state/expoRuntime.js';

const companiesWithManagedScreen = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      heroScreenImageUrl: 'https://cdn.example.com/sponsor-concierge-screen.webp',
      heroScreenSlotId: 'city-right-marquee-hero',
      heroScreenStatus: 'published',
      heroScreenText: 'Managed sponsor message for city inventory',
      heroScreenTitle: 'Sponsor Concierge Campaign',
      heroScreenType: 'image',
    },
  };
});

const world = buildExpoWorldContract({
  companies: companiesWithManagedScreen,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const plan = buildCanonicalWorldPlanFromWorldContract(world);
const overrides = buildManagedScreenAssignmentOverrides({
  assignments: plan.screenAssignments,
  boothPlacements: world.boothPlacements,
  sockets: plan.screenSockets,
});
const override = overrides.overridesByAssignmentId.get('screen-marquee-right-1-socket-assignment');

assert.equal(overrides.activeOverrideCount, 1);
assert.equal(overrides.publishedCitySlotCount, 1);
assert.ok(override);
assert.equal(override.assignment.companyId, 'sponsor-concierge');
assert.equal(override.assignment.label, 'Sponsor Concierge Campaign');
assert.equal(override.assignment.imageUrl, 'https://cdn.example.com/sponsor-concierge-screen.webp');
assert.equal(override.source.screenSlotId, 'city-right-marquee-hero');

const companiesWithBoothOwnedSlot = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      heroScreenImageUrl: 'https://cdn.example.com/booth-owned-screen.webp',
      heroScreenSlotId: 'booth-sponsor-concierge-main-screen',
      heroScreenStatus: 'published',
      heroScreenTitle: 'Booth Screen Only',
      heroScreenType: 'image',
    },
  };
});
const boothOwnedWorld = buildExpoWorldContract({
  companies: companiesWithBoothOwnedSlot,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const boothOwnedPlan = buildCanonicalWorldPlanFromWorldContract(boothOwnedWorld);
const boothOwnedOverrides = buildManagedScreenAssignmentOverrides({
  assignments: boothOwnedPlan.screenAssignments,
  boothPlacements: boothOwnedWorld.boothPlacements,
  sockets: boothOwnedPlan.screenSockets,
});

assert.equal(boothOwnedOverrides.activeOverrideCount, 0);
assert.equal(boothOwnedOverrides.publishedCitySlotCount, 0);

const companiesWithManagedVideoScreen = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      heroScreenImageUrl: 'https://cdn.example.com/sponsor-concierge-video-poster.webp',
      heroScreenSlotId: 'city-right-marquee-hero',
      heroScreenStatus: 'published',
      heroScreenText: 'Live managed sponsor video',
      heroScreenTitle: 'Sponsor Concierge Live Video',
      heroScreenType: 'video',
      heroScreenVideoUrl: 'https://cdn.example.com/sponsor-concierge-live.mp4',
    },
  };
});
const videoWorld = buildExpoWorldContract({
  companies: companiesWithManagedVideoScreen,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const videoPlan = buildCanonicalWorldPlanFromWorldContract(videoWorld);
const videoOverrides = buildManagedScreenAssignmentOverrides({
  assignments: videoPlan.screenAssignments,
  boothPlacements: videoWorld.boothPlacements,
  sockets: videoPlan.screenSockets,
});
const videoOverride = videoOverrides.overridesByAssignmentId.get('screen-marquee-right-1-socket-assignment');
const videoPrimitive = (videoOverride?.assignment.renderIntent?.primitives ?? []).find((primitive) => primitive.kind === 'texture-plane');

assert.ok(videoOverride);
assert.equal(videoOverride.assignment.imageUrl, 'https://cdn.example.com/sponsor-concierge-live.mp4');
assert.equal(videoOverride.source.mode, 'video');
assert.ok(videoPrimitive);
assert.equal(videoPrimitive.kind, 'texture-plane');
if (videoPrimitive.kind === 'texture-plane') {
  assert.equal(videoPrimitive.posterUrl, 'https://cdn.example.com/sponsor-concierge-video-poster.webp');
}

console.log('managed screen assignment override checks passed');
