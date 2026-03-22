import * as THREE from "three";

export class InstancedCityLayer {
  scene: THREE.Scene;
  meshes: Map<string, THREE.InstancedMesh> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createInstanceGroup(key: string, base: THREE.Mesh, count: number) {
    // 🚀 MATERIAL SHARING BUG FIX: Drošāka klonēšana
    const material = Array.isArray(base.material) 
      ? base.material.map(m => m.clone()) 
      : (base.material as THREE.Material).clone();

    const instanced = new THREE.InstancedMesh(
      base.geometry,
      material,
      count
    );

    // DynamicDrawUsage pasaka GPU, ka matricas var tikt mainītas
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // 🚀 FRUSTUM CULLING BOOST
    instanced.frustumCulled = true;
    // 🚀 BVH / RAYCAST PREP
    instanced.raycast = THREE.InstancedMesh.prototype.raycast;

    // 🚀 GPU RELIEF FIX: Izslēdzam ēnas visiem instancētajiem objektiem
    instanced.castShadow = false;
    instanced.receiveShadow = false;

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
    // 🚀 INSTANCE MATRIX FREEZE
    instanced.matrixAutoUpdate = false;
  }

  // 🚀 GPU MEMORY FIX: Droša atmiņas tīrīšana
  dispose() {
    this.meshes.forEach((instanced) => {
      instanced.geometry.dispose();
      if (Array.isArray(instanced.material)) {
        instanced.material.forEach(m => m.dispose());
      } else {
        instanced.material.dispose();
      }
      this.scene.remove(instanced);
    });
    this.meshes.clear();
  }
}
