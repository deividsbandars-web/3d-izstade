import {
  buildRearCampusMetrics,
  buildRearCampusPerimeterConnectors,
  buildVisibleRearCampusForecourts,
  buildVisibleRearCampusLandmarkTowers,
  buildVisibleRearCampusSidePavilions,
} from '../../../world/ExpoRearCampusLayout';
import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type {
  CanonicalPrimitive,
  CityTower,
  RearCampusLandmarkTower,
  RearCampusZoneExtension,
  ExpoZonePlannerContext,
} from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';

function mapRearCampusLandmarkTowers(
  towers: ReturnType<typeof buildVisibleRearCampusLandmarkTowers>
): RearCampusLandmarkTower[] {
  return towers.map((tower) => ({
    id: tower.id,
    position: tower.position,
  }));
}

function buildRearCampusTower(tower: RearCampusLandmarkTower, crownColor: string): CityTower {
  const renderIntent = {
    crownBandEmissiveIntensity: 0.036,
    crownPlateEmissiveIntensity: 0.05,
    hidden: false,
    insetEmissive: 0.018,
    midBandEmissiveIntensity: 0.03,
    podiumDepthMultiplier: 1.7,
    podiumEmissiveIntensity: 0.012,
    podiumWidthMultiplier: 1.65,
    rearFinEmissive: 0.018,
    showCrownPlate: true,
    showCrownPods: true,
    showInsetMass: true,
    showMidBand: true,
    showRearFin: true,
    showSideFin: true,
    showSpire: true,
    sideFinEmissive: 0.026,
    skipBase: false,
    rearFinHeight: 48,
    sideFinHeight: 72,
    crownBandHeight: 12,
    midBandHeight: 18,
  } as const;
  const side = tower.position[0] < 0 ? -1 : 1;
  const baseSize: [number, number, number] = [188, 576, 146];
  const upperSize: [number, number, number] = [52, 62, 52];
  const podiumWidth = baseSize[0] * renderIntent.podiumWidthMultiplier;
  const podiumDepth = baseSize[2] * renderIntent.podiumDepthMultiplier;
  const primitives: CanonicalPrimitive[] = [
    { color: '#d9e4ea', emissive: crownColor, emissiveIntensity: renderIntent.podiumEmissiveIntensity, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.08, 0], roughness: 0.66, size: [podiumWidth, baseSize[1] * 0.16, podiumDepth] },
    { color: '#708596', emissive: crownColor, emissiveIntensity: 0.01, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.5, 0], roughness: 0.74, size: baseSize },
    { color: '#94a6b2', emissive: crownColor, emissiveIntensity: 0.012, kind: 'box', metalness: 0.06, position: [0, baseSize[1] + (upperSize[1] * 0.5) - 18, 0], roughness: 0.66, size: upperSize },
    { color: '#6f7b85', emissive: crownColor, emissiveIntensity: renderIntent.sideFinEmissive, kind: 'box', metalness: 0.06, position: [side * (baseSize[0] * 0.38), baseSize[1] * 0.58, 0], roughness: 0.66, size: [baseSize[0] * 0.16, renderIntent.sideFinHeight, baseSize[2] * 0.48] },
    { color: '#65717b', emissive: crownColor, emissiveIntensity: renderIntent.rearFinEmissive, kind: 'box', metalness: 0.06, position: [0, baseSize[1] * 0.58, -baseSize[2] * 0.28], roughness: 0.66, size: [baseSize[0] * 0.42, renderIntent.rearFinHeight, baseSize[2] * 0.18] },
    { color: '#5f6a73', emissive: crownColor, emissiveIntensity: renderIntent.insetEmissive, kind: 'box', metalness: 0.06, position: [-side * (baseSize[0] * 0.22), baseSize[1] * 0.32, 0], roughness: 0.66, size: [baseSize[0] * 0.38, baseSize[1] * 0.2, baseSize[2] * 0.4] },
    { color: crownColor, emissive: crownColor, emissiveIntensity: renderIntent.crownPlateEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] - 8, 0], roughness: 0.34, size: [baseSize[0] * 0.62, 1.8, baseSize[2] * 0.62] },
    { color: '#7b8a95', emissive: crownColor, emissiveIntensity: renderIntent.midBandEmissiveIntensity, kind: 'box', metalness: 0.14, position: [0, baseSize[1] + (upperSize[1] * 0.48), 0], roughness: 0.44, size: [upperSize[0] * 1.08, renderIntent.midBandHeight, upperSize[2] * 0.34] },
    { color: '#778692', emissive: crownColor, emissiveIntensity: renderIntent.crownBandEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] + 6, 0], roughness: 0.42, size: [upperSize[0] * 0.78, renderIntent.crownBandHeight, upperSize[2] * 0.78] },
    { color: '#8897a3', emissive: crownColor, emissiveIntensity: 0.03, kind: 'box', metalness: 0.16, position: [side * (upperSize[0] * 0.36), baseSize[1] + upperSize[1] + 3, 0], roughness: 0.42, size: [upperSize[0] * 0.14, renderIntent.crownBandHeight + 6, upperSize[2] * 0.26] },
    { color: '#7f8d98', emissive: crownColor, emissiveIntensity: 0.022, kind: 'box', metalness: 0.14, position: [-side * (upperSize[0] * 0.26), baseSize[1] + upperSize[1] - 2, -upperSize[2] * 0.12], roughness: 0.44, size: [upperSize[0] * 0.18, renderIntent.crownBandHeight + 4, upperSize[2] * 0.18] },
    { color: '#a2b3bf', emissive: crownColor, emissiveIntensity: 0.036, kind: 'box', metalness: 0.16, position: [0, baseSize[1] + upperSize[1] + 22, 0], roughness: 0.34, size: [upperSize[0] * 0.48, 24, upperSize[2] * 0.48] },
    { color: '#c0d2de', emissive: crownColor, emissiveIntensity: 0.05, kind: 'cylinder', metalness: 0.22, position: [0, baseSize[1] + upperSize[1] + 44, 0], radialSegments: 12, radiusBottom: upperSize[0] * 0.18, radiusTop: upperSize[0] * 0.12, roughness: 0.26, height: 18 },
  ];

  return {
    id: tower.id,
    position: tower.position,
    baseSize,
    upperSize,
    color: '#708596',
    composition: 'hero',
    crownColor,
    renderIntent: { ...renderIntent, primitives },
    role: 'hero',
    sections: ['middle'],
  };
}

export function buildRearCampusZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('rear-campus');
  const metrics = buildRearCampusMetrics(context.inputs.boothPlacements);
  const forecourts = buildVisibleRearCampusForecourts(metrics.campusCenterZ).map((plane) => ({
    color: plane.color,
    id: plane.id,
    position: plane.position,
    size: plane.size,
  }));
  const sidePavilions = buildVisibleRearCampusSidePavilions(metrics.campusCenterZ).map((pavilion) => ({
    accentSide: pavilion.accentSide,
    id: pavilion.id,
    position: pavilion.position,
    size: pavilion.size,
  }));
  const landmarkTowers = mapRearCampusLandmarkTowers(buildVisibleRearCampusLandmarkTowers(metrics.campusCenterZ));
  const perimeterConnectors = buildRearCampusPerimeterConnectors(metrics.campusCenterZ).map((connector) => ({
    accent: connector.accent,
    id: connector.id,
    position: connector.position,
    size: connector.size,
  }));
  const screenSurfaces = buildZoneScreenSurfacePlan({
    campusCenterZ: metrics.campusCenterZ,
    inputs: context.inputs,
    landmarkTowers,
    zoneId: 'rear-campus',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'rear-campus');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('rear-campus', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'rear-campus',
  });

  const zoneExtension: RearCampusZoneExtension = {
    campusCenterZ: metrics.campusCenterZ,
    feedSocketIds: {
      bowl: screenSockets.find((socket) => socket.id.includes('rear-campus-bowl-feed-surface'))?.id ?? null,
      leftTower: screenSockets.find((socket) => socket.id.includes('rear-campus-landmark-left'))?.id ?? null,
      rightTower: screenSockets.find((socket) => socket.id.includes('rear-campus-landmark-right'))?.id ?? null,
    },
    forecourts,
    landmarkTowers,
    perimeterConnectors,
    sidePavilions,
    stadiumBackWallZ: metrics.stadiumBackWallZ,
  };

  return createZonePlan({
    assignments,
    context,
    id: 'rear-campus',
    masses: perimeterConnectors.map((connector) => ({
      color: connector.accent === 'cap' ? '#98a4ad' : '#81909a',
      id: connector.id,
      position: connector.position,
      size: connector.size,
    })),
    planes: forecourts.map((plane) => ({
      color: plane.color,
      id: plane.id,
      position: plane.position,
      role: 'decorative',
      size: plane.size,
    })),
    screenSockets,
    screenSurfaces,
    towers: landmarkTowers.map((tower) => buildRearCampusTower(tower, context.inputs.visualProfile.global.hudAccent)),
    zoneExtension: {
      rearCampus: zoneExtension,
    },
  });
}
