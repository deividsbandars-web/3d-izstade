import { useEffect, useState } from 'react';
import { EXPO_DEBUG_DEFAULT, type ExpoMode } from '../../../state/expoRuntime';
import type { ReviewOperatorZone } from '../model/reviewOperatorSession';

type LayerStates = {
  booths: boolean;
  city: boolean;
  promenade: boolean;
  skyline: boolean;
  stadium: boolean;
};

type SectionStates = {
  arrival: boolean;
  left: boolean;
  middle: boolean;
  right: boolean;
  stadium: boolean;
};

type InspectorEntry = {
  distance: number;
  id: string;
  layer: string;
};

type UseExpoOperatorStateArgs = {
  activeZoneId: string | null;
  centerStack: string[];
  centerTarget: string | null;
  clickStack: string[];
  clickTarget: string | null;
  enabled: boolean;
  inspector: InspectorEntry[];
  mode: ExpoMode;
  playerPos: number[];
  sceneVersion: string | null;
  setMode: (mode: ExpoMode) => void;
  zones: ReviewOperatorZone[];
};

export function useExpoOperatorState({
  activeZoneId,
  centerStack,
  centerTarget,
  clickStack,
  clickTarget,
  enabled,
  inspector,
  mode,
  playerPos,
  sceneVersion,
  setMode,
  zones,
}: UseExpoOperatorStateArgs) {
  const [debug, setDebug] = useState(EXPO_DEBUG_DEFAULT);
  const [focusSlug, setFocusSlug] = useState<string | null>('__use_url__');
  const [markedPoint, setMarkedPoint] = useState<[number, number, number] | null>(null);
  const [targetBasket, setTargetBasket] = useState<string[]>([]);
  const [operatorZoneId, setOperatorZoneId] = useState<string | null>(() => (enabled ? 'arrival' : null));
  const [layerStates, setLayerStates] = useState<LayerStates>({
    booths: true,
    city: true,
    promenade: true,
    skyline: true,
    stadium: true,
  });
  const [sectionStates, setSectionStates] = useState<SectionStates>({
    arrival: true,
    left: true,
    middle: true,
    right: true,
    stadium: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    const operator = {
      clearFocus: () => {
        setOperatorZoneId(null);
        setFocusSlug('');
      },
      focusBooth: (slugOrId: string) => {
        setOperatorZoneId(null);
        setFocusSlug(slugOrId);
      },
      focusZone: (zoneId: string) => {
        setFocusSlug('');
        setOperatorZoneId(zoneId);
      },
      getSnapshot: () => ({
        activeZoneId,
        centerStack,
        centerTarget,
        clickStack,
        clickTarget,
        inspector,
        layerStates,
        mode,
        operatorZoneId,
        playerPos,
        sceneVersion,
        sectionStates,
        targetBasket,
      }),
      setLayerStates: (next: Partial<LayerStates>) => {
        setLayerStates((current) => ({ ...current, ...next }));
      },
      setMode: (nextMode: ExpoMode) => setMode(nextMode),
      setSectionStates: (next: Partial<SectionStates>) => {
        setSectionStates((current) => ({ ...current, ...next }));
      },
      setTargetBasket: (targets: string[]) => setTargetBasket(targets),
      zones: zones.map((zone) => ({ id: zone.id, intent: zone.intent, label: zone.label })),
    };

    (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ = operator;

    return () => {
      if ((window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__ === operator) {
        delete (window as unknown as { __WARPALA_EXPO_REVIEW_OPERATOR__?: typeof operator }).__WARPALA_EXPO_REVIEW_OPERATOR__;
      }
    };
  }, [
    activeZoneId,
    centerStack,
    centerTarget,
    clickStack,
    clickTarget,
    enabled,
    inspector,
    layerStates,
    mode,
    operatorZoneId,
    playerPos,
    sceneVersion,
    sectionStates,
    setMode,
    targetBasket,
    zones,
  ]);

  return {
    centerStack,
    centerTarget,
    clickStack,
    clickTarget,
    debug,
    focusSlug,
    inspector,
    layerStates,
    markedPoint,
    operatorZoneId,
    sectionStates,
    setDebug,
    setFocusSlug,
    setLayerStates,
    setMarkedPoint,
    setOperatorZoneId,
    setSectionStates,
    targetBasket,
    setTargetBasket,
  };
}
