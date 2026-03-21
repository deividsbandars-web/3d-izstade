import * as THREE from "three";

export class InstancedCityLayer {
  scene: THREE.Scene;
  meshes: Map<string, THREE.InstancedMesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createInstanceGroup(key: string, base: THREE.Mesh, count: number) {
    const instanced = new THREE.InstancedMesh(
      base.geometry,
      base.material,
      count
    );

    // DynamicDrawUsage pasaka GPU, ka matricas var tikt mainītas
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Saglabājam ēnas iestatījumus no bāzes modeļa
    instanced.castShadow = base.castShadow;
    instanced.receiveShadow = base.receiveShadow;

    this.scene.add(instanced);
    this.meshes.set(key, instanced);

    return instanced;
  }

  setInstance(
    instanced: THREE.InstancedMesh,
    index: number,
    position: THREE.Vector3,
    rotationY: number,
    scaleVec: THREE.Vector3
  ) {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, rotationY, 0)
    );

    matrix.compose(position, quaternion, scaleVec);
    instanced.setMatrixAt(index, matrix);
  }

  finalize(instanced: THREE.InstancedMesh) {
    instanced.instanceMatrix.needsUpdate = true;
    // Pārrēķinām bounding box frustum culling (lai nerenderē, kad neskatās)
    instanced.computeBoundingSphere();
  }
}
