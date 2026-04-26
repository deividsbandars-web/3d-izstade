export type ExpoWorldLayerToggles = {
  booths: boolean;
  city: boolean;
  promenade: boolean;
  skyline: boolean;
  stadium: boolean;
};

export type ExpoWorldSectionToggles = {
  arrival: boolean;
  left: boolean;
  middle: boolean;
  right: boolean;
  stadium: boolean;
};

export function normalizeWorldLayerToggles(toggles?: Partial<ExpoWorldLayerToggles>): ExpoWorldLayerToggles {
  return {
    booths: toggles?.booths ?? true,
    city: toggles?.city ?? true,
    promenade: toggles?.promenade ?? true,
    skyline: toggles?.skyline ?? true,
    stadium: toggles?.stadium ?? true,
  };
}

export function normalizeWorldSectionToggles(toggles?: Partial<ExpoWorldSectionToggles>): ExpoWorldSectionToggles {
  return {
    arrival: toggles?.arrival ?? true,
    left: toggles?.left ?? true,
    middle: toggles?.middle ?? true,
    right: toggles?.right ?? true,
    stadium: toggles?.stadium ?? true,
  };
}

export function matchesWorldSection(
  position: [number, number, number],
  toggles: Pick<ExpoWorldSectionToggles, 'arrival' | 'left' | 'middle' | 'right'>
) {
  if (position[2] > 120) {
    return toggles.arrival;
  }
  if (position[0] < -260) {
    return toggles.left;
  }
  if (position[0] > 260) {
    return toggles.right;
  }
  return toggles.middle;
}
