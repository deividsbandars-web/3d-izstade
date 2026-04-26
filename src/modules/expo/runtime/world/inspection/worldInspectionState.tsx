import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type * as THREE from 'three';

export type WorldInspectionEntry = {
  id: string;
  layer: string;
  position: [number, number, number];
};

export type WorldInspectionSummaryEntry = {
  distance: number;
  id: string;
  layer: string;
};

type WorldInspectionSummaryBoothPlacement = {
  id: string;
  position: [number, number, number];
};

type WorldInspectionSourceBucket = 'city' | 'stadium';

type WorldInspectionSelection = {
  stack: string[];
  target: string | null;
};

export type WorldInspectionState = {
  activeFocus: {
    center: WorldInspectionSelection;
    click: WorldInspectionSelection;
  };
  rawSources: {
    city: WorldInspectionEntry[];
    stadium: WorldInspectionEntry[];
  };
  sceneRef: THREE.Scene | null;
};

type WorldInspectionEvent =
  | { type: 'CENTER_TARGET_UPDATED'; payload: WorldInspectionSelection }
  | { type: 'CLICK_TARGET_UPDATED'; payload: WorldInspectionSelection }
  | { type: 'SOURCE_REGISTERED'; payload: { bucket: WorldInspectionSourceBucket; entries: WorldInspectionEntry[] } }
  | { type: 'SOURCE_REMOVED'; payload: { bucket: WorldInspectionSourceBucket } }
  | { type: 'SCENE_REF_UPDATED'; payload: { scene: THREE.Scene | null } };

const INITIAL_INSPECTION_STATE: WorldInspectionState = {
  activeFocus: {
    center: {
      stack: [],
      target: null,
    },
    click: {
      stack: [],
      target: null,
    },
  },
  rawSources: {
    city: [],
    stadium: [],
  },
  sceneRef: null,
};

function worldInspectionReducer(
  state: WorldInspectionState,
  event: WorldInspectionEvent,
): WorldInspectionState {
  switch (event.type) {
    case 'CENTER_TARGET_UPDATED':
      return {
        ...state,
        activeFocus: {
          ...state.activeFocus,
          center: event.payload,
        },
      };
    case 'CLICK_TARGET_UPDATED':
      return {
        ...state,
        activeFocus: {
          ...state.activeFocus,
          click: event.payload,
        },
      };
    case 'SOURCE_REGISTERED':
      return {
        ...state,
        rawSources: {
          ...state.rawSources,
          [event.payload.bucket]: event.payload.entries,
        },
      };
    case 'SOURCE_REMOVED':
      return {
        ...state,
        rawSources: {
          ...state.rawSources,
          [event.payload.bucket]: [],
        },
      };
    case 'SCENE_REF_UPDATED':
      return {
        ...state,
        sceneRef: event.payload.scene,
      };
    default:
      return state;
  }
}

const WorldInspectionStateContext = createContext<WorldInspectionState | null>(null);
const WorldInspectionDispatchContext = createContext<Dispatch<WorldInspectionEvent> | null>(null);

export function WorldInspectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(worldInspectionReducer, INITIAL_INSPECTION_STATE);

  return (
    <WorldInspectionDispatchContext.Provider value={dispatch}>
      <WorldInspectionStateContext.Provider value={state}>
        {children}
      </WorldInspectionStateContext.Provider>
    </WorldInspectionDispatchContext.Provider>
  );
}

function useWorldInspectionStateContext() {
  const state = useContext(WorldInspectionStateContext);
  if (!state) {
    throw new Error('WorldInspectionProvider is required for world inspection hooks.');
  }
  return state;
}

function useWorldInspectionDispatch() {
  const dispatch = useContext(WorldInspectionDispatchContext);
  if (!dispatch) {
    throw new Error('WorldInspectionProvider is required for world inspection hooks.');
  }
  return dispatch;
}

export function useWorldInspection() {
  return useWorldInspectionStateContext();
}

export function useInspectionFocus() {
  const state = useWorldInspectionStateContext();
  return state.activeFocus;
}

export function useInspectionTargets() {
  const focus = useInspectionFocus();

  return useMemo(() => ({
    centerStack: focus.center.stack,
    centerTarget: focus.center.target,
    clickStack: focus.click.stack,
    clickTarget: focus.click.target,
  }), [focus.center.stack, focus.center.target, focus.click.stack, focus.click.target]);
}

export function useWorldInspectionRegistry(bucket: WorldInspectionSourceBucket, entries: WorldInspectionEntry[]) {
  const dispatch = useWorldInspectionDispatch();

  useEffect(() => {
    dispatch({
      type: 'SOURCE_REGISTERED',
      payload: {
        bucket,
        entries,
      },
    });

    return () => {
      dispatch({
        type: 'SOURCE_REMOVED',
        payload: {
          bucket,
        },
      });
    };
  }, [bucket, dispatch, entries]);
}

export function useWorldInspectionPublisher() {
  const dispatch = useWorldInspectionDispatch();

  return useMemo(() => ({
    setCenterSelection(target: string | null, stack: string[]) {
      dispatch({
        type: 'CENTER_TARGET_UPDATED',
        payload: {
          stack,
          target,
        },
      });
    },
    setClickSelection(target: string | null, stack: string[]) {
      dispatch({
        type: 'CLICK_TARGET_UPDATED',
        payload: {
          stack,
          target,
        },
      });
    },
    setSceneRef(scene: THREE.Scene | null) {
      dispatch({
        type: 'SCENE_REF_UPDATED',
        payload: {
          scene,
        },
      });
    },
  }), [dispatch]);
}

function selectInspectionSummaryEntries({
  boothEntries,
  playerPos,
  state,
}: {
  boothEntries: WorldInspectionEntry[];
  playerPos: number[];
  state: WorldInspectionState;
}) {
  const [playerX, , playerZ] = playerPos as [number, number, number];
  const entries = [
    ...state.rawSources.city,
    ...state.rawSources.stadium,
    ...boothEntries,
  ];

  return entries
    .map((entry) => ({
      distance: Math.round(Math.hypot(entry.position[0] - playerX, entry.position[2] - playerZ)),
      id: entry.id,
      layer: entry.layer,
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 3);
}

export function useInspectionSummary({
  boothEntries,
  playerPos,
}: {
  boothEntries: WorldInspectionEntry[];
  playerPos: number[];
}) {
  const state = useWorldInspectionStateContext();

  return useMemo<WorldInspectionSummaryEntry[]>(() => (
    selectInspectionSummaryEntries({
      boothEntries,
      playerPos,
      state,
    })
  ), [boothEntries, playerPos, state]);
}

export function useInspectionOperatorSummary({
  boothPlacements,
  playerPos,
}: {
  boothPlacements: WorldInspectionSummaryBoothPlacement[];
  playerPos: number[];
}) {
  const boothEntries = useMemo<WorldInspectionEntry[]>(
    () => boothPlacements.map((placement) => ({
      id: placement.id,
      layer: 'booth',
      position: placement.position,
    })),
    [boothPlacements],
  );

  return useInspectionSummary({
    boothEntries,
    playerPos,
  });
}
