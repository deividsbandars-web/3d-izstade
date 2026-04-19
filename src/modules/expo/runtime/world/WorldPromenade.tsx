import type { ExpoSectorMarker } from '../../layout-engine';
import type { ExpoBoothPlacement } from '../../layout-engine';
import type { ExpoWorldVisualProfile } from '../../world-contract';

export function WorldPromenade({
  boothPlacements,
  sectorMarkers: _sectorMarkers,
  visualProfile,
}: {
  boothPlacements: ExpoBoothPlacement[];
  sectorMarkers: ExpoSectorMarker[];
  visualProfile?: ExpoWorldVisualProfile;
}) {
  void boothPlacements;
  void visualProfile;
  // Promenade is intentionally not a visible ground owner in the current hierarchy.
  return null;
}
