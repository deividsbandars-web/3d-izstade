import { buildSponsorBoothPresentation, resolveSponsorCtaIntent } from './sponsorBoothPresentation';
import type { ExpoSceneCompany, ExpoSceneData } from '../types/scene';

export type SponsorRoomRecord = {
  boothId: string | null;
  brochureUrl: string | null;
  company: ExpoSceneCompany;
  presentation: ReturnType<typeof buildSponsorBoothPresentation>;
  sectorName: string | null;
  slugOrId: string;
};

function normalizeRouteToken(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized.toLowerCase() : null;
}

export function resolveSponsorRoomRecord(scene: ExpoSceneData, routeId: string | undefined): SponsorRoomRecord | null {
  const routeToken = normalizeRouteToken(routeId);
  if (!routeToken) {
    return null;
  }

  const company = scene.companies.find((candidate) => {
    const companyId = normalizeRouteToken(candidate.id);
    const companySlug = normalizeRouteToken(candidate.slug || undefined);
    const boothId = normalizeRouteToken(candidate.booth?.id || undefined);
    const boothSlug = normalizeRouteToken(candidate.booth?.slug || undefined);

    return routeToken === companyId || routeToken === companySlug || routeToken === boothId || routeToken === boothSlug;
  });

  if (!company) {
    return null;
  }

  const presentation = buildSponsorBoothPresentation(company, company.booth);
  const sectorId = company.sectorId ?? company.sector_id ?? null;
  const sectorName = scene.sectors.find((sector) => sector.id === sectorId)?.name ?? null;

  return {
    boothId: company.booth?.id ?? null,
    brochureUrl: presentation.posterUrl,
    company,
    presentation,
    sectorName,
    slugOrId: company.slug || company.id,
  };
}

export function buildSponsorRoomActions(record: SponsorRoomRecord) {
  const brochureAction = record.brochureUrl
    ? {
        kind: 'brochure' as const,
        intent: { type: 'external' as const, target: record.brochureUrl },
        label: 'Open Brochure',
      }
    : null;

  const primaryActions = record.presentation.actions
    .map((action) => ({
      action,
      intent: resolveSponsorCtaIntent(action, record.presentation),
    }))
    .filter((
      entry
    ): entry is {
      action: typeof entry.action;
      intent: NonNullable<typeof entry.intent>;
    } => entry.intent !== null);

  return {
    brochureAction,
    primaryActions,
  };
}
