import * as THREE from "three";
import { fixModel } from "./fixModel";

export type AssetCategory = "building" | "booth" | "landmark" | "road" | "nature";

export function prepareCityObjects(models: THREE.Object3D[]) {
  return models.map((rawMesh, i) => {
    // 1. Izlaižam cauri mūsu Pro Auto-Fix konveijeram
    const mesh = fixModel(rawMesh);

    // 2. Kategorizējam objektus balstoties uz nosaukumu (vai ID)
    const name = mesh.name.toLowerCase();
    let type: AssetCategory = "building"; // Default

    if (name.includes('road') || name.includes('track') || name.includes('intersection')) {
      type = "road";
    } else if (name.includes('booth')) {
      type = "booth";
    } else if (name.includes('bridge') || name.includes('sign') || name.includes('lamp') || name.includes('trash') || name.includes('dumpster')) {
      type = "landmark";
    } else if (name.includes('grass') || name.includes('tree') || name.includes('plant') || name.includes('dog') || name.includes('eagle') || name.includes('bee') || name.includes('terrain') || name.includes('crow')) {
      type = "nature";
    }

    const box = new THREE.Box3().setFromObject(mesh);
    const size = new THREE.Vector3();
    box.getSize(size);

    return {
      id: `obj_${i}_${type}`,
      type,
      mesh,
      width: size.x,
      depth: size.z,
    };
  });
}
