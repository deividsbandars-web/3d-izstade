import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildCityScreenHostMasses } from '../../screens/buildCityScreenHostMassPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type { ExpoZonePlannerContext } from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';
import { buildCenterSpineZoneGeometry } from './geometry';

export function buildCenterSpineZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('center-spine');
  const geometry = buildCenterSpineZoneGeometry(context);
  const screenSurfaces = buildZoneScreenSurfacePlan({
    inputs: context.inputs,
    zoneId: 'center-spine',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenHostMasses = buildCityScreenHostMasses(screenSurfaces);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'center-spine');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('center-spine', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'center-spine',
  });

  return createZonePlan({
    assignments,
    context,
    id: 'center-spine',
    masses: [...geometry.masses, ...screenHostMasses],
    planes: geometry.planes,
    screenSockets,
    screenSurfaces,
    towers: geometry.towers,
  });
}
