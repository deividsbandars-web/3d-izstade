export type GalaDoorId = 'D-ENTRY' | 'D-TERRACE' | 'D-BEDROOM' | 'D-BATHROOM';

export type GalaDoorState = 'closed' | 'open';

export type GalaDoorStateMap = Record<GalaDoorId, GalaDoorState>;

export const GALA_DOOR_STATE_EVENT = 'gala:door-state-change';

export const DEFAULT_GALA_DOOR_STATES: GalaDoorStateMap = {
  'D-BATHROOM': 'closed',
  'D-BEDROOM': 'closed',
  'D-ENTRY': 'closed',
  'D-TERRACE': 'closed',
};

type GalaDoorRuntime = {
  getDoorState: (doorId: GalaDoorId) => GalaDoorState;
  setDoorState: (doorId: GalaDoorId, state: GalaDoorState) => GalaDoorStateMap;
  states: GalaDoorStateMap;
  toggleDoor: (doorId: GalaDoorId) => GalaDoorStateMap;
};

type GalaDoorWindow = Window & {
  __WARPALA_GALA_DOOR_API__?: GalaDoorRuntime;
  __WARPALA_GALA_DOOR_STATES__?: GalaDoorStateMap;
};

function cloneDoorStates(states: GalaDoorStateMap): GalaDoorStateMap {
  return { ...DEFAULT_GALA_DOOR_STATES, ...states };
}

function getDoorWindow(): GalaDoorWindow | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window as GalaDoorWindow;
}

export function getGalaDoorStatesSnapshot(): GalaDoorStateMap {
  const doorWindow = getDoorWindow();
  if (!doorWindow) {
    return { ...DEFAULT_GALA_DOOR_STATES };
  }

  if (!doorWindow.__WARPALA_GALA_DOOR_STATES__) {
    doorWindow.__WARPALA_GALA_DOOR_STATES__ = { ...DEFAULT_GALA_DOOR_STATES };
  }

  return cloneDoorStates(doorWindow.__WARPALA_GALA_DOOR_STATES__);
}

export function setGalaDoorState(doorId: GalaDoorId, state: GalaDoorState): GalaDoorStateMap {
  const doorWindow = getDoorWindow();
  const nextStates = {
    ...getGalaDoorStatesSnapshot(),
    [doorId]: state,
  };

  if (doorWindow) {
    doorWindow.__WARPALA_GALA_DOOR_STATES__ = nextStates;
    if (doorWindow.__WARPALA_GALA_DOOR_API__) {
      doorWindow.__WARPALA_GALA_DOOR_API__.states = nextStates;
    }
    doorWindow.dispatchEvent(new CustomEvent(GALA_DOOR_STATE_EVENT, {
      detail: {
        doorId,
        state,
        states: nextStates,
      },
    }));
  }

  return nextStates;
}

export function toggleGalaDoorState(doorId: GalaDoorId): GalaDoorStateMap {
  const current = getGalaDoorStatesSnapshot()[doorId];
  return setGalaDoorState(doorId, current === 'open' ? 'closed' : 'open');
}

export function installGalaDoorRuntime(): GalaDoorStateMap {
  const doorWindow = getDoorWindow();
  const states = getGalaDoorStatesSnapshot();

  if (doorWindow) {
    doorWindow.__WARPALA_GALA_DOOR_STATES__ = states;
    doorWindow.__WARPALA_GALA_DOOR_API__ = {
      getDoorState: (doorId) => getGalaDoorStatesSnapshot()[doorId],
      setDoorState: setGalaDoorState,
      states,
      toggleDoor: toggleGalaDoorState,
    };
  }

  return states;
}
