import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type { CanonicalPrimitive, CityTower, ExpoZonePlannerContext } from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';
import { buildTowerClusterZoneGeometry } from './geometry';

function buildTowerPrimitives(tower: CityTower, renderIntent: NonNullable<CityTower['renderIntent']>): CanonicalPrimitive[] {
  const side = tower.position[0] < 0 ? -1 : 1;
  const podiumWidth = tower.baseSize[0] * renderIntent.podiumWidthMultiplier;
  const podiumDepth = tower.baseSize[2] * renderIntent.podiumDepthMultiplier;
  const primitives: CanonicalPrimitive[] = [
    { color: '#d9e4ea', emissive: tower.crownColor, emissiveIntensity: renderIntent.podiumEmissiveIntensity, kind: 'box', metalness: 0.06, position: [0, tower.baseSize[1] * 0.08, 0], roughness: 0.66, size: [podiumWidth, tower.baseSize[1] * 0.16, podiumDepth] },
    { color: tower.color, emissive: tower.crownColor, emissiveIntensity: 0.01, kind: 'box', metalness: 0.06, position: [0, tower.baseSize[1] * 0.5, 0], roughness: 0.74, size: tower.baseSize },
    { color: '#94a6b2', emissive: tower.crownColor, emissiveIntensity: 0.012, kind: 'box', metalness: 0.06, position: [0, tower.baseSize[1] + (tower.upperSize[1] * 0.5) - 18, 0], roughness: 0.66, size: tower.upperSize },
  ];

  if (renderIntent.showSideFin) {
    primitives.push({ color: '#6f7b85', emissive: tower.crownColor, emissiveIntensity: renderIntent.sideFinEmissive, kind: 'box', metalness: 0.06, position: [side * (tower.baseSize[0] * 0.38), tower.baseSize[1] * 0.58, 0], roughness: 0.66, size: [tower.baseSize[0] * 0.16, renderIntent.sideFinHeight, tower.baseSize[2] * 0.48] });
  }
  if (renderIntent.showRearFin) {
    primitives.push({ color: '#65717b', emissive: tower.crownColor, emissiveIntensity: renderIntent.rearFinEmissive, kind: 'box', metalness: 0.06, position: [0, tower.baseSize[1] * 0.58, -tower.baseSize[2] * 0.28], roughness: 0.66, size: [tower.baseSize[0] * 0.42, renderIntent.rearFinHeight, tower.baseSize[2] * 0.18] });
  }
  if (renderIntent.showInsetMass) {
    primitives.push({ color: '#5f6a73', emissive: tower.crownColor, emissiveIntensity: renderIntent.insetEmissive, kind: 'box', metalness: 0.06, position: [-side * (tower.baseSize[0] * 0.22), tower.baseSize[1] * 0.32, 0], roughness: 0.66, size: [tower.baseSize[0] * 0.38, tower.baseSize[1] * 0.2, tower.baseSize[2] * 0.4] });
  }
  if (renderIntent.showCrownPlate) {
    primitives.push({ color: tower.crownColor, emissive: tower.crownColor, emissiveIntensity: renderIntent.crownPlateEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, tower.baseSize[1] + tower.upperSize[1] - 8, 0], roughness: 0.34, size: [tower.baseSize[0] * 0.62, 1.8, tower.baseSize[2] * 0.62] });
  }
  if (renderIntent.showMidBand && renderIntent.midBandHeight > 0) {
    primitives.push({ color: tower.role === 'hero' ? '#7b8a95' : '#6d7983', emissive: tower.crownColor, emissiveIntensity: renderIntent.midBandEmissiveIntensity, kind: 'box', metalness: 0.14, position: [0, tower.baseSize[1] + (tower.upperSize[1] * 0.48), 0], roughness: tower.role === 'hero' ? 0.44 : 0.5, size: [tower.upperSize[0] * 1.08, renderIntent.midBandHeight, tower.upperSize[2] * 0.34] });
  }
  if (renderIntent.crownBandHeight > 0) {
    primitives.push({ color: tower.role === 'hero' ? '#778692' : '#66727c', emissive: tower.crownColor, emissiveIntensity: renderIntent.crownBandEmissiveIntensity, kind: 'box', metalness: 0.16, position: [0, tower.baseSize[1] + tower.upperSize[1] + 6, 0], roughness: tower.role === 'hero' ? 0.42 : 0.5, size: [tower.upperSize[0] * 0.78, renderIntent.crownBandHeight, tower.upperSize[2] * 0.78] });
  }
  if (renderIntent.showCrownPods) {
    primitives.push(
      { color: tower.role === 'hero' ? '#8897a3' : '#6e7b84', emissive: tower.crownColor, emissiveIntensity: tower.role === 'hero' ? 0.03 : 0.01, kind: 'box', metalness: 0.16, position: [side * (tower.upperSize[0] * 0.36), tower.baseSize[1] + tower.upperSize[1] + 3, 0], roughness: tower.role === 'hero' ? 0.42 : 0.5, size: [tower.upperSize[0] * 0.14, renderIntent.crownBandHeight + 6, tower.upperSize[2] * 0.26] },
      { color: tower.role === 'hero' ? '#7f8d98' : '#5e6973', emissive: tower.crownColor, emissiveIntensity: tower.role === 'hero' ? 0.022 : 0.008, kind: 'box', metalness: 0.14, position: [-side * (tower.upperSize[0] * 0.26), tower.baseSize[1] + tower.upperSize[1] - 2, -tower.upperSize[2] * 0.12], roughness: tower.role === 'hero' ? 0.44 : 0.52, size: [tower.upperSize[0] * 0.18, renderIntent.crownBandHeight + 4, tower.upperSize[2] * 0.18] },
    );
  }
  if (renderIntent.showSpire) {
    primitives.push(
      { color: '#a2b3bf', emissive: tower.crownColor, emissiveIntensity: 0.036, kind: 'box', metalness: 0.16, position: [0, tower.baseSize[1] + tower.upperSize[1] + 22, 0], roughness: 0.34, size: [tower.upperSize[0] * 0.48, 24, tower.upperSize[2] * 0.48] },
      { color: '#c0d2de', emissive: tower.crownColor, emissiveIntensity: 0.05, kind: 'cylinder', metalness: 0.22, position: [0, tower.baseSize[1] + tower.upperSize[1] + 44, 0], radialSegments: 12, radiusBottom: tower.upperSize[0] * 0.18, radiusTop: tower.upperSize[0] * 0.12, roughness: 0.26, height: 18 },
    );
  }

  return primitives;
}

function withTowerClusterIntent(tower: CityTower): CityTower {
  const composition = tower.composition ?? tower.role ?? 'standard';
  const renderIntent = composition === 'hero'
    ? {
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
      }
    : composition === 'minimal'
      ? {
          crownBandEmissiveIntensity: 0,
          crownPlateEmissiveIntensity: 0,
          hidden: [
            'meetings-hero-tower-right',
            '75c36ca5-1c8e-4bd7-b61c-7cafd988fcf1-support-tower-right',
            '75c36ca5-1c8e-4bd7-b61c-7cafd988fcf1-support-tower-left',
            '1a459ffc-d447-4899-97e5-7af7b562487d-support-tower-left',
            '1a459ffc-d447-4899-97e5-7af7b562487d-outer-support-tower-right',
          ].includes(tower.id),
          insetEmissive: 0,
          midBandEmissiveIntensity: 0,
          podiumDepthMultiplier: tower.role === 'outer-support' ? 1.5 : 1.28,
          podiumEmissiveIntensity: 0.012,
          podiumWidthMultiplier: tower.role === 'outer-support' ? 1.45 : 1.24,
          rearFinEmissive: 0.01,
          showCrownPlate: false,
          showCrownPods: false,
          showInsetMass: false,
          showMidBand: false,
          showRearFin: true,
          showSideFin: true,
          showSpire: false,
          sideFinEmissive: 0.026,
          skipBase: false,
          rearFinHeight: 18,
          sideFinHeight: tower.role === 'outer-support' ? 28 : 22,
          crownBandHeight: 0,
          midBandHeight: 0,
        }
      : {
          crownBandEmissiveIntensity: tower.role === 'hero' ? 0.036 : 0.014,
          crownPlateEmissiveIntensity: 0,
          hidden: false,
          insetEmissive: 0.01,
          midBandEmissiveIntensity: tower.role === 'hero' ? 0.03 : 0.014,
          podiumDepthMultiplier: 1.5,
          podiumEmissiveIntensity: 0.012,
          podiumWidthMultiplier: 1.45,
          rearFinEmissive: 0.018,
          showCrownPlate: false,
          showCrownPods: false,
          showInsetMass: true,
          showMidBand: true,
          showRearFin: true,
          showSideFin: true,
          showSpire: false,
          sideFinEmissive: 0.026,
          skipBase: false,
          rearFinHeight: 26,
          sideFinHeight: 36,
          crownBandHeight: 8,
          midBandHeight: 10,
        };

  return {
    ...tower,
    renderIntent: {
      ...renderIntent,
      primitives: buildTowerPrimitives(tower, renderIntent),
    },
    sections: tower.sections ?? ['middle'],
  };
}

export function buildTowerClusterZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('tower-cluster');
  const geometry = buildTowerClusterZoneGeometry(context);
  const screenSurfaces = buildZoneScreenSurfacePlan({
    inputs: context.inputs,
    towers: geometry.towers,
    zoneId: 'tower-cluster',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'tower-cluster');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('tower-cluster', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'tower-cluster',
  });

  return createZonePlan({
    assignments,
    context,
    id: 'tower-cluster',
    masses: geometry.masses,
    planes: geometry.planes,
    screenSockets,
    screenSurfaces,
    towers: geometry.towers.map(withTowerClusterIntent),
  });
}
