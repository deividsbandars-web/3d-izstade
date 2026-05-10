import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CityPlane, StadiumReserve } from './WorldCitySkeletonLayout';

export function WorldCityPlanes({
  planes,
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  planes: CityPlane[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  void planes;
  void _stadiumReserve;
  void visualProfile;
  // Ground ownership is centralized in WorldGroundPlane. City planes stay in planning/registry only.
  return null;
}
