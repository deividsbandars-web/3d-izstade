import type { ExpoPlanningZonePlan, RearCampusPavilion } from '../planning/types';

export const RENDERED_REAR_CAMPUS_PAVILION_IDS = new Set([
  'rear-campus-event-pavilion-left',
  'rear-campus-event-pavilion-right',
]);

export function filterRenderedRearCampusSidePavilions(
  sidePavilions: ReadonlyArray<RearCampusPavilion>,
) {
  return sidePavilions.filter((pavilion) => RENDERED_REAR_CAMPUS_PAVILION_IDS.has(pavilion.id));
}

export function buildRenderedRearCampusRegistryPlan(
  rearCampusPlan: ExpoPlanningZonePlan,
): ExpoPlanningZonePlan {
  const rearCampus = rearCampusPlan.zoneExtension?.rearCampus;
  if (!rearCampus) {
    return rearCampusPlan;
  }

  return {
    ...rearCampusPlan,
    planes: [],
    zoneExtension: {
      rearCampus: {
        ...rearCampus,
        forecourts: [],
        landmarkTowers: [],
        sidePavilions: filterRenderedRearCampusSidePavilions(rearCampus.sidePavilions),
      },
    },
  };
}
