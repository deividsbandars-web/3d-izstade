import { buildExpoBoothRoute } from './expoBoothRoutes';

export type SponsorScreenInteractionCandidate = {
  companyId?: string | null;
  companySlug?: string | null;
  ctaLabel?: string | null;
  id: string;
  label?: string | null;
  title?: string | null;
};

export type SponsorScreenResolvedAction =
  | {
      analytics: {
        actionKind: 'screen-route';
        companyId: string;
        label: string;
        route: string;
        sourceId: string;
      };
      companyId: string;
      kind: 'route';
      label: string;
      route: string;
      sourceId: string;
    }
  | {
      companyId?: string;
      kind: 'none';
      label?: string;
      reason: 'missing-company-id';
      sourceId: string;
    };

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildRouteLabel(candidate: SponsorScreenInteractionCandidate) {
  return normalizeText(candidate.ctaLabel)
    ?? normalizeText(candidate.title)
    ?? normalizeText(candidate.label)
    ?? 'Open Sponsor Booth';
}

export function resolveSponsorScreenInteraction(
  candidate: SponsorScreenInteractionCandidate
): SponsorScreenResolvedAction {
  const companyId = normalizeText(candidate.companyId);
  const companySlug = normalizeText(candidate.companySlug);

  if (!companyId) {
    return {
      kind: 'none',
      reason: 'missing-company-id',
      sourceId: candidate.id,
    };
  }

  const route = buildExpoBoothRoute({
    companyId,
    companySlug,
  });

  if (!route) {
    return {
      kind: 'none',
      reason: 'missing-company-id',
      sourceId: candidate.id,
    };
  }

  return {
    analytics: {
      actionKind: 'screen-route',
      companyId,
      label: buildRouteLabel(candidate),
      route,
      sourceId: candidate.id,
    },
    companyId,
    kind: 'route',
    label: buildRouteLabel(candidate),
    route,
    sourceId: candidate.id,
  };
}
