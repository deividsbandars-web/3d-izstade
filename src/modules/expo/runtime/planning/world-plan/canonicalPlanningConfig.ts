import type { ExpoWorldContract } from '../../../../../shared/expo/worldContract.js';
import type { ExpoPlanningInputs } from '../types/index.js';
import { buildCanonicalWorldPlan } from './buildCanonicalWorldPlan.js';

export const EXPO_CANONICAL_DISTRICT_STRIDE = 548;

export function buildExpoPlanningInputsFromWorldContract(
  worldContract: Pick<ExpoWorldContract, 'boothPlacements' | 'districtPrograms' | 'visualProfile'>,
): ExpoPlanningInputs {
  return {
    boothPlacements: worldContract.boothPlacements,
    districtPrograms: worldContract.districtPrograms,
    districtStride: EXPO_CANONICAL_DISTRICT_STRIDE,
    visualProfile: worldContract.visualProfile,
  };
}

export function buildCanonicalWorldPlanFromWorldContract(
  worldContract: Pick<ExpoWorldContract, 'boothPlacements' | 'districtPrograms' | 'visualProfile'>,
) {
  return buildCanonicalWorldPlan(buildExpoPlanningInputsFromWorldContract(worldContract));
}
