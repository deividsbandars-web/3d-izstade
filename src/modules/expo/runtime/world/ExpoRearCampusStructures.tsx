import type { CampusPavilion, CampusTower } from './ExpoRearCampusLayout';

type CampusScreenFeed = {
  accentColor: string;
  id: string;
  imageUrl: string | null;
};

export function ExpoRearCampusStructures({
  accent,
  campusCenterZ,
  enableHeavyShadows,
  screenFeeds,
  sidePavilions,
  towers,
}: {
  accent: string;
  campusCenterZ: number;
  enableHeavyShadows: boolean;
  screenFeeds: CampusScreenFeed[];
  sidePavilions: CampusPavilion[];
  towers: CampusTower[];
}) {
  void accent;
  void campusCenterZ;
  void enableHeavyShadows;
  void screenFeeds;
  void sidePavilions;
  void towers;

  // Rear-campus massing is intentionally centralized in the screen/perimeter planners.
  // The old scenic stadium city duplicated that ownership and made the stadium read as a second city.
  return null;
}
