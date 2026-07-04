import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { ExpoCommunitySprayPlacement } from '../../../../shared/expo/communityContent';

const MAX_SURFACE_PICK_DISTANCE = 18;
const PICK_DISTANCE = 6.5;

function roundPlacementValue(value: number) {
  return Math.round(value * 100) / 100;
}

function findHostObject(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name || current.userData?.id || current.userData?.expoObjectId) {
      return current;
    }
    current = current.parent;
  }
  return object;
}

function isObjectExcludedFromSprayPick(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    const name = String(current.name || '').toLowerCase();
    if (
      name.includes('expo-visitor-presence') ||
      name.includes('expo-city-temporary-sprays') ||
      name.includes('spray') ||
      current.userData?.expoSprayIgnore === true
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function getSurfaceLabel(object: THREE.Object3D) {
  const host = findHostObject(object);
  return String(host.userData?.surfaceLabel || host.userData?.label || host.name || 'Picked city surface').slice(0, 32);
}

function getHostId(object: THREE.Object3D) {
  const host = findHostObject(object);
  return String(host.userData?.expoObjectId || host.userData?.id || host.name || object.uuid).slice(0, 80);
}

function buildPlacementFromCamera(camera: THREE.Camera): ExpoCommunitySprayPlacement {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  const flat = new THREE.Vector3(direction.x, 0, direction.z);
  if (flat.lengthSq() < 0.0001) {
    flat.set(0, 0, -1);
  }
  flat.normalize();

  const position = new THREE.Vector3().copy(camera.position).addScaledVector(flat, PICK_DISTANCE);
  const y = Math.min(5.2, Math.max(1.5, camera.position.y - 0.7));

  return {
    rotationY: Math.atan2(flat.x, flat.z) + Math.PI,
    normalX: -flat.x,
    normalY: 0,
    normalZ: -flat.z,
    surfaceLabel: 'Picked city spot',
    x: roundPlacementValue(position.x),
    y: roundPlacementValue(y),
    z: roundPlacementValue(position.z),
  };
}

function buildPlacementFromIntersection(intersection: THREE.Intersection<THREE.Object3D>) {
  const normal = intersection.face?.normal
    ? intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld).normalize()
    : new THREE.Vector3(0, 0, 1);
  const point = intersection.point.clone().addScaledVector(normal, 0.055);

  return {
    hostId: getHostId(intersection.object),
    normalX: Math.round(normal.x * 1000) / 1000,
    normalY: Math.round(normal.y * 1000) / 1000,
    normalZ: Math.round(normal.z * 1000) / 1000,
    rotationY: Math.atan2(normal.x, normal.z),
    surfaceLabel: getSurfaceLabel(intersection.object),
    x: roundPlacementValue(point.x),
    y: roundPlacementValue(point.y),
    z: roundPlacementValue(point.z),
  };
}

function emitSprayPlacementStatus(status: 'active' | 'cancelled' | 'selected') {
  window.dispatchEvent(new CustomEvent('expo:spray-placement-status', { detail: { status } }));
}

export function WorldSprayPlacementPicker() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    let active = false;
    const raycaster = new THREE.Raycaster();
    raycaster.far = MAX_SURFACE_PICK_DISTANCE;
    const pointer = new THREE.Vector2();

    const resolvePickedPlacement = (event?: PointerEvent) => {
      if (!event) return buildPlacementFromCamera(camera);
      const bounds = gl.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const picked = raycaster
        .intersectObjects(scene.children, true)
        .find((candidate) => (
          candidate.object instanceof THREE.Mesh &&
          candidate.distance <= MAX_SURFACE_PICK_DISTANCE &&
          !isObjectExcludedFromSprayPick(candidate.object)
        ));

      return picked ? buildPlacementFromIntersection(picked) : buildPlacementFromCamera(camera);
    };

    const cancel = () => {
      if (!active) return;
      active = false;
      emitSprayPlacementStatus('cancelled');
    };

    const select = (event?: Event) => {
      if (!active) return;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      active = false;
      const placement = resolvePickedPlacement(event instanceof PointerEvent ? event : undefined);
      window.dispatchEvent(new CustomEvent('expo:spray-placement-selected', { detail: placement }));
      emitSprayPlacementStatus('selected');
    };

    const start = () => {
      active = true;
      emitSprayPlacementStatus('active');
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancel();
      }
    };

    window.addEventListener('expo:start-spray-placement', start);
    window.addEventListener('expo:cancel-spray-placement', cancel);
    window.addEventListener('keydown', onKeyDown);
    gl.domElement.addEventListener('pointerdown', select, true);

    return () => {
      window.removeEventListener('expo:start-spray-placement', start);
      window.removeEventListener('expo:cancel-spray-placement', cancel);
      window.removeEventListener('keydown', onKeyDown);
      gl.domElement.removeEventListener('pointerdown', select, true);
    };
  }, [camera, gl.domElement, scene]);

  return null;
}
