import { buildExpoBoothLocalFootprint, type ExpoBoothLocalFootprint } from './lib/boothLocalFootprint.js';
import { buildSponsorBoulevardPlan, type SponsorBoulevardPlan } from './lib/boulevardLayout.js';
import {
  buildDistrictThemeMap,
  resolveDistrictThemeBySectorId,
  type DistrictThemeId,
  type ExpoDistrictTheme,
} from './lib/districtTheme.js';
import type { ExpoSceneCompany, ExpoSceneSector } from './sceneContract.js';

export type ExpoBoothPlacement = {
  id: string;
  company: ExpoSceneCompany & { booth: unknown };
  color: string;
  clusterIndex?: number;
  districtTheme: ExpoDistrictTheme;
  districtThemeId: DistrictThemeId;
  layoutFootprint?: SponsorBoulevardPlan['footprint'];
  localFootprint?: ExpoBoothLocalFootprint;
  nodeType?: SponsorBoulevardPlan['nodes'][number]['nodeType'];
  position: [number, number, number];
  priority?: number;
  rotation: [number, number, number];
  sectorId?: string;
  sectorName?: string;
  sponsorTier?: string;
  boothType?: string;
};

export type ExpoSectorMarker = {
  id: string;
  label: string;
  color: string;
  clusterIndex?: number;
  districtTheme: ExpoDistrictTheme;
  districtThemeId: DistrictThemeId;
  nodeType?: SponsorBoulevardPlan['sectorGateways'][number]['nodeType'];
  position: [number, number, number];
  side: 'left' | 'right';
  sectorId?: string | null;
};

export type ExpoBoothPlacementDiagnostics = SponsorBoulevardPlan['placementDiagnostics'];

function getNormalizedBooth(company: ExpoSceneCompany) {
  const rawBooth = company?.booth ?? null;

  if (Array.isArray(rawBooth)) {
    return rawBooth[0] || null;
  }

  if (rawBooth && typeof rawBooth === 'object') {
    return rawBooth;
  }

  return null;
}

export function buildExpoDistrictThemes(sectors: ExpoSceneSector[]) {
  return buildDistrictThemeMap(sectors);
}

export function buildExpoLayoutEngine(
  companies: ExpoSceneCompany[],
  sectors: ExpoSceneSector[],
) {
  const plan = buildSponsorBoulevardPlan(companies, sectors);
  const districtThemes = buildExpoDistrictThemes(sectors);
  const companiesById = new Map(companies.map((company) => [String(company.id), company]));

  const boothPlacements = plan.nodes
    .filter((node) => node.companyId)
    .map((node) => {
      const company = companiesById.get(String(node.companyId)) ?? ({ id: node.companyId } as ExpoSceneCompany);
      const districtTheme = resolveDistrictThemeBySectorId(node.sectorId, districtThemes);
      const normalizedCompany = {
        ...company,
        booth: getNormalizedBooth(company),
      } as ExpoSceneCompany & { booth: unknown };

      return {
        boothType: normalizedCompany.boothType,
        clusterIndex: node.clusterIndex,
        color: node.color,
        company: normalizedCompany,
        districtTheme,
        districtThemeId: districtTheme.id,
        id: String(node.companyId),
        layoutFootprint: plan.footprint,
        localFootprint: buildExpoBoothLocalFootprint({
          boothType: normalizedCompany.boothType,
          nodeType: node.nodeType,
          position: node.position,
          rotation: node.rotation,
          sponsorTier: node.sponsorTier,
        }),
        nodeType: node.nodeType,
        position: node.position,
        priority: node.priority,
        rotation: node.rotation,
        sectorId: node.sectorId ?? undefined,
        sectorName: node.sectorLabel,
        sponsorTier: node.sponsorTier,
      };
    });

  const sectorMarkers = plan.sectorGateways.map((node) => {
    const districtTheme = resolveDistrictThemeBySectorId(node.sectorId, districtThemes);
    return {
      clusterIndex: node.clusterIndex,
      color: node.color,
      districtTheme,
      districtThemeId: districtTheme.id,
      id: node.id,
      label: node.sectorLabel,
      nodeType: node.nodeType,
      position: node.position,
      sectorId: node.sectorId,
      side: node.position[0] < 0 ? 'left' : 'right',
    } satisfies ExpoSectorMarker;
  });

  return {
    boothPlacements: Object.assign(boothPlacements, { footprint: plan.footprint }),
    districtThemes,
    placementDiagnostics: plan.placementDiagnostics,
    plan,
    sectorMarkers,
  };
}
