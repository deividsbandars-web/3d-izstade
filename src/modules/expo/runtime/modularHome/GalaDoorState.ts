import {
  getGalaDoorStatesSnapshot as getGalaDoorStatesSnapshotFromStore,
  setGalaDoorState as setGalaDoorStateInStore,
  subscribeGalaDoorStates,
  toggleGalaDoorState as toggleGalaDoorStateInStore,
  type GalaDoorId,
  type GalaDoorState,
  type GalaDoorStateMap,
} from './GalaHouseState';

export {
  DEFAULT_GALA_DOOR_STATES,
  type GalaDoorId,
  type GalaDoorState,
  type GalaDoorStateMap,
} from './GalaHouseState';

export function getGalaDoorStatesSnapshot(): GalaDoorStateMap {
  return getGalaDoorStatesSnapshotFromStore();
}

export function setGalaDoorState(doorId: GalaDoorId, state: GalaDoorState): GalaDoorStateMap {
  return setGalaDoorStateInStore(doorId, state);
}

export function toggleGalaDoorState(doorId: GalaDoorId): GalaDoorStateMap {
  return toggleGalaDoorStateInStore(doorId);
}

export { subscribeGalaDoorStates };
