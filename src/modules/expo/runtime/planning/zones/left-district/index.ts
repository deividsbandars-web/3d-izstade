import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildCityScreenHostMasses } from '../../screens/buildCityScreenHostMassPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type { ExpoZonePlannerContext } from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';
import { buildLeftDistrictZoneGeometry } from './geometry';

export function buildLeftDistrictZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('left-district');
  const geometry = buildLeftDistrictZoneGeometry(context);
  const screenSurfaces = buildZoneScreenSurfacePlan({
    inputs: context.inputs,
    zoneId: 'left-district',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenHostMasses = buildCityScreenHostMasses(screenSurfaces);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'left-district');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('left-district', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'left-district',
  });

  return createZonePlan({
    assignments,
    context,
    id: 'left-district',
    masses: [...geometry.masses, ...screenHostMasses],
    planes: geometry.planes,
    screenSockets,
    screenSurfaces,
    towers: geometry.towers,
  });
}
