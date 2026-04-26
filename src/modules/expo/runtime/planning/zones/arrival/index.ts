import type { ExpoZonePlannerContext } from '../../types';
import { createZonePlan } from '../shared';

export function buildArrivalZonePlan(context: ExpoZonePlannerContext) {
  return createZonePlan({
    context,
    id: 'arrival',
    masses: context.geometry.arrivalGatewayMasses,
    planes: context.geometry.arrivalPlanes,
    screenSockets: [],
    screenSurfaces: [],
    towers: [],
  });
}
