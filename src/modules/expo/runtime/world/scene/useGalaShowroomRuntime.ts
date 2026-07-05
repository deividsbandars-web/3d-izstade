import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  getGalaDoorStatesSnapshot,
  subscribeGalaDoorStates,
  toggleGalaDoorState,
} from '../../modularHome/GalaDoorState';
import {
  buildGalaCollisionSegments,
  findNearbyGalaDoor,
  type GalaDoorPromptState,
} from './useGalaShowroomMovement';

export function useGalaShowroomRuntime({
  camera,
  enabled,
}: {
  camera: THREE.Camera;
  enabled: boolean;
}) {
  const [nearbyDoorPrompt, setNearbyDoorPrompt] = useState<GalaDoorPromptState | null>(null);
  const galaDoorStatesRef = useRef(getGalaDoorStatesSnapshot());
  const galaCollisionSegmentsRef = useRef(buildGalaCollisionSegments(getGalaDoorStatesSnapshot()));
  const nearbyDoorPromptRef = useRef<GalaDoorPromptState | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    galaDoorStatesRef.current = getGalaDoorStatesSnapshot();
    galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStatesRef.current);
    return subscribeGalaDoorStates((states) => {
      galaDoorStatesRef.current = states;
      galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStatesRef.current);
    });
  }, [enabled, galaCollisionSegmentsRef, galaDoorStatesRef]);

  const toggleNearbyDoor = useCallback(() => {
    const nearbyDoor = findNearbyGalaDoor(camera.position);
    if (!nearbyDoor) {
      return false;
    }

    galaDoorStatesRef.current = toggleGalaDoorState(nearbyDoor.doorId);
    galaCollisionSegmentsRef.current = buildGalaCollisionSegments(galaDoorStatesRef.current);
    return true;
  }, [camera.position, galaCollisionSegmentsRef, galaDoorStatesRef]);

  return {
    galaCollisionSegmentsRef,
    galaDoorStatesRef,
    nearbyDoorPrompt,
    nearbyDoorPromptRef,
    setNearbyDoorPrompt,
    toggleNearbyDoor,
  };
}
