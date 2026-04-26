import { buildZoneScreenAssignmentPlan } from '../../screens/buildScreenAssignmentPlan';
import { buildZoneScreenSocketPlan } from '../../screens/buildScreenSocketPlan';
import { buildZoneScreenSurfacePlan } from '../../screens/buildScreenSurfacePlan';
import type { ExpoZonePlannerContext } from '../../types';
import { collectZoneBoothPlacements, createZonePlan, getZoneRule } from '../shared';
import { buildRightDistrictZoneGeometry } from './geometry';

export function buildRightDistrictZonePlan(context: ExpoZonePlannerContext) {
  const rule = getZoneRule('right-district');
  const geometry = buildRightDistrictZoneGeometry(context);
  const screenSurfaces = buildZoneScreenSurfacePlan({
    inputs: context.inputs,
    zoneId: 'right-district',
  }).slice(0, rule.densityCaps.screenSurfaceCap);
  const screenSockets = buildZoneScreenSocketPlan(screenSurfaces, rule.densityCaps.screenSocketCap, 'right-district');
  const assignments = buildZoneScreenAssignmentPlan({
    assignmentCap: rule.densityCaps.assignmentCap,
    boothPlacements: collectZoneBoothPlacements('right-district', context.inputs.boothPlacements),
    sockets: screenSockets,
    zoneId: 'right-district',
  });

  return createZonePlan({
    assignments,
    context,
    id: 'right-district',
    masses: geometry.masses,
    planes: geometry.planes,
    screenSockets,
    screenSurfaces,
    towers: geometry.towers,
  });
}
