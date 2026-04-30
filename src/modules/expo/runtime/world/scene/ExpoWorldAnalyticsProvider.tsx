/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';

type ExpoWorldAnalyticsState = {
  lastSectorKey: string | null;
  playerPosition: [number, number, number];
  sceneLoaded: boolean;
  viewedBoothKeys: string[];
};

type ExpoWorldAnalyticsEvent =
  | { type: 'PLAYER_POSITION_UPDATED'; payload: { position: [number, number, number] } }
  | { type: 'SCENE_LOADED_RECORDED' }
  | { type: 'BOOTH_VIEWED_RECORDED'; payload: { boothKey: string } }
  | { type: 'SECTOR_ENTERED_RECORDED'; payload: { sectorKey: string } };

const INITIAL_ANALYTICS_STATE: ExpoWorldAnalyticsState = {
  lastSectorKey: null,
  playerPosition: [0, 0, 0],
  sceneLoaded: false,
  viewedBoothKeys: [],
};

function expoWorldAnalyticsReducer(
  state: ExpoWorldAnalyticsState,
  event: ExpoWorldAnalyticsEvent,
): ExpoWorldAnalyticsState {
  switch (event.type) {
    case 'PLAYER_POSITION_UPDATED':
      return {
        ...state,
        playerPosition: event.payload.position,
      };
    case 'SCENE_LOADED_RECORDED':
      return state.sceneLoaded ? state : {
        ...state,
        sceneLoaded: true,
      };
    case 'BOOTH_VIEWED_RECORDED':
      return state.viewedBoothKeys.includes(event.payload.boothKey)
        ? state
        : {
            ...state,
            viewedBoothKeys: [...state.viewedBoothKeys, event.payload.boothKey],
          };
    case 'SECTOR_ENTERED_RECORDED':
      return {
        ...state,
        lastSectorKey: event.payload.sectorKey,
      };
    default:
      return state;
  }
}

const ExpoWorldAnalyticsStateContext = createContext<ExpoWorldAnalyticsState | null>(null);
const ExpoWorldAnalyticsDispatchContext = createContext<Dispatch<ExpoWorldAnalyticsEvent> | null>(null);

export function ExpoWorldAnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expoWorldAnalyticsReducer, INITIAL_ANALYTICS_STATE);

  return (
    <ExpoWorldAnalyticsDispatchContext.Provider value={dispatch}>
      <ExpoWorldAnalyticsStateContext.Provider value={state}>
        {children}
      </ExpoWorldAnalyticsStateContext.Provider>
    </ExpoWorldAnalyticsDispatchContext.Provider>
  );
}

export function useExpoWorldAnalyticsState() {
  const state = useContext(ExpoWorldAnalyticsStateContext);
  if (!state) {
    throw new Error('ExpoWorldAnalyticsProvider is required for analytics hooks.');
  }
  return state;
}

export function useExpoWorldAnalyticsActions() {
  const dispatch = useContext(ExpoWorldAnalyticsDispatchContext);
  if (!dispatch) {
    throw new Error('ExpoWorldAnalyticsProvider is required for analytics hooks.');
  }

  return useMemo(() => ({
    markBoothViewed(boothKey: string) {
      dispatch({
        type: 'BOOTH_VIEWED_RECORDED',
        payload: { boothKey },
      });
    },
    markSceneLoaded() {
      dispatch({ type: 'SCENE_LOADED_RECORDED' });
    },
    markSectorEntered(sectorKey: string) {
      dispatch({
        type: 'SECTOR_ENTERED_RECORDED',
        payload: { sectorKey },
      });
    },
    setPlayerPosition(position: [number, number, number]) {
      dispatch({
        type: 'PLAYER_POSITION_UPDATED',
        payload: { position },
      });
    },
  }), [dispatch]);
}
