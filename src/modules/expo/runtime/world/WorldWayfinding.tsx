import type { ExpoBoothPlacement, ExpoSectorMarker } from '../../layout-engine';

type WorldWayfindingProps = {
  boothPlacements: ExpoBoothPlacement[];
  playerPosition: [number, number, number];
  sectorMarkers: ExpoSectorMarker[];
};

export function WorldWayfinding(_props: WorldWayfindingProps) {
  // Floating 3D wayfinding was occluding sponsor screens and reading as booth mutations.
  return null;
}
