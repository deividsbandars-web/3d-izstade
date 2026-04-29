import assert from 'node:assert/strict';
import { resolveSponsorScreenInteraction } from '../lib/sponsorScreenInteractionResolver.js';

const routeCandidate = {
  companyId: 'hero-1',
  ctaLabel: 'Open Showroom',
  id: 'facade-screen-hero',
  label: 'Warpala Platform',
  title: 'Warpala Platform',
} as const;

const resolvedRoute = resolveSponsorScreenInteraction(routeCandidate);

assert.deepEqual(resolvedRoute, {
  analytics: {
    actionKind: 'screen-route',
    companyId: 'hero-1',
    label: 'Open Showroom',
    route: '/expo/booth/hero-1',
    sourceId: 'facade-screen-hero',
  },
  companyId: 'hero-1',
  kind: 'route',
  label: 'Open Showroom',
  route: '/expo/booth/hero-1',
  sourceId: 'facade-screen-hero',
});

const titleFallback = resolveSponsorScreenInteraction({
  companyId: 'gold-1',
  ctaLabel: '   ',
  id: 'medium-screen-gold-1-0',
  label: 'Sponsor Concierge',
  title: 'Premium Concierge',
});

assert.deepEqual(titleFallback, {
  analytics: {
    actionKind: 'screen-route',
    companyId: 'gold-1',
    label: 'Premium Concierge',
    route: '/expo/booth/gold-1',
    sourceId: 'medium-screen-gold-1-0',
  },
  companyId: 'gold-1',
  kind: 'route',
  label: 'Premium Concierge',
  route: '/expo/booth/gold-1',
  sourceId: 'medium-screen-gold-1-0',
});

const labelFallback = resolveSponsorScreenInteraction({
  companyId: 'std-1',
  ctaLabel: null,
  id: 'ground-screen-sector-a',
  label: 'District Demo',
  title: '',
});

assert.deepEqual(labelFallback, {
  analytics: {
    actionKind: 'screen-route',
    companyId: 'std-1',
    label: 'District Demo',
    route: '/expo/booth/std-1',
    sourceId: 'ground-screen-sector-a',
  },
  companyId: 'std-1',
  kind: 'route',
  label: 'District Demo',
  route: '/expo/booth/std-1',
  sourceId: 'ground-screen-sector-a',
});

const missingCompanyId = resolveSponsorScreenInteraction({
  companyId: '  ',
  ctaLabel: 'Enter',
  id: 'ground-screen-arrival',
  label: 'Arrival',
  title: 'Arrival',
});

assert.deepEqual(missingCompanyId, {
  kind: 'none',
  reason: 'missing-company-id',
  sourceId: 'ground-screen-arrival',
});

const originalCandidate = {
  companyId: 'premium-1',
  ctaLabel: 'Open',
  id: 'facade-screen-premium',
  label: 'Premium Brand',
  title: 'Premium Brand',
};
const snapshot = { ...originalCandidate };

resolveSponsorScreenInteraction(originalCandidate);

assert.deepEqual(originalCandidate, snapshot);
