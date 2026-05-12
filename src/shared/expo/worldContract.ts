import { buildExpoLayoutEngine, type ExpoBoothPlacement, type ExpoSectorMarker } from './layoutEngine.js';
import {
  buildExpoPlayBoundsFromPlacements,
  buildExpoWalkRegionContract,
  type ExpoPlayBounds,
  type ExpoWalkRegion,
  type ExpoWalkRegionContract,
} from './walkRegion.js';
import type {
  ExpoDistrictDowngradeReason,
  ExpoDistrictExpressionMode,
  ExpoDistrictProgramRole,
  ExpoDistrictSupportLevel,
  SponsorBoulevardPlan,
} from './lib/boulevardLayout.js';
import type { ExpoSceneCompany, ExpoSceneSector } from './sceneContract.js';

export type ExpoStartView = {
  lookAt: [number, number, number];
  position: [number, number, number];
  source: 'arrival-main';
};

export type ExpoWorldQualityProfileInputs = {
  boothCount: number;
  discoveryLaneCount: number;
  districtProgramNodeCount: number;
  districtProgramTargetCount: number;
  emptySectorDowngradeCount: number;
  footprintDepth: number;
  footprintWidth: number;
  frontageIntensityByDistrict: Record<string, number>;
  heroBoothCount: number;
  scenicEdgeCount: number;
  scenicWithoutAuthoredMomentCount: number;
  secondaryLoopCount: number;
  sectorCount: number;
  sectorPocketCount: number;
  sponsorBackedDistrictCount: number;
  unsupportedActiveDistrictCount: number;
};

export type ExpoDistrictVisualProfile = {
  clusterIndex: number;
  districtGlow: string;
  expressionMode: ExpoDistrictExpressionMode;
  frontageIntensity: number;
  groundAccent: string;
  groundBase: string;
  groundEdge: string;
  hudAccent: string;
  hudPanel: string;
  labelOpacity: number;
  screenFrame: string;
  sectorId: string | null;
  shellAccent: string;
  shellBase: string;
  skylineOpacity: number;
  skylineScale: number;
  supportLevel: ExpoDistrictSupportLevel;
};

export type ExpoWorldVisualProfile = {
  districts: ExpoDistrictVisualProfile[];
  global: {
    groundBase: string;
    groundEdge: string;
    hudAccent: string;
    hudPanel: string;
    skylineColor: string;
  };
};

export type ExpoDistrictProgramSummary = {
  authoredMomentCount: number;
  clusterIndex: number;
  depth: number;
  downgradeReason: ExpoDistrictDowngradeReason;
  expressionMode: ExpoDistrictExpressionMode;
  frontageIntensity: number;
  frontagePackage: {
    hasGroundEngagement: boolean;
    hasPrimaryScreenPlane: boolean;
    hasSecondarySupport: boolean;
  };
  isCommerciallyEligible: boolean;
  programNodeCount: number;
  programTargets: Array<{
    allocated: number;
    role: ExpoDistrictProgramRole;
    requested: number;
  }>;
  sectorId: string | null;
  sectorLabel: string;
  sponsorBackedFrontCount: number;
  supportLevel: ExpoDistrictSupportLevel;
  supportingNodeCount: number;
};

export type ExpoWorldContract = {
  boothPlacements: ExpoBoothPlacement[];
  districtPrograms: ExpoDistrictProgramSummary[];
  plan: SponsorBoulevardPlan;
  playBounds: ExpoPlayBounds;
  qualityProfileInputs: ExpoWorldQualityProfileInputs;
  routeContract: ExpoWalkRegionContract;
  sectorMarkers: ExpoSectorMarker[];
  startView: ExpoStartView;
  visualProfile: ExpoWorldVisualProfile;
  walkRegions: ExpoWalkRegion[];
};

export function buildExpoSponsorStartView(plan: Pick<SponsorBoulevardPlan, 'arrivalNode' | 'footprint'>): ExpoStartView {
  const centerX = (plan.footprint.minX + plan.footprint.maxX) * 0.5;
  const arrivalZ = plan.arrivalNode.position[2];

  return {
    lookAt: [centerX, 3.6, arrivalZ - 46],
    position: [centerX, 8.2, arrivalZ + 182],
    source: 'arrival-main',
  };
}

function getSceneCompanies(data: any): ExpoSceneCompany[] {
  return Array.isArray(data?.companies) ? data.companies : [];
}

function getSceneSectors(data: any): ExpoSceneSector[] {
  return Array.isArray(data?.sectors) ? data.sectors : [];
}

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function shadeHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value * (1 - ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function buildDistrictVisualProfile(district: ExpoDistrictProgramSummary): ExpoDistrictVisualProfile {
  const baseAccent = district.sectorId === null ? '#3b82f6' : shadeHex(tintHex('#2563eb', district.clusterIndex * 0.04), 0.02);
  const accent = district.expressionMode === 'active-commercial'
    ? tintHex(baseAccent, 0.1)
    : district.expressionMode === 'calm-dwell'
      ? tintHex(baseAccent, 0.18)
      : district.expressionMode === 'feature-court'
        ? tintHex(baseAccent, 0.14)
        : district.expressionMode === 'orientation'
          ? tintHex(baseAccent, 0.24)
          : tintHex(baseAccent, 0.2);

  switch (district.expressionMode) {
    case 'active-commercial':
      return {
        clusterIndex: district.clusterIndex,
        districtGlow: tintHex(accent, 0.18),
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundAccent: tintHex(accent, 0.08),
        groundBase: '#8e9aa3',
        groundEdge: '#0b1220',
        hudAccent: tintHex(accent, 0.2),
        hudPanel: 'rgba(10, 18, 30, 0.82)',
        labelOpacity: 0.74,
        screenFrame: '#08111c',
        sectorId: district.sectorId,
        shellAccent: accent,
        shellBase: '#101827',
        skylineOpacity: 0.66 + (district.frontageIntensity * 0.06),
        skylineScale: 1 + (district.frontageIntensity * 0.04),
        supportLevel: district.supportLevel,
      };
    case 'calm-dwell':
      return {
        clusterIndex: district.clusterIndex,
        districtGlow: tintHex(accent, 0.08),
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundAccent: '#cfd8df',
        groundBase: '#848f98',
        groundEdge: '#101826',
        hudAccent: '#c9d6e4',
        hudPanel: 'rgba(14, 20, 32, 0.78)',
        labelOpacity: 0.46,
        screenFrame: '#111b2a',
        sectorId: district.sectorId,
        shellAccent: '#d5dde6',
        shellBase: '#162234',
        skylineOpacity: 0.5,
        skylineScale: 0.96,
        supportLevel: district.supportLevel,
      };
    case 'feature-court':
      return {
        clusterIndex: district.clusterIndex,
        districtGlow: tintHex(accent, 0.14),
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundAccent: '#b7d4dd',
        groundBase: '#9ca7af',
        groundEdge: '#0d1522',
        hudAccent: tintHex(accent, 0.12),
        hudPanel: 'rgba(11, 18, 28, 0.8)',
        labelOpacity: 0.42,
        screenFrame: '#11202a',
        sectorId: district.sectorId,
        shellAccent: tintHex(accent, 0.22),
        shellBase: '#13212d',
        skylineOpacity: 0.54,
        skylineScale: 0.94,
        supportLevel: district.supportLevel,
      };
    case 'orientation':
    case 'satellite':
      return {
        clusterIndex: district.clusterIndex,
        districtGlow: '#a9bfd3',
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundAccent: '#c6d0d8',
        groundBase: '#8a959e',
        groundEdge: '#111827',
        hudAccent: '#bad2e8',
        hudPanel: 'rgba(10, 16, 25, 0.78)',
        labelOpacity: 0.38,
        screenFrame: '#132033',
        sectorId: district.sectorId,
        shellAccent: '#dbe5ef',
        shellBase: '#142131',
        skylineOpacity: 0.48,
        skylineScale: 0.92,
        supportLevel: district.supportLevel,
      };
    case 'scenic':
    default:
      return {
        clusterIndex: district.clusterIndex,
        districtGlow: '#8fb7c5',
        expressionMode: district.expressionMode,
        frontageIntensity: district.frontageIntensity,
        groundAccent: '#7aa08f',
        groundBase: '#86919a',
        groundEdge: '#101722',
        hudAccent: '#9fc0cf',
        hudPanel: 'rgba(9, 16, 25, 0.76)',
        labelOpacity: 0.34,
        screenFrame: '#12202d',
        sectorId: district.sectorId,
        shellAccent: '#b7cfd1',
        shellBase: '#12212b',
        skylineOpacity: 0.42,
        skylineScale: 0.9,
        supportLevel: district.supportLevel,
      };
  }
}

export function buildExpoWorldContract(data: any): ExpoWorldContract {
  const companies = getSceneCompanies(data);
  const sectors = getSceneSectors(data);
  const { boothPlacements, plan, sectorMarkers } = buildExpoLayoutEngine(companies, sectors);
  const playBounds = buildExpoPlayBoundsFromPlacements(boothPlacements, plan.footprint);
  const routeContract = buildExpoWalkRegionContract(boothPlacements, plan.footprint);
  const districtPrograms = plan.districts.map((district) => ({
    authoredMomentCount: district.authoredMomentCount,
    clusterIndex: district.clusterIndex,
    depth: district.depth,
    downgradeReason: district.downgradeReason,
    expressionMode: district.expressionMode,
    frontageIntensity: district.frontageIntensity,
    frontagePackage: district.frontagePackage,
    isCommerciallyEligible: district.isCommerciallyEligible,
    programNodeCount: district.programNodeIds.length,
    programTargets: district.programTargets.map((target) => ({
      allocated: target.allocated,
      role: target.role,
      requested: target.target,
    })),
    sectorId: district.sectorId,
    sectorLabel: district.sectorLabel,
    sponsorBackedFrontCount: district.sponsorBackedFrontCount,
    supportLevel: district.supportLevel,
    supportingNodeCount: district.supportingNodeCount,
  }));
  const visualDistricts = districtPrograms.map(buildDistrictVisualProfile);

  const sponsorBackedDistrictCount = districtPrograms.filter((district) => district.sponsorBackedFrontCount > 0).length;
  const unsupportedActiveDistrictCount = districtPrograms.filter(
    (district) => district.programTargets.some((target) => target.role === 'demo_stage' || target.role === 'info_pavilion')
      && !district.isCommerciallyEligible
      && district.expressionMode === 'active-commercial',
  ).length;
  const emptySectorDowngradeCount = districtPrograms.filter(
    (district) => district.sponsorBackedFrontCount === 0 && district.downgradeReason !== null,
  ).length;
  const scenicWithoutAuthoredMomentCount = districtPrograms.filter(
    (district) => (district.expressionMode === 'scenic' || district.expressionMode === 'feature-court') && district.authoredMomentCount < 2,
  ).length;

  return {
    boothPlacements,
    districtPrograms,
    plan,
    playBounds,
    qualityProfileInputs: {
      boothCount: boothPlacements.length,
      discoveryLaneCount: routeContract.discoveryLanes.length,
      districtProgramNodeCount: districtPrograms.reduce((sum, district) => sum + district.programNodeCount, 0),
      districtProgramTargetCount: districtPrograms.reduce((sum, district) => sum + district.programTargets.reduce((inner, target) => inner + target.requested, 0), 0),
      emptySectorDowngradeCount,
      footprintDepth: plan.footprint.maxZ - plan.footprint.minZ,
      footprintWidth: plan.footprint.maxX - plan.footprint.minX,
      frontageIntensityByDistrict: Object.fromEntries(districtPrograms.map((district) => [district.sectorId ?? `cluster-${district.clusterIndex}`, district.frontageIntensity])),
      heroBoothCount: boothPlacements.filter((placement) => placement.nodeType === 'hero_left' || placement.nodeType === 'hero_right').length,
      scenicEdgeCount: routeContract.scenicEdges.length,
      scenicWithoutAuthoredMomentCount,
      secondaryLoopCount: routeContract.secondaryLoops.length,
      sectorCount: sectors.length,
      sectorPocketCount: routeContract.sectorPockets.length,
      sponsorBackedDistrictCount,
      unsupportedActiveDistrictCount,
    },
    routeContract,
    sectorMarkers,
    startView: buildExpoSponsorStartView(plan),
    visualProfile: {
      districts: visualDistricts,
      global: {
        groundBase: '#88949d',
        groundEdge: '#0c1320',
        hudAccent: visualDistricts.find((district) => district.expressionMode === 'active-commercial')?.hudAccent ?? '#9ed6f3',
        hudPanel: 'rgba(10, 17, 28, 0.82)',
        skylineColor: '#a3b6c8',
      },
    },
    walkRegions: routeContract.walkRegions,
  };
}
