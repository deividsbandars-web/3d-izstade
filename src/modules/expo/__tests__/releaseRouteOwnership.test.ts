import assert from 'node:assert/strict';
import {
  RELEASE_PRIMARY_NAV_ITEMS,
  RELEASE_ROUTE_OWNERSHIP,
  RELEASE_UTILITY_NAV_ITEMS,
  buildReleaseLoginHref,
  canOpenReleaseRoute,
  getReleaseRouteOwnership,
  hasExplicitOperatorMode,
} from '../../../config/releaseRouteOwnership';

const primaryNavPaths = RELEASE_PRIMARY_NAV_ITEMS.map((item) => item.path);
const utilityNavPaths = RELEASE_UTILITY_NAV_ITEMS.map((item) => item.path);

assert.deepEqual(primaryNavPaths, [
  '/expo-3d',
  '/expo/sponsor-packages',
  '/expo/booth-marketplace',
  '/modular-homes/studio',
  '/calculators',
]);
assert.deepEqual(utilityNavPaths, [
  '/expo/admin',
  '/expo/sponsor-leads',
]);

const internalOrDemoPaths = RELEASE_ROUTE_OWNERSHIP
  .filter((entry) => entry.status !== 'ship')
  .map((entry) => entry.path);

internalOrDemoPaths.forEach((path) => {
  assert.equal(primaryNavPaths.includes(path), false, `${path} must not be promoted in release primary nav`);
  assert.equal(utilityNavPaths.includes(path), false, `${path} must not be promoted in release utility nav`);
});

assert.equal(getReleaseRouteOwnership('/expo-3d')?.status, 'ship');
assert.equal(getReleaseRouteOwnership('/dashboard')?.status, 'internal');
assert.equal(getReleaseRouteOwnership('/generator')?.status, 'demo-only');
assert.equal(getReleaseRouteOwnership('/expo/admin')?.path, '/expo/admin');
assert.equal(getReleaseRouteOwnership('/platform/dashboard/team')?.status, 'internal');
assert.equal(getReleaseRouteOwnership('/expo/city-screens')?.status, 'ship');

assert.equal(buildReleaseLoginHref('/expo/admin/team'), '/login?next=/expo/admin');
assert.equal(buildReleaseLoginHref('/expo/sponsor-leads'), '/login?next=/expo/sponsor-leads');
assert.equal(buildReleaseLoginHref('/modular-homes/quotes/quote-1'), '/login?next=/modular-homes/quotes');
assert.equal(buildReleaseLoginHref('/expo-3d'), '/login');

assert.equal(hasExplicitOperatorMode('?operator=1'), true);
assert.equal(hasExplicitOperatorMode('?operator=0'), false);
assert.equal(canOpenReleaseRoute('/expo-3d'), true);
assert.equal(canOpenReleaseRoute('/dashboard'), false);
assert.equal(canOpenReleaseRoute('/dashboard', '?operator=1'), true);
assert.equal(canOpenReleaseRoute('/generator', '?operator=1', { demoRoutesEnabled: false }), false);
assert.equal(canOpenReleaseRoute('/generator', '?operator=1', { demoRoutesEnabled: true }), true);
