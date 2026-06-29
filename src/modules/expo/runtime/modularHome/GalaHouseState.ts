import { create } from 'zustand';
import {
  DEFAULT_GALA_HOUSE_VISUAL_CONFIG,
  resolveGalaHouseVisualConfigFromModularHomeConfig,
  type GalaHouseVisualConfig,
} from './GalaHouseConfig';
import {
  GALA_CIRCULATION_PATHS,
  GALA_CLOSED_DOOR_COLLISION_SEGMENTS,
  GALA_DOOR_INTERACTION_ZONES,
  GALA_FLOORPLAN,
  GALA_GEOMETRY_LEVELS,
  GALA_INTERIOR_DOORS,
  GALA_INTERIOR_FURNITURE_FOOTPRINTS,
  GALA_INTERIOR_LAYOUT_DIAGNOSTICS,
  GALA_OPENING_GAPS,
  GALA_WALK_PHYSICS,
  GALA_WALL_COLLISION_SEGMENTS,
} from './GalaFloorplan';

export { resolveGalaHouseVisualConfigFromModularHomeConfig };
export type { GalaHouseVisualConfig };

export type GalaDoorId = 'D-ENTRY' | 'D-TERRACE' | 'D-BEDROOM' | 'D-BATHROOM';

export type GalaDoorState = 'closed' | 'open';

export type GalaDoorStateMap = Record<GalaDoorId, GalaDoorState>;

declare global {
  interface Window {
    __WARPALA_GALA_DOOR_API__?: {
      getDoorStates: () => GalaDoorStateMap;
      resetDoorStates: () => GalaDoorStateMap;
      setDoorState: (doorId: GalaDoorId, state: GalaDoorState) => GalaDoorStateMap;
      toggleDoorState: (doorId: GalaDoorId) => GalaDoorStateMap;
    };
  }
}

export const DEFAULT_GALA_DOOR_STATES: GalaDoorStateMap = {
  'D-BATHROOM': 'closed',
  'D-BEDROOM': 'closed',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

export const GALA_HOUSE_FLOORPLAN_LAYOUT = {
  circulationPaths: GALA_CIRCULATION_PATHS,
  closedDoorCollisionSegments: GALA_CLOSED_DOOR_COLLISION_SEGMENTS,
  doorInteractionZones: GALA_DOOR_INTERACTION_ZONES,
  floorplan: GALA_FLOORPLAN,
  geometryLevels: GALA_GEOMETRY_LEVELS,
  interiorDoors: GALA_INTERIOR_DOORS,
  interiorFurnitureFootprints: GALA_INTERIOR_FURNITURE_FOOTPRINTS,
  interiorLayoutDiagnostics: GALA_INTERIOR_LAYOUT_DIAGNOSTICS,
  openingGaps: GALA_OPENING_GAPS,
  walkPhysics: GALA_WALK_PHYSICS,
  wallCollisionSegments: GALA_WALL_COLLISION_SEGMENTS,
} as const;

export type GalaHouseFloorplanLayout = typeof GALA_HOUSE_FLOORPLAN_LAYOUT;

export type GalaHouseStateSnapshot = {
  doorStates: GalaDoorStateMap;
  floorplanLayout: GalaHouseFloorplanLayout;
  visualConfig: GalaHouseVisualConfig;
};

type GalaHouseStore = GalaHouseStateSnapshot & {
  resetDoorStates: () => GalaDoorStateMap;
  setDoorState: (doorId: GalaDoorId, state: GalaDoorState) => GalaDoorStateMap;
  setVisualConfig: (visualConfig: GalaHouseVisualConfig) => void;
  toggleDoorState: (doorId: GalaDoorId) => GalaDoorStateMap;
};

function cloneDoorStates(states: GalaDoorStateMap): GalaDoorStateMap {
  return { ...DEFAULT_GALA_DOOR_STATES, ...states };
}

export const useGalaHouseState = create<GalaHouseStore>((set, get) => ({
  doorStates: { ...DEFAULT_GALA_DOOR_STATES },
  floorplanLayout: GALA_HOUSE_FLOORPLAN_LAYOUT,
  resetDoorStates: () => {
    const nextStates = { ...DEFAULT_GALA_DOOR_STATES };
    set({ doorStates: nextStates });
    return nextStates;
  },
  setDoorState: (doorId, state) => {
    const nextStates = {
      ...get().doorStates,
      [doorId]: state,
    };
    set({ doorStates: nextStates });
    return cloneDoorStates(nextStates);
  },
  setVisualConfig: (visualConfig) => set({ visualConfig }),
  toggleDoorState: (doorId) => {
    const current = get().doorStates[doorId];
    const nextStates = {
      ...get().doorStates,
      [doorId]: current === 'open' ? 'closed' : 'open',
    };
    set({ doorStates: nextStates });
    return cloneDoorStates(nextStates);
  },
  visualConfig: DEFAULT_GALA_HOUSE_VISUAL_CONFIG,
}));

export const galaHouseStateStore = useGalaHouseState;

export function useGalaDoorStates(): GalaDoorStateMap {
  return useGalaHouseState((state) => state.doorStates);
}

export function getGalaHouseStateSnapshot(): GalaHouseStateSnapshot {
  const state = galaHouseStateStore.getState();
  return {
    doorStates: cloneDoorStates(state.doorStates),
    floorplanLayout: state.floorplanLayout,
    visualConfig: state.visualConfig,
  };
}

export function getGalaDoorStatesSnapshot(): GalaDoorStateMap {
  return cloneDoorStates(galaHouseStateStore.getState().doorStates);
}

export function setGalaDoorState(doorId: GalaDoorId, state: GalaDoorState): GalaDoorStateMap {
  return galaHouseStateStore.getState().setDoorState(doorId, state);
}

export function toggleGalaDoorState(doorId: GalaDoorId): GalaDoorStateMap {
  return galaHouseStateStore.getState().toggleDoorState(doorId);
}

export function resetGalaDoorStates(): GalaDoorStateMap {
  return galaHouseStateStore.getState().resetDoorStates();
}

export function subscribeGalaDoorStates(listener: (states: GalaDoorStateMap) => void): () => void {
  let previousStates = galaHouseStateStore.getState().doorStates;
  return galaHouseStateStore.subscribe((state) => {
    if (state.doorStates === previousStates) {
      return;
    }
    previousStates = state.doorStates;
    listener(cloneDoorStates(state.doorStates));
  });
}

if (typeof window !== 'undefined') {
  window.__WARPALA_GALA_DOOR_API__ = {
    getDoorStates: getGalaDoorStatesSnapshot,
    resetDoorStates: resetGalaDoorStates,
    setDoorState: setGalaDoorState,
    toggleDoorState: toggleGalaDoorState,
  };
}
