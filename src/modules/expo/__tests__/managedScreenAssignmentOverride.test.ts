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
      cityScreenImageUrl: 'https://cdn.example.com/sponsor-concierge-screen.webp',
      cityScreenSlotId: 'city-right-marquee-hero',
      cityScreenStatus: 'published',
      cityScreenText: 'Managed sponsor message for city inventory',
      cityScreenTitle: 'Sponsor Concierge Campaign',
      cityScreenType: 'image',
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
assert.equal(override.assignment.commercial?.ownerLabel, 'Sponsor Concierge');
assert.equal(override.assignment.commercial?.mediaMode, 'image');
assert.equal(override.assignment.commercial?.source, 'managed-screen');
assert.equal(override.assignment.commercial?.qualityTierBehavior, 'static-billboard');
assert.ok(override.assignment.commercial?.fallbackImageUrl.startsWith('generated-billboard:'));
assert.equal(override.source.screenSlotId, 'city-right-marquee-hero');

const companiesWithBoothOwnedSlot = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      cityScreenImageUrl: null,
      cityScreenSlotId: null,
      cityScreenStatus: null,
      cityScreenText: null,
      cityScreenTitle: null,
      cityScreenType: null,
      cityScreenVideoUrl: null,
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
      cityScreenImageUrl: 'https://cdn.example.com/sponsor-concierge-video-poster.webp',
      cityScreenSlotId: 'city-right-marquee-hero',
      cityScreenStatus: 'published',
      cityScreenText: 'Live managed sponsor video',
      cityScreenTitle: 'Sponsor Concierge Live Video',
      cityScreenType: 'video',
      cityScreenVideoUrl: 'https://cdn.example.com/sponsor-concierge-live.mp4',
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
assert.equal(videoOverride.assignment.commercial?.mediaMode, 'video');
assert.equal(videoOverride.assignment.commercial?.qualityTierBehavior, 'video-budgeted-by-quality-and-distance');
assert.equal(videoOverride.source.mode, 'video');
assert.ok(videoPrimitive);
assert.equal(videoPrimitive.kind, 'texture-plane');
if (videoPrimitive.kind === 'texture-plane') {
  assert.equal(videoPrimitive.posterUrl, 'https://cdn.example.com/sponsor-concierge-video-poster.webp');
}

const companiesWithVideoPlaceholderScreen = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      cityScreenImageUrl: 'https://cdn.example.com/sponsor-concierge-placeholder.webp',
      cityScreenSlotId: 'city-right-marquee-hero',
      cityScreenStatus: 'published',
      cityScreenText: 'Static poster while sponsor video is prepared',
      cityScreenTitle: 'Sponsor Concierge Video Slot',
      cityScreenType: 'video-placeholder',
      cityScreenVideoUrl: 'https://cdn.example.com/sponsor-concierge-placeholder.mp4',
    },
  };
});
const placeholderWorld = buildExpoWorldContract({
  companies: companiesWithVideoPlaceholderScreen,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const placeholderPlan = buildCanonicalWorldPlanFromWorldContract(placeholderWorld);
const placeholderOverrides = buildManagedScreenAssignmentOverrides({
  assignments: placeholderPlan.screenAssignments,
  boothPlacements: placeholderWorld.boothPlacements,
  sockets: placeholderPlan.screenSockets,
});
const placeholderOverride = placeholderOverrides.overridesByAssignmentId.get('screen-marquee-right-1-socket-assignment');
const placeholderPrimitive = (placeholderOverride?.assignment.renderIntent?.primitives ?? []).find((primitive) => primitive.kind === 'texture-plane');

assert.ok(placeholderOverride);
assert.equal(placeholderOverride.assignment.imageUrl, 'https://cdn.example.com/sponsor-concierge-placeholder.webp');
assert.equal(placeholderOverride.assignment.commercial?.mediaMode, 'video-placeholder');
assert.equal(placeholderOverride.assignment.commercial?.qualityTierBehavior, 'static-billboard');
assert.ok(placeholderPrimitive);
assert.equal(placeholderPrimitive.kind, 'texture-plane');
if (placeholderPrimitive.kind === 'texture-plane') {
  assert.equal(placeholderPrimitive.url, 'https://cdn.example.com/sponsor-concierge-placeholder.webp');
}

const companiesWithMalformedManagedScreen = PRODUCTION_SAFE_COMPANIES.map((company) => {
  if (company.id !== 'sponsor-concierge') {
    return company;
  }

  return {
    ...company,
    booth: {
      ...company.booth,
      cityScreenImageUrl: 'http://internal.local/sponsor-concierge-screen.svg',
      cityScreenSlotId: 'city-right-marquee-hero',
      cityScreenStatus: 'published',
      cityScreenText: 'Malformed sponsor media should fall back safely',
      cityScreenTitle: 'Sponsor Concierge Unsafe Media',
      cityScreenType: 'image',
    },
  };
});
const malformedWorld = buildExpoWorldContract({
  companies: companiesWithMalformedManagedScreen,
  sectors: PRODUCTION_SAFE_SECTORS,
});
const malformedPlan = buildCanonicalWorldPlanFromWorldContract(malformedWorld);
const malformedOverrides = buildManagedScreenAssignmentOverrides({
  assignments: malformedPlan.screenAssignments,
  boothPlacements: malformedWorld.boothPlacements,
  sockets: malformedPlan.screenSockets,
});
const malformedOverride = malformedOverrides.overridesByAssignmentId.get('screen-marquee-right-1-socket-assignment');
const malformedPrimitive = (malformedOverride?.assignment.renderIntent?.primitives ?? []).find((primitive) => primitive.kind === 'texture-plane');

assert.ok(malformedOverride);
assert.equal(malformedOverride.assignment.commercial?.mediaMode, 'generated-card');
assert.ok(malformedOverride.assignment.commercial?.fallbackImageUrl.startsWith('generated-billboard:'));
assert.ok(malformedPrimitive);
assert.equal(malformedPrimitive.kind, 'texture-plane');
if (malformedPrimitive.kind === 'texture-plane') {
  assert.ok(malformedPrimitive.url?.startsWith('generated-billboard:'));
}

console.log('managed screen assignment override checks passed');
