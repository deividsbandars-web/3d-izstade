import type * as THREE from 'three';

export function setWorldSceneUserData(scene: THREE.Scene, key: string, value: unknown) {
  scene.userData[key] = value;
}
